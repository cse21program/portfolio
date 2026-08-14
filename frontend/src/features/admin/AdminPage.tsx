import { FeaturePage } from "@/features/shared/FeaturePage";

export function AdminPage() {
  return (
    <FeaturePage
      title="Admin"
      description="Platform metrics and management."
    />
  );
}

export function AdminPortfolioPage() {
  return (
    <FeaturePage
      title="Portfolio"
      description="About, experience, education, projects, and certificates."
    />
  );
}

export function AdminContentPage() {
  return <FeaturePage title="Content" description="Fields, topics, blogs, and tutorials." />;
}

export function AdminCoursesPage() {
  return <FeaturePage title="Courses" description="Course, section, and lesson management." />;
}

export function AdminOrdersPage() {
  return <FeaturePage title="Orders" description="Payments, refunds, and service orders." />;
}
