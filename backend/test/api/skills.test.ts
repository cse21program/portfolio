import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { defaultSkills } from "../../src/modules/skills/skills.types";

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

const sampleSkill = {
  name: "Java",
  slug: "java",
  field: "Backend Development",
  level: "Advanced",
  years: "Core language",
  summary: "Object-oriented backend services with a strong type system.",
  overview: "Java is the foundation of my Spring Boot work.",
  iconUrl: null,
  imageUrl: null,
  videoUrl: null,
  embedVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  fieldVideoUrl: null,
  fieldEmbedVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  featured: true,
  published: true,
  seoTitle: "Java",
  seoDescription: "Backend Java skills.",
  topics: [
    {
      title: "OOP",
      slug: "oop",
      summary: "Encapsulation, composition, and domain modeling.",
      overview: "Keep business rules close to the model.",
      images: [],
      videoUrl: null,
      embedVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      relatedBlogSlugs: ["jwt-authentication"],
      relatedTutorialSlugs: [],
      relatedCourseSlugs: ["spring-boot-masterclass"],
      seoTitle: "",
      seoDescription: "",
    },
  ],
};

describe("skills API", () => {
  it("seeds default records on the first public read", async () => {
    const response = await request(app).get("/api/v1/skills");

    expect(response.status).toBe(200);
    expect(response.body.data.skills).toHaveLength(defaultSkills.length);
    expect(response.body.data.skills[0].slug).toBe("java");
    expect(response.body.data.skills[0].field).toBe("Backend Development");
    expect(response.body.data.skills[0].topics[0].slug).toBe("oop");
    expect(response.body.data.skills[0].featured).toBe(true);
  });

  it("returns a skill and related skills by slug", async () => {
    const response = await request(app).get("/api/v1/skills/java");

    expect(response.status).toBe(200);
    expect(response.body.data.skill.name).toBe("Java");
    expect(response.body.data.skill.topics.map((topic: { slug: string }) => topic.slug)).toEqual([
      "oop",
      "collections",
    ]);
    expect(response.body.data.related.length).toBeGreaterThan(0);
    expect(response.body.data.related.every((item: { slug: string }) => item.slug !== "java")).toBe(
      true,
    );
    expect(response.body.data.related[0].field).toBe("Backend Development");
  });

  it("returns 404 for an unknown slug", async () => {
    const response = await request(app).get("/api/v1/skills/missing-skill");
    expect(response.status).toBe(404);
  });

  it("rejects unauthenticated updates", async () => {
    const response = await request(app).put("/api/v1/skills").send({ skills: [sampleSkill] });
    expect(response.status).toBe(401);
  });

  it("rejects customer updates", async () => {
    const agent = await registerCustomer();
    const response = await agent.put("/api/v1/skills").send({ skills: [sampleSkill] });
    expect(response.status).toBe(403);
  });

  it("lets an admin replace the list in order", async () => {
    const agent = await registerAdmin();
    const updated = await agent.put("/api/v1/skills").send({
      skills: [
        sampleSkill,
        {
          ...sampleSkill,
          name: "Docker",
          slug: "docker",
          field: "DevOps",
          featured: false,
          topics: [
            {
              title: "Images",
              slug: "images",
              summary: "Lean Dockerfiles and reproducible builds.",
              overview: "The image should be the artifact you promote.",
              images: [],
              videoUrl: null,
              relatedBlogSlugs: [],
              relatedTutorialSlugs: ["docker-complete"],
              relatedCourseSlugs: [],
              seoTitle: "",
              seoDescription: "",
            },
          ],
        },
      ],
    });

    expect(updated.status).toBe(200);
    expect(updated.body.data.skills).toHaveLength(2);
    expect(updated.body.data.skills[0].slug).toBe("java");
    expect(updated.body.data.skills[0].sortOrder).toBe(0);
    expect(updated.body.data.skills[1].slug).toBe("docker");
    expect(updated.body.data.skills[1].topics[0].slug).toBe("images");
    expect(updated.body.data.skills[0].fieldEmbedVideoUrl).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(updated.body.data.skills[0].embedVideoUrl).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(updated.body.data.skills[0].topics[0].embedVideoUrl).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );

    const listed = await request(app).get("/api/v1/skills");
    expect(listed.body.data.skills.map((item: { slug: string }) => item.slug)).toEqual([
      "java",
      "docker",
    ]);
  });

  it("rejects duplicate skill slugs and duplicate topic slugs", async () => {
    const agent = await registerAdmin();
    const duplicates = await agent.put("/api/v1/skills").send({
      skills: [sampleSkill, { ...sampleSkill, name: "Copy" }],
    });
    expect(duplicates.status).toBe(400);

    const topicDupes = await agent.put("/api/v1/skills").send({
      skills: [
        {
          ...sampleSkill,
          topics: [sampleSkill.topics[0], { ...sampleSkill.topics[0], title: "Copy" }],
        },
      ],
    });
    expect(topicDupes.status).toBe(400);
  });
});
