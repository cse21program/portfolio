import { PagePlaceholder } from "@/components/ui/PagePlaceholder";

export function DashboardPage() {
  return (
    <PagePlaceholder
      title="Dashboard"
      description="Purchased courses, orders, and account overview."
    />
  );
}

export function DashboardCoursesPage() {
  return <PagePlaceholder title="My courses" description="Enrollments and learning progress." />;
}

export function DashboardOrdersPage() {
  return <PagePlaceholder title="Orders" description="Course and service order history." />;
}

export function DashboardSettingsPage() {
  return <PagePlaceholder title="Settings" description="Profile and security settings." />;
}
