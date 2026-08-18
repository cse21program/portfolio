import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPut } from "@/lib/api";
import { AdminSkillsPage } from "@/features/skills/AdminSkillsPage";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPut: vi.fn(),
  };
});

const get = vi.mocked(apiGet);
const put = vi.mocked(apiPut);

const seeded = [
  {
    id: "b2e2d9f1-0000-4000-8000-000000000021",
    name: "Java",
    slug: "java",
    field: "Backend Development",
    level: "Advanced",
    years: "Core language",
    summary: "Object-oriented backend services.",
    overview: "Java is the foundation of my Spring Boot work.",
    iconUrl: null,
    imageUrl: null,
    featured: true,
    published: true,
    seoTitle: "Java",
    seoDescription: "Backend Java skills.",
    sortOrder: 0,
    topics: [
      {
        id: "b2e2d9f1-0000-4000-8000-000000000022",
        title: "OOP",
        slug: "oop",
        summary: "Encapsulation, composition, and domain modeling.",
        overview: "Keep business rules close to the model.",
        images: [],
        videoUrl: null,
        relatedBlogSlugs: ["jwt-authentication"],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: ["spring-boot-masterclass"],
        seoTitle: "",
        seoDescription: "",
        sortOrder: 0,
      },
    ],
  },
];

describe("AdminSkillsPage", () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
    get.mockResolvedValue({ skills: seeded });
    put.mockResolvedValue({
      skills: [{ ...seeded[0]!, name: "Java SE" }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads published records and publishes edits", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminSkillsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Skills" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Java");
    expect(screen.getByLabelText("Slug")).toHaveValue("java");
    expect(screen.getByLabelText("Field")).toHaveValue("Backend Development");
    expect(screen.getByLabelText("Level")).toHaveValue("Advanced");
    expect(screen.getByLabelText("Topic title")).toHaveValue("OOP");
    expect(screen.getByText("JWT authentication without painting yourself into a corner")).toBeInTheDocument();
    expect(screen.getByText("Production-grade Spring Boot")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View public page →" })).toHaveAttribute("href", "/skills");
    expect(screen.getByRole("button", { name: "Docker networking explained for API developers" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Docker complete tutorial" })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Field"), "DevOps");
    await user.click(screen.getByRole("button", { name: "Docker networking explained for API developers" }));
    await user.click(screen.getByRole("button", { name: "Start with a modular monolith" }));
    await user.click(screen.getByRole("button", { name: "Docker complete tutorial" }));
    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Java SE");
    await user.click(screen.getByRole("button", { name: "Publish skills" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalled();
    });

    expect(put).toHaveBeenCalledWith(
      "/skills",
      expect.objectContaining({
        skills: [
          expect.objectContaining({
            name: "Java SE",
            slug: "java",
            field: "DevOps",
            featured: true,
            topics: [
              expect.objectContaining({
                slug: "oop",
                relatedBlogSlugs: ["jwt-authentication", "docker-networking", "modular-monolith"],
                relatedTutorialSlugs: ["docker-complete"],
              }),
            ],
          }),
        ],
      }),
    );
    expect(await screen.findByText("Skills published.")).toBeInTheDocument();
  });

  it("blocks publish when a name is missing", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminSkillsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText("Name")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Name"));
    await user.click(screen.getByRole("button", { name: "Publish skills" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("name must be at least 2 characters");
  });
});
