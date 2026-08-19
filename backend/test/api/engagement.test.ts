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

async function registerCustomer(email = "customer@example.com", name = "Student") {
  const agent = request.agent(app);
  const created = await agent.post("/api/v1/auth/register").send({
    name,
    email,
    password: "password123",
  });
  expect(created.status).toBe(201);
  return agent;
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

describe("blog engagement API", () => {
  it("returns empty public engagement for a published post", async () => {
    const response = await request(app).get("/api/v1/blogs/jwt-authentication/engagement");
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      comments: [],
      likeCount: 0,
      liked: false,
      bookmarked: false,
    });
  });

  it("hides engagement on drafts", async () => {
    const admin = await registerAdmin();
    await admin.put("/api/v1/blogs").send({
      blogs: [{ ...sampleBlog, status: "draft" }],
    });

    const response = await request(app).get("/api/v1/blogs/jwt-authentication/engagement");
    expect(response.status).toBe(404);
  });

  it("requires auth to comment, like, or bookmark", async () => {
    const comment = await request(app)
      .post("/api/v1/blogs/jwt-authentication/comments")
      .send({ body: "This helped me ship auth." });
    expect(comment.status).toBe(401);

    const like = await request(app).post("/api/v1/blogs/jwt-authentication/like");
    expect(like.status).toBe(401);

    const bookmark = await request(app).post("/api/v1/blogs/jwt-authentication/bookmark");
    expect(bookmark.status).toBe(401);
  });

  it("lets a signed-in reader comment, like, bookmark, and remove their comment", async () => {
    await registerAdmin();
    const reader = await registerCustomer();

    const posted = await reader.post("/api/v1/blogs/jwt-authentication/comments").send({
      body: "This helped me ship auth.",
    });
    expect(posted.status).toBe(201);
    expect(posted.body.data.comment.body).toBe("This helped me ship auth.");
    expect(posted.body.data.comment.author).toBe("Student");

    const liked = await reader.post("/api/v1/blogs/jwt-authentication/like");
    expect(liked.status).toBe(200);
    expect(liked.body.data).toEqual({ liked: true, likeCount: 1 });

    const saved = await reader.post("/api/v1/blogs/jwt-authentication/bookmark");
    expect(saved.status).toBe(200);
    expect(saved.body.data.bookmarked).toBe(true);

    const engagement = await reader.get("/api/v1/blogs/jwt-authentication/engagement");
    expect(engagement.body.data.liked).toBe(true);
    expect(engagement.body.data.bookmarked).toBe(true);
    expect(engagement.body.data.likeCount).toBe(1);
    expect(engagement.body.data.comments).toHaveLength(1);

    const bookmarks = await reader.get("/api/v1/blogs/bookmarks");
    expect(bookmarks.status).toBe(200);
    expect(bookmarks.body.data.blogs.map((item: { slug: string }) => item.slug)).toEqual([
      "jwt-authentication",
    ]);

    const removed = await reader.delete(`/api/v1/blogs/comments/${posted.body.data.comment.id}`);
    expect(removed.status).toBe(200);

    const after = await reader.get("/api/v1/blogs/jwt-authentication/engagement");
    expect(after.body.data.comments).toHaveLength(0);
  });

  it("lets an admin moderate comments and keeps bookmarks after a republish", async () => {
    const admin = await registerAdmin();
    const reader = await registerCustomer();

    await reader.post("/api/v1/blogs/jwt-authentication/bookmark");
    const posted = await reader.post("/api/v1/blogs/jwt-authentication/comments").send({
      body: "Worth a second read later.",
    });

    const listed = await admin.get("/api/v1/blogs/comments");
    expect(listed.status).toBe(200);
    expect(listed.body.data.comments[0].title).toContain("JWT");
    expect(listed.body.data.comments[0].body).toContain("second read");

    const forbidden = await reader.get("/api/v1/blogs/comments");
    expect(forbidden.status).toBe(403);

    await admin.put("/api/v1/blogs").send({ blogs: [sampleBlog] });

    const stillSaved = await reader.get("/api/v1/blogs/bookmarks");
    expect(stillSaved.body.data.blogs).toHaveLength(1);

    const deleted = await admin.delete(`/api/v1/blogs/comments/${posted.body.data.comment.id}`);
    expect(deleted.status).toBe(200);

    await admin.put("/api/v1/blogs").send({
      blogs: [{ ...sampleBlog, slug: "docker-networking", title: "Docker networking" }],
    });
    const pruned = await reader.get("/api/v1/blogs/bookmarks");
    expect(pruned.body.data.blogs).toHaveLength(0);
  });
});

