export type ExperienceRecord = {
  id: string;
  company: string;
  position: string;
  type: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  logoUrl: string | null;
  website: string | null;
  sortOrder: number;
};

export type ExperienceWrite = Omit<ExperienceRecord, "id" | "sortOrder"> & {
  id?: string;
  sortOrder?: number;
};

export const defaultExperiences: ExperienceWrite[] = [
  {
    company: "Independent",
    position: "Software Engineer",
    type: "Freelance / contract",
    location: "Remote · Bangladesh",
    startDate: "2024",
    endDate: "Present",
    current: true,
    description:
      "Backend APIs, DevOps, and production delivery for web products. Current focus is this portfolio, course, and services platform.",
    responsibilities: [
      "Design modular APIs and data models",
      "Containerize local and production-shaped environments",
      "Turn requirements into shippable slices",
    ],
    achievements: [
      "Laid out a modular monolith that can host portfolio, LMS, and commerce without a rewrite",
      "Public site shipped as a static first version against the full product spec",
    ],
    technologies: ["TypeScript", "Express", "PostgreSQL", "Docker", "React"],
    logoUrl: null,
    website: null,
  },
  {
    company: "Leading University",
    position: "Computer Science",
    type: "Academic",
    location: "Sylhet, Bangladesh",
    startDate: "Ongoing",
    endDate: "",
    current: true,
    description: "Academic grounding in computer science alongside shipping real software.",
    responsibilities: [
      "Study systems, software design, and engineering practice",
      "Apply coursework to production-shaped side products",
    ],
    achievements: ["Connect theory to backend, cloud, and delivery work"],
    technologies: ["Java", "Data structures", "Databases"],
    logoUrl: null,
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
