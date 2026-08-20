import { ActionCard } from "@/components/ui/ActionCard";

export function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Studio</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Overview</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Manage what visitors see. About, Resume, Experience, Education, Projects, Skills, Fields,
          Topics, Blog, Tutorials, Courses, Services, and Contact are live. Other modules open as they are built.
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
          description="Skills and topics under each field. Shown on Home and /skills, with related writing and courses."
          actionLabel="Edit Skills"
        />
        <ActionCard
          to="/admin/fields"
          eyebrow="Ready"
          title="Fields"
          description="Broad areas such as Backend or DevOps, with intro video, overview, and SEO."
          actionLabel="Edit Fields"
        />
        <ActionCard
          to="/admin/topics"
          eyebrow="Ready"
          title="Topics"
          description="Lessons under each skill: overview, video, code, resources, and related writing."
          actionLabel="Edit Topics"
        />
        <ActionCard
          to="/admin/blogs"
          eyebrow="Ready"
          title="Blog"
          description="Posts with excerpt, tags, skill, and SEO. Drafts stay off the public writing page."
          actionLabel="Edit Blog"
        />
        <ActionCard
          to="/admin/audience"
          eyebrow="Ready"
          title="Audience"
          description="Moderate comments and send notes to the newsletter list."
          actionLabel="Open Audience"
        />
        <ActionCard
          to="/admin/tutorials"
          eyebrow="Ready"
          title="Tutorials"
          description="Structured walkthroughs with sections, video, code, and resources. Drafts stay off the public page."
          actionLabel="Edit Tutorials"
        />
        <ActionCard
          to="/admin/courses"
          eyebrow="Ready"
          title="Courses"
          description="Modules, lessons, pricing, and curriculum. Drafts stay off the public catalog. Checkout is next."
          actionLabel="Edit Courses"
        />
        <ActionCard
          to="/admin/enrollments"
          eyebrow="Ready"
          title="Enrollments"
          description="Grant or revoke seats. Free courses self-enroll; premium courses stay locked until you grant access."
          actionLabel="Manage enrollments"
        />
        <ActionCard
          to="/admin/services"
          eyebrow="Ready"
          title="Services"
          description="Catalog, packages, and availability. Drafts stay off the public page."
          actionLabel="Edit services"
        />
        <ActionCard
          to="/admin/orders"
          eyebrow="Ready"
          title="Orders"
          description="Checkout orders for courses, tutorials, and priced packages. Confirm transfers, refund, or add a Studio note."
          actionLabel="Manage orders"
        />
        <ActionCard
          to="/admin/reviews"
          eyebrow="Ready"
          title="Reviews"
          description="Approve verified purchaser ratings for courses, tutorials, and paid service packages."
          actionLabel="Manage reviews"
        />
        <ActionCard
          to="/admin/service-orders"
          eyebrow="Ready"
          title="Service orders"
          description="Review catalog requests, confirm work, and close delivery. Paid packages live under Orders."
          actionLabel="Manage service orders"
        />
        <ActionCard
          to="/admin/payments"
          eyebrow="Ready"
          title="Payments"
          description="Turn gateways on, paste Stripe or other credentials, and switch Demo to Live without a deploy."
          actionLabel="Configure payments"
        />
        <ActionCard
          to="/admin/leads"
          eyebrow="Ready"
          title="Leads"
          description="Hire-me messages from the public contact form, with status tracking."
          actionLabel="Manage leads"
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
