import type { SocialLink } from "@/types/public";

export const profile = {
  fullName: "Rezaul Karim",
  professionalTitle: "Software Engineer",
  shortBiography:
    "I build backend systems, deployment pipelines, and cloud setups that stay understandable after launch.",
  detailedBiography: [
    "I work across backend APIs, DevOps, and cloud engineering, with a bias toward systems that are observable, documented, and cheap to operate.",
    "This platform will eventually host case studies, structured skill notes, tutorials, courses, and professional services. The public pages here are a static first version so the product can be designed before the CMS and payments go live.",
    "When I take on work, I care about requirements, architecture, delivery, and handing over something another engineer can maintain.",
  ],
  careerObjectives:
    "Help teams ship production-grade backend and cloud systems, and teach the same craft through writing and courses.",
  philosophy:
    "Prefer boring, proven infrastructure. Make the domain model explicit. Automate the path to production.",
  interests: [
    "Distributed systems",
    "Platform engineering",
    "Developer experience",
    "Technical writing",
  ],
  location: "Sylhet, Bangladesh",
  yearsOfExperience: "Hands-on backend and DevOps work",
  languages: ["English", "Bangla"],
  availability: "Open for hire",
  profileImage: "/images/profile.png",
} as const;

export const socialLinks: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/swe-rezaul-karim" },
  { label: "Email", href: "mailto:hello@rezaul.dev" },
];

export const heroSkills = [
  "Backend Development",
  "DevOps",
  "Cloud Engineering",
  "Spring Boot",
  "Node.js",
  "AWS",
  "Docker",
  "Kubernetes",
];
