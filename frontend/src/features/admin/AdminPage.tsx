import { ActionCard } from "@/components/ui/ActionCard";
import { EmptyState } from "@/components/ui/EmptyState";

export function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Studio</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Overview</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Manage what visitors see. About, Resume, Experience, Education, Projects, and Skills are
          live. Other modules open as they are built, so you are not looking at empty admin chrome.
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
          to="/admin/resume"
          eyebrow="Ready"
          title="Resume"
          description="Headline, awards, publications, and an optional PDF for the public CV page."
          actionLabel="Edit Resume"
        />
        <ActionCard
          to="/admin/experience"
          eyebrow="Ready"
          title="Work experience"
          description="Roles, dates, stack, and company logos. Shown on Home, /experience, and the CV."
          actionLabel="Edit Experience"
        />
        <ActionCard
          to="/admin/education"
          eyebrow="Ready"
          title="Education"
          description="Degrees, institutions, grades, and transcripts. Shown on /education and the CV."
          actionLabel="Edit Education"
        />
        <ActionCard
          to="/admin/projects"
          eyebrow="Ready"
          title="Projects"
          description="Case studies, stack, screenshots, and links. Shown on Home, /projects, and the CV."
          actionLabel="Edit Projects"
        />
        <ActionCard
          to="/admin/skills"
          eyebrow="Ready"
          title="Skills"
          description="Skills and topics grouped by field. Shown on Home and /skills, with related writing and courses."
          actionLabel="Edit Skills"
        />
        <ActionCard
          to="/about"
          eyebrow="Public"
          title="View the live page"
          description="Check the About page as visitors see it after you publish."
          actionLabel="Open About"
        />
        <ActionCard
          to="/resume"
          eyebrow="Public"
          title="View the CV"
          description="Check the resume page, including the downloadable PDF if one is published."
          actionLabel="Open Resume"
        />
        <ActionCard
          to="/experience"
          reloadDocument
          eyebrow="Public"
          title="View experience"
          description="Check the public timeline as visitors see it after you publish."
          actionLabel="Open Experience"
        />
        <ActionCard
          to="/education"
          reloadDocument
          eyebrow="Public"
          title="View education"
          description="Check the public study page as visitors see it after you publish."
          actionLabel="Open Education"
        />
        <ActionCard
          to="/projects"
          reloadDocument
          eyebrow="Public"
          title="View projects"
          description="Check the public case studies as visitors see them after you publish."
          actionLabel="Open Projects"
        />
        <ActionCard
          to="/skills"
          reloadDocument
          eyebrow="Public"
          title="View skills"
          description="Check the public knowledge tree as visitors see it after you publish."
          actionLabel="Open Skills"
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
        title="Blogs and tutorials"
        description="This editor will arrive with the publishing module. Fields are edited under Knowledge."
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
