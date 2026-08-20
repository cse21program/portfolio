import { formatUsd } from "@modules/cart/cart.money";

export type DashboardLinkItem = {
  title: string;
  meta: string;
  href: string;
};

export type DashboardAttention = {
  label: string;
  count: number;
  href: string;
};

export type AdminDashboard = {
  generatedAt: string;
  metrics: {
    visitors: number;
    pageviews: number;
    users: number;
    courses: number;
    students: number;
    orders: number;
    revenueCents: number;
    revenueLabel: string;
    courseRevenueCents: number;
    courseRevenueLabel: string;
    serviceRevenueCents: number;
    serviceRevenueLabel: string;
  };
  attention: DashboardAttention[];
  recentOrders: DashboardLinkItem[];
  pendingServiceOrders: DashboardLinkItem[];
  popularCourses: DashboardLinkItem[];
  popularTutorials: DashboardLinkItem[];
  popularBlogs: DashboardLinkItem[];
};

export function moneyLabel(cents: number) {
  return formatUsd(cents);
}

export function orderStatusMeta(status: string) {
  if (status === "pending_payment") {
    return "Pending payment";
  }
  if (status === "processing") {
    return "Processing";
  }
  if (status === "paid") {
    return "Paid";
  }
  if (status === "failed") {
    return "Payment failed";
  }
  if (status === "canceled") {
    return "Canceled";
  }
  if (status === "refunded") {
    return "Refunded";
  }
  return status.replace(/_/g, " ");
}
