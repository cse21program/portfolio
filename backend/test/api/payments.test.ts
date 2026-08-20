import request from "supertest";
import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { env } from "../../src/common/config/env";
import { getOutbox } from "../../src/common/mailer/mailer";
import { createApp } from "../../src/app";

const app = createApp();

const billing = {
  billingName: "Ada Lovelace",
  billingEmail: "ada@example.com",
  billingPhone: "+44 20 7946 0958",
  country: "United Kingdom",
  address: "12 Analytical Engine Lane",
  city: "London",
  postal: "SW1A 1AA",
  paymentMethod: "card",
  termsAccepted: true,
};

async function registerAdmin() {
  const agent = request.agent(app);
  const created = await agent.post("/api/v1/auth/register").send({
    name: "Owner",
    email: "admin@example.com",
    password: "password123",
  });
  expect(created.status).toBe(201);
  return agent;
}

async function registerCustomer(email = "student@example.com") {
  const agent = request.agent(app);
  const created = await agent.post("/api/v1/auth/register").send({
    name: "Ada",
    email,
    password: "password123",
  });
  expect(created.status).toBe(201);
  return agent;
}

async function seedCatalog() {
  await request(app).get("/api/v1/courses");
}

async function placeCourseOrder(agent: request.Agent, paymentMethod = "card") {
  await seedCatalog();
  const added = await agent.post("/api/v1/cart/items").send({
    kind: "course",
    slug: "spring-boot-masterclass",
  });
  expect(added.status).toBe(200);
  const placed = await agent.post("/api/v1/checkout").send({ ...billing, paymentMethod });
  expect(placed.status).toBe(201);
  return placed.body.data.order;
}

function sign(body: object) {
  const raw = JSON.stringify(body);
  return {
    raw,
    signature: createHmac("sha256", env.PAYMENT_WEBHOOK_SECRET).update(raw).digest("hex"),
  };
}

