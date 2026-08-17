import { articles } from "@/content/blog";
import { profile } from "@/content/profile";
import type { ResumeCredit, ResumeDocument } from "@/types/resume";

export const suggestedResumeDraft = {
  headline: profile.professionalTitle,
  summary:
    "I build backend systems, deployment pipelines, and cloud setups that stay understandable after launch. Current work is APIs, containers, and this portfolio platform.",
  awards: [
    {
      title: "Independent engineering practice",
      detail: "Backend APIs, DevOps, and production delivery",
      year: "2024 — Present",
      href: "https://github.com/swe-rezaul-karim",
    },
  ] satisfies ResumeCredit[],
  publications: articles.map((article) => ({
    title: article.title,
    detail: `${article.category} · ${article.tags.slice(0, 2).join(", ")}`,
    year: article.publishedAt.slice(0, 4),
    href: `/blog/${article.slug}`,
  })) satisfies ResumeCredit[],
};

export function isBlankResume(resume: ResumeDocument) {
  return (
    !resume.headline &&
    !resume.summary &&
    resume.awards.length === 0 &&
    resume.publications.length === 0 &&
    !resume.pdfUrl
  );
}
