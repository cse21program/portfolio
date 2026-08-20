import { prisma } from "@common/database/prisma";
import { moneyLabel, orderStatusMeta, type AdminDashboard, type DashboardLinkItem } from "./admin.types";

const AWAITING_PAYMENT = ["pending_payment", "processing", "failed"];
const LIST_LIMIT = 8;
const POPULAR_LIMIT = 5;

function asCount(rows: Array<{ count: bigint | number | null }>) {
  return Number(rows[0]?.count ?? 0);
}

function countMap(rows: Array<{ key: string; count: number }>) {
  const next = new Map<string, number>();
  for (const row of rows) {
    next.set(row.key, (next.get(row.key) ?? 0) + row.count);
  }
  return next;
}

function popularItems(
  scores: Map<string, number>,
  titles: Map<string, string>,
  hrefFor: (slug: string) => string,
  unit: string,
): DashboardLinkItem[] {
  return [...scores.entries()]
    .filter(([slug, count]) => count > 0 && titles.has(slug))
    .map(([slug, count]) => ({ slug, count, title: titles.get(slug) ?? slug }))
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
    .slice(0, POPULAR_LIMIT)
    .map((item) => ({
      title: item.title,
      meta: `${item.count} ${item.count === 1 ? unit : `${unit}s`}`,
      href: hrefFor(item.slug),
    }));
}

export const adminService = {
  async dashboard(): Promise<AdminDashboard> {
    const [
      pageviews,
      visitors,
      users,
      courses,
      students,
      orders,
      paidRevenue,
      itemRevenue,
      awaitingPayment,
      pendingReviews,
      newLeads,
      pendingServiceCount,
      recentOrders,
      pendingServiceOrders,
      courseEnrollments,
      tutorialSales,
      blogLikes,
      blogBookmarks,
      publishedCourses,
      publishedTutorials,
      publishedBlogs,
    ] = await Promise.all([
      prisma.siteVisit.count(),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT "visitorKey")::bigint AS count FROM "site_visits"
      `.then(asCount),
      prisma.user.count({ where: { status: { not: "DELETED" } } }),
      prisma.course.count({ where: { status: "published" } }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT "userId")::bigint AS count FROM "enrollments" WHERE status = 'active'
      `.then(asCount),
      prisma.order.count({ where: { status: { not: "canceled" } } }),
      prisma.order.aggregate({
        where: { status: "paid" },
        _sum: { totalCents: true },
      }),
      prisma.orderItem.findMany({
        where: { order: { status: "paid" } },
        select: { kind: true, lineCents: true },
      }),
      prisma.order.count({ where: { status: { in: AWAITING_PAYMENT } } }),
      prisma.review.count({ where: { status: "pending" } }),
      prisma.contactMessage.count({ where: { status: "new" } }),
      prisma.serviceOrder.count({ where: { status: "pending" } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: LIST_LIMIT,
        select: {
          orderNumber: true,
          status: true,
          totalCents: true,
          billingName: true,
          createdAt: true,
        },
      }),
      prisma.serviceOrder.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
        take: LIST_LIMIT,
        select: {
          id: true,
          serviceTitle: true,
          packageName: true,
          budget: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.enrollment.groupBy({
        by: ["courseSlug", "courseTitle"],
        where: { status: "active" },
        _count: { _all: true },
      }),
      prisma.orderItem.findMany({
        where: { kind: "tutorial", order: { status: "paid" } },
        select: { slug: true, title: true, quantity: true },
      }),
      prisma.blogLike.groupBy({
        by: ["slug"],
        _count: { _all: true },
      }),
      prisma.blogBookmark.groupBy({
        by: ["slug"],
        _count: { _all: true },
      }),
      prisma.course.findMany({
        where: { status: "published" },
        select: { slug: true, title: true },
      }),
      prisma.tutorial.findMany({
        where: { status: "published" },
        select: { slug: true, title: true },
      }),
      prisma.blog.findMany({
        where: { status: "published" },
        select: { slug: true, title: true },
      }),
    ]);

    const revenueByKind = new Map<string, number>();
    for (const row of itemRevenue) {
      revenueByKind.set(row.kind, (revenueByKind.get(row.kind) ?? 0) + row.lineCents);
    }
    const courseRevenueCents = (revenueByKind.get("course") ?? 0) + (revenueByKind.get("tutorial") ?? 0);
    const serviceRevenueCents = revenueByKind.get("service") ?? 0;
    const revenueCents = paidRevenue._sum.totalCents ?? 0;

    const courseTitles = new Map(publishedCourses.map((item) => [item.slug, item.title]));
    const tutorialTitles = new Map(publishedTutorials.map((item) => [item.slug, item.title]));
    const blogTitles = new Map(publishedBlogs.map((item) => [item.slug, item.title]));

    const courseScores = countMap(
      courseEnrollments.map((row) => ({ key: row.courseSlug, count: row._count._all })),
    );
    const tutorialScores = countMap(
      tutorialSales.map((row) => ({ key: row.slug, count: Math.max(1, row.quantity) })),
    );
    const blogScores = countMap([
      ...blogLikes.map((row) => ({ key: row.slug, count: row._count._all })),
      ...blogBookmarks.map((row) => ({ key: row.slug, count: row._count._all })),
    ]);

    const attention = [
      { label: "Awaiting payment", count: awaitingPayment, href: "/admin/orders" },
      { label: "Pending service requests", count: pendingServiceCount, href: "/admin/service-orders" },
      { label: "Reviews to moderate", count: pendingReviews, href: "/admin/reviews" },
      { label: "New leads", count: newLeads, href: "/admin/leads" },
    ].filter((item) => item.count > 0);

    return {
      generatedAt: new Date().toISOString(),
      metrics: {
        visitors,
        pageviews,
        users,
        courses,
        students,
        orders,
        revenueCents,
        revenueLabel: moneyLabel(revenueCents),
        courseRevenueCents,
        courseRevenueLabel: moneyLabel(courseRevenueCents),
        serviceRevenueCents,
        serviceRevenueLabel: moneyLabel(serviceRevenueCents),
      },
      attention,
      recentOrders: recentOrders.map((order) => ({
        title: order.orderNumber,
        meta: `${orderStatusMeta(order.status)} · ${moneyLabel(order.totalCents)} · ${order.billingName}`,
        href: "/admin/orders",
      })),
      pendingServiceOrders: pendingServiceOrders.map((order) => ({
        title: order.serviceTitle,
        meta: [order.packageName, order.user?.name || order.user?.email, order.budget].filter(Boolean).join(" · "),
        href: "/admin/service-orders",
      })),
      popularCourses: popularItems(courseScores, courseTitles, (slug) => `/admin/courses#${slug}`, "student"),
      popularTutorials: popularItems(tutorialScores, tutorialTitles, (slug) => `/admin/tutorials#${slug}`, "sale"),
      popularBlogs: popularItems(blogScores, blogTitles, (slug) => `/admin/blogs#${slug}`, "engagement"),
    };
  },
};
