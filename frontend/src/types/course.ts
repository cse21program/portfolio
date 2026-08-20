import type {
  Course,
  CourseAssignment,
  CourseLesson,
  CourseLessonKind,
  CourseModule,
  CoursePdf,
  CourseQuiz,
  CourseQuizQuestion,
  TopicLink,
  TopicSnippet,
} from "@/types/public";
import { matchesPriceBand, matchesYear, paidCents } from "@/lib/catalogFilters";

export type {
  Course,
  CourseAssignment,
  CourseLesson,
  CourseLessonKind,
  CourseModule,
  CoursePdf,
  CourseQuiz,
  CourseQuizQuestion,
};

export const courseStatuses = ["draft", "scheduled", "published", "archived"] as const;
export type CourseStatus = (typeof courseStatuses)[number];

export const courseDifficulties = ["Beginner", "Intermediate", "Advanced", "Professional"] as const;
export type CourseDifficulty = (typeof courseDifficulties)[number];

export const courseLessonKinds = [
  "video",
  "text",
  "code",
  "images",
  "resources",
  "pdf",
  "quiz",
  "assignment",
] as const;

export function lessonKindLabel(kind: string | undefined) {
  switch (kind) {
    case "video":
      return "Video";
    case "code":
      return "Code";
    case "images":
      return "Images";
    case "resources":
      return "Resources";
    case "pdf":
      return "PDF";
    case "quiz":
      return "Quiz";
    case "assignment":
      return "Assignment";
    default:
      return "Text";
  }
}

export function listFromLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function paragraphsFromBody(value: string) {
  return value
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function emptyQuiz(): CourseQuiz {
  return { passingScore: 70, questions: [] };
}

export function emptyAssignment(): CourseAssignment {
  return { brief: [], requirements: [], submission: "none", dueNote: "" };
}

export function emptyQuestion(): CourseQuizQuestion {
  return { prompt: "", choices: ["", ""], answerIndex: 0, explanation: "" };
}

export function inferLessonKind(lesson: Pick<
  CourseLesson,
  "kind" | "body" | "videoUrl" | "images" | "codeSnippets" | "resources" | "downloads" | "pdfs" | "quiz" | "assignment"
>): CourseLessonKind {
  const kind = lesson.kind?.trim();
  if (kind && (courseLessonKinds as readonly string[]).includes(kind)) {
    return kind as CourseLessonKind;
  }
  if ((lesson.quiz?.questions ?? []).length > 0) {
    return "quiz";
  }
  if ((lesson.assignment?.brief ?? []).length > 0 || (lesson.assignment?.requirements ?? []).length > 0) {
    return "assignment";
  }
  if ((lesson.pdfs ?? []).length > 0) {
    return "pdf";
  }
  if (lesson.videoUrl?.trim()) {
    return "video";
  }
  if ((lesson.codeSnippets ?? []).length > 0 && (lesson.body ?? []).length === 0) {
    return "code";
  }
  if ((lesson.images ?? []).length > 0 && (lesson.body ?? []).length === 0) {
    return "images";
  }
  if (
    (lesson.resources ?? []).length + (lesson.downloads ?? []).length > 0 &&
    (lesson.body ?? []).length === 0 &&
    (lesson.codeSnippets ?? []).length === 0
  ) {
    return "resources";
  }
  return "text";
}

export type RichBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string };

export function parseRichBody(paragraphs: string[]): RichBlock[] {
  const blocks: RichBlock[] = [];
  for (const raw of paragraphs) {
    const text = raw.trim();
    if (!text) {
      continue;
    }
    if (text.startsWith("## ")) {
      blocks.push({ type: "heading", text: text.slice(3).trim() });
      continue;
    }
    if (text.startsWith("# ")) {
      blocks.push({ type: "heading", text: text.slice(2).trim() });
      continue;
    }
    if (text.startsWith("> ")) {
      blocks.push({ type: "callout", text: text.replace(/^>\s?/gm, "").trim() });
      continue;
    }
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length > 0 && lines.every((line) => line.startsWith("- ") || line.startsWith("* "))) {
      blocks.push({ type: "list", items: lines.map((line) => line.slice(2).trim()) });
      continue;
    }
    blocks.push({ type: "paragraph", text });
  }
  return blocks;
}

