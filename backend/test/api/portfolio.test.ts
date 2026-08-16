import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { defaultAboutProfile } from "../../src/modules/portfolio/portfolio.types";

const app = createApp();

async function registerAdmin() {
  const agent = request.agent(app);
  const created = await agent.post("/api/v1/auth/register").send({
    name: "Owner",
    email: "admin@example.com",
    password: "password123",
  });
  expect(created.status).toBe(201);
  expect(created.body.data.user.role).toBe("ADMIN");
  return agent;
}

async function currentAbout(agent: ReturnType<typeof request.agent>) {
  const response = await agent.get("/api/v1/portfolio/about");
  expect(response.status).toBe(200);
  return response;
}

describe("portfolio about API", () => {
  it("returns the default about profile with cache validators", async () => {
    const response = await request(app).get("/api/v1/portfolio/about");

    expect(response.status).toBe(200);
    expect(response.headers.etag).toBe('"1"');
    expect(response.headers["cache-control"]).toContain("no-cache");
    expect(response.body.data.profile.fullName).toBe(defaultAboutProfile.fullName);
    expect(response.body.data.profile.version).toBe(1);
    expect(response.body.data.profile.updatedAt).toBeTruthy();
    expect(response.body.data.profile.links).toEqual(defaultAboutProfile.links);
  });

  it("returns 304 when the ETag matches", async () => {
    const response = await request(app)
      .get("/api/v1/portfolio/about")
      .set("If-None-Match", '"1"');

    expect(response.status).toBe(304);
  });

  it("rejects unauthenticated studio reads", async () => {
    const response = await request(app).get("/api/v1/portfolio/about/studio");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects unauthenticated updates", async () => {
    const response = await request(app)
      .put("/api/v1/portfolio/about")
      .set("If-Match", '"1"')
      .send(defaultAboutProfile);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects customer updates", async () => {
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/register").send({
      name: "Customer",
      email: "customer@example.com",
      password: "password123",
    });

    const response = await agent
      .put("/api/v1/portfolio/about")
      .set("If-Match", '"1"')
      .send(defaultAboutProfile);
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("requires If-Match on updates", async () => {
    const agent = await registerAdmin();
    const response = await agent.put("/api/v1/portfolio/about").send(defaultAboutProfile);

    expect(response.status).toBe(428);
    expect(response.body.error.code).toBe("PRECONDITION_REQUIRED");
  });

  it("rejects invalid update payloads", async () => {
    const agent = await registerAdmin();
    const current = await currentAbout(agent);
    const response = await agent
      .put("/api/v1/portfolio/about")
      .set("If-Match", current.headers.etag)
      .send({
        ...defaultAboutProfile,
        fullName: "A",
        links: [{ label: "Site", href: "javascript:alert(1)" }],
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects non-allowlisted embeds", async () => {
    const agent = await registerAdmin();
    const current = await currentAbout(agent);
    const response = await agent
      .put("/api/v1/portfolio/about")
      .set("If-Match", current.headers.etag)
      .send({
        ...defaultAboutProfile,
        embedVideoUrl: "https://example.com/not-youtube",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("lets an admin update the about profile", async () => {
    const agent = await registerAdmin();
    const current = await currentAbout(agent);
    const payload = {
      ...defaultAboutProfile,
      fullName: "Rezaul Karim",
      professionalTitle: "Backend and cloud engineer",
      availability: "Available for contract work",
      coverImageUrl: "https://example.com/cover.jpg",
      gallery: [
        { url: "https://example.com/one.jpg", private: false },
        { url: "https://example.com/two.jpg", private: true },
      ],
      embedVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      introVideoUrl: "",
      links: [
        { label: "GitHub", href: "https://github.com/swe-rezaul-karim" },
        { label: "LinkedIn", href: "https://www.linkedin.com/in/swe-rezaul-karim" },
      ],
    };

    const response = await agent
      .put("/api/v1/portfolio/about")
      .set("If-Match", current.headers.etag)
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.headers.etag).toBe('"2"');
    expect(response.body.data.profile.version).toBe(2);
    expect(response.body.data.profile.professionalTitle).toBe("Backend and cloud engineer");
    expect(response.body.data.profile.availability).toBe("Available for contract work");
    expect(response.body.data.profile.coverImageUrl).toBe("https://example.com/cover.jpg");
    expect(response.body.data.profile.gallery).toEqual(payload.gallery);
    expect(response.body.data.profile.embedVideoUrl).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(response.body.data.profile.introVideoUrl).toBeNull();
    expect(response.body.data.profile.links).toEqual(payload.links);

    const publicRead = await request(app).get("/api/v1/portfolio/about");
    expect(publicRead.body.data.profile.professionalTitle).toBe("Backend and cloud engineer");
    expect(publicRead.body.data.profile.gallery).toEqual([
      { url: "https://example.com/one.jpg", private: false },
    ]);

    const adminPublicRead = await agent.get("/api/v1/portfolio/about");
    expect(adminPublicRead.body.data.profile.gallery).toEqual([
      { url: "https://example.com/one.jpg", private: false },
    ]);

    const studioRead = await agent.get("/api/v1/portfolio/about/studio");
    expect(studioRead.status).toBe(200);
    expect(studioRead.body.data.profile.gallery).toEqual(payload.gallery);
  });

  it("lets an admin hide a gallery photo without rewriting the rest of the profile", async () => {
    const agent = await registerAdmin();
    const current = await currentAbout(agent);
    const created = await agent
      .put("/api/v1/portfolio/about")
      .set("If-Match", current.headers.etag)
      .send({
        ...defaultAboutProfile,
        gallery: [
          { url: "https://example.com/one.jpg", private: false },
          { url: "https://example.com/two.jpg", private: false },
        ],
      });
    expect(created.status).toBe(200);

    const hidden = await agent
      .patch("/api/v1/portfolio/about/gallery")
      .set("If-Match", created.headers.etag)
      .send({
        gallery: [
          { url: "https://example.com/one.jpg", private: false },
          { url: "https://example.com/two.jpg", private: true },
        ],
      });

    expect(hidden.status).toBe(200);
    expect(hidden.body.data.profile.gallery).toEqual([
      { url: "https://example.com/one.jpg", private: false },
      { url: "https://example.com/two.jpg", private: true },
    ]);

    const publicRead = await request(app).get("/api/v1/portfolio/about");
    expect(publicRead.body.data.profile.gallery).toEqual([
      { url: "https://example.com/one.jpg", private: false },
    ]);
  });

  it("rejects a stale If-Match", async () => {
    const agent = await registerAdmin();
    const first = await currentAbout(agent);
    const payload = {
      ...defaultAboutProfile,
      professionalTitle: "Principal engineer",
    };

    const update = await agent
      .put("/api/v1/portfolio/about")
      .set("If-Match", first.headers.etag)
      .send(payload);
    expect(update.status).toBe(200);

    const stale = await agent
      .put("/api/v1/portfolio/about")
      .set("If-Match", first.headers.etag)
      .send(payload);
    expect(stale.status).toBe(412);
    expect(stale.body.error.code).toBe("PRECONDITION_FAILED");
  });
});
