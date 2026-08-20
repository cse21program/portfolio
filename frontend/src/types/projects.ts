import type { Project } from "@/types/public";
import { matchesYear } from "@/lib/catalogFilters";

export type { Project };

export function listFromLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function slugFromTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeProject(item: Partial<Project> & Pick<Project, "title" | "slug">): Project {
  return {
    id: typeof item.id === "string" && item.id.length > 0 ? item.id : undefined,
    title: item.title.trim(),
    slug: item.slug.trim().toLowerCase(),
    category: item.category?.trim() ?? "",
    status: item.status?.trim() || "Shipped",
    featured: item.featured === true,
    shortDescription: item.shortDescription?.trim() ?? "",
    fullDescription: item.fullDescription?.trim() ?? "",
    thumbnailUrl: item.thumbnailUrl?.trim() || null,
    images: (item.images ?? []).map((entry) => entry.trim()).filter(Boolean),
    demoVideoUrl: item.demoVideoUrl?.trim() || null,
    problem: item.problem?.trim() ?? "",
    requirements: item.requirements?.trim() ?? "",
    solution: item.solution?.trim() ?? "",
    architecture: item.architecture?.trim() ?? "",
    features: (item.features ?? []).map((entry) => entry.trim()).filter(Boolean),
    technologies: (item.technologies ?? []).map((entry) => entry.trim()).filter(Boolean),
    challenges: (item.challenges ?? []).map((entry) => entry.trim()).filter(Boolean),
    solutions: (item.solutions ?? []).map((entry) => entry.trim()).filter(Boolean),
    lessons: (item.lessons ?? []).map((entry) => entry.trim()).filter(Boolean),
    githubUrl: item.githubUrl?.trim() || null,
    liveUrl: item.liveUrl?.trim() || null,
    docsUrl: item.docsUrl?.trim() || null,
    startDate: item.startDate?.trim() ?? "",
    endDate: item.endDate?.trim() ?? "",
    seoTitle: item.seoTitle?.trim() ?? "",
    seoDescription: item.seoDescription?.trim() ?? "",
    sortOrder: item.sortOrder,
  };
}

export function normalizeProjectList(items: Project[] | undefined) {
  return (items ?? []).map((item, index) =>
    normalizeProject({
      ...item,
      sortOrder: item.sortOrder ?? index,
    }),
  );
}

export function selectFeaturedProjects(items: Project[]) {
  const featured = items.filter((item) => item.featured);
  return featured.length > 0 ? featured : items.slice(0, 3);
}

export function matchesProjectQuery(item: Project, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return [item.title, item.shortDescription, item.category, item.status, ...(item.technologies ?? [])]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export type ProjectFilters = {
  query: string;
  category: string;
  technology: string;
  year?: string;
};

export function matchesProjectFilters(item: Project, filters: ProjectFilters) {
  if (!matchesProjectQuery(item, filters.query)) {
    return false;
  }
  if (filters.category && item.category !== filters.category) {
    return false;
  }
  if (filters.technology && !(item.technologies ?? []).includes(filters.technology)) {
    return false;
  }
  if (!matchesYear(item.startDate, filters.year ?? "")) {
    return false;
  }
  return true;
}

export function emptyProject(sortOrder = 0): Project {
  return {
    id: crypto.randomUUID(),
    title: "",
    slug: "",
    category: "",
    status: "Shipped",
    featured: false,
    shortDescription: "",
    fullDescription: "",
    thumbnailUrl: null,
    images: [],
    demoVideoUrl: null,
    problem: "",
    requirements: "",
    solution: "",
    architecture: "",
    features: [],
    technologies: [],
    challenges: [],
    solutions: [],
    lessons: [],
    githubUrl: null,
    liveUrl: null,
    docsUrl: null,
    startDate: "",
    endDate: "",
    seoTitle: "",
    seoDescription: "",
    sortOrder,
  };
}