export function slugFromTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length >= 2 && value.length <= 80;
}

export function accessLabel(item: Pick<Course, "free" | "price" | "salePrice">) {
  if (item.free) {
    return "Free";
  }
  return item.salePrice?.trim() || item.price.trim() || "Premium";
}

export function displayPrice(item: Pick<Course, "free" | "price" | "salePrice">) {
  return accessLabel(item);
}

export function lessonCount(course: Pick<Course, "modules">) {
  return course.modules.reduce((total, courseModule) => total + courseModule.lessons.length, 0);
}

export function formatCourseDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  const iso = /^\d{4}-\d{2}-\d{2}/.test(trimmed) ? `${trimmed.slice(0, 10)}T00:00:00` : trimmed;
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return trimmed;
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(parsed));
}

export function lessonAnchor(index: number, title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `lesson-${index + 1}${slug ? `-${slug}` : ""}`;
}

export function lessonKeyPart(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "lesson";
}

export type FlatLesson = {
  key: string;
  moduleTitle: string;
  moduleIndex: number;
  lessonIndex: number;
  globalIndex: number;
  lesson: CourseLesson;
};

export function flattenLessons(modules: CourseModule[]): FlatLesson[] {
  const seen = new Map<string, number>();
  const flat: FlatLesson[] = [];
  modules.forEach((courseModule, moduleIndex) => {
    const moduleSlug = lessonKeyPart(courseModule.title);
    courseModule.lessons.forEach((lesson, lessonIndex) => {
      const base = `${moduleSlug}/${lessonKeyPart(lesson.title)}`;
      const count = (seen.get(base) ?? 0) + 1;
      seen.set(base, count);
      flat.push({
        key: count === 1 ? base : `${base}-${count}`,
        moduleTitle: courseModule.title,
        moduleIndex,
        lessonIndex,
        globalIndex: flat.length,
        lesson,
      });
    });
  });
  return flat;
}

export function emptyLesson(): CourseLesson {
  return {
    kind: "text",
    title: "",
    summary: "",
    body: [],
    videoUrl: null,
    images: [],
    codeSnippets: [],
    resources: [],
    downloads: [],
    pdfs: [],
    quiz: emptyQuiz(),
    assignment: emptyAssignment(),
  };
}

export function emptyModule(): CourseModule {
  return {
    title: "",
    summary: "",
    lessons: [emptyLesson()],
  };
}

function normalizeLink(item: Partial<TopicLink> | undefined): TopicLink | null {
  const label = item?.label?.trim() ?? "";
  const url = item?.url?.trim() ?? "";
  if (!label || !url) {
    return null;
  }
  return { label, url };
}

function normalizeSnippet(item: Partial<TopicSnippet> | undefined): TopicSnippet | null {
  const code = item?.code ?? "";
  if (!code.trim()) {
    return null;
  }
  return {
    label: item?.label?.trim() ?? "",
    language: item?.language?.trim() || "text",
    code,
  };
}

function lessonFromUnknown(value: CourseLesson | string | undefined): CourseLesson | null {
  if (typeof value === "string") {
    const title = value.trim();
    return title ? { ...emptyLesson(), title } : null;
  }
  if (!value?.title?.trim()) {
    return null;
  }
  return normalizeLesson({ ...value, title: value.title });
}

