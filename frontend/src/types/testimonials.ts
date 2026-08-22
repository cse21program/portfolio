import type { Testimonial } from "@/types/public";

export type { Testimonial };

export type TestimonialSource = {
  reviewId: string;
  name: string;
  comment: string;
  rating: number;
  title: string;
  href: string;
  kind: string;
};

export function normalizeTestimonial(
  item: Partial<Testimonial> & Pick<Testimonial, "name" | "comment">,
): Testimonial {
  const rating = Number(item.rating);
  return {
    id: typeof item.id === "string" && item.id.length > 0 ? item.id : undefined,
    name: item.name.trim(),
    position: item.position?.trim() ?? "",
    company: item.company?.trim() ?? "",
    imageUrl: item.imageUrl?.trim() || null,
    rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : 5,
    comment: item.comment.trim(),
    featured: item.featured === true,
    reviewId: item.reviewId?.trim() || null,
    sortOrder: item.sortOrder,
  };
}

export function normalizeTestimonialList(items: Testimonial[] | undefined) {
  return (items ?? []).map((item, index) =>
    normalizeTestimonial({
      ...item,
      sortOrder: item.sortOrder ?? index,
    }),
  );
}

export function featuredTestimonials(items: Testimonial[]) {
  const featured = items.filter((item) => item.featured);
  return featured.length > 0 ? featured : items.slice(0, 3);
}

export function emptyTestimonial(sortOrder = 0): Testimonial {
  return {
    id: crypto.randomUUID(),
    name: "",
    position: "",
    company: "",
    imageUrl: null,
    rating: 5,
    comment: "",
    featured: false,
    reviewId: null,
    sortOrder,
  };
}

export function attribution(item: Pick<Testimonial, "position" | "company">) {
  return [item.position.trim(), item.company.trim()].filter(Boolean).join(", ");
}
