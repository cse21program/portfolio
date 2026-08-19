import { articles } from "@/content/blog";
import { certificates } from "@/content/certificates";
import { courses, tutorials } from "@/content/learning";
import { projects } from "@/content/projects";

export type RelatedOption = {
  slug: string;
  name: string;
  keywords: string;
};

function option(slug: string, name: string, extra: string[] = []): RelatedOption {
  return {
    slug,
    name,
    keywords: [name, slug, ...extra].join(" ").toLowerCase(),
  };
}

export const relatedBlogOptions: RelatedOption[] = articles.map((article) =>
  option(article.slug, article.title, [article.skill, article.category, ...article.tags]),
);

export const relatedTutorialOptions: RelatedOption[] = tutorials.map((tutorial) =>
  option(tutorial.slug, tutorial.title, [tutorial.skill, tutorial.difficulty]),
);

export const relatedCourseOptions: RelatedOption[] = courses.map((course) =>
  option(course.slug, course.title, [course.subtitle, course.description, course.skill, course.category ?? ""]),
);

export const relatedProjectOptions: RelatedOption[] = projects.map((project) =>
  option(project.slug, project.title, [project.category, project.shortDescription]),
);

export const relatedCertificateOptions: RelatedOption[] = certificates.map((certificate) =>
  option(certificate.slug, certificate.title, [certificate.organization, certificate.skill]),
);

function termsFrom(...values: string[]) {
  return values
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 1);
}

export function scoreRelated(option: RelatedOption, needles: string[]) {
  const terms = termsFrom(...needles);
  if (terms.length === 0) {
    return 0;
  }
  return terms.reduce((score, term) => {
    if (option.name.toLowerCase().includes(term)) {
      return score + 3;
    }
    if (option.keywords.includes(term)) {
      return score + 1;
    }
    return score;
  }, 0);
}

export function suggestedRelated(options: RelatedOption[], selected: string[], needles: string[]) {
  return options
    .filter((option) => !selected.includes(option.slug))
    .map((option) => ({ option, score: scoreRelated(option, needles) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.option.name.localeCompare(b.option.name))
    .map((entry) => entry.option);
}

export function searchRelated(options: RelatedOption[], selected: string[], query: string) {
  const needle = query.trim().toLowerCase();
  const remaining = options.filter((option) => !selected.includes(option.slug));
  if (needle.length === 0) {
    return remaining;
  }
  const terms = termsFrom(query);
  return remaining
    .map((option) => {
      let score = 0;
      if (option.slug === needle) {
        score += 8;
      } else if (option.slug.includes(needle)) {
        score += 5;
      }
      if (option.name.toLowerCase().includes(needle)) {
        score += 4;
      }
      if (option.keywords.includes(needle)) {
        score += 2;
      }
      score += scoreRelated(option, terms);
      return { option, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.option.name.localeCompare(b.option.name))
    .map((entry) => entry.option);
}

export function relatedSlugFromQuery(query: string) {
  const needle = query.trim().toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(needle) && needle.length >= 2 && needle.length <= 80
    ? needle
    : "";
}

export function relatedLabel(options: RelatedOption[], slug: string) {
  return options.find((option) => option.slug === slug)?.name ?? slug;
}

export function isKnownRelated(options: RelatedOption[], slug: string) {
  return options.some((option) => option.slug === slug);
}
