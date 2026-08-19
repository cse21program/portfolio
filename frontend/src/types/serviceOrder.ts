export type ServiceOrderStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "delivered"
  | "revision_requested"
  | "completed"
  | "cancelled";

export type ServiceOrder = {
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
  service?: {
    slug: string;
    title: string;
    startingPrice: string;
    pricingType: string;
    deliveryTime: string;
    available: boolean;
  } | null;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
};

export function serviceOrderStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "in_progress":
      return "In progress";
    case "delivered":
      return "Delivered";
    case "revision_requested":
      return "Revision requested";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}
