import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPut } from "@/lib/api";
import { AdminTopicsPage } from "@/features/skills/AdminTopicsPage";

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

const seededTopic = {
  id: "b2e2d9f1-0000-4000-8000-000000000041",
  skill: "Java",
  skillSlug: "java",
  field: "Backend Development",
  fieldSlug: "backend-development",
  title: "OOP",
  slug: "oop",
  summary: "Encapsulation, composition, and domain modeling.",
  overview: "Keep business rules close to the model.",
  body: "",
  images: [],
  videoUrl: null,
  embedVideoUrl: null,
  codeSnippets: [],
  resources: [],
  externalLinks: [],
  relatedBlogSlugs: [],
  relatedTutorialSlugs: [],
  relatedCourseSlugs: [],
  relatedProjectSlugs: [],
  relatedCertificateSlugs: [],
  published: true,
  seoTitle: "",
  seoDescription: "",
  sortOrder: 0,
};

const seededSkill = {
  id: "b2e2d9f1-0000-4000-8000-000000000021",
  name: "Java",
  slug: "java",
  field: "Backend Development",
  level: "Advanced",
  years: "Core language",
  summary: "Object-oriented backend services.",
  overview: "Java is the foundation of my Spring Boot work.",
  featured: true,
  published: true,
  topics: [],
};

describe("AdminTopicsPage", () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
    get.mockImplementation(async (path: string) => {
      if (path === "/topics") {
        return { topics: [seededTopic] };
      }
      return { skills: [seededSkill] };
    });
    put.mockResolvedValue({
      topics: [{ ...seededTopic, title: "Object-oriented design" }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads published records and publishes edits", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminTopicsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Topics" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View public page →" })).toHaveAttribute("href", "/topics");

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Title")).toHaveValue("OOP");
    expect(screen.getByLabelText("Slug")).toHaveValue("oop");
    await user.click(screen.getByRole("button", { name: "Collapse" }));
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Title")).toHaveValue("OOP");

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Object-oriented design");
    await user.click(screen.getByRole("button", { name: "Publish topics" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalled();
    });

    expect(put).toHaveBeenCalledWith(
      "/topics",
      expect.objectContaining({
        topics: [
          expect.objectContaining({
            title: "Object-oriented design",
            slug: "oop",
            skill: "Java",
            published: true,
          }),
        ],
      }),
    );
    expect(await screen.findByText("Topics published.")).toBeInTheDocument();
  });

  it("blocks publish when a title is missing", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminTopicsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Title"));
    await user.click(screen.getByRole("button", { name: "Publish topics" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("title must be at least 2 characters");
  });

  it("lets a snippet, resource, and search listing be edited", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminTopicsPage />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: "Edit" }));
    expect(screen.getByRole("heading", { name: "Code" })).toBeInTheDocument();
    expect(screen.getByText("No snippets yet.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resources" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Links" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Search listing" })).toBeInTheDocument();
    expect(screen.getAllByText("/topics/java/oop").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Add snippet" }));
    await user.type(screen.getByPlaceholderText("Record example"), "Record");
    await user.selectOptions(screen.getByLabelText("Language"), "java");
    await user.type(screen.getByPlaceholderText("Paste the example visitors should see."), "record UserId(String value)");

    await user.click(screen.getByRole("button", { name: "Add resource" }));
    const names = screen.getAllByLabelText("Name");
    const urls = screen.getAllByLabelText("URL");
    await user.type(names[names.length - 1]!, "Oracle OOP");
    await user.type(urls[urls.length - 1]!, "https://docs.oracle.com/javase/tutorial/java/concepts/");

    await user.clear(screen.getByLabelText("SEO title"));
    await user.type(screen.getByLabelText("SEO title"), "OOP in Java");
    expect(screen.getAllByText("OOP in Java").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Publish topics" }));
    await waitFor(() => {
      expect(put).toHaveBeenCalled();
    });
    expect(put).toHaveBeenCalledWith(
      "/topics",
      expect.objectContaining({
        topics: [
          expect.objectContaining({
            codeSnippets: [
              expect.objectContaining({
                label: "Record",
                language: "java",
                code: "record UserId(String value)",
              }),
            ],
            resources: [
              expect.objectContaining({
                label: "Oracle OOP",
                url: "https://docs.oracle.com/javase/tutorial/java/concepts/",
              }),
            ],
            seoTitle: "OOP in Java",
          }),
        ],
      }),
    );
  });

  it("filters the list by search", async () => {
    const user = userEvent.setup();
    get.mockImplementation(async (path: string) => {
      if (path === "/topics") {
        return {
          topics: [
            seededTopic,
            {
              ...seededTopic,
              id: "b2e2d9f1-0000-4000-8000-000000000042",
              title: "Collections",
              slug: "collections",
              summary: "Lists, maps, and data shaping at the service layer.",
            },
          ],
        };
      }
      return { skills: [seededSkill] };
    });

    render(
      <MemoryRouter>
        <AdminTopicsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "OOP" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Collections" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Search topics"), "collections");

    expect(screen.queryByRole("heading", { name: "OOP" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Collections" })).toBeInTheDocument();
    expect(screen.getByText("1 of 2 topics")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Search topics"));
    await user.type(screen.getByLabelText("Search topics"), "xyz");
    expect(screen.getByText("No topics match these filters.")).toBeInTheDocument();
  });

  it("filters the list by skill and draft status", async () => {
    const user = userEvent.setup();
    get.mockImplementation(async (path: string) => {
      if (path === "/topics") {
        return {
          topics: [
            seededTopic,
            {
              ...seededTopic,
              id: "b2e2d9f1-0000-4000-8000-000000000042",
              skill: "Docker",
              skillSlug: "docker",
              field: "DevOps",
              fieldSlug: "devops",
              title: "Images",
              slug: "images",
              summary: "Lean Dockerfiles and reproducible builds.",
              published: false,
            },
          ],
        };
      }
      return {
        skills: [
          seededSkill,
          { ...seededSkill, id: "skill-docker", name: "Docker", slug: "docker", field: "DevOps" },
        ],
      };
    });

    render(
      <MemoryRouter>
        <AdminTopicsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "OOP" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Images" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Docker" }));
    expect(screen.queryByRole("heading", { name: "OOP" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Images" })).toBeInTheDocument();
    expect(screen.getByText("1 of 2 topics")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All skills" }));
    await user.click(screen.getByRole("button", { name: "Draft" }));
    expect(screen.queryByRole("heading", { name: "OOP" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Images" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Published" }));
    expect(screen.getByRole("heading", { name: "OOP" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Images" })).not.toBeInTheDocument();
  });
});
