export const reviewKinds = ["course", "tutorial", "service"] as const;
export type ReviewKind = (typeof reviewKinds)[number];

export const reviewStatuses = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];

export const reviewKindLabels: Record<ReviewKind, string> = {
  course: "Course",
  tutorial: "Tutorial",
  service: "Service",
};

export type ReviewUser = {
  id: string;
  email: string;
  name: string | null;
};

export type ReviewRecord = {
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
  adminNote: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  user?: ReviewUser;
  authorName: string;
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

function asKind(value: string): ReviewKind {
  if (value === "tutorial" || value === "service") {
    return value;
  }
  return "course";
}

function asStatus(value: string): ReviewStatus {
  if (value === "approved" || value === "rejected") {
    return value;
  }
  return "pending";
}

export function publicAuthorName(name: string | null | undefined) {
  const trimmed = name?.trim() ?? "";
  return trimmed || "A student";
}

export function toReviewRecord(
  row: {
    id: string;
    userId: string;
    kind: string;
    slug: string;
    title: string;
    href: string;
    rating: number;
    comment: string;
    status: string;
    verified: boolean;
    adminNote: string;
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
    user?: { id: string; email: string; name: string | null } | null;
  },
  options: { includeAdmin?: boolean } = {},
): ReviewRecord {
  const user = row.user ?? undefined;
  return {
    id: row.id,
    userId: row.userId,
    kind: asKind(row.kind),
    slug: row.slug,
    title: row.title,
    href: row.href,
    rating: row.rating,
    comment: row.comment,
    status: asStatus(row.status),
    verified: row.verified,
    adminNote: options.includeAdmin ? row.adminNote : "",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    user: options.includeAdmin ? user : undefined,
    authorName: publicAuthorName(user?.name),
  };
}

export function toReviewSummary(ratings: number[]): ReviewSummary {
  if (ratings.length === 0) {
    return { count: 0, average: 0 };
  }
  const total = ratings.reduce((sum, value) => sum + value, 0);
  return {
    count: ratings.length,
    average: Math.round((total / ratings.length) * 10) / 10,
  };
}
