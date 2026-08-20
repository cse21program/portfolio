import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FieldDetailPage } from "@/features/skills/FieldDetailPage";
import { SkillDetailPage } from "@/features/skills/SkillDetailPage";
import { SkillsPage } from "@/features/skills/SkillsPage";
import { TopicDetailPage } from "@/features/skills/TopicDetailPage";
import { TopicsPage } from "@/features/skills/TopicsPage";
import { expandFilters } from "../../helpers/expandFilters";

const apiFields = [
  {
    id: "field-1",
    name: "Backend Development",
    slug: "backend-development",
    summary: "APIs, domain models, and services that stay stable as systems grow.",
    overview: "Clear boundaries and APIs that stay readable.",
    featured: true,
    published: true,
    iconUrl: "/media/backend-icon.png",
    thumbnailUrl: "/media/backend-thumb.jpg",
    bannerUrl: "/media/backend-banner.jpg",
    embedVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: "field-2",
    name: "DevOps",
    slug: "devops",
    summary: "Packaging, delivery, and the path from a laptop to production.",
    overview: "Containers and rollouts.",
    featured: true,
    published: true,
  },
];

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
        body: "Pin the base image and keep the runtime layer small.\n\nBuild in one stage, copy the artifact into a second.",
        images: ["/media/docker-1.jpg"],
        videoUrl: null,
        embedVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        codeSnippets: [
          { label: "Runtime stage", language: "docker", code: "FROM eclipse-temurin:21-jre" },
        ],
        resources: [{ label: "Docker build docs", url: "https://docs.docker.com/build/" }],
        relatedBlogSlugs: ["docker-networking"],
        relatedTutorialSlugs: ["docker-complete"],
        relatedCourseSlugs: ["production-docker"],
        relatedCertificateSlugs: ["docker-essentials"],
        seoTitle: "Docker images",
        seoDescription: "Lean Dockerfiles and reproducible builds.",
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
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);
        if (url.includes("/fields")) {
          return jsonResponse({ fields: apiFields });
        }
        if (url.includes("/tutorials")) {
          return jsonResponse({
            tutorials: [
              {
                slug: "docker-complete",
                title: "Docker complete tutorial",
                description: "From images and containers to a deployable API stack.",
                difficulty: "Beginner",
                duration: "4 hours",
                price: "Free",
                free: true,
                skill: "Docker",
                sections: [],
                status: "published",
              },
            ],
          });
        }
        if (url.includes("/topics")) {
          return jsonResponse({
            topics: apiSkills.flatMap((skill) =>
              skill.topics.map((topic) => ({
                ...topic,
                skill: skill.name,
                skillSlug: skill.slug,
                field: skill.field,
                fieldSlug: skill.field === "Backend Development" ? "backend-development" : "devops",
                published: true,
              })),
            ),
          });
        }
        return jsonResponse({ skills: apiSkills });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the knowledge tree from the API", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SkillsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "What I work in" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play Backend Development introduction" })).not.toBeInTheDocument();
    expect(document.querySelector('img[src="/media/backend-icon.png"]')).not.toBeNull();
    expect(
      await screen.findByText("APIs, domain models, and services that stay stable as systems grow."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play Java introduction" })).not.toBeInTheDocument();
    expect(await screen.findByText("Object-oriented backend services.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Java" })).toBeInTheDocument();
    expect(screen.getByText("Skill video")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Docker" })).toBeInTheDocument();
    await expandFilters(user);
    expect(screen.getByRole("button", { name: "Backend Development" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Backend Development" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Backend Development" })).toHaveAttribute(
      "href",
      "/fields/backend-development",
    );
    expect(screen.getByRole("link", { name: "View Backend Development" })).toHaveAttribute(
      "href",
      "/fields/backend-development",
    );
  });

  it("filters skills by search", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SkillsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Object-oriented backend services.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Search skills"), "Docker");
    expect(screen.queryByRole("heading", { name: "Java" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Docker" })).toBeInTheDocument();
  });

  it("renders a field and its skills", async () => {
    render(
      <MemoryRouter initialEntries={["/fields/backend-development"]}>
        <Routes>
          <Route path="/fields/:fieldSlug" element={<FieldDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Backend Development" })).toBeInTheDocument();
    expect(await screen.findByText("Clear boundaries and APIs that stay readable.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Java" })).toHaveAttribute("href", "/skills/java");
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
    expect(screen.getByRole("link", { name: "OOP" })).toHaveAttribute("href", "/skills/java/oop");
    expect(screen.getByRole("heading", { name: "Related skills" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Docker" })).toHaveAttribute("href", "/skills/docker");
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

    expect(await screen.findByRole("heading", { name: "Images", level: 1 })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Play Images introduction" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByText("The image should be the artifact you promote.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Text" })).toBeInTheDocument();
    expect(screen.getByText("Pin the base image and keep the runtime layer small.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Code" })).toBeInTheDocument();
    expect(screen.getByText("Runtime stage")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Images", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Blog" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Docker networking explained for API developers" })).toHaveAttribute(
      "href",
      "/blog/docker-networking",
    );
    expect(screen.getByRole("heading", { name: "Tutorials" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Docker complete tutorial" })).toHaveAttribute(
      "href",
      "/tutorials/docker-complete",
    );
    expect(screen.getByRole("heading", { name: "Courses" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Production Docker" })).toHaveAttribute(
      "href",
      "/courses/production-docker",
    );
    expect(screen.getByRole("heading", { name: "Certificates" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Docker & container fundamentals" })).toHaveAttribute(
      "href",
      "/certificates",
    );
    expect(screen.getByRole("heading", { name: "Resources" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Docker build docs" })).toHaveAttribute(
      "href",
      "https://docs.docker.com/build/",
    );
    expect(screen.getByRole("link", { name: "Back to Docker" })).toHaveAttribute("href", "/skills/docker");
    expect(document.title).toBe("Docker images");

    await user.click(screen.getByRole("button", { name: "View photo 1 of 1" }));
    expect(screen.getByRole("dialog", { name: /Photo 1 of 1/ })).toBeInTheDocument();
  });

  it("opens a unique topic slug at /topics/:slug", async () => {
    render(
      <MemoryRouter initialEntries={["/topics/images"]}>
        <Routes>
          <Route path="/topics/:topicSlug" element={<TopicDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Images", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Docker" })).toHaveAttribute("href", "/skills/docker");
  });

  it("renders topics grouped by skill", async () => {
    render(
      <MemoryRouter>
        <TopicsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Lessons under each skill" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Java" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "OOP" })).toHaveAttribute("href", "/topics/java/oop");
  });

  it("filters topics by search", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TopicsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Java" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Search topics"), "OOP");
    expect(screen.getByRole("link", { name: "OOP" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Images" })).not.toBeInTheDocument();
  });
});
