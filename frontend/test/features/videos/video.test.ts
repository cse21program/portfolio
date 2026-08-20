import { describe, expect, it } from "vitest";
import { sortVideos, type ManagedVideo } from "@/types/video";

const youtube: ManagedVideo = {
  id: "a",
  origin: "hosted",
  provider: "youtube",
  title: "Zebra",
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  playUrl: null,
  embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  posterUrl: null,
  caption: "",
  sizeBytes: 0,
  usedIn: [],
  createdAt: "2026-08-21T02:00:00.000Z",
  updatedAt: "2026-08-21T02:00:00.000Z",
};

const file: ManagedVideo = {
  ...youtube,
  id: "b",
  origin: "upload",
  provider: "file",
  title: "alpha.mp4",
  url: "/api/v1/media/files/7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.mp4",
  playUrl: "/api/v1/media/files/7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.mp4",
  embedUrl: null,
  createdAt: "2026-08-21T01:00:00.000Z",
  updatedAt: "2026-08-21T01:00:00.000Z",
};

describe("video helpers", () => {
  it("sorts by newest, oldest, and name", () => {
    expect(sortVideos([file, youtube], "newest").map((item) => item.id)).toEqual(["a", "b"]);
    expect(sortVideos([file, youtube], "oldest").map((item) => item.id)).toEqual(["b", "a"]);
    expect(sortVideos([youtube, file], "name").map((item) => item.id)).toEqual(["b", "a"]);
  });
});
