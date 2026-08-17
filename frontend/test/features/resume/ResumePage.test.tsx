import { MemoryRouter } from "react-router-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AboutProfileProvider } from "@/features/about/AboutProfileContext";
import { fallbackAboutProfile } from "@/features/about/fallback";
import { ResumePage } from "@/features/resume/ResumePage";
import { fallbackResume } from "@/types/resume";
import { experiences as fallbackExperiences, education as fallbackEducation } from "@/content/experience";

function jsonResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ success: true, data }),
  };
}

function mockPortfolio(resume: unknown, profile: unknown = fallbackAboutProfile) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((input: RequestInfo) => {
      const url = String(input);
      if (url.includes("/portfolio/resume")) {
        return Promise.resolve(jsonResponse({ resume }));
      }
      if (url.includes("/experience")) {
        return Promise.resolve(jsonResponse({ experiences: fallbackExperiences }));
      }
      if (url.includes("/education")) {
        return Promise.resolve(jsonResponse({ education: fallbackEducation }));
      }
      return Promise.resolve(
        jsonResponse({
          profile: {
            ...fallbackAboutProfile,
            ...((profile ?? {}) as object),
            fullName: "Test Owner",
            professionalTitle: "Staff engineer",
            shortBiography: "Builds production systems.",
            interests: ["Backend", "DevOps"],
          },
        }),
      );
    }),
  );
}

describe("ResumePage", () => {
  beforeEach(() => {
    mockPortfolio(fallbackResume);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders identity and offers print when no PDF is published", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(
      <MemoryRouter>
        <AboutProfileProvider>
          <ResumePage />
        </AboutProfileProvider>
      </MemoryRouter>,
    );

    const view = document.querySelector(".resume-screen") as HTMLElement;
    expect(await screen.findByRole("heading", { name: "Test Owner" })).toBeInTheDocument();
    expect(within(view).getByText("Staff engineer")).toBeInTheDocument();
    expect(within(view).getByText("Builds production systems.")).toBeInTheDocument();
    expect(within(view).getByRole("heading", { name: "Experience" })).toBeInTheDocument();
    expect(within(view).getByRole("heading", { name: "Interests" })).toBeInTheDocument();

    await userEvent.click(within(view).getAllByRole("button", { name: "Print this page" })[0]!);
    expect(print).toHaveBeenCalled();
    print.mockRestore();
  });

  it("uses resume overrides and a PDF download link", async () => {
    mockPortfolio({
      ...fallbackResume,
      headline: "Platform engineer",
      summary: "APIs, containers, and delivery.",
      awards: [{ title: "Dean's list", detail: "Leading University", year: "2024", href: null }],
      publications: [
        {
          title: "Notes on APIs",
          detail: "Blog",
          year: "2026",
          href: "https://example.com/notes",
        },
      ],
      pdfUrl: "/api/v1/media/files/7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.pdf",
      pdfFileName: "rezaul-karim-cv.pdf",
    });

    render(
      <MemoryRouter>
        <AboutProfileProvider>
          <ResumePage />
        </AboutProfileProvider>
      </MemoryRouter>,
    );

    const view = document.querySelector(".resume-screen") as HTMLElement;
    expect(await within(view).findByText("Platform engineer")).toBeInTheDocument();
    expect(within(view).getByText("APIs, containers, and delivery.")).toBeInTheDocument();
    expect(within(view).getByRole("heading", { name: "Awards" })).toBeInTheDocument();
    expect(within(view).getByText("Dean's list")).toBeInTheDocument();
    expect(within(view).getByRole("link", { name: "Notes on APIs" })).toHaveAttribute(
      "href",
      "https://example.com/notes",
    );

    const download = within(view).getByRole("link", { name: "Download PDF" });
    expect(download).toHaveAttribute(
      "href",
      "/api/v1/media/files/7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.pdf?download=1&name=rezaul-karim-cv.pdf",
    );
    expect(download).toHaveAttribute("download", "rezaul-karim-cv.pdf");
    expect(within(view).getAllByRole("button", { name: "Print this page" }).length).toBeGreaterThan(0);
  });

  it("plays the intro video from the About profile", async () => {
    mockPortfolio(fallbackResume, {
      ...fallbackAboutProfile,
      embedVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    render(
      <MemoryRouter>
        <AboutProfileProvider>
          <ResumePage />
        </AboutProfileProvider>
      </MemoryRouter>,
    );

    const view = document.querySelector(".resume-screen") as HTMLElement;
    expect(await screen.findByRole("heading", { name: "Test Owner" })).toBeInTheDocument();
    expect(within(view).getByRole("heading", { name: "A short introduction" })).toBeInTheDocument();
    expect(within(view).getByAltText("Test Owner")).toBeInTheDocument();
    await userEvent.click(within(view).getByRole("button", { name: "Play Introduction video" }));
    const embed = within(view).getByTitle("Introduction video");
    expect(embed.getAttribute("src")).toContain("https://www.youtube.com/embed/dQw4w9WgXcQ");
    expect(embed.getAttribute("src")).toContain("autoplay=1");
  });
});
