import type { Experience } from "@/types/public";

export type { Experience };

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Freelance / contract",
  "Internship",
  "Academic",
  "Other",
] as const;

export function linesFromList(values: string[]) {
  return values.join("\n");
}

export function listFromLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function displayEndDate(item: Experience) {
  if (item.current) {
    return item.endDate.trim() || "Present";
  }
  return item.endDate.trim();
}

export function normalizeExperience(item: Partial<Experience> & Pick<Experience, "company" | "position">): Experience {
  return {
    id: typeof item.id === "string" && item.id.length > 0 ? item.id : undefined,
    company: item.company.trim(),
    position: item.position.trim(),
    type: item.type?.trim() || "Full-time",
    location: item.location?.trim() ?? "",
    startDate: item.startDate?.trim() ?? "",
    endDate: item.endDate?.trim() ?? "",
    current: item.current === true,
    description: item.description?.trim() ?? "",
    responsibilities: (item.responsibilities ?? []).map((entry) => entry.trim()).filter(Boolean),
    achievements: (item.achievements ?? []).map((entry) => entry.trim()).filter(Boolean),
    technologies: (item.technologies ?? []).map((entry) => entry.trim()).filter(Boolean),
    logoUrl: item.logoUrl?.trim() || null,
    website: item.website?.trim() || null,
    sortOrder: item.sortOrder,
  };
}

export function normalizeExperienceList(items: Experience[]) {
  return items.map((item, index) =>
    normalizeExperience({
      ...item,
      sortOrder: item.sortOrder ?? index,
    }),
  );
}

export function emptyExperience(sortOrder = 0): Experience {
  return {
    id: crypto.randomUUID(),
    company: "",
    position: "",
    type: "Full-time",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
    responsibilities: [],
    achievements: [],
    technologies: [],
    logoUrl: null,
    website: null,
    sortOrder,
  };
}
