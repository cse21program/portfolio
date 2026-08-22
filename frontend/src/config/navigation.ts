export type NavItem = {
  label: string;
  href: string;
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

export function asNavGroups(nav: NavItem[] | NavGroup[]): NavGroup[] {
  if (nav.length === 0) {
    return [];
  }
  if ("items" in nav[0]!) {
    return nav as NavGroup[];
  }
  return [{ items: nav as NavItem[] }];
}

export function morePages(items: NavItem[]) {
  return items.filter((item) => item.href !== "/search");
}

export function isNavItemActive(href: string, pathname: string, end = false) {
  if (end || href === "/") {
    return pathname === href || pathname === `${href}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function groupHasPath(items: NavItem[], pathname: string, homeHref?: string) {
  return items.some((item) => isNavItemActive(item.href, pathname, item.href === homeHref));
}

export const publicNav: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Skills", href: "/skills" },
  { label: "Courses", href: "/courses" },
  { label: "Services", href: "/services" },
  { label: "Blog", href: "/blog" },
];

export const moreNav: NavItem[] = [
  { label: "Search", href: "/search" },
  { label: "Experience", href: "/experience" },
  { label: "Education", href: "/education" },
  { label: "Certificates", href: "/certificates" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "Tutorials", href: "/tutorials" },
  { label: "Resume", href: "/resume" },
];

export const customerNav: NavItem[] = [
  { label: "Overview", href: "/dashboard" },
  { label: "Profile", href: "/dashboard/profile" },
  { label: "My courses", href: "/dashboard/courses" },
  { label: "Purchases", href: "/dashboard/purchases" },
  { label: "Reviews", href: "/dashboard/reviews" },
  { label: "Orders", href: "/dashboard/orders" },
  { label: "Notifications", href: "/dashboard/notifications" },
  { label: "Saved posts", href: "/dashboard/saved" },
  { label: "Settings", href: "/dashboard/settings" },
];

export const adminNav: NavGroup[] = [
  { items: [{ label: "Dashboard", href: "/admin" }, { label: "Media", href: "/admin/media" }, { label: "Videos", href: "/admin/videos" }] },
  {
    label: "Portfolio",
    items: [
      { label: "About", href: "/admin/portfolio" },
      { label: "Resume", href: "/admin/resume" },
      { label: "Experience", href: "/admin/experience" },
      { label: "Education", href: "/admin/education" },
      { label: "Certificates", href: "/admin/certificates" },
      { label: "Testimonials", href: "/admin/testimonials" },
      { label: "Projects", href: "/admin/projects" },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { label: "Skills", href: "/admin/skills" },
      { label: "Fields", href: "/admin/fields" },
      { label: "Topics", href: "/admin/topics" },
    ],
  },
  {
    label: "Publish",
    items: [
      { label: "Blog", href: "/admin/blogs" },
      { label: "Catalogs", href: "/admin/catalogs" },
      { label: "Audience", href: "/admin/audience" },
      { label: "Tutorials", href: "/admin/tutorials" },
    ],
  },
  {
    label: "Learn",
    items: [
      { label: "Courses", href: "/admin/courses" },
      { label: "Enrollments", href: "/admin/enrollments" },
    ],
  },
  {
    label: "Work",
    items: [
      { label: "Services", href: "/admin/services" },
      { label: "Checkout", href: "/admin/orders" },
      { label: "Reviews", href: "/admin/reviews" },
      { label: "Requests", href: "/admin/service-orders" },
      { label: "Payments", href: "/admin/payments" },
      { label: "Email", href: "/admin/mail" },
      { label: "Leads", href: "/admin/leads" },
    ],
  },
];
