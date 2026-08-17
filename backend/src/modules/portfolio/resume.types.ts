export type ResumeCredit = {
  title: string;
  detail: string;
  year: string;
  href: string | null;
};

export type ResumeDocument = {
  headline: string | null;
  summary: string | null;
  awards: ResumeCredit[];
  publications: ResumeCredit[];
  pdfUrl: string | null;
  pdfFileName: string | null;
  version: number;
  updatedAt: string;
};

export const DEFAULT_RESUME_ID = "default";

export const defaultResume: Omit<ResumeDocument, "version" | "updatedAt"> = {
  headline: null,
  summary: null,
  awards: [],
  publications: [],
  pdfUrl: null,
  pdfFileName: null,
};

function asCredit(value: unknown): ResumeCredit | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as {
    title?: unknown;
    detail?: unknown;
    year?: unknown;
    href?: unknown;
  };
  const title = typeof record.title === "string" ? record.title.trim() : "";
  if (!title) {
    return null;
  }
  const detail = typeof record.detail === "string" ? record.detail.trim() : "";
  const year = typeof record.year === "string" ? record.year.trim() : "";
  const hrefRaw = typeof record.href === "string" ? record.href.trim() : "";
  return {
    title,
    detail,
    year,
    href: hrefRaw.length > 0 ? hrefRaw : null,
  };
}

export function parseCredits(value: unknown): ResumeCredit[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    const credit = asCredit(item);
    return credit ? [credit] : [];
  });
}

export function emptyToNull(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
