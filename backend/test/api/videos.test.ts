import request from "supertest";
import { describe, expect, it } from "vitest";
import { prisma } from "@common/database/prisma";
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
  expect(created.body.data.user.role).toBe("ADMIN");
  return agent;
}

describe("videos API", () => {
  it("lets an admin add, rename, and remove a YouTube video", async () => {
    const agent = await registerAdmin();

    const created = await agent.post("/api/v1/videos").send({
      url: "https://youtu.be/dQw4w9WgXcQ",
      title: "Intro",
    });
    expect(created.status).toBe(201);
    expect(created.body.data.video).toMatchObject({
      origin: "hosted",
      provider: "youtube",
      title: "Intro",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    const id = created.body.data.video.id as string;
    const listed = await agent.get("/api/v1/videos");
    expect(listed.status).toBe(200);
    expect(listed.body.data.videos.some((item: { id: string }) => item.id === id)).toBe(true);

    const updated = await agent.patch(`/api/v1/videos/${id}`).send({ title: "Studio intro" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.video.title).toBe("Studio intro");

    const duplicate = await agent.post("/api/v1/videos").send({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" });
    expect(duplicate.status).toBe(409);

    const removed = await agent.delete(`/api/v1/videos/${id}`);
    expect(removed.status).toBe(200);
  });

  it("accepts Vimeo and CDN links, lists uploaded files, and rejects library URLs", async () => {
    const agent = await registerAdmin();

    const vimeo = await agent.post("/api/v1/videos").send({ url: "https://vimeo.com/123456789" });
    expect(vimeo.status).toBe(201);
    expect(vimeo.body.data.video).toMatchObject({
      origin: "hosted",
      provider: "vimeo",
      url: "https://vimeo.com/123456789",
    });

    const cdn = await agent.post("/api/v1/videos").send({ url: "https://cdn.example.com/promo.mp4" });
    expect(cdn.status).toBe(201);
    expect(cdn.body.data.video).toMatchObject({ origin: "hosted", provider: "url" });

    const filename = "7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.mp4";
    const uploaded = await prisma.mediaAsset.create({
      data: {
        filename,
        originalName: "demo.mp4",
        kind: "video",
        contentType: "video/mp4",
        sizeBytes: 12,
        url: `/api/v1/media/files/${filename}`,
      },
    });

    const listed = await agent.get("/api/v1/videos");
    expect(listed.status).toBe(200);
    const catalog = listed.body.data.videos as Array<{ id: string; origin: string; title: string }>;
    expect(catalog.some((item) => item.id === uploaded.id && item.origin === "upload" && item.title === "demo.mp4")).toBe(
      true,
    );

    const renamed = await agent.patch(`/api/v1/videos/${uploaded.id}`).send({ title: "Studio demo" });
    expect(renamed.status).toBe(200);
    expect(renamed.body.data.video).toMatchObject({ origin: "upload", title: "Studio demo.mp4" });

    const libraryUrl = await agent.post("/api/v1/videos").send({
      url: `https://example.com/api/v1/media/files/${filename}`,
    });
    expect(libraryUrl.status).toBe(400);

    const removed = await agent.delete(`/api/v1/videos/${uploaded.id}`);
    expect(removed.status).toBe(200);
  });

  it("indexes video URLs already used on courses and tutorials", async () => {
    const agent = await registerAdmin();
    const youtube = "https://youtu.be/dQw4w9WgXcQ";
    const vimeo = "https://vimeo.com/123456789";
    const cdn = "https://cdn.example.com/lesson.webm";

    await prisma.course.create({
      data: {
        title: "Catalog course",
        slug: `video-course-${Date.now()}`,
        description: "Promo and lesson videos.",
        promoVideoUrl: youtube,
        modules: [
          {
            title: "Start",
            summary: "",
            lessons: [
              {
                title: "Welcome",
                summary: "",
                body: [],
                videoUrl: vimeo,
                images: [],
                codeSnippets: [],
                resources: [],
                downloads: [],
              },
            ],
          },
        ],
      },
    });

    await prisma.tutorial.create({
      data: {
        title: "Catalog tutorial",
        slug: `video-tutorial-${Date.now()}`,
        description: "Section video.",
        sections: [
          {
            title: "Intro",
            summary: "",
            body: [],
            videoUrl: cdn,
            images: [],
            codeSnippets: [],
            resources: [],
            downloads: [],
          },
        ],
      },
    });

    const listed = await agent.get("/api/v1/videos");
    expect(listed.status).toBe(200);
    const catalog = listed.body.data.videos as Array<{
      id: string;
      origin: string;
      provider: string;
      url: string;
      title: string;
      usedIn: Array<{ label: string; href: string }>;
    }>;

    const hostedYoutube = catalog.find((item) => item.url === "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    const hostedVimeo = catalog.find((item) => item.url === "https://vimeo.com/123456789");
    const hostedCdn = catalog.find((item) => item.url === cdn);

    expect(hostedYoutube).toMatchObject({ origin: "hosted", provider: "youtube", title: "Catalog course" });
    expect(hostedYoutube?.usedIn).toEqual([{ label: "Catalog course", href: "/admin/courses" }]);
    expect(hostedVimeo).toMatchObject({ origin: "hosted", provider: "vimeo", title: "Catalog course" });
    expect(hostedCdn).toMatchObject({ origin: "hosted", provider: "url", title: "Catalog tutorial" });
    expect(hostedCdn?.usedIn).toEqual([{ label: "Catalog tutorial", href: "/admin/tutorials" }]);

    const blocked = await agent.delete(`/api/v1/videos/${hostedYoutube!.id}`);
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.message).toMatch(/Catalog course/);
  });

  it("rejects a page URL and forbids customers", async () => {
    const admin = await registerAdmin();
    const rejected = await admin.post("/api/v1/videos").send({ url: "https://example.com/about" });
    expect(rejected.status).toBe(400);

    const customer = request.agent(app);
    const created = await customer.post("/api/v1/auth/register").send({
      name: "Student",
      email: `video-cust-${Date.now()}@example.com`,
      password: "password123",
    });
    expect(created.status).toBe(201);
    const listed = await customer.get("/api/v1/videos");
    expect(listed.status).toBe(403);
  });
});
