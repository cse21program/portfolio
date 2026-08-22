import { Link } from "react-router-dom";
import { AuthError } from "@/features/auth/AuthForm";
import { useAuth } from "@/features/auth/AuthContext";
import { useAdminDashboard } from "@/features/admin/useAdminDashboard";
import type { DashboardLinkItem } from "@/types/dashboard";

const shortcuts = [
  {
    label: "Commerce",
    items: [
      { label: "Orders", href: "/admin/orders" },
      { label: "Payments", href: "/admin/payments" },
      { label: "Email", href: "/admin/mail" },
      { label: "Service orders", href: "/admin/service-orders" },
      { label: "Reviews", href: "/admin/reviews" },
      { label: "Leads", href: "/admin/leads" },
    ],
  },
  {
    label: "Learn",
    items: [
      { label: "Courses", href: "/admin/courses" },
      { label: "Enrollments", href: "/admin/enrollments" },
      { label: "Tutorials", href: "/admin/tutorials" },
      { label: "Blog", href: "/admin/blogs" },
      { label: "Audience", href: "/admin/audience" },
    ],
  },
  {
    label: "Library",
    items: [
      { label: "Media", href: "/admin/media" },
      { label: "Videos", href: "/admin/videos" },
      { label: "Catalogs", href: "/admin/catalogs" },
      { label: "About", href: "/admin/portfolio" },
      { label: "Projects", href: "/admin/projects" },
      { label: "Services", href: "/admin/services" },
    ],
  },
];

function formatUpdated(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) {
    return "";
  }
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

export function AdminPage() {
  const { user } = useAuth();
  const { dashboard, loading, error } = useAdminDashboard();
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const metrics = dashboard.metrics;
  const updated = formatUpdated(dashboard.generatedAt);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.16em] text-accent uppercase">Studio</p>
          <h1 className="mt-2 font-display text-4xl text-ink">
            {firstName ? `${firstName}, here is the business` : "Dashboard"}
          </h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Live visitors, students, orders, and revenue. Open a number to work the queue behind it.
          </p>
        </div>
        {updated ? <p className="text-xs tracking-[0.12em] text-muted uppercase">As of {updated}</p> : null}
      </div>

      {error ? <AuthError>{error}</AuthError> : null}

      <dl
        aria-busy={loading}
        className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] border border-line bg-line sm:grid-cols-4"
      >
        <Metric
          label="Visitors"
          value={loading ? "—" : formatCount(metrics.visitors)}
          hint={loading ? "" : `${formatCount(metrics.pageviews)} views`}
          loading={loading}
        />
        <Metric
          label="Registered users"
          value={loading ? "—" : formatCount(metrics.users)}
          loading={loading}
        />
        <Metric
          label="Courses"
          value={loading ? "—" : formatCount(metrics.courses)}
          href="/admin/courses"
          loading={loading}
        />
        <Metric
          label="Students"
          value={loading ? "—" : formatCount(metrics.students)}
          href="/admin/enrollments"
          loading={loading}
        />
        <Metric
          label="Orders"
          value={loading ? "—" : formatCount(metrics.orders)}
          href="/admin/orders"
          loading={loading}
        />
        <Metric
          label="Revenue"
          value={loading ? "—" : metrics.revenueLabel}
          href="/admin/orders"
          loading={loading}
        />
        <Metric
          label="Course revenue"
          value={loading ? "—" : metrics.courseRevenueLabel}
          href="/admin/courses"
          loading={loading}
        />
        <Metric
          label="Service revenue"
          value={loading ? "—" : metrics.serviceRevenueLabel}
          href="/admin/services"
          loading={loading}
        />
      </dl>

      {dashboard.attention.length > 0 ? (
        <section className="rounded-[1.5rem] border border-line bg-surface px-5 py-4">
          <h2 className="text-xs tracking-[0.16em] text-muted uppercase">Needs attention</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {dashboard.attention.map((item) => (
              <li key={item.href + item.label}>
                <Link
                  to={item.href}
                  className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3 py-1.5 text-sm text-ink hover:border-accent"
                >
                  {item.label}{" "}
                  <span className="font-medium text-accent">{item.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardList
          title="Recent orders"
          empty="No checkout orders yet."
          action={{ label: "Manage orders", href: "/admin/orders" }}
          items={dashboard.recentOrders}
          loading={loading}
        />
        <DashboardList
          title="Pending service requests"
          empty="No open service requests."
          action={{ label: "Manage requests", href: "/admin/service-orders" }}
          items={dashboard.pendingServiceOrders}
          loading={loading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardList
          title="Popular courses"
          empty="No course enrollments yet."
          action={{ label: "Open courses", href: "/admin/courses" }}
          items={dashboard.popularCourses}
          loading={loading}
        />
        <DashboardList
          title="Popular tutorials"
          empty="No paid tutorial sales yet."
          action={{ label: "Open tutorials", href: "/admin/tutorials" }}
          items={dashboard.popularTutorials}
          loading={loading}
        />
        <DashboardList
          title="Popular blogs"
          empty="No blog engagement yet."
          action={{ label: "Open blog", href: "/admin/blogs" }}
          items={dashboard.popularBlogs}
          loading={loading}
        />
      </div>

      <section>
        <h2 className="font-display text-2xl text-ink">Jump to</h2>
        <div className="mt-4 grid gap-px overflow-hidden rounded-[1.5rem] border border-line bg-line sm:grid-cols-3">
          {shortcuts.map((group) => (
            <div key={group.label} className="bg-surface px-5 py-4">
              <p className="text-xs tracking-[0.16em] text-muted uppercase">{group.label}</p>
              <ul className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link to={item.href} className="text-sm text-ink hover:text-accent">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  href,
  loading,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  loading: boolean;
}) {
  const figure = (
    <span className={loading ? "inline-block h-8 w-16 animate-pulse rounded bg-paper-muted" : undefined}>
      {loading ? "\u00a0" : value}
    </span>
  );
  const accessible = loading ? `${label}, loading` : hint ? `${label}, ${value}, ${hint}` : `${label}, ${value}`;

  return (
    <div className="bg-surface px-4 py-4">
      <dt className="text-xs tracking-[0.14em] text-muted uppercase">{label}</dt>
      <dd className="mt-1">
        {href ? (
          <Link to={href} aria-label={accessible} className="block font-display text-2xl tabular-nums text-ink hover:text-accent">
            {figure}
          </Link>
        ) : (
          <p aria-label={accessible} className="font-display text-2xl tabular-nums text-ink">
            {figure}
          </p>
        )}
        {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      </dd>
    </div>
  );
}

function DashboardList({
  title,
  empty,
  action,
  items,
  loading,
}: {
  title: string;
  empty: string;
  action: { label: string; href: string };
  items: DashboardLinkItem[];
  loading: boolean;
}) {
  return (
    <section className="rounded-[1.5rem] border border-line bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 className="font-display text-xl text-ink">{title}</h2>
        <Link to={action.href} className="text-sm text-accent hover:text-accent-dark">
          {action.label} →
        </Link>
      </header>
      {loading ? (
        <div className="space-y-3 px-5 py-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-xl bg-paper-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="px-5 py-6 text-sm leading-6 text-ink-soft">{empty}</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={`${item.href}-${item.title}`}>
              <Link to={item.href} className="flex items-start justify-between gap-3 px-5 py-3.5 hover:bg-paper-muted/60">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{item.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted">{item.meta}</span>
                </span>
                <span aria-hidden="true" className="text-muted">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
