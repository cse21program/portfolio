import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/common/database/prisma";

const app = createApp();

function uniqueEmail() {
  return `notice-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
}

describe("notifications API", () => {
  it("lists account notices and marks them read", async () => {
    const agent = request.agent(app);
    const email = uniqueEmail();
    const created = await agent.post("/api/v1/auth/register").send({
      name: "Ada",
      email,
      password: "password123",
    });
    expect(created.status).toBe(201);

    const listed = await agent.get("/api/v1/notifications");
    expect(listed.status).toBe(200);
    expect(listed.body.data.unreadCount).toBeGreaterThan(0);
    expect(listed.body.data.notifications.some((item: { type: string }) => item.type === "ACCOUNT_CREATED")).toBe(
      true,
    );

    const unread = await agent.get("/api/v1/notifications/unread");
    expect(unread.status).toBe(200);
    expect(unread.body.data.unreadCount).toBe(listed.body.data.unreadCount);

    const notice = listed.body.data.notifications[0] as { id: string };
    const marked = await agent.patch(`/api/v1/notifications/${notice.id}/read`);
    expect(marked.status).toBe(200);
    expect(marked.body.data.notification.readAt).toBeTruthy();

    const all = await agent.post("/api/v1/notifications/read-all");
    expect(all.status).toBe(200);
    expect(all.body.data.unreadCount).toBe(0);

    const after = await agent.get("/api/v1/notifications/unread");
    expect(after.body.data.unreadCount).toBe(0);
  });

  it("skips product notices when the customer turned them off", async () => {
    const agent = request.agent(app);
    const email = uniqueEmail();
    const created = await agent.post("/api/v1/auth/register").send({
      name: "Ada",
      email,
      password: "password123",
    });
    const userId = created.body.data.user.id as string;
    await agent.patch("/api/v1/users/me").send({
      name: "Ada",
      phone: "",
      country: "",
      notifyProduct: false,
      notifyMarketing: false,
    });

    const { notifyInApp } = await import("../../src/modules/notifications/notify");
    await notifyInApp({
      userId,
      type: "COURSE_ENROLLMENT",
      title: "You are enrolled",
      body: "You are enrolled in HTTP from zero.",
      href: "/courses/http-from-zero",
    });
    await notifyInApp({
      userId,
      type: "PASSWORD_CHANGED",
      title: "Password updated",
      body: "Your password was changed.",
      href: "/dashboard/settings",
    });

    const listed = await agent.get("/api/v1/notifications");
    const types = listed.body.data.notifications.map((item: { type: string }) => item.type);
    expect(types).toContain("ACCOUNT_CREATED");
    expect(types).toContain("PASSWORD_CHANGED");
    expect(types).not.toContain("COURSE_ENROLLMENT");
    await prisma.notification.deleteMany({ where: { userId } });
  });

  it("rejects guests", async () => {
    const response = await request(app).get("/api/v1/notifications");
    expect(response.status).toBe(401);
  });
});
