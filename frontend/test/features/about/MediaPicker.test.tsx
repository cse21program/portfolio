import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiUpload } from "@/lib/api";
import { GalleryPicker, IdentityStage } from "@/features/about/MediaPicker";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiUpload: vi.fn(),
  };
});

const upload = vi.mocked(apiUpload);

function jpegFile(name: string) {
  return new File(["photo"], name, { type: "image/jpeg" });
}

const photos = [
  { url: "https://example.com/one.jpg", private: false },
  { url: "https://example.com/two.jpg", private: false },
];

describe("IdentityStage", () => {
  it("lays the portrait over a wide cover", () => {
    render(
      <IdentityStage
        profileUrl="https://example.com/me.jpg"
        coverUrl="https://example.com/cover.jpg"
        onProfileChange={() => undefined}
        onCoverChange={() => undefined}
      />,
    );
    const images = document.querySelectorAll("img");
    expect(images[0]?.className).toContain("absolute");
    expect(images[1]?.className).toContain("aspect-[3/4]");
    expect(screen.getByText("Profile photo")).toBeInTheDocument();
    expect(screen.getByText("Cover image")).toBeInTheDocument();
  });
});

describe("GalleryPicker", () => {
  beforeEach(() => {
    upload.mockReset();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows an empty drop zone", () => {
    render(
      <GalleryPicker
        label="Gallery"
        photos={[]}
        onChange={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: /Drop photos here/i })).toBeInTheDocument();
    expect(screen.getByText("0/24 photos")).toBeInTheDocument();
  });

  it("can reorder, hide, and remove photos", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <GalleryPicker
        label="Gallery"
        photos={photos}
        onChange={onChange}
      />,
    );

    expect(screen.getByText("Featured")).toBeInTheDocument();
    expect(screen.getByText("2/24 photos")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Move later" })[0]);
    expect(onChange).toHaveBeenCalledWith([photos[1], photos[0]]);

    await user.click(screen.getAllByRole("button", { name: "Make private" })[0]);
    expect(onChange).toHaveBeenCalledWith([{ ...photos[0], private: true }, photos[1]]);
    expect(screen.getAllByRole("button", { name: "Drag to reorder" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Use as profile" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Use as cover" })).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    expect(onChange).toHaveBeenCalledWith([photos[1]]);
  });

  it("opens every photo in a modal on the same page", async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 8 }, (_, index) => ({
      url: `https://example.com/${index}.jpg`,
      private: false,
    }));
    render(
      <GalleryPicker
        label="Gallery"
        photos={many}
        onChange={() => undefined}
      />,
    );

    expect(screen.getAllByRole("button", { name: /View gallery image/ })).toHaveLength(4);
    expect(screen.queryByRole("button", { name: "View gallery image 6 of 8" })).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "View all 8 photos" })[0]!);
    const dialog = screen.getByRole("dialog", { name: "Gallery" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "View gallery image 6 of 8" })).toBeInTheDocument();
    expect(within(dialog).getAllByRole("button", { name: "Make private" })).toHaveLength(8);
  });

  it("uploads selected photos one after another", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    upload
      .mockResolvedValueOnce({ url: "https://cdn.example/a.jpg", kind: "image" })
      .mockResolvedValueOnce({ url: "https://cdn.example/b.jpg", kind: "image" });

    render(
      <GalleryPicker
        label="Gallery"
        photos={[]}
        onChange={onChange}
      />,
    );

    const input = document.getElementById("gallery") as HTMLInputElement;
    await user.upload(input, [jpegFile("a.jpg"), jpegFile("b.jpg")]);

    await waitFor(() => {
      expect(upload).toHaveBeenCalledTimes(2);
    });
    expect(onChange).toHaveBeenNthCalledWith(1, [{ url: "https://cdn.example/a.jpg", private: false }]);
    expect(onChange).toHaveBeenNthCalledWith(2, [
      { url: "https://cdn.example/a.jpg", private: false },
      { url: "https://cdn.example/b.jpg", private: false },
    ]);
  });
});
