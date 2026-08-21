import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { defaultCertificates } from "../../src/modules/certificates/certificates.types";

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

const sampleCertificate = {
  title: "AWS Cloud Practitioner path",
  slug: "aws-foundations",
  organization: "Amazon Web Services",
  issueDate: "In progress",
  expiryDate: "",
  credentialId: "",
  skill: "AWS",
  description: "Foundations across IAM, EC2, VPC, S3, and the shared-responsibility model.",
  imageUrl: null,
  documentUrl: null,
  documentName: null,
  verificationUrl: null,
  featured: true,
  status: "published",
  publishedAt: "2026-01-01",
  seoTitle: "",
  seoDescription: "",
};

describe("certificates API", () => {
  it("seeds default records on the first public read", async () => {
    const response = await request(app).get("/api/v1/certificates");

    expect(response.status).toBe(200);
    expect(response.body.data.certificates).toHaveLength(defaultCertificates.length);
    expect(response.body.data.certificates[0].slug).toBe("aws-foundations");
    expect(response.body.data.certificates[0].status).toBe("published");
  });

  it("returns a published credential by slug", async () => {
    const response = await request(app).get("/api/v1/certificates/aws-foundations");
    expect(response.status).toBe(200);
    expect(response.body.data.certificate.title).toContain("AWS");
  });

  it("rejects unauthenticated updates", async () => {
    const response = await request(app).put("/api/v1/certificates").send({
      certificates: [sampleCertificate],
    });
    expect(response.status).toBe(401);
  });

  it("rejects customer updates", async () => {
    const agent = await registerCustomer();
    const response = await agent.put("/api/v1/certificates").send({
      certificates: [sampleCertificate],
    });
    expect(response.status).toBe(403);
  });

  it("lets an admin replace the list and hides drafts from the public catalog", async () => {
    const agent = await registerAdmin();
    const updated = await agent.put("/api/v1/certificates").send({
      certificates: [
        sampleCertificate,
        {
          ...sampleCertificate,
          title: "Draft credential",
          slug: "draft-credential",
          status: "draft",
          featured: false,
        },
      ],
    });

    expect(updated.status).toBe(200);
    expect(updated.body.data.certificates).toHaveLength(2);

    const listed = await request(app).get("/api/v1/certificates");
    expect(listed.body.data.certificates.map((item: { slug: string }) => item.slug)).toEqual([
      "aws-foundations",
    ]);

    const hidden = await request(app).get("/api/v1/certificates/draft-credential");
    expect(hidden.status).toBe(404);

    const preview = await agent.get("/api/v1/certificates/draft-credential");
    expect(preview.status).toBe(200);
    expect(preview.body.data.certificate.status).toBe("draft");
  });
});
