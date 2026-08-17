import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { defaultResume } from "../../src/modules/portfolio/resume.types";

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

describe("portfolio resume API", () => {
  it("returns the default resume with cache validators", async () => {
    const response = await request(app).get("/api/v1/portfolio/resume");

    expect(response.status).toBe(200);
    expect(response.headers.etag).toBe('"1"');
    expect(response.body.data.resume.headline).toBeNull();
    expect(response.body.data.resume.awards).toEqual([]);
    expect(response.body.data.resume.pdfUrl).toBeNull();
    expect(response.body.data.resume.version).toBe(1);
  });

  it("rejects unauthenticated updates", async () => {
    const response = await request(app)
      .put("/api/v1/portfolio/resume")
      .set("If-Match", '"1"')
      .send({ ...defaultResume, awards: [], publications: [] });

    expect(response.status).toBe(401);
  });

  it("lets an admin publish awards and a PDF path", async () => {
    const agent = await registerAdmin();
    const current = await agent.get("/api/v1/portfolio/resume");
    const payload = {
      headline: "Software Engineer",
      summary: "Backend, DevOps, and production systems.",
      awards: [
        {
          title: "Dean's list",
          detail: "Leading University",
          year: "2024",
          href: "https://www.lus.ac.bd/",
        },
      ],
      publications: [],
      pdfUrl: "/api/v1/media/files/7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.pdf",
      pdfFileName: "rezaul-karim-cv.pdf",
    };

    const updated = await agent
      .put("/api/v1/portfolio/resume")
      .set("If-Match", current.headers.etag)
      .send(payload);

    expect(updated.status).toBe(200);
    expect(updated.body.data.resume.headline).toBe("Software Engineer");
    expect(updated.body.data.resume.awards).toHaveLength(1);
    expect(updated.body.data.resume.pdfFileName).toBe("rezaul-karim-cv.pdf");
    expect(updated.body.data.resume.version).toBe(current.body.data.resume.version + 1);
  });

  it("rejects javascript links in awards", async () => {
    const agent = await registerAdmin();
    const current = await agent.get("/api/v1/portfolio/resume");
    const response = await agent
      .put("/api/v1/portfolio/resume")
      .set("If-Match", current.headers.etag)
      .send({
        headline: null,
        summary: null,
        awards: [{ title: "Hack", detail: "", year: "", href: "javascript:alert(1)" }],
        publications: [],
        pdfUrl: null,
        pdfFileName: null,
      });

    expect(response.status).toBe(400);
  });

  it("requires If-Match for updates", async () => {
    const agent = await registerAdmin();
    const response = await agent.put("/api/v1/portfolio/resume").send({
      headline: "Engineer",
      summary: null,
      awards: [],
      publications: [],
      pdfUrl: null,
      pdfFileName: null,
    });

    expect(response.status).toBe(428);
  });
});
