import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { AdminTestimonialsPage } from "@/features/testimonials/AdminTestimonialsPage";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPut: vi.fn(),
    apiPost: vi.fn(),
  };
});

const get = vi.mocked(apiGet);
const put = vi.mocked(apiPut);
const post = vi.mocked(apiPost);

const seeded = [
  {
    id: "b2e2d9f1-0000-4000-8000-000000000011",
    name: "Aisha Rahman",
    position: "Product engineer",
    company: "Early-stage SaaS",
    imageUrl: null,
    rating: 5,
    comment: "The error format and auth story were the difference.",
    featured: true,
    reviewId: null,
    sortOrder: 0,
  },
];

const source = {
  reviewId: "b2e2d9f1-0000-4000-8000-000000000022",
  name: "Owner",
  comment: "Clear production guidance with a real checkout path.",
  rating: 5,
  title: "Spring Boot",
  href: "/courses/spring-boot",
  kind: "course",
};

describe("AdminTestimonialsPage", () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
    post.mockReset();
    get.mockResolvedValue({ testimonials: seeded, sources: [source] });
    put.mockResolvedValue({
      testimonials: [{ ...seeded[0]!, name: "Aisha R." }],
    });
    post.mockResolvedValue({
      testimonial: {
        id: "b2e2d9f1-0000-4000-8000-000000000033",
        name: "Owner",
        position: "",
        company: "Spring Boot",
        imageUrl: null,
        rating: 5,
        comment: source.comment,
        featured: false,
        reviewId: source.reviewId,
        sortOrder: 1,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads published quotes and publishes edits", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminTestimonialsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Testimonials" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Name")).toHaveValue("Aisha Rahman");

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Aisha R.");
    await user.click(screen.getByRole("button", { name: "Publish testimonials" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalled();
    });
    expect(put).toHaveBeenCalledWith(
      "/testimonials",
      expect.objectContaining({
        testimonials: [expect.objectContaining({ name: "Aisha R.", rating: 5, featured: true })],
      }),
    );
    expect(await screen.findByText("Testimonials published.")).toBeInTheDocument();
  });

  it("promotes an approved review", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminTestimonialsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("From approved reviews")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Use as testimonial" }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith("/testimonials/from-review", { reviewId: source.reviewId });
    });
    expect(await screen.findByRole("heading", { name: "Owner" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Spring Boot")).toBeInTheDocument();
  });

  it("blocks publish when a name is missing", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminTestimonialsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Testimonials" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.clear(screen.getByLabelText("Name"));
    await user.click(screen.getByRole("button", { name: "Publish testimonials" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("name must be at least 2 characters");
  });
});
