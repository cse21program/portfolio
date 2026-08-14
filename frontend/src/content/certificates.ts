import type { Certificate } from "@/types/public";

export const certificates: Certificate[] = [
  {
    slug: "aws-foundations",
    title: "AWS Cloud Practitioner path",
    organization: "Amazon Web Services",
    issueDate: "In progress",
    skill: "AWS",
    featured: true,
    description:
      "Foundations across IAM, EC2, VPC, S3, and the shared-responsibility model. Credential details will be added when issued.",
  },
  {
    slug: "docker-essentials",
    title: "Docker & container fundamentals",
    organization: "Self-directed",
    issueDate: "2025",
    skill: "Docker",
    featured: true,
    description:
      "Images, containers, volumes, networking, Compose, and a repeatable local production-shaped stack.",
  },
  {
    slug: "spring-security",
    title: "Spring Security & API auth",
    organization: "Self-directed",
    issueDate: "2025",
    skill: "Spring Boot",
    featured: false,
    description:
      "JWT, session strategy, role-based access, and keeping authorization on the server.",
  },
];

export const featuredCertificates = certificates.filter((item) => item.featured);
