import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { searchKindLabels } from "../../src/modules/search/search.types";

const app = createApp();

async function seedCatalog() {
  await request(app).get("/api/v1/projects");
  await request(app).get("/api/v1/skills");
  await request(app).get("/api/v1/topics");
  await request(app).get("/api/v1/blogs");
  await request(app).get("/api/v1/tutorials");
  await request(app).get("/api/v1/courses");
  await request(app).get("/api/v1/services");
}

describe("search API", () => {
  it("returns empty groups when the query is blank", async () => {
    const response = await request(app).get("/api/v1/search");
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      query: "",
      kind: null,
      total: 0,
      groups: [],
    });
  });

  it("groups Docker matches by content type", { timeout: 30000 }, async () => {
    await seedCatalog();

    const response = await request(app).get("/api/v1/search").query({ q: "Docker" });
    expect(response.status).toBe(200);
    expect(response.body.data.query).toBe("Docker");
    expect(response.body.data.total).toBeGreaterThan(0);

    const groups = response.body.data.groups as Array<{
      kind: string;
      label: string;
      items: Array<{ title: string; href: string }>;
    }>;
    const byKind = Object.fromEntries(groups.map((group) => [group.kind, group]));

    expect(byKind.skill).toMatchObject({
      label: searchKindLabels.skill,
    });
    expect(byKind.skill.items.some((item) => item.title === "Docker" && item.href === "/skills/docker")).toBe(
      true,
    );
    expect(byKind.tutorial.items.some((item) => item.href === "/tutorials/docker-complete")).toBe(true);
    expect(byKind.course.items.some((item) => item.href === "/courses/production-docker")).toBe(true);
    expect(byKind.blog.items.some((item) => item.href === "/blog/docker-networking")).toBe(true);

    const kinds = groups.map((group) => group.kind);
    expect(kinds).toEqual([...kinds].sort((left, right) => {
      const order = ["project", "skill", "topic", "blog", "tutorial", "course", "service"];
      return order.indexOf(left) - order.indexOf(right);
    }));
  });

  it("can limit results to one kind", { timeout: 30000 }, async () => {
    await seedCatalog();
    const response = await request(app).get("/api/v1/search").query({ q: "Docker", kind: "course" });
    expect(response.status).toBe(200);
    expect(response.body.data.kind).toBe("course");
    expect(response.body.data.groups).toHaveLength(1);
    expect(response.body.data.groups[0].kind).toBe("course");
    expect(response.body.data.groups[0].items[0].href).toBe("/courses/production-docker");
  });

  it("does not search premium tutorial bodies", { timeout: 30000 }, async () => {
    await seedCatalog();
    const leaked = await request(app)
      .get("/api/v1/search")
      .query({ q: "transport for claims", kind: "tutorial" });
    expect(leaked.status).toBe(200);
    expect(leaked.body.data.groups).toEqual([]);

    const titled = await request(app).get("/api/v1/search").query({ q: "JWT", kind: "tutorial" });
    expect(titled.status).toBe(200);
    expect(titled.body.data.groups[0].items.some((item: { href: string }) => item.href === "/tutorials/jwt-api-security")).toBe(
      true,
    );
  });

  it("rejects an unknown kind", async () => {
    const response = await request(app).get("/api/v1/search").query({ q: "Docker", kind: "resume" });
    expect(response.status).toBe(400);
  });

  it("filters by year, topic, access, and price", { timeout: 30000 }, async () => {
    await seedCatalog();

    const year = await request(app).get("/api/v1/search").query({ q: "t", kind: "blog", year: "2025" });
    expect(year.status).toBe(200);
    expect(year.body.data.groups[0].items.map((item: { href: string }) => item.href)).toEqual([
      "/blog/modular-monolith",
    ]);
    expect(year.body.data.facets.years).toEqual(expect.arrayContaining(["2025", "2026"]));

    const topic = await request(app).get("/api/v1/search").query({ q: "Docker", kind: "blog", topic: "Images" });
    expect(topic.status).toBe(200);
    expect(topic.body.data.groups[0].items.some((item: { href: string }) => item.href === "/blog/docker-networking")).toBe(
      true,
    );

    const access = await request(app).get("/api/v1/search").query({ q: "JWT", kind: "tutorial", access: "paid" });
    expect(access.status).toBe(200);
    expect(
      access.body.data.groups[0].items.some((item: { href: string }) => item.href === "/tutorials/jwt-api-security"),
    ).toBe(true);

    const price = await request(app)
      .get("/api/v1/search")
      .query({ q: "Spring", kind: "course", price: "50-199" });
    expect(price.status).toBe(200);
    expect(price.body.data.groups[0].items[0].href).toBe("/courses/spring-boot-masterclass");
  });

  it("can sort blog matches by newest", { timeout: 30000 }, async () => {
    await seedCatalog();
    const response = await request(app).get("/api/v1/search").query({ q: "t", kind: "blog", sort: "newest" });
    expect(response.status).toBe(200);
    expect(response.body.data.sort).toBe("newest");
    expect(response.body.data.groups[0].items.map((item: { href: string }) => item.href)).toEqual([
      "/blog/jwt-authentication",
      "/blog/docker-networking",
      "/blog/modular-monolith",
    ]);
  });

  it("rejects an unknown sort or price band", async () => {
    expect((await request(app).get("/api/v1/search").query({ q: "Docker", sort: "views" })).status).toBe(400);
    expect((await request(app).get("/api/v1/search").query({ q: "Docker", price: "cheap" })).status).toBe(400);
  });
});
