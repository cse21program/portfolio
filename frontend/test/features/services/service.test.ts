import { describe, expect, it } from "vitest";
import { featuredServices, normalizeService, publishedServices } from "@/types/services";

describe("service helpers", () => {
  it("treats missing availability as open", () => {
    const service = normalizeService({
      title: "Review",
      slug: "review",
      shortDescription: "A written review.",
      description: "A structured look at an existing backend.",
      startingPrice: "$400",
      pricingType: "Fixed price",
      deliveryTime: "1 week",
      featured: false,
      features: [],
      technologies: [],
      faq: [],
    });
    expect(service.available).toBe(true);
    expect(publishedServices([service, { ...service, slug: "draft", status: "draft" }])).toHaveLength(1);
    expect(featuredServices([{ ...service, featured: true }])[0]?.slug).toBe("review");
  });
});
