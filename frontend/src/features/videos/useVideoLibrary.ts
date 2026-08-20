import { useCallback, useEffect, useState } from "react";
import { ApiRequestError, apiDelete, apiGet, apiPatch, apiPost, apiUpload } from "@/lib/api";
import type { MediaAsset } from "@/types/media";
import type { ManagedVideo } from "@/types/video";

function errorMessage(caught: unknown, fallback: string) {
  if (caught instanceof ApiRequestError) {
    return caught.message;
  }
  return fallback;
}

function normalize(video: ManagedVideo): ManagedVideo {
  return { ...video, usedIn: video.usedIn ?? [] };
}

export function useVideoLibrary() {
  const [videos, setVideos] = useState<ManagedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    const payload = await apiGet<{ videos: ManagedVideo[] }>("/videos");
    setVideos((payload.videos ?? []).map(normalize));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void reload()
      .catch((caught) => {
        if (!cancelled) {
          setError(errorMessage(caught, "Could not load videos"));
          setVideos([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  async function addUrl(url: string, title?: string) {
    const payload = await apiPost<{ video: ManagedVideo }>("/videos", { url, title });
    const video = normalize(payload.video);
    setVideos((current) => [video, ...current.filter((item) => item.id !== video.id)]);
    return video;
  }

  async function upload(file: File) {
    const payload = await apiUpload<{ asset: MediaAsset | null }>("/media?kind=video", file);
    await reload();
    return payload.asset;
  }

  async function update(id: string, input: { title?: string; caption?: string }) {
    const payload = await apiPatch<{ video: ManagedVideo }>(`/videos/${id}`, input);
    const video = normalize(payload.video);
    setVideos((current) => current.map((item) => (item.id === id ? { ...video, usedIn: video.usedIn.length ? video.usedIn : item.usedIn } : item)));
    return video;
  }

  async function remove(id: string) {
    await apiDelete(`/videos/${id}`);
    setVideos((current) => current.filter((item) => item.id !== id));
  }

  return { videos, loading, error, reload, addUrl, upload, update, remove };
}