describe("newsletter API", () => {
  it("subscribes an email once, sends welcome mail, and lets an admin manage the list", async () => {
    const first = await request(app).post("/api/v1/newsletter").send({
      email: "reader@example.com",
      name: "Reader",
    });
    expect(first.status).toBe(200);
    expect(first.body.data.subscriber.email).toBe("reader@example.com");
    expect(first.body.data.subscriber.unsubscribeToken).toBeUndefined();

    const welcome = getOutbox().filter((item) => item.to === "reader@example.com");
    expect(welcome).toHaveLength(1);
    expect(welcome[0].subject).toBe("You're on the list");
    expect(welcome[0].text).toContain("/unsubscribe?token=");

    const again = await request(app).post("/api/v1/newsletter").send({
      email: "Reader@example.com",
    });
    expect(again.status).toBe(200);
    expect(again.body.data.subscriber.id).toBe(first.body.data.subscriber.id);
    expect(getOutbox().filter((item) => item.to === "reader@example.com")).toHaveLength(1);

    const guestList = await request(app).get("/api/v1/newsletter");
    expect(guestList.status).toBe(401);

    const admin = await registerAdmin();
    const listed = await admin.get("/api/v1/newsletter");
    expect(listed.status).toBe(200);
    expect(listed.body.data.subscribers).toHaveLength(1);

    const customer = await registerCustomer();
    const blocked = await customer.get("/api/v1/newsletter");
    expect(blocked.status).toBe(403);

    const removed = await admin.delete(`/api/v1/newsletter/${first.body.data.subscriber.id}`);
    expect(removed.status).toBe(200);

    const empty = await admin.get("/api/v1/newsletter");
    expect(empty.body.data.subscribers).toHaveLength(0);
  });

  it("lets a reader unsubscribe and an admin send an issue", async () => {
    await request(app).post("/api/v1/newsletter").send({
      email: "reader@example.com",
      name: "Reader",
    });
    const token = getOutbox()
      .find((item) => item.to === "reader@example.com")
      ?.text.match(/unsubscribe\?token=([a-f0-9]+)/i)?.[1];
    expect(token).toBeTruthy();

    const left = await request(app).post("/api/v1/newsletter/unsubscribe").send({ token });
    expect(left.status).toBe(200);

    const again = await request(app).post("/api/v1/newsletter/unsubscribe").send({ token });
    expect(again.status).toBe(404);

    await request(app).post("/api/v1/newsletter").send({
      email: "reader@example.com",
      name: "Reader",
    });

    const admin = await registerAdmin();
    const sent = await admin.post("/api/v1/newsletter/send").send({
      subject: "New note on JWT",
      body: "A short note about tokens on the server.",
      slug: "jwt-authentication",
    });
    expect(sent.status).toBe(200);
    expect(sent.body.data.sent).toBe(1);
    expect(sent.body.data.failed).toBe(0);
    expect(sent.body.data.error).toBeUndefined();
    const issue = getOutbox().find((item) => item.subject === "New note on JWT");
    expect(issue?.text).toContain("jwt-authentication");
    expect(issue?.html).toContain("Unsubscribe");

    const customer = await registerCustomer();
    const blocked = await customer.post("/api/v1/newsletter/send").send({
      subject: "Should not send",
      body: "Customers cannot broadcast.",
    });
    expect(blocked.status).toBe(403);
  });
});
