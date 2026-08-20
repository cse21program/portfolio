import { useCallback, useEffect, useState } from "react";
import { ApiRequestError, apiDelete, apiGet, apiPatch, apiUpload } from "@/lib/api";
import { summarizeLibrary, type MediaAsset, type MediaKind, type MediaLibrarySummary } from "@/types/media";

function errorMessage(caught: unknown, fallback: string) {
  if (caught instanceof ApiRequestError) {
    return caught.message;
  }
  return fallback;
}

function normalize(asset: MediaAsset): MediaAsset {
  return { ...asset, usedIn: asset.usedIn ?? [] };
}

export function useMediaLibrary() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [summary, setSummary] = useState<MediaLibrarySummary>({
    totalBytes: 0,
    image: 0,
    video: 0,
    document: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    const payload = await apiGet<{ assets: MediaAsset[]; summary?: MediaLibrarySummary }>("/media");
    const next = (payload.assets ?? []).map(normalize);
    setAssets(next);
    setSummary(payload.summary ?? summarizeLibrary(next));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void reload()
      .catch((caught) => {
        if (!cancelled) {
          setError(errorMessage(caught, "Could not load the media library"));
          setAssets([]);
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

  async function upload(file: File, kind: MediaKind) {
    const payload = await apiUpload<{ asset: MediaAsset | null }>(`/media?kind=${kind}`, file);
    if (payload.asset) {
      const asset = normalize(payload.asset);
      setAssets((current) => {
        const next = [asset, ...current.filter((item) => item.id !== asset.id)];
        setSummary(summarizeLibrary(next));
        return next;
      });
      return asset;
    }
    await reload();
    return null;
  }

  async function update(id: string, input: { originalName?: string; alt?: string; caption?: string }) {
    const payload = await apiPatch<{ asset: MediaAsset }>(`/media/${id}`, input);
    const asset = normalize(payload.asset);
    setAssets((current) =>
      current.map((item) => (item.id === id ? { ...asset, usedIn: asset.usedIn.length ? asset.usedIn : item.usedIn } : item)),
    );
    return asset;
  }

  async function remove(id: string) {
    await apiDelete(`/media/${id}`);
    setAssets((current) => {
      const next = current.filter((item) => item.id !== id);
      setSummary(summarizeLibrary(next));
      return next;
    });
  }

  return { assets, summary, loading, error, reload, upload, update, remove };
}
