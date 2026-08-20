import request from "supertest";
import { describe, expect, it } from "vitest";
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
  paymentMethod: "bank",
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
  await request(app).get("/api/v1/tutorials");
  await request(app).get("/api/v1/services");
}

describe("checkout API", () => {
  it("places an order from the cart and clears the cart", async () => {
    await registerAdmin();
    const agent = await registerCustomer();
    await seedCatalog();

    const added = await agent.post("/api/v1/cart/items").send({
      kind: "course",
      slug: "spring-boot-masterclass",
    });
    expect(added.status).toBe(200);
    expect(added.body.data.cart.checkoutReady).toBe(true);

    const placed = await agent.post("/api/v1/checkout").send(billing);
    expect(placed.status).toBe(201);
    const order = placed.body.data.order;
    expect(order.orderNumber).toMatch(/^RK-\d{8}-[A-F0-9]{4}$/);
    expect(order.status).toBe("pending_payment");
    expect(order.summary.totalCents).toBe(9900);
    expect(order.summary.taxCents).toBe(0);
    expect(order.summary.currency).toBe("USD");
    expect(order.paymentMethod).toBe("bank");
    expect(order.billing.name).toBe("Ada Lovelace");
    expect(order.items).toHaveLength(1);
    expect(order.items[0].slug).toBe("spring-boot-masterclass");
    expect(order.termsAccepted).toBe(true);
    expect(getOutbox().some((item) => item.subject === `Order ${order.orderNumber}`)).toBe(true);

    const cart = await agent.get("/api/v1/cart");
    expect(cart.status).toBe(200);
    expect(cart.body.data.cart.items).toHaveLength(0);
    expect(cart.body.data.cart.checkoutReady).toBe(false);

    const listed = await agent.get("/api/v1/orders");
    expect(listed.status).toBe(200);
    expect(listed.body.data.orders).toHaveLength(1);
    expect(listed.body.data.orders[0].orderNumber).toBe(order.orderNumber);

    const fetched = await agent.get(`/api/v1/orders/${order.orderNumber}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.order.id).toBe(order.id);
  });

  it("rejects an empty cart, missing terms, and guests", async () => {
    await registerAdmin();
    const agent = await registerCustomer();
    await seedCatalog();

    const empty = await agent.post("/api/v1/checkout").send(billing);
    expect(empty.status).toBe(400);
    expect(empty.body.error.message).toBe("Cart is empty");

    await agent.post("/api/v1/cart/items").send({
      kind: "tutorial",
      slug: "jwt-api-security",
    });

    const noTerms = await agent.post("/api/v1/checkout").send({
      ...billing,
      termsAccepted: false,
    });
    expect(noTerms.status).toBe(400);

    const guest = await request(app).post("/api/v1/checkout").send(billing);
    expect(guest.status).toBe(401);
  });

  it("lets a customer cancel a pending order and lets Studio list purchases", async () => {
    const admin = await registerAdmin();
    const agent = await registerCustomer();
    await seedCatalog();

    await agent.post("/api/v1/cart/items").send({
      kind: "course",
      slug: "spring-boot-masterclass",
    });
    const placed = await agent.post("/api/v1/checkout").send(billing);
    expect(placed.status).toBe(201);
    const orderNumber = placed.body.data.order.orderNumber as string;

    const other = await registerCustomer("other@example.com");
    const hidden = await other.get(`/api/v1/orders/${orderNumber}`);
    expect(hidden.status).toBe(404);

    const adminList = await admin.get("/api/v1/orders/admin");
    expect(adminList.status).toBe(200);
    expect(adminList.body.data.orders).toHaveLength(1);

    const cancelled = await agent.delete(`/api/v1/orders/${orderNumber}`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.order.status).toBe("canceled");

    const again = await agent.delete(`/api/v1/orders/${orderNumber}`);
    expect(again.status).toBe(400);
  });

  it("lets Studio add a note, cancel an unpaid order, and refuses a paid cancel", async () => {
    const admin = await registerAdmin();
    const agent = await registerCustomer();
    await seedCatalog();

    await agent.post("/api/v1/cart/items").send({
      kind: "course",
      slug: "spring-boot-masterclass",
    });
    const placed = await agent.post("/api/v1/checkout").send(billing);
    expect(placed.status).toBe(201);
    const orderNumber = placed.body.data.order.orderNumber as string;

    const forbidden = await agent.patch(`/api/v1/orders/admin/${orderNumber}`).send({
      adminNote: "Customer note",
    });
    expect(forbidden.status).toBe(403);

    const empty = await admin.patch(`/api/v1/orders/admin/${orderNumber}`).send({});
    expect(empty.status).toBe(400);

    const noted = await admin.patch(`/api/v1/orders/admin/${orderNumber}`).send({
      adminNote: "Waiting on the transfer",
    });
    expect(noted.status).toBe(200);
    expect(noted.body.data.order.adminNote).toBe("Waiting on the transfer");
    expect(noted.body.data.order.status).toBe("pending_payment");

    const cancelled = await admin.patch(`/api/v1/orders/admin/${orderNumber}`).send({
      status: "canceled",
    });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.order.status).toBe("canceled");
    expect(getOutbox().some((item) => item.subject === `Order ${orderNumber} cancelled`)).toBe(true);

    await agent.post("/api/v1/cart/items").send({
      kind: "course",
      slug: "spring-boot-masterclass",
    });
    const paidPlacement = await agent.post("/api/v1/checkout").send({
      ...billing,
      paymentMethod: "card",
    });
    expect(paidPlacement.status).toBe(201);
    const paidNumber = paidPlacement.body.data.order.orderNumber as string;
    const started = await agent.post("/api/v1/payments").send({
      orderNumber: paidNumber,
      provider: "stripe",
    });
    expect(started.status).toBe(201);
    const paid = await agent.post(`/api/v1/payments/${started.body.data.payment.id}/demo`).send({
      action: "succeed",
    });
    expect(paid.status).toBe(200);
    expect(paid.body.data.order.status).toBe("paid");

    const refuse = await admin.patch(`/api/v1/orders/admin/${paidNumber}`).send({
      status: "canceled",
    });
    expect(refuse.status).toBe(400);
    expect(refuse.body.error.message).toBe("Refund a paid order instead of cancelling it");
  });
});
