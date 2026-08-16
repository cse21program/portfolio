import { PagePlaceholder } from "@/components/ui/PagePlaceholder";

export function AdminPage() {
  return (
    <PagePlaceholder
      title="Admin"
      description="Platform metrics and management."
    />
  );
}

export function AdminPortfolioPage() {
  return (
    <PagePlaceholder
      title="Portfolio"
      description="About, experience, education, projects, and certificates."
    />
  );
}

export function AdminContentPage() {
  return <PagePlaceholder title="Content" description="Fields, topics, blogs, and tutorials." />;
}

export function AdminCoursesPage() {
  return <PagePlaceholder title="Courses" description="Course, section, and lesson management." />;
}

export function AdminOrdersPage() {
  return <PagePlaceholder title="Orders" description="Payments, refunds, and service orders." />;
}
