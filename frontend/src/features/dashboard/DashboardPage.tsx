import { FeaturePage } from "@/features/shared/FeaturePage";

export function DashboardPage() {
  return (
    <FeaturePage
      title="Dashboard"
      description="Purchased courses, orders, and account overview."
    />
  );
}

export function DashboardCoursesPage() {
  return <FeaturePage title="My courses" description="Enrollments and learning progress." />;
}

export function DashboardOrdersPage() {
  return <FeaturePage title="Orders" description="Course and service order history." />;
}

export function DashboardSettingsPage() {
  return <FeaturePage title="Settings" description="Profile and security settings." />;
}