export function normalizeLesson(item: Partial<CourseLesson> & Pick<CourseLesson, "title">): CourseLesson {
  const parsed = {
    title: item.title.trim(),
    summary: item.summary?.trim() ?? "",
    body: (item.body ?? []).map((entry) => entry.trim()).filter(Boolean),
    videoUrl: item.videoUrl?.trim() || null,
    images: (item.images ?? []).map((entry) => entry.trim()).filter(Boolean),
    codeSnippets: (item.codeSnippets ?? []).map(normalizeSnippet).filter((entry): entry is TopicSnippet => Boolean(entry)),
    resources: (item.resources ?? []).map(normalizeLink).filter((entry): entry is TopicLink => Boolean(entry)),
    downloads: (item.downloads ?? []).map(normalizeLink).filter((entry): entry is TopicLink => Boolean(entry)),
    pdfs: (item.pdfs ?? [])
      .map((pdf) => ({
        label: pdf.label?.trim() || pdf.fileName?.trim() || "PDF",
        url: pdf.url?.trim() ?? "",
        fileName: pdf.fileName?.trim() ?? "",
      }))
      .filter((pdf) => pdf.url),
    quiz: {
      passingScore: Math.min(Math.max(item.quiz?.passingScore ?? 70, 1), 100),
      questions: (item.quiz?.questions ?? [])
        .map((question) => ({
          prompt: question.prompt.trim(),
          choices: question.choices.map((choice) => choice.trim()).filter(Boolean),
          answerIndex: question.answerIndex,
          explanation: question.explanation?.trim() ?? "",
        }))
        .filter((question) => question.prompt && question.choices.length >= 2)
        .map((question) => ({
          ...question,
          answerIndex: Math.min(Math.max(question.answerIndex, 0), question.choices.length - 1),
        })),
    },
    assignment: {
      brief: (item.assignment?.brief ?? []).map((entry) => entry.trim()).filter(Boolean),
      requirements: (item.assignment?.requirements ?? []).map((entry) => entry.trim()).filter(Boolean),
      submission: item.assignment?.submission ?? "none",
      dueNote: item.assignment?.dueNote?.trim() ?? "",
    },
  };
  return {
    ...parsed,
    kind: inferLessonKind({ ...parsed, kind: item.kind }),
  };
}

export function normalizeModule(item: Partial<CourseModule> & Pick<CourseModule, "title">): CourseModule {
  return {
    title: item.title.trim(),
    summary: item.summary?.trim() ?? "",
    lessons: (item.lessons ?? [])
      .map((lesson) => lessonFromUnknown(lesson))
      .filter((lesson): lesson is CourseLesson => Boolean(lesson)),
  };
}

export function normalizeCourse(item: Partial<Course> & Pick<Course, "title" | "slug">, index = 0): Course {
  const free = item.free ?? item.price?.trim().toLowerCase() === "free";
  return {
    id: typeof item.id === "string" && item.id.length > 0 ? item.id : undefined,
    title: item.title.trim(),
    slug: item.slug.trim().toLowerCase(),
    subtitle: item.subtitle?.trim() ?? "",
    description: item.description?.trim() ?? "",
    overview: (item.overview ?? []).map((entry) => entry.trim()).filter(Boolean),
    thumbnailUrl: item.thumbnailUrl?.trim() || null,
    promoVideoUrl: item.promoVideoUrl?.trim() || null,
    instructor: item.instructor?.trim() || "Rezaul Karim",
    category: item.category?.trim() ?? "",
    skill: item.skill?.trim() ?? "",
    difficulty: item.difficulty?.trim() || "Beginner",
    language: item.language?.trim() || "English",
    duration: item.duration?.trim() ?? "",
    requirements: (item.requirements ?? []).map((entry) => entry.trim()).filter(Boolean),
    outcomes: (item.outcomes ?? []).map((entry) => entry.trim()).filter(Boolean),
    audience: (item.audience ?? []).map((entry) => entry.trim()).filter(Boolean),
    price: free ? "Free" : item.price?.trim() || "Premium",
    salePrice: free ? "" : item.salePrice?.trim() ?? "",
    currency: item.currency?.trim() || "USD",
    free,
    featured: Boolean(item.featured),
    certificateAvailable: Boolean(item.certificateAvailable),
    relatedSkillSlugs: (item.relatedSkillSlugs ?? []).map((entry) => entry.trim()).filter(Boolean),
    relatedTutorialSlugs: (item.relatedTutorialSlugs ?? []).map((entry) => entry.trim()).filter(Boolean),
    relatedCourseSlugs: (item.relatedCourseSlugs ?? []).map((entry) => entry.trim()).filter(Boolean),
    modules: (item.modules ?? [])
      .filter((courseModule) => courseModule.title?.trim())
      .map((courseModule) => normalizeModule({ ...courseModule, title: courseModule.title })),
    status: item.status?.trim() || "published",
    publishedAt: item.publishedAt?.trim() ?? "",
    seoTitle: item.seoTitle?.trim() ?? "",
    seoDescription: item.seoDescription?.trim() ?? "",
    canonicalUrl: item.canonicalUrl?.trim() ?? "",
    sortOrder: item.sortOrder ?? index,
    updatedAt: item.updatedAt,
  };
}

