import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ApiRequestError, apiUpload } from "@/lib/api";

type UploadedFile = {
  url: string;
  kind: string;
};

const PDF_MAX_BYTES = 10 * 1024 * 1024;

function isPdfFile(file: File) {
  const namedPdf = file.name.toLowerCase().endsWith(".pdf");
  const typedPdf = file.type === "application/pdf" || file.type === "application/x-pdf";
  return namedPdf || typedPdf;
}

export function PdfPicker({
  url,
  fileName,
  error,
  disabled,
  onChange,
}: {
  url: string | null;
  fileName: string | null;
  error?: string;
  disabled?: boolean;
  onChange: (next: { url: string | null; fileName: string | null }) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();
  const message = error ?? uploadError ?? undefined;
  const blocked = busy || disabled;

  async function onPick(files: FileList | File[]) {
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
      const uploaded = await apiUpload<UploadedFile>("/media?kind=document", file);
      onChange({ url: uploaded.url, fileName: file.name });
    } catch (caught) {
      setUploadError(
        caught instanceof ApiRequestError ? caught.message : "Could not upload that PDF",
      );
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

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    if (blocked) {
      return;
    }
    if (event.dataTransfer.files.length > 0) {
      void onPick(event.dataTransfer.files);
    }
  }

  return (
    <div
      className={`rounded-[1.75rem] border p-4 sm:p-5 ${
        dragOver ? "border-accent bg-accent/5" : "border-line bg-paper-muted/40"
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!blocked) {
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <p className="text-[11px] tracking-[0.18em] text-accent uppercase">File</p>
      <label className="mt-1.5 block text-sm font-medium text-ink" htmlFor={fieldId}>
        PDF resume
      </label>
      <p className="mt-1 text-xs leading-5 text-muted">
        Saved as soon as it uploads. Visitors can download this file from the CV page. PDF · up to
        10 MB.
      </p>
      <input
        ref={inputRef}
        id={fieldId}
        className="sr-only"
        type="file"
        accept="application/pdf,.pdf"
        disabled={blocked}
        onChange={handleChange}
      />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          className="cursor-pointer rounded-full bg-ink px-4 py-2 text-sm text-paper hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          disabled={blocked}
          onClick={() => inputRef.current?.click()}
        >
          {url ? (busy ? "Uploading…" : "Replace PDF") : busy ? "Uploading…" : "Upload PDF"}
        </button>
        {url ? (
          <button
            className="cursor-pointer rounded-full px-4 py-2 text-sm text-muted hover:text-ink"
            type="button"
            disabled={blocked}
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
        <p className="mt-3 text-sm text-ink">
          Current file:{" "}
          <a className="text-accent hover:text-accent-dark" href={url} target="_blank" rel="noreferrer">
            {fileName ?? "Open PDF"}
          </a>
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">Drop a PDF here, or upload one. Print stays available on the public page.</p>
      )}
      {message ? (
        <p className="mt-3 text-sm text-accent" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
