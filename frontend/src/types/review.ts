export const reviewKinds = ["course", "tutorial", "service"] as const;
export type ReviewKind = (typeof reviewKinds)[number];

export const reviewStatuses = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];

export type Review = {
  id: string;
  userId: string;
  kind: ReviewKind;
  slug: string;
  title: string;
  href: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  verified: boolean;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  authorName: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
};

export type ReviewSummary = {
  count: number;
  average: number;
};

export type EligibleReviewProduct = {
  kind: ReviewKind;
  slug: string;
  title: string;
  href: string;
};

export function reviewKindLabel(kind: string) {
  if (kind === "tutorial") {
    return "Tutorial";
  }
  if (kind === "service") {
    return "Service";
  }
  return "Course";
}

export function reviewStatusLabel(status: string) {
  if (status === "approved") {
    return "Published";
  }
  if (status === "rejected") {
    return "Not published";
  }
  return "Awaiting review";
}

export function formatReviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatReviewAverage(average: number) {
  if (!average) {
    return "0";
  }
  return Number.isInteger(average) ? String(average) : average.toFixed(1);
}
