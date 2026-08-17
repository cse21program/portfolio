import type { Education } from "@/types/public";

export type { Education };

export function listFromLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function displayEducationEndDate(item: Education) {
  if (item.current) {
    return item.endDate.trim() || "Present";
  }
  return item.endDate.trim();
}

export function normalizeEducation(
  item: Partial<Education> & Pick<Education, "institution" | "degree" | "field">,
): Education {
  return {
    id: typeof item.id === "string" && item.id.length > 0 ? item.id : undefined,
    institution: item.institution.trim(),
    degree: item.degree.trim(),
    field: item.field.trim(),
    startDate: item.startDate?.trim() ?? "",
    endDate: item.endDate?.trim() ?? "",
    current: item.current === true,
    grade: item.grade?.trim() ?? "",
    location: item.location?.trim() ?? "",
    description: item.description?.trim() ?? "",
    achievements: (item.achievements ?? []).map((entry) => entry.trim()).filter(Boolean),
    logoUrl: item.logoUrl?.trim() || null,
    documentUrl: item.documentUrl?.trim() || null,
    documentName: item.documentName?.trim() || null,
    website: item.website?.trim() || null,
    sortOrder: item.sortOrder,
  };
}

export function normalizeEducationList(items: Education[]) {
  return items.map((item, index) =>
    normalizeEducation({
      ...item,
      sortOrder: item.sortOrder ?? index,
    }),
  );
}

export function emptyEducation(sortOrder = 0): Education {
  return {
    id: crypto.randomUUID(),
    institution: "",
    degree: "",
    field: "",
    startDate: "",
    endDate: "",
    current: false,
    grade: "",
    location: "",
    description: "",
    achievements: [],
    logoUrl: null,
    documentUrl: null,
    documentName: null,
    website: null,
    sortOrder,
  };
}
