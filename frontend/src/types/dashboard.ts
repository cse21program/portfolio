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

export type AdminDashboardMetrics = {
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

export type AdminDashboard = {
  generatedAt: string;
  metrics: AdminDashboardMetrics;
  attention: DashboardAttention[];
  recentOrders: DashboardLinkItem[];
  pendingServiceOrders: DashboardLinkItem[];
  popularCourses: DashboardLinkItem[];
  popularTutorials: DashboardLinkItem[];
  popularBlogs: DashboardLinkItem[];
};

export const emptyDashboard: AdminDashboard = {
  generatedAt: new Date(0).toISOString(),
  metrics: {
    visitors: 0,
    pageviews: 0,
    users: 0,
    courses: 0,
    students: 0,
    orders: 0,
    revenueCents: 0,
    revenueLabel: "$0",
    courseRevenueCents: 0,
    courseRevenueLabel: "$0",
    serviceRevenueCents: 0,
    serviceRevenueLabel: "$0",
  },
  attention: [],
  recentOrders: [],
  pendingServiceOrders: [],
  popularCourses: [],
  popularTutorials: [],
  popularBlogs: [],
};
