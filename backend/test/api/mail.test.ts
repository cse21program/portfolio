import request from "supertest";
import { describe, expect, it } from "vitest";
import { getOutbox } from "../../src/common/mailer/mailer";
import { createApp } from "../../src/app";

const app = createApp();

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

describe("mail API", () => {
  it("lets studio configure SES and SMTP separately", async () => {
    const admin = await registerAdmin();
    const listed = await admin.get("/api/v1/mail/admin");
    expect(listed.status).toBe(200);
    expect(listed.body.data.providers.map((item: { id: string }) => item.id)).toEqual(["ses", "smtp"]);
    expect(listed.body.data.providers.every((item: { fields: unknown[] }) => item.fields.length > 0)).toBe(true);
    expect(listed.body.data.providers.some((item: { fields: Array<{ type: string; value?: string }> }) =>
      item.fields.some((field) => field.type === "password" && field.value),
    )).toBe(false);

    const ses = await admin.patch("/api/v1/mail/admin/providers/ses").send({
      credentials: {
        fromEmail: "hello@rezaul.dev",
        fromName: "Rezaul Karim",
        region: "ap-south-1",
        user: "AKIATESTSMTPUSER",
        password: "ses-smtp-password",
      },
      activate: true,
    });
    expect(ses.status).toBe(200);
    expect(ses.body.data.provider.active).toBe(true);
    expect(ses.body.data.provider.fields.find((field: { key: string }) => field.key === "fromEmail").value).toBe(
      "hello@rezaul.dev",
    );

    const smtp = await admin.patch("/api/v1/mail/admin/providers/smtp").send({
      credentials: {
        host: "smtp.example.com",
        port: "587",
        secure: "starttls",
        user: "hello@rezaul.dev",
        password: "app-password",
        fromEmail: "studio@rezaul.dev",
        fromName: "Studio",
      },
    });
    expect(smtp.status).toBe(200);
    expect(smtp.body.data.provider.active).toBe(false);
    expect(
      smtp.body.data.provider.fields.find((field: { key: string }) => field.key === "password").configured,
    ).toBe(true);
    expect(smtp.body.data.provider.fields.find((field: { key: string }) => field.key === "password").value).toBeUndefined();

    const switched = await admin.put("/api/v1/mail/admin/transport").send({ transport: "smtp" });
    expect(switched.status).toBe(200);
    expect(switched.body.data.transport).toBe("smtp");
    expect(switched.body.data.fromEmail).toBe("studio@rezaul.dev");
  });

  it("sends a test through the selected transport without leaking secrets", async () => {
    const admin = await registerAdmin();
    await admin.patch("/api/v1/mail/admin/providers/ses").send({
      credentials: {
        fromEmail: "hello@rezaul.dev",
        region: "ap-south-1",
        user: "AKIATESTSMTPUSER",
        password: "ses-smtp-password",
      },
      activate: true,
    });
    const sent = await admin.post("/api/v1/mail/admin/test").send({ provider: "ses" });
    expect(sent.status).toBe(200);
    expect(sent.body.data.to).toBe("admin@example.com");
    expect(getOutbox().some((item) => item.to === "admin@example.com" && item.subject === "Test email from Studio")).toBe(
      true,
    );
  });

  it("rejects mail updates from guests", async () => {
    const response = await request(app).get("/api/v1/mail/admin");
    expect(response.status).toBe(401);
  });
});
