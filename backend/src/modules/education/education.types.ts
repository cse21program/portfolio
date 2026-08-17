export type EducationRecord = {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
  grade: string;
  location: string;
  description: string;
  achievements: string[];
  logoUrl: string | null;
  documentUrl: string | null;
  documentName: string | null;
  website: string | null;
  sortOrder: number;
};

export type EducationWrite = Omit<EducationRecord, "id" | "sortOrder"> & {
  id?: string;
  sortOrder?: number;
};

export const defaultEducation: EducationWrite[] = [
  {
    institution: "Leading University",
    degree: "B.Sc.",
    field: "Computer Science & Engineering",
    startDate: "Ongoing",
    endDate: "",
    current: true,
    grade: "",
    location: "Sylhet, Bangladesh",
    description:
      "Core computer science with an emphasis on software construction, databases, and systems thinking.",
    achievements: [
      "Build software alongside academic work",
      "Use real projects as the lab for backend and DevOps skills",
    ],
    logoUrl: null,
    documentUrl: null,
    documentName: null,
    website: "https://www.lus.ac.bd/",
  },
];

export function emptyToNull(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
