import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AboutPage } from "@/features/about/AboutPage";
import { AboutProfileProvider } from "@/features/about/AboutProfileContext";
import { fallbackAboutProfile } from "@/features/about/fallback";

function jsonResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ success: true, data }),
  };
}

describe("AboutPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          profile: {
            ...fallbackAboutProfile,
            fullName: "Test Owner",
            professionalTitle: "Staff engineer",
            embedVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            gallery: [{ url: "https://example.com/one.jpg", private: false }],
          },
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders biography and media from the API", async () => {
    render(
      <MemoryRouter>
        <AboutProfileProvider>
          <AboutPage />
        </AboutProfileProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Test Owner" })).toBeInTheDocument();
    expect(screen.getByText("Staff engineer")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Introduction" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Professional links" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /GitHub/ }).length).toBeGreaterThan(0);
    expect(screen.queryByTitle("Introduction video")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Play Introduction video" }));
    const embed = screen.getByTitle("Introduction video");
    expect(embed.getAttribute("src")).toContain("https://www.youtube.com/embed/dQw4w9WgXcQ");
    expect(embed.getAttribute("src")).toContain("autoplay=1");
    expect(screen.getByRole("heading", { name: "Photos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View gallery image 1 of 1" })).toBeInTheDocument();
  });

  it("renders when a cached profile omits gallery", async () => {
    const { gallery: _gallery, ...legacyProfile } = fallbackAboutProfile;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          profile: {
            ...legacyProfile,
            fullName: "Legacy Owner",
            galleryImageUrls: ["https://example.com/old.jpg"],
          },
        }),
      ),
    );

    render(
      <MemoryRouter>
        <AboutProfileProvider>
          <AboutPage />
        </AboutProfileProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Legacy Owner" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Gallery" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View gallery image 1 of 1" })).toBeInTheDocument();
  });
});
