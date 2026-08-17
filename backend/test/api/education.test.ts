import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { defaultEducation } from "../../src/modules/education/education.types";

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

const sampleSchool = {
  institution: "Leading University",
  degree: "B.Sc.",
  field: "Computer Science",
  startDate: "2021",
  endDate: "",
  current: true,
  grade: "3.8 CGPA",
  location: "Sylhet, Bangladesh",
  description: "Software construction and systems.",
  achievements: ["Ship real projects alongside coursework"],
  logoUrl: null,
  documentUrl: null,
  documentName: null,
  website: "https://www.lus.ac.bd/",
};

describe("education API", () => {
  it("seeds default records on the first public read", async () => {
    const response = await request(app).get("/api/v1/education");

    expect(response.status).toBe(200);
    expect(response.body.data.education).toHaveLength(defaultEducation.length);
    expect(response.body.data.education[0].institution).toBe("Leading University");
    expect(response.body.data.education[0].current).toBe(true);
    expect(response.body.data.education[0].endDate).toBe("Present");
    expect(response.body.data.education[0].website).toBe("https://www.lus.ac.bd/");
  });

  it("rejects unauthenticated updates", async () => {
    const response = await request(app)
      .put("/api/v1/education")
      .send({ education: [sampleSchool] });

    expect(response.status).toBe(401);
  });

  it("rejects customer updates", async () => {
    const agent = await registerCustomer();
    const response = await agent.put("/api/v1/education").send({ education: [sampleSchool] });

    expect(response.status).toBe(403);
  });

  it("lets an admin replace the list in order", async () => {
    const agent = await registerAdmin();
    const updated = await agent.put("/api/v1/education").send({
      education: [
        sampleSchool,
        {
          ...sampleSchool,
          institution: "City College",
          degree: "H.S.C.",
          field: "Science",
          current: false,
          startDate: "2018",
          endDate: "2020",
          grade: "",
          website: null,
        },
      ],
    });

    expect(updated.status).toBe(200);
    expect(updated.body.data.education).toHaveLength(2);
    expect(updated.body.data.education[0].institution).toBe("Leading University");
    expect(updated.body.data.education[0].sortOrder).toBe(0);
    expect(updated.body.data.education[1].institution).toBe("City College");
    expect(updated.body.data.education[1].endDate).toBe("2020");

    const listed = await request(app).get("/api/v1/education");
    expect(listed.body.data.education.map((item: { institution: string }) => item.institution)).toEqual([
      "Leading University",
      "City College",
    ]);
  });

  it("rejects javascript institution websites", async () => {
    const agent = await registerAdmin();
    const response = await agent.put("/api/v1/education").send({
      education: [{ ...sampleSchool, website: "javascript:alert(1)" }],
    });

    expect(response.status).toBe(400);
  });

  it("requires institution and field", async () => {
    const agent = await registerAdmin();
    const response = await agent.put("/api/v1/education").send({
      education: [{ ...sampleSchool, institution: "A", field: "" }],
    });

    expect(response.status).toBe(400);
  });
});
