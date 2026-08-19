export type NavItem = {
  label: string;
  href: string;
};

export const publicNav: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Skills", href: "/skills" },
  { label: "Courses", href: "/courses" },
  { label: "Services", href: "/services" },
  { label: "Blog", href: "/blog" },
];

export const moreNav: NavItem[] = [
  { label: "Experience", href: "/experience" },
  { label: "Education", href: "/education" },
  { label: "Certificates", href: "/certificates" },
  { label: "Tutorials", href: "/tutorials" },
  { label: "Resume", href: "/resume" },
];

export const customerNav: NavItem[] = [
  { label: "Overview", href: "/dashboard" },
  { label: "Saved posts", href: "/dashboard/saved" },
  { label: "My courses", href: "/dashboard/courses" },
  { label: "Orders", href: "/dashboard/orders" },
  { label: "Settings", href: "/dashboard/settings" },
];

export const adminNav: NavItem[] = [
  { label: "Overview", href: "/admin" },
  { label: "About", href: "/admin/portfolio" },
  { label: "Resume", href: "/admin/resume" },
  { label: "Experience", href: "/admin/experience" },
  { label: "Education", href: "/admin/education" },
  { label: "Projects", href: "/admin/projects" },
  { label: "Skills", href: "/admin/skills" },
  { label: "Fields", href: "/admin/fields" },
  { label: "Topics", href: "/admin/topics" },
  { label: "Blog", href: "/admin/blogs" },
  { label: "Audience", href: "/admin/audience" },
  { label: "Tutorials", href: "/admin/tutorials" },
  { label: "Courses", href: "/admin/courses" },
  { label: "Enrollments", href: "/admin/enrollments" },
  { label: "Orders", href: "/admin/orders" },
];