describe("payments API", () => {
  it("lists the shared demo providers", async () => {
    const listed = await request(app).get("/api/v1/payments/providers");
    expect(listed.status).toBe(200);
    const ids = listed.body.data.providers.map((item: { id: string }) => item.id);
    expect(ids).toEqual(["stripe", "paypal", "sslcommerz", "bkash", "nagad", "bank"]);
    expect(listed.body.data.providers.every((item: { demo: boolean }) => item.demo)).toBe(true);
  });

  it("starts a demo payment, records a paid webhook, and grants the course seat", async () => {
    await registerAdmin();
    const agent = await registerCustomer();
    const order = await placeCourseOrder(agent);

    const started = await agent.post("/api/v1/payments").send({
      orderNumber: order.orderNumber,
      provider: "stripe",
    });
    expect(started.status).toBe(201);
    expect(started.body.data.payment.provider).toBe("stripe");
    expect(started.body.data.payment.status).toBe("processing");
    expect(started.body.data.checkoutUrl).toContain(`/pay/${started.body.data.payment.id}`);
    expect(started.body.data.order.status).toBe("processing");

    const paid = await agent.post(`/api/v1/payments/${started.body.data.payment.id}/demo`).send({
      action: "succeed",
    });
    expect(paid.status).toBe(200);
    expect(paid.body.data.payment.status).toBe("paid");
    expect(paid.body.data.order.status).toBe("paid");
    expect(getOutbox().some((item) => item.subject === `Payment received for ${order.orderNumber}`)).toBe(true);

    const enrollments = await agent.get("/api/v1/enrollments");
    expect(enrollments.status).toBe(200);
    expect(enrollments.body.data.enrollments.some((item: { courseSlug: string }) => item.courseSlug === "spring-boot-masterclass")).toBe(true);

    const again = await agent.post("/api/v1/payments").send({ orderNumber: order.orderNumber });
    expect(again.status).toBe(400);
  });

  it("verifies signed webhooks and rejects a bad signature", async () => {
    await registerAdmin();
    const agent = await registerCustomer();
    const order = await placeCourseOrder(agent);
    const started = await agent.post("/api/v1/payments").send({
      orderNumber: order.orderNumber,
      provider: "bkash",
    });
    expect(started.status).toBe(201);
    const payment = started.body.data.payment;

    const payload = {
      provider: "bkash",
      transactionId: payment.transactionId,
      status: "paid",
      amountCents: payment.amountCents,
      currency: payment.currency,
      paidAt: new Date().toISOString(),
      metadata: { adapter: "demo" },
    };
    const { signature } = sign(payload);

    const bad = await request(app)
      .post("/api/v1/payments/webhooks/bkash")
      .set("x-payment-signature", "deadbeef")
      .send(payload);
    expect(bad.status).toBe(401);

    const ok = await request(app)
      .post("/api/v1/payments/webhooks/bkash")
      .set("x-payment-signature", signature)
      .send(payload);
    expect(ok.status).toBe(200);
    expect(ok.body.data.payment.status).toBe("paid");
    expect(ok.body.data.order.status).toBe("paid");
  });

  it("lets Studio refund a paid demo payment", async () => {
    const admin = await registerAdmin();
    const agent = await registerCustomer();
    const order = await placeCourseOrder(agent);
    const started = await agent.post("/api/v1/payments").send({ orderNumber: order.orderNumber });
    await agent.post(`/api/v1/payments/${started.body.data.payment.id}/demo`).send({ action: "succeed" });

    const refunded = await admin.post(`/api/v1/payments/${started.body.data.payment.id}/refund`);
    expect(refunded.status).toBe(200);
    expect(refunded.body.data.payment.status).toBe("refunded");
    expect(refunded.body.data.order.status).toBe("refunded");
  });

  it("lets Studio save Stripe credentials without returning the secret", async () => {
    const admin = await registerAdmin();
    const customer = await registerCustomer();

    const listed = await admin.get("/api/v1/payments/admin/providers");
    expect(listed.status).toBe(200);
    const stripe = listed.body.data.providers.find((item: { id: string }) => item.id === "stripe");
    expect(stripe.enabled).toBe(true);
    expect(stripe.mode).toBe("demo");
    expect(stripe.fields.every((field: { configured: boolean }) => field.configured === false)).toBe(true);

    const liveWithoutKeys = await admin.patch("/api/v1/payments/admin/providers/stripe").send({
      mode: "live",
    });
    expect(liveWithoutKeys.status).toBe(400);

    const saved = await admin.patch("/api/v1/payments/admin/providers/stripe").send({
      enabled: true,
      mode: "live",
      credentials: {
        secretKey: "sk_test_123",
        webhookSecret: "whsec_abc",
      },
    });
    expect(saved.status).toBe(200);
    expect(saved.body.data.provider.mode).toBe("live");
    expect(saved.body.data.provider.liveReady).toBe(true);
    expect(JSON.stringify(saved.body)).not.toContain("sk_test_123");
    expect(JSON.stringify(saved.body)).not.toContain("whsec_abc");
    const secretKey = saved.body.data.provider.fields.find((field: { key: string }) => field.key === "secretKey");
    expect(secretKey.configured).toBe(true);
    expect(secretKey.value).toBeUndefined();

    const publicList = await request(app).get("/api/v1/payments/providers");
    expect(publicList.status).toBe(200);
    const publicStripe = publicList.body.data.providers.find((item: { id: string }) => item.id === "stripe");
    expect(publicStripe.demo).toBe(false);

    const guest = await request(app).get("/api/v1/payments/admin/providers");
    expect(guest.status).toBe(401);
    const forbidden = await customer.get("/api/v1/payments/admin/providers");
    expect(forbidden.status).toBe(403);
  });

  it("hides disabled gateways from checkout and blocks starting them", async () => {
    const admin = await registerAdmin();
    await admin.patch("/api/v1/payments/admin/providers/stripe").send({ enabled: false });
    await admin.patch("/api/v1/payments/admin/providers/sslcommerz").send({ enabled: false });
    await admin.patch("/api/v1/payments/admin/providers/bkash").send({ enabled: false });
    await admin.patch("/api/v1/payments/admin/providers/nagad").send({ enabled: false });
    await admin.patch("/api/v1/payments/admin/providers/bank").send({ enabled: false });
    await admin.patch("/api/v1/payments/admin/providers/paypal").send({ enabled: true, mode: "demo" });

    const listed = await request(app).get("/api/v1/payments/providers");
    expect(listed.status).toBe(200);
    expect(listed.body.data.providers.map((item: { id: string }) => item.id)).toEqual(["paypal"]);

    const agent = await registerCustomer();
    const order = await placeCourseOrder(agent);
    const blocked = await agent.post("/api/v1/payments").send({
      orderNumber: order.orderNumber,
      provider: "stripe",
    });
    expect(blocked.status).toBe(400);

    const started = await agent.post("/api/v1/payments").send({
      orderNumber: order.orderNumber,
    });
    expect(started.status).toBe(201);
    expect(started.body.data.payment.provider).toBe("paypal");
    expect(started.body.data.payment.demo).toBe(true);
  });

  it("rejects guests and canceled orders", async () => {
    await registerAdmin();
    const agent = await registerCustomer();
    const order = await placeCourseOrder(agent);
    await agent.delete(`/api/v1/orders/${order.orderNumber}`);

    const guest = await request(app).post("/api/v1/payments").send({ orderNumber: order.orderNumber });
    expect(guest.status).toBe(401);

    const blocked = await agent.post("/api/v1/payments").send({ orderNumber: order.orderNumber });
    expect(blocked.status).toBe(400);
  });

  it("lets Studio save bank details and keeps them off the public provider list", async () => {
    const admin = await registerAdmin();
    const listed = await admin.get("/api/v1/payments/admin/providers");
    const bank = listed.body.data.providers.find((item: { id: string }) => item.id === "bank");
    expect(bank.kind).toBe("manual");
    expect(bank.webhookUrl).toBe("");

    const liveWithoutDetails = await admin.patch("/api/v1/payments/admin/providers/bank").send({
      mode: "live",
    });
    expect(liveWithoutDetails.status).toBe(400);

    const saved = await admin.patch("/api/v1/payments/admin/providers/bank").send({
      enabled: true,
      mode: "live",
      credentials: {
        bankName: "HSBC",
        accountName: "Rezaul Karim",
        accountNumber: "GB82WEST12345698765432",
        branch: "Canary Wharf",
        instructions: "Use the order number as the reference.",
      },
    });
    expect(saved.status).toBe(200);
    expect(saved.body.data.provider.liveReady).toBe(true);
    const accountNumber = saved.body.data.provider.fields.find(
      (field: { key: string }) => field.key === "accountNumber",
    );
    expect(accountNumber.value).toBe("GB82WEST12345698765432");

    const publicList = await request(app).get("/api/v1/payments/providers");
    expect(publicList.status).toBe(200);
    expect(JSON.stringify(publicList.body)).not.toContain("GB82WEST12345698765432");
    const publicBank = publicList.body.data.providers.find((item: { id: string }) => item.id === "bank");
    expect(publicBank.kind).toBe("manual");
    expect(publicBank.demo).toBe(false);
  });

  it("starts a bank payment, records a customer report, and lets Studio confirm the transfer", async () => {
    const admin = await registerAdmin();
    await admin.patch("/api/v1/payments/admin/providers/bank").send({
      enabled: true,
      mode: "live",
      credentials: {
        bankName: "HSBC",
        accountName: "Rezaul Karim",
        accountNumber: "GB82WEST12345698765432",
        instructions: "Use the order number as the reference.",
      },
    });

    const agent = await registerCustomer();
    const order = await placeCourseOrder(agent, "bank");
    const started = await agent.post("/api/v1/payments").send({ orderNumber: order.orderNumber });
    expect(started.status).toBe(201);
    expect(started.body.data.payment.provider).toBe("bank");
    expect(started.body.data.payment.demo).toBe(false);
    expect(started.body.data.payment.metadata.bank.accountNumber).toBe("GB82WEST12345698765432");
    expect(started.body.data.checkoutUrl).toContain(`/pay/${started.body.data.payment.id}`);

    const reported = await agent.post(`/api/v1/payments/${started.body.data.payment.id}/report`).send({
      reference: "TRX-4411",
    });
    expect(reported.status).toBe(200);
    expect(reported.body.data.payment.status).toBe("processing");
    expect(reported.body.data.payment.metadata.reported).toBe(true);
    expect(reported.body.data.payment.metadata.reference).toBe("TRX-4411");
    expect(reported.body.data.order.status).toBe("processing");

    const forbidden = await agent.post(`/api/v1/payments/${started.body.data.payment.id}/confirm`);
    expect(forbidden.status).toBe(403);

    const confirmed = await admin.post(`/api/v1/payments/${started.body.data.payment.id}/confirm`);
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.data.payment.status).toBe("paid");
    expect(confirmed.body.data.order.status).toBe("paid");

    const enrollments = await agent.get("/api/v1/enrollments");
    expect(enrollments.status).toBe(200);
    expect(
      enrollments.body.data.enrollments.some(
        (item: { courseSlug: string }) => item.courseSlug === "spring-boot-masterclass",
      ),
    ).toBe(true);
  });
});
