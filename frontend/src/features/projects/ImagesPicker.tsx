import { useRef, useState, type ChangeEvent } from "react";
import { ApiRequestError, apiUpload } from "@/lib/api";

function errorMessage(caught: unknown, fallback: string) {
  if (caught instanceof ApiRequestError) {
    return caught.message;
  }
  return fallback;
}

export function ImagesPicker({
  urls,
  disabled,
  onChange,
}: {
  urls: string[];
  disabled?: boolean;
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onPick(files: FileList) {
    setBusy(true);
    setUploadError(null);
    const next = [...urls];
    try {
      for (const file of Array.from(files)) {
        const uploaded = await apiUpload<{ url: string }>("/media?kind=image", file);
        if (!next.includes(uploaded.url)) {
          next.push(uploaded.url);
        }
      }
      onChange(next);
    } catch (caught) {
      setUploadError(errorMessage(caught, "Could not upload that image"));
    } finally {
      setBusy(false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      void onPick(event.target.files);
    }
    event.target.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Screenshots</p>
          <p className="mt-1 text-xs text-muted">Optional. JPEG, PNG, WebP, or GIF.</p>
        </div>
        <button
          className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent disabled:opacity-60"
          type="button"
          disabled={disabled || busy || urls.length >= 24}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Uploading…" : "Add images"}
        </button>
      </div>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        disabled={disabled || busy}
        onChange={handleChange}
      />
      {urls.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {urls.map((url) => (
            <li key={url} className="overflow-hidden rounded-2xl border border-line bg-paper">
              <img src={url} alt="" className="aspect-video w-full object-cover" />
              <button
                className="w-full cursor-pointer px-3 py-2 text-left text-xs text-muted hover:text-ink"
                type="button"
                disabled={disabled}
                onClick={() => onChange(urls.filter((item) => item !== url))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {uploadError ? (
        <p className="text-sm text-accent" role="alert">
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}
