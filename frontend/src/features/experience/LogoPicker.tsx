import { useRef, useState, type ChangeEvent } from "react";
import { ApiRequestError, apiUpload } from "@/lib/api";

function errorMessage(caught: unknown, fallback: string) {
  if (caught instanceof ApiRequestError) {
    return caught.message;
  }
  return fallback;
}

export function LogoPicker({
  url,
  disabled,
  onChange,
}: {
  url: string | null;
  disabled?: boolean;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onPick(files: FileList) {
    const file = files[0];
    if (!file) {
      return;
    }
    setBusy(true);
    setUploadError(null);
    try {
      const uploaded = await apiUpload<{ url: string }>("/media?kind=image", file);
      onChange(uploaded.url);
    } catch (caught) {
      setUploadError(errorMessage(caught, "Could not upload that image"));
    } finally {
      setBusy(false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 0) {
      void onPick(files);
    }
    event.target.value = "";
  }

  return (
    <div>
      <p className="text-sm text-ink">Company logo</p>
      <p className="mt-1 text-xs text-muted">Optional. Square works best.</p>
      <div className="mt-3 flex items-center gap-4">
        {url ? (
          <img src={url} alt="" className="h-14 w-14 rounded-xl border border-line bg-paper object-contain p-1" />
        ) : (
          <div className="grid h-14 w-14 place-items-center rounded-xl border border-dashed border-line bg-paper text-[10px] text-muted">
            Logo
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
            disabled={disabled || busy}
            onChange={handleChange}
          />
          <button
            className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent disabled:opacity-60"
            type="button"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Uploading…" : url ? "Replace" : "Upload"}
          </button>
          {url ? (
            <button
              className="cursor-pointer text-sm text-muted hover:text-ink"
              type="button"
              disabled={disabled || busy}
              onClick={() => {
                setUploadError(null);
                onChange(null);
              }}
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
      {uploadError ? (
        <p className="mt-2 text-sm text-accent" role="alert">
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}
