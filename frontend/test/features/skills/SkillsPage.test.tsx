import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SkillDetailPage } from "@/features/skills/SkillDetailPage";
import { SkillsPage } from "@/features/skills/SkillsPage";
import { TopicDetailPage } from "@/features/skills/TopicDetailPage";

const apiSkills = [
  {
    id: "skill-1",
    name: "Java",
    slug: "java",
    field: "Backend Development",
    level: "Advanced",
    years: "Core language",
    summary: "Object-oriented backend services.",
    overview: "Java is the foundation of my Spring Boot work.",
    featured: true,
    published: true,
    fieldEmbedVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    embedVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    topics: [
      {
        id: "topic-1",
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
      },
    ],
  },
  {
    id: "skill-2",
    name: "Docker",
    slug: "docker",
    field: "DevOps",
    level: "Advanced",
    years: "Local and production",
    summary: "Images, compose files, and repeatable environments.",
    overview: "Docker is the default packaging for APIs.",
    featured: false,
    published: true,
    topics: [
      {
        id: "topic-2",
        title: "Images",
        slug: "images",
        summary: "Lean Dockerfiles and reproducible builds.",
        overview: "The image should be the artifact you promote.",
        images: ["/media/docker-1.jpg"],
        videoUrl: null,
        embedVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        relatedBlogSlugs: [],
        relatedTutorialSlugs: ["docker-complete"],
        relatedCourseSlugs: [],
      },
    ],
  },
];

function jsonResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ success: true, data }),
  };
}

describe("SkillsPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ skills: apiSkills })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the knowledge tree from the API", async () => {
    render(
      <MemoryRouter>
        <SkillsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "What I work in" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Play Backend Development introduction" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Play Backend Development introduction" }));
    const embed = screen.getByTitle("Backend Development introduction");
    expect(embed.tagName).toBe("IFRAME");
    expect(embed.getAttribute("src")).toContain("https://www.youtube.com/embed/dQw4w9WgXcQ");
    expect(embed.getAttribute("src")).not.toContain("origin=");
    expect(embed.getAttribute("sandbox")).toBeNull();
    expect(
      embed.getAttribute("referrerpolicy") ?? embed.getAttribute("referrerPolicy"),
    ).toBe("strict-origin-when-cross-origin");
    expect(screen.queryByRole("button", { name: "Play Java introduction" })).not.toBeInTheDocument();
    expect(await screen.findByText("Object-oriented backend services.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Java" })).toBeInTheDocument();
    expect(screen.getByText("Skill video")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Docker" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Backend Development" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Backend Development" })).toBeInTheDocument();
  });

  it("renders a skill and related skills", async () => {
    render(
      <MemoryRouter initialEntries={["/skills/java"]}>
        <Routes>
          <Route path="/skills/:skillSlug" element={<SkillDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Java" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Play Java introduction" })).toBeInTheDocument();
    expect(await screen.findByText("Java is the foundation of my Spring Boot work.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /OOP/ })).toHaveAttribute("href", "/skills/java/oop");
    expect(screen.getByRole("heading", { name: "Related skills" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Docker/ })).toHaveAttribute("href", "/skills/docker");
  });

  it("renders a topic and related learning links", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/skills/docker/images"]}>
        <Routes>
          <Route path="/skills/:skillSlug/:topicSlug" element={<TopicDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Images" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Play Images introduction" })).toBeInTheDocument();
    expect(await screen.findByText("The image should be the artifact you promote.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Docker" })).toHaveAttribute("href", "/skills/docker");

    await user.click(screen.getByRole("button", { name: "View photo 1 of 1" }));
    expect(screen.getByRole("dialog", { name: /Photo 1 of 1/ })).toBeInTheDocument();
  });
});
