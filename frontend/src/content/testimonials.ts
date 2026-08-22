import type { Testimonial } from "@/types/public";

export const testimonials: Testimonial[] = [
  {
    name: "Aisha Rahman",
    position: "Product engineer",
    company: "Early-stage SaaS",
    rating: 5,
    featured: true,
    comment:
      "Rezaul turned a messy API into something the frontend could trust. The error format and auth story were the difference.",
  },
  {
    name: "Daniel Cole",
    position: "Founder",
    company: "Internal tools",
    rating: 5,
    featured: true,
    comment:
      "We had Docker files that only worked on one laptop. The Compose setup and a real health check saved us a month.",
  },
  {
    name: "Nusrat Jahan",
    position: "CS student",
    company: "Mentoring",
    rating: 5,
    featured: true,
    comment:
      "The mentoring was practical. We scoped a portfolio project that looked like production work instead of another to-do list.",
  },
];