export function normalizeCourseList(items: Course[] | undefined) {
  return (items ?? []).map((item, index) => normalizeCourse(item, index));
}

export function publishedCourses(items: Course[]) {
  return items.filter((item) => (item.status ?? "published") === "published");
}

export function featuredCourses(items: Course[]) {
  const published = publishedCourses(items);
  const featured = published.filter((item) => item.featured);
  return featured.length > 0 ? featured : published.slice(0, 2);
}

export function findCourse(items: Course[], slug: string) {
  return publishedCourses(items).find((item) => item.slug === slug);
}

export function relatedCourses(course: Course, items: Course[]) {
  const others = publishedCourses(items).filter((item) => item.slug !== course.slug);
  const named = new Set(course.relatedCourseSlugs ?? []);
  const close = others.filter(
    (item) =>
      named.has(item.slug) ||
      (course.skill && item.skill === course.skill) ||
      (course.category && item.category === course.category) ||
      (course.difficulty && item.difficulty === course.difficulty),
  );
  const rest = others.filter((item) => !close.includes(item));
  return [...close, ...rest].slice(0, 3);
}

export function matchesCourseQuery(item: Course, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return [
    item.title,
    item.subtitle,
    item.description,
    item.skill,
    item.category,
    item.difficulty,
    accessLabel(item),
    ...(item.requirements ?? []),
    ...(item.outcomes ?? []),
    ...item.modules.flatMap((courseModule) => [
      courseModule.title,
      courseModule.summary ?? "",
      ...courseModule.lessons.map(
        (lesson) =>
          `${lesson.title} ${lesson.summary} ${lessonKindLabel(lesson.kind)} ${lesson.quiz?.questions.map((question) => question.prompt).join(" ") ?? ""}`,
      ),
    ]),
  ]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export type CourseFilters = {
  query: string;
  difficulty: string;
  skill: string;
  access: string;
  featured: string;
  status: string;
  year?: string;
  price?: string;
};

export function matchesCourseFilters(item: Course, filters: CourseFilters) {
  if (!matchesCourseQuery(item, filters.query)) {
    return false;
  }
  if (filters.difficulty && item.difficulty !== filters.difficulty) {
    return false;
  }
  if (filters.skill && item.skill !== filters.skill) {
    return false;
  }
  if (filters.access === "free" && !item.free) {
    return false;
  }
  if (filters.access === "premium" && item.free) {
    return false;
  }
  if (filters.featured === "featured" && !item.featured) {
    return false;
  }
  if (!matchesYear(item.publishedAt ?? "", filters.year ?? "")) {
    return false;
  }
  if (!matchesPriceBand(item.free, paidCents(item.free, item.salePrice, item.price), filters.price ?? "")) {
    return false;
  }
  if (filters.status && (item.status ?? "published") !== filters.status) {
    return false;
  }
  return true;
}

export function emptyCourse(sortOrder = 0): Course {
  return {
    id: crypto.randomUUID(),
    title: "",
    slug: "",
    subtitle: "",
    description: "",
    overview: [],
    thumbnailUrl: null,
    promoVideoUrl: null,
    instructor: "Rezaul Karim",
    category: "",
    skill: "",
    difficulty: "Beginner",
    language: "English",
    duration: "",
    requirements: [],
    outcomes: [],
    audience: [],
    price: "",
    salePrice: "",
    currency: "USD",
    free: false,
    featured: false,
    certificateAvailable: false,
    relatedSkillSlugs: [],
    relatedTutorialSlugs: [],
    relatedCourseSlugs: [],
    modules: [emptyModule()],
    status: "draft",
    publishedAt: new Date().toISOString().slice(0, 10),
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
    sortOrder,
  };
}
