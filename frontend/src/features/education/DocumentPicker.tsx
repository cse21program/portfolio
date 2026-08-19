import { useRef, useState, type ChangeEvent } from "react";
import { ApiRequestError, apiUpload } from "@/lib/api";

const PDF_MAX_BYTES = 10 * 1024 * 1024;

function isPdfFile(file: File) {
  const namedPdf = file.name.toLowerCase().endsWith(".pdf");
  const typedPdf = file.type === "application/pdf" || file.type === "application/x-pdf";
  return namedPdf || typedPdf;
}

export function DocumentPicker({
  url,
  fileName,
  disabled,
  label = "Certificate or transcript",
  hint = "Optional PDF, up to 10 MB.",
  onChange,
}: {
  url: string | null;
  fileName: string | null;
  disabled?: boolean;
  label?: string;
  hint?: string;
  onChange: (next: { url: string | null; fileName: string | null }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onPick(files: FileList) {
    const file = files[0];
    if (!file) {
      return;
    }
    if (!isPdfFile(file)) {
      setUploadError("Use a PDF file");
      return;
    }
    if (file.size > PDF_MAX_BYTES) {
      setUploadError("PDF must be 10 MB or smaller");
      return;
    }
    setBusy(true);
    setUploadError(null);
    try {
      const uploaded = await apiUpload<{ url: string }>("/media?kind=document", file);
      onChange({ url: uploaded.url, fileName: file.name });
    } catch (caught) {
      setUploadError(caught instanceof ApiRequestError ? caught.message : "Could not upload that PDF");
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
      <p className="text-sm text-ink">{label}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="application/pdf,.pdf"
          disabled={disabled || busy}
          onChange={handleChange}
        />
        <button
          className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent disabled:opacity-60"
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Uploading…" : url ? "Replace PDF" : "Upload PDF"}
        </button>
        {url ? (
          <button
            className="cursor-pointer text-sm text-muted hover:text-ink"
            type="button"
            disabled={disabled || busy}
            onClick={() => {
              setUploadError(null);
              onChange({ url: null, fileName: null });
            }}
          >
            Remove
          </button>
        ) : null}
      </div>
      {url ? (
        <p className="mt-2 text-sm text-ink-soft">
          <a className="text-accent hover:text-accent-dark" href={url} target="_blank" rel="noreferrer">
            {fileName || "Open PDF"}
          </a>
        </p>
      ) : null}
      {uploadError ? (
        <p className="mt-2 text-sm text-accent" role="alert">
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}
