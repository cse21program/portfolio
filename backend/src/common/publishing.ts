export const contentStatuses = ["draft", "scheduled", "published", "archived"] as const;
export type ContentStatus = (typeof contentStatuses)[number];

export function parseScheduleInstant(value: string | undefined | null) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = Date.parse(`${trimmed}T00:00:00`);
    return Number.isNaN(parsed) ? null : new Date(parsed);
  }
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

export function isLiveContent(item: { status?: string | null; publishedAt?: string | null }) {
  const status = (item.status ?? "published").trim() || "published";
  if (status === "published") {
    return true;
  }
  if (status === "scheduled") {
    const at = parseScheduleInstant(item.publishedAt);
    return at !== null && at.getTime() <= Date.now();
  }
  return false;
}

export function contentStatusLabel(status: string | undefined | null) {
  const value = (status ?? "draft").trim() || "draft";
  if (value === "draft") {
    return "Draft";
  }
  if (value === "scheduled") {
    return "Scheduled";
  }
  if (value === "published") {
    return "Published";
  }
  if (value === "archived") {
    return "Archived";
  }
  return value.replace(/_/g, " ");
}

export function todayStamp() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
