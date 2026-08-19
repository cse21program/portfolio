export const serviceOrderStatuses = [
  "pending",
  "confirmed",
  "in_progress",
  "delivered",
  "revision_requested",
  "completed",
  "cancelled",
] as const;

export type ServiceOrderStatus = (typeof serviceOrderStatuses)[number];

export const openServiceOrderStatuses: ServiceOrderStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
  "delivered",
  "revision_requested",
];

export type ServiceOrderServiceSummary = {
  slug: string;
  title: string;
  startingPrice: string;
  pricingType: string;
  deliveryTime: string;
  available: boolean;
} | null;

export type ServiceOrderRecord = {
  id: string;
  userId: string;
  serviceSlug: string;
  serviceTitle: string;
  packageName: string;
  requirements: string;
  budget: string;
  timeline: string;
  status: ServiceOrderStatus;
  adminNote: string;
  source: "self" | "admin";
  createdAt: string;
  updatedAt: string;
  canceledAt: string | null;
  service: ServiceOrderServiceSummary;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
};
