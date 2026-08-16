import { ActionCard } from "@/components/ui/ActionCard";
import { EmptyState } from "@/components/ui/EmptyState";

export function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Studio</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Overview</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Manage what visitors see. About is live. Other modules open as they are built, so you are
          not looking at empty admin chrome.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ActionCard
          to="/admin/portfolio"
          eyebrow="Ready"
          title="About me"
          description="Edit biography, media, and professional links. Publish goes to the public About page."
          actionLabel="Edit About"
        />
        <ActionCard
          to="/about"
          eyebrow="Public"
          title="View the live page"
          description="Check the About page as visitors see it after you publish."
          actionLabel="Open About"
        />
      </div>
    </div>
  );
}

export function AdminContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Publishing</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Content</h1>
      </div>
      <EmptyState
        title="Fields, topics, blogs, and tutorials"
        description="This editor will arrive with the content module. Until then, the public catalog still uses the static pages."
        action={{ label: "View blog", to: "/blog" }}
      />
    </div>
  );
}

export function AdminCoursesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Learning</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Courses</h1>
      </div>
      <EmptyState
        title="Course management is not live yet"
        description="Sections, lessons, and pricing will be edited here. The public course pages are still static."
        action={{ label: "View courses", to: "/courses" }}
      />
    </div>
  );
}

export function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Commerce</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Orders</h1>
      </div>
      <EmptyState
        title="No orders to manage"
        description="Payments, refunds, and service bookings will land here after checkout is connected."
        action={{ label: "View services", to: "/services" }}
      />
    </div>
  );
}
