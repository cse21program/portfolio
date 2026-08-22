export type TestimonialRecord = {
  id: string;
  name: string;
  position: string;
  company: string;
  imageUrl: string | null;
  comment: string;
  rating: number;
  featured: boolean;
  sortOrder: number;
  reviewId: string | null;
};

export type TestimonialSource = {
  reviewId: string;
  name: string;
  comment: string;
  rating: number;
  title: string;
  href: string;
  kind: string;
};

export type TestimonialWrite = Omit<TestimonialRecord, "id" | "sortOrder" | "reviewId"> & {
  id?: string;
  sortOrder?: number;
  reviewId?: string | null;
};

export const defaultTestimonials: TestimonialWrite[] = [
  {
    name: "Aisha Rahman",
    position: "Product engineer",
    company: "Early-stage SaaS",
    imageUrl: null,
    rating: 5,
    featured: true,
    comment:
      "Rezaul turned a messy API into something the frontend could trust. The error format and auth story were the difference.",
  },
  {
    name: "Daniel Cole",
    position: "Founder",
    company: "Internal tools",
    imageUrl: null,
    rating: 5,
    featured: true,
    comment:
      "We had Docker files that only worked on one laptop. The Compose setup and a real health check saved us a month.",
  },
  {
    name: "Nusrat Jahan",
    position: "CS student",
    company: "Mentoring",
    imageUrl: null,
    rating: 5,
    featured: true,
    comment:
      "The mentoring was practical. We scoped a portfolio project that looked like production work instead of another to-do list.",
  },
];

export function emptyToNull(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
