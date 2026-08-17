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

export const fallbackResume: ResumeDocument = {
  headline: null,
  summary: null,
  awards: [],
  publications: [],
  pdfUrl: null,
  pdfFileName: null,
  version: 0,
  updatedAt: new Date(0).toISOString(),
};

export function emptyCredit(): ResumeCredit {
  return { title: "", detail: "", year: "", href: null };
}

export function normalizeCredits(value: unknown): ResumeCredit[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }
    const record = item as Partial<ResumeCredit>;
    const title = typeof record.title === "string" ? record.title.trim() : "";
    if (!title) {
      return [];
    }
    return [
      {
        title,
        detail: typeof record.detail === "string" ? record.detail.trim() : "",
        year: typeof record.year === "string" ? record.year.trim() : "",
        href: typeof record.href === "string" && record.href.trim() ? record.href.trim() : null,
      },
    ];
  });
}

export function normalizeResume(raw: Partial<ResumeDocument> | null | undefined): ResumeDocument {
  return {
    headline: raw?.headline?.trim() || null,
    summary: raw?.summary?.trim() || null,
    awards: normalizeCredits(raw?.awards),
    publications: normalizeCredits(raw?.publications),
    pdfUrl: raw?.pdfUrl?.trim() || null,
    pdfFileName: raw?.pdfFileName?.trim() || null,
    version: typeof raw?.version === "number" ? raw.version : 0,
    updatedAt: raw?.updatedAt ?? new Date(0).toISOString(),
  };
}

export function pdfDownloadHref(url: string, fileName?: string | null) {
  const params = new URLSearchParams({ download: "1" });
  if (fileName?.trim()) {
    params.set("name", fileName.trim());
  }
  return `${url}${url.includes("?") ? "&" : "?"}${params.toString()}`;
}
