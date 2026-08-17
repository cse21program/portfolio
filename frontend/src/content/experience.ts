import type { Education, Experience } from "@/types/public";

export const experiences: Experience[] = [
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
  },
  {
    company: "Leading University",
    position: "Computer Science",
    type: "Academic",
    location: "Sylhet, Bangladesh",
    startDate: "Ongoing",
    endDate: "",
    current: true,
    description:
      "Academic grounding in computer science alongside shipping real software.",
    responsibilities: [
      "Study systems, software design, and engineering practice",
      "Apply coursework to production-shaped side products",
    ],
    achievements: ["Connect theory to backend, cloud, and delivery work"],
    technologies: ["Java", "Data structures", "Databases"],
    website: "https://www.lus.ac.bd/",
  },
];

export const education: Education[] = [
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
    website: "https://www.lus.ac.bd/",
  },
];
