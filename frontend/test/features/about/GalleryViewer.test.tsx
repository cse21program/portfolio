import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GalleryViewer } from "@/features/about/GalleryViewer";

const images = ["https://example.com/one.jpg", "https://example.com/two.jpg"];
const manyImages = [
  "https://example.com/a.jpg",
  "https://example.com/b.jpg",
  "https://example.com/c.jpg",
  "https://example.com/d.jpg",
];

describe("GalleryViewer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens a lightbox and moves between images", async () => {
    const user = userEvent.setup();
    render(<GalleryViewer images={images} />);

    await user.click(screen.getByRole("button", { name: "View gallery image 1 of 2" }));
    expect(screen.getByRole("dialog", { name: "Photo 1 of 2" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Gallery progress" })).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
    expect(screen.getByRole("img", { name: "Gallery image 1 of 2" })).toHaveAttribute(
      "src",
      images[0],
    );

    await user.click(screen.getByRole("button", { name: "Next image" }));
    expect(screen.getByRole("dialog", { name: "Photo 2 of 2" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Gallery progress" })).toHaveAttribute(
      "aria-valuenow",
      "2",
    );
    expect(screen.getByRole("img", { name: "Gallery image 2 of 2" })).toHaveAttribute(
      "src",
      images[1],
    );

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("loads mosaic photos one at a time as they enter view", () => {
    const observers: IntersectionObserverCallback[] = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          observers.push(callback);
        }
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    );

    render(<GalleryViewer images={manyImages} />);
    expect(document.querySelectorAll("ul img")).toHaveLength(0);

    act(() => {
      observers[0]?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(document.querySelectorAll("ul img")).toHaveLength(1);
    expect(document.querySelector("ul img")?.getAttribute("src")).toBe(manyImages[0]);

    act(() => {
      observers[1]?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      observers[2]?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      observers[3]?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(document.querySelectorAll("ul img")).toHaveLength(1);

    act(() => {
      fireEvent.load(document.querySelector("ul img")!);
    });
    expect(document.querySelectorAll("ul img")).toHaveLength(2);
    expect([...document.querySelectorAll("ul img")].map((img) => img.getAttribute("src"))).toEqual([
      manyImages[0],
      manyImages[1],
    ]);
  });

  it("opens all photos in a modal on the same page", async () => {
    const user = userEvent.setup();
    const urls = Array.from({ length: 8 }, (_, index) => `https://example.com/${index}.jpg`);
    render(<GalleryViewer images={urls} />);

    expect(screen.getAllByRole("button", { name: /View gallery image/ })).toHaveLength(4);
    expect(screen.queryByRole("button", { name: "View gallery image 6 of 8" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /View all/ })).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "View all 8 photos" })[0]!);
    expect(screen.getByRole("dialog", { name: "Photos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View gallery image 6 of 8" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View gallery image 8 of 8" })).toBeInTheDocument();
  });
});
