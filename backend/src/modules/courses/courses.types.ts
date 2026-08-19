import { parseTopicLinks, parseTopicSnippets, type TopicLink, type TopicSnippet } from "../topics/topics.types";

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

export type CourseLessonKind = (typeof courseLessonKinds)[number];

export type CoursePdf = {
  label: string;
  url: string;
  fileName: string;
};

export type CourseQuizQuestion = {
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
};

export type CourseQuiz = {
  passingScore: number;
  questions: CourseQuizQuestion[];
};

export type CourseAssignment = {
  brief: string[];
  requirements: string[];
  submission: "none" | "link" | "file" | "text";
  dueNote: string;
};

export type CourseLesson = {
  kind: CourseLessonKind;
  title: string;
  summary: string;
  body: string[];
  videoUrl: string | null;
  images: string[];
  codeSnippets: TopicSnippet[];
  resources: TopicLink[];
  downloads: TopicLink[];
  pdfs: CoursePdf[];
  quiz: CourseQuiz;
  assignment: CourseAssignment;
};

export type CourseModule = {
  title: string;
  summary: string;
  lessons: CourseLesson[];
};

export type CourseRecord = {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  overview: string[];
  thumbnailUrl: string | null;
  promoVideoUrl: string | null;
  instructor: string;
  category: string;
  skill: string;
  difficulty: string;
  language: string;
  duration: string;
  requirements: string[];
  outcomes: string[];
  audience: string[];
  price: string;
  salePrice: string;
  currency: string;
  free: boolean;
  featured: boolean;
  certificateAvailable: boolean;
  relatedSkillSlugs: string[];
  relatedTutorialSlugs: string[];
  relatedCourseSlugs: string[];
  modules: CourseModule[];
  status: string;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  sortOrder: number;
  updatedAt?: string;
};

export type CourseWrite = Omit<CourseRecord, "id" | "sortOrder" | "updatedAt"> & {
  id?: string;
  sortOrder?: number;
};

