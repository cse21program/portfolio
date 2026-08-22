import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";

const app = createApp();

async function register(name: string, email: string) {
  const agent = request.agent(app);
  const created = await agent.post("/api/v1/auth/register").send({
    name,
    email,
    password: "password123",
  });
  expect(created.status).toBe(201);
  return { agent, user: created.body.data.user as { id: string; role: string } };
}

const sampleBlog = {
  title: "JWT authentication without painting yourself into a corner",
  slug: "jwt-authentication",
  excerpt: "Access tokens, refresh tokens, and why authorization still has to live on the server.",
  content: ["Keep authorization on the server.", "Rotate refresh tokens."],
  featuredImageUrl: null,
  author: "Rezaul Karim",
  category: "Backend",
  tags: ["JWT", "Security"],
  skill: "Spring Boot",
  topic: "",
  readingTime: "8 min",
  publishedAt: "2026-07-12",
  status: "published",
  seoTitle: "JWT authentication",
  seoDescription: "Access tokens and refresh tokens.",
  canonicalUrl: "",
};

describe("follows API", () => {
  it("lets a signed-in reader follow and unfollow the studio", async () => {
    const publicStatus = await request(app).get("/api/v1/follows/studio");
    expect(publicStatus.status).toBe(200);
    expect(publicStatus.body.data).toEqual({ following: false, followerCount: 0 });

    const denied = await request(app).post("/api/v1/follows/studio");
    expect(denied.status).toBe(401);

    const { agent } = await register("Ada", "ada@example.com");
    const followed = await agent.post("/api/v1/follows/studio");
    expect(followed.status).toBe(200);
    expect(followed.body.data).toEqual({ following: true, followerCount: 1 });

    const again = await agent.post("/api/v1/follows/studio");
    expect(again.status).toBe(200);
    expect(again.body.data.followerCount).toBe(1);

    const mine = await agent.get("/api/v1/follows/studio");
    expect(mine.body.data.following).toBe(true);

    const visitor = await request(app).get("/api/v1/follows/studio");
    expect(visitor.body.data).toEqual({ following: false, followerCount: 1 });

    const left = await agent.delete("/api/v1/follows/studio");
    expect(left.status).toBe(200);
    expect(left.body.data).toEqual({ following: false, followerCount: 0 });

    const leftover = await agent.delete("/api/v1/follows/studio");
    expect(leftover.body.data.following).toBe(false);
  });

  it("hides new follows when studio stops Follow", async () => {
    const admin = await register("Owner", "admin@example.com");
    const reader = await register("Ada", "ada@example.com");
    const { defaultPublicCatalogs } = await import("../../src/modules/site-access/site-access.types");

    const stopped = await admin.agent.put("/api/v1/site-access").send({
      catalogs: { ...defaultPublicCatalogs, follow: false },
    });
    expect(stopped.status).toBe(200);

    const blocked = await reader.agent.post("/api/v1/follows/studio");
    expect(blocked.status).toBe(404);

    const allowed = await admin.agent.post("/api/v1/follows/studio");
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.following).toBe(true);
  });

  it("lists followers only to an admin and can remove one", async () => {
    const admin = await register("Owner", "admin@example.com");
    const reader = await register("Ada", "ada@example.com");
    expect(admin.user.role).toBe("ADMIN");

    await reader.agent.post("/api/v1/follows/studio");

    const forbidden = await reader.agent.get("/api/v1/follows/admin/studio");
    expect(forbidden.status).toBe(403);

    const listed = await admin.agent.get("/api/v1/follows/admin/studio");
    expect(listed.status).toBe(200);
    expect(listed.body.data.total).toBe(1);
    expect(listed.body.data.follows).toEqual([
      expect.objectContaining({
        userId: reader.user.id,
        email: "ada@example.com",
        name: "Ada",
      }),
    ]);

    const removed = await admin.agent.delete(`/api/v1/follows/admin/studio/${reader.user.id}`);
    expect(removed.status).toBe(200);
    expect(removed.body.data.followerCount).toBe(0);

    const empty = await admin.agent.get("/api/v1/follows/admin/studio");
    expect(empty.body.data.follows).toEqual([]);
  });

  it("notifies followers when a new note is published, once", async () => {
    const admin = await register("Owner", "admin@example.com");
    const reader = await register("Ada", "ada@example.com");
    await admin.agent.post("/api/v1/follows/studio");
    await reader.agent.post("/api/v1/follows/studio");
    expect((await request(app).get("/api/v1/blogs")).status).toBe(200);

    const published = await admin.agent.put("/api/v1/blogs").send({
      blogs: [
        sampleBlog,
        {
          ...sampleBlog,
          title: "A new production note",
          slug: "production-follow",
          excerpt: "Followers should hear about this.",
          status: "published",
        },
      ],
    });
    expect(published.status).toBe(200);

    const readerNotices = await reader.agent.get("/api/v1/notifications");
    const followNotices = readerNotices.body.data.notifications.filter(
      (item: { type: string }) => item.type === "FOLLOW_UPDATE",
    );
    expect(followNotices).toHaveLength(1);
    expect(followNotices[0].title).toBe("New note: A new production note");
    expect(followNotices[0].href).toBe("/blog/production-follow");

    const adminNotices = await admin.agent.get("/api/v1/notifications");
    expect(
      adminNotices.body.data.notifications.some((item: { type: string }) => item.type === "FOLLOW_UPDATE"),
    ).toBe(false);

    const again = await admin.agent.put("/api/v1/blogs").send({
      blogs: [
        sampleBlog,
        {
          ...sampleBlog,
          title: "A new production note",
          slug: "production-follow",
          excerpt: "Followers should hear about this.",
          status: "published",
        },
      ],
    });
    expect(again.status).toBe(200);

    const after = await reader.agent.get("/api/v1/notifications");
    expect(
      after.body.data.notifications.filter((item: { type: string }) => item.type === "FOLLOW_UPDATE"),
    ).toHaveLength(1);
  });
});
