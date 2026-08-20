import request from "supertest";
import { describe, expect, it } from "vitest";
import { prisma } from "../../src/common/database/prisma";
import { createApp } from "../../src/app";

const app = createApp();

describe("analytics API", () => {
  it("records public pageviews and ignores studio paths and bots", async () => {
    const recorded = await request(app)
      .post("/api/v1/analytics/pageview")
      .set("User-Agent", "Mozilla/5.0 PortfolioTest")
      .set("X-Forwarded-For", "203.0.113.10")
      .send({ path: "/courses/spring-boot-masterclass" });
    expect(recorded.status).toBe(200);

    const again = await request(app)
      .post("/api/v1/analytics/pageview")
      .set("User-Agent", "Mozilla/5.0 PortfolioTest")
      .set("X-Forwarded-For", "203.0.113.10")
      .send({ path: "/" });
    expect(again.status).toBe(200);

    const studio = await request(app)
      .post("/api/v1/analytics/pageview")
      .set("User-Agent", "Mozilla/5.0 PortfolioTest")
      .set("X-Forwarded-For", "203.0.113.10")
      .send({ path: "/admin/orders" });
    expect(studio.status).toBe(200);

    const bot = await request(app)
      .post("/api/v1/analytics/pageview")
      .set("User-Agent", "Googlebot/2.1")
      .set("X-Forwarded-For", "203.0.113.11")
      .send({ path: "/blog" });
    expect(bot.status).toBe(200);

    const invalid = await request(app).post("/api/v1/analytics/pageview").send({ path: "not-a-path" });
    expect(invalid.status).toBe(200);

    const missing = await request(app).post("/api/v1/analytics/pageview").send({});
    expect(missing.status).toBe(400);

    const visits = await prisma.siteVisit.findMany({ orderBy: { createdAt: "asc" } });
    expect(visits).toHaveLength(2);
    expect(visits.map((row) => row.path)).toEqual(["/courses/spring-boot-masterclass", "/"]);
    expect(visits[0]?.visitorKey).toBe(visits[1]?.visitorKey);
    expect(visits[0]?.visitorKey).toMatch(/^[a-f0-9]{64}$/);
  });
});