export function emptyToNull(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function isPublishedCourse(item: Pick<CourseRecord, "status">) {
  return item.status === "published";
}

export function emptyQuiz(): CourseQuiz {
  return { passingScore: 70, questions: [] };
}

export function emptyAssignment(): CourseAssignment {
  return { brief: [], requirements: [], submission: "none", dueNote: "" };
}

export function inferLessonKind(lesson: Omit<CourseLesson, "kind"> & { kind?: string }): CourseLessonKind {
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parsePdfs(value: unknown): CoursePdf[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const pdfs: CoursePdf[] = [];
  for (const entry of value) {
    const row = asRecord(entry);
    if (!row) {
      continue;
    }
    const url = typeof row.url === "string" ? row.url.trim() : "";
    if (!url) {
      continue;
    }
    const label = typeof row.label === "string" ? row.label.trim() : "";
    const fileName = typeof row.fileName === "string" ? row.fileName.trim() : "";
    pdfs.push({
      label: label || fileName || "PDF",
      url,
      fileName,
    });
  }
  return pdfs;
}

function parseQuiz(value: unknown): CourseQuiz {
  const row = asRecord(value);
  if (!row) {
    return emptyQuiz();
  }
  const passing =
    typeof row.passingScore === "number" && Number.isFinite(row.passingScore) ? Math.round(row.passingScore) : 70;
  const questions: CourseQuizQuestion[] = [];
  if (Array.isArray(row.questions)) {
    for (const entry of row.questions) {
      const question = asRecord(entry);
      if (!question) {
        continue;
      }
      const prompt = typeof question.prompt === "string" ? question.prompt.trim() : "";
      const choices = stringList(question.choices).slice(0, 6);
      if (!prompt || choices.length < 2) {
        continue;
      }
      const answerIndex =
        typeof question.answerIndex === "number" && Number.isInteger(question.answerIndex) ? question.answerIndex : 0;
      questions.push({
        prompt,
        choices,
        answerIndex: Math.min(Math.max(answerIndex, 0), choices.length - 1),
        explanation: typeof question.explanation === "string" ? question.explanation.trim() : "",
      });
    }
  }
  return {
    passingScore: Math.min(Math.max(passing, 1), 100),
    questions,
  };
}

function parseAssignment(value: unknown): CourseAssignment {
  const row = asRecord(value);
  if (!row) {
    return emptyAssignment();
  }
  const submission = row.submission;
  return {
    brief: stringList(row.brief),
    requirements: stringList(row.requirements),
    submission: submission === "link" || submission === "file" || submission === "text" ? submission : "none",
    dueNote: typeof row.dueNote === "string" ? row.dueNote.trim() : "",
  };
}

function emptyLessonFields(title: string, summary = ""): CourseLesson {
  return {
    kind: "text",
    title,
    summary,
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

export function parseCourseLesson(value: unknown): CourseLesson | null {
  if (typeof value === "string") {
    const title = value.trim();
    return title ? emptyLessonFields(title) : null;
  }
  const row = asRecord(value);
  if (!row) {
    return null;
  }
  const title = typeof row.title === "string" ? row.title.trim() : "";
  if (!title) {
    return null;
  }
  const video = typeof row.videoUrl === "string" ? row.videoUrl.trim() : "";
  const parsed = {
    title,
    summary: typeof row.summary === "string" ? row.summary.trim() : "",
    body: stringList(row.body),
    videoUrl: video.length > 0 ? video : null,
    images: stringList(row.images),
    codeSnippets: parseTopicSnippets(row.codeSnippets),
    resources: parseTopicLinks(row.resources),
    downloads: parseTopicLinks(row.downloads),
    pdfs: parsePdfs(row.pdfs),
    quiz: parseQuiz(row.quiz),
    assignment: parseAssignment(row.assignment),
  };
  return {
    ...parsed,
    kind: inferLessonKind({ ...parsed, kind: typeof row.kind === "string" ? row.kind : "" }),
  };
}

export function parseCourseModules(value: unknown): CourseModule[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const modules: CourseModule[] = [];
  for (const entry of value) {
    const row = asRecord(entry);
    if (!row) {
      continue;
    }
    const title = typeof row.title === "string" ? row.title.trim() : "";
    if (!title) {
      continue;
    }
    const lessons = Array.isArray(row.lessons)
      ? row.lessons.map(parseCourseLesson).filter((lesson): lesson is CourseLesson => Boolean(lesson))
      : [];
    modules.push({
      title,
      summary: typeof row.summary === "string" ? row.summary.trim() : "",
      lessons,
    });
  }
  return modules;
}

export function outlineLesson(lesson: CourseLesson): CourseLesson {
  return {
    kind: lesson.kind,
    title: lesson.title,
    summary: lesson.summary,
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

export function stripLessonContent(course: CourseRecord): CourseRecord {
  return {
    ...course,
    modules: course.modules.map((courseModule) => ({
      title: courseModule.title,
      summary: courseModule.summary,
      lessons: courseModule.lessons.map(outlineLesson),
    })),
  };
}

export type CourseAccess = {
  enrolled: boolean;
  canReadLessons: boolean;
  status: "active" | "canceled" | null;
};

export function relatedCourses(course: CourseRecord, all: CourseRecord[]) {
  const others = all.filter((item) => isPublishedCourse(item) && item.slug !== course.slug);
  const close = others.filter(
    (item) =>
      Boolean(course.skill && item.skill === course.skill) ||
      Boolean(course.difficulty && item.difficulty === course.difficulty) ||
      Boolean(course.category && item.category === course.category) ||
      course.relatedCourseSlugs.includes(item.slug),
  );
  const rest = others.filter((item) => !close.includes(item));
  return [...close, ...rest].slice(0, 3);
}

export { defaultCourses } from "./courses.seed";
