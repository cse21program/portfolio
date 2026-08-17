import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { defaultExperiences } from "../../src/modules/experience/experience.types";

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

async function registerCustomer() {
  const agent = request.agent(app);
  const created = await agent.post("/api/v1/auth/register").send({
    name: "Student",
    email: "customer@example.com",
    password: "password123",
  });
  expect(created.status).toBe(201);
  expect(created.body.data.user.role).toBe("CUSTOMER");
  return agent;
}

const sampleRole = {
  company: "Acme",
  position: "Backend Engineer",
  type: "Full-time",
  location: "Remote",
  startDate: "2025",
  endDate: "",
  current: true,
  description: "APIs and delivery.",
  responsibilities: ["Ship services"],
  achievements: ["Cut deploy time"],
  technologies: ["TypeScript"],
  logoUrl: null,
  website: "https://example.com",
};

describe("experience API", () => {
  it("seeds default roles on the first public read", async () => {
    const response = await request(app).get("/api/v1/experience");

    expect(response.status).toBe(200);
    expect(response.body.data.experiences).toHaveLength(defaultExperiences.length);
    expect(response.body.data.experiences[0].company).toBe("Independent");
    expect(response.body.data.experiences[0].current).toBe(true);
    expect(response.body.data.experiences[0].endDate).toBe("Present");
    expect(response.body.data.experiences[1].website).toBe("https://www.lus.ac.bd/");
  });

  it("rejects unauthenticated updates", async () => {
    const response = await request(app)
      .put("/api/v1/experience")
      .send({ experiences: [sampleRole] });

    expect(response.status).toBe(401);
  });

  it("rejects customer updates", async () => {
    const agent = await registerCustomer();
    const response = await agent.put("/api/v1/experience").send({ experiences: [sampleRole] });

    expect(response.status).toBe(403);
  });

  it("lets an admin replace the list in chronological order", async () => {
    const agent = await registerAdmin();
    const updated = await agent.put("/api/v1/experience").send({
      experiences: [
        sampleRole,
        {
          ...sampleRole,
          company: "Studio",
          position: "Contractor",
          type: "Contract",
          current: false,
          startDate: "2023",
          endDate: "2024",
          website: null,
        },
      ],
    });

    expect(updated.status).toBe(200);
    expect(updated.body.data.experiences).toHaveLength(2);
    expect(updated.body.data.experiences[0].company).toBe("Acme");
    expect(updated.body.data.experiences[0].sortOrder).toBe(0);
    expect(updated.body.data.experiences[1].company).toBe("Studio");
    expect(updated.body.data.experiences[1].endDate).toBe("2024");

    const listed = await request(app).get("/api/v1/experience");
    expect(listed.body.data.experiences.map((item: { company: string }) => item.company)).toEqual([
      "Acme",
      "Studio",
    ]);
  });

  it("rejects javascript company websites", async () => {
    const agent = await registerAdmin();
    const response = await agent.put("/api/v1/experience").send({
      experiences: [{ ...sampleRole, website: "javascript:alert(1)" }],
    });

    expect(response.status).toBe(400);
  });

  it("requires company and position", async () => {
    const agent = await registerAdmin();
    const response = await agent.put("/api/v1/experience").send({
      experiences: [{ ...sampleRole, company: "A", position: "" }],
    });

    expect(response.status).toBe(400);
  });
});
