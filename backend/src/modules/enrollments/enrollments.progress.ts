export type CurriculumLesson = {
  key: string;
  title: string;
  moduleTitle: string;
  index: number;
};

export type CourseProgress = {
  lessonsTotal: number;
  lessonsCompleted: number;
  lessonsRemaining: number;
  percent: number;
  currentLesson: CurriculumLesson | null;
  lastActivityAt: string;
  completedKeys: string[];
  completed: boolean;
};

export function slugPart(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "lesson";
}

export function curriculumLessons(
  modules: Array<{ title: string; lessons: Array<{ title: string }> }>,
): CurriculumLesson[] {
  const seen = new Map<string, number>();
  const items: CurriculumLesson[] = [];
  for (const courseModule of modules) {
    const moduleSlug = slugPart(courseModule.title);
    for (const lesson of courseModule.lessons) {
      const base = `${moduleSlug}/${slugPart(lesson.title)}`;
      const count = (seen.get(base) ?? 0) + 1;
      seen.set(base, count);
      items.push({
        key: count === 1 ? base : `${base}-${count}`,
        title: lesson.title,
        moduleTitle: courseModule.title,
        index: items.length,
      });
    }
  }
  return items;
}

export function emptyProgress(lastActivityAt: string): CourseProgress {
  return {
    lessonsTotal: 0,
    lessonsCompleted: 0,
    lessonsRemaining: 0,
    percent: 0,
    currentLesson: null,
    lastActivityAt,
    completedKeys: [],
    completed: false,
  };
}

export function computeCourseProgress(input: {
  modules: Array<{ title: string; lessons: Array<{ title: string }> }> | undefined;
  completedKeys: string[];
  lastActivityAt: string;
}): CourseProgress {
  const lessons = curriculumLessons(input.modules ?? []);
  if (lessons.length === 0) {
    return emptyProgress(input.lastActivityAt);
  }

  const completedSet = new Set(input.completedKeys);
  const completedKeys = lessons.filter((item) => completedSet.has(item.key)).map((item) => item.key);
  const completedCount = completedKeys.length;
  const currentLesson = lessons.find((item) => !completedSet.has(item.key)) ?? lessons[lessons.length - 1] ?? null;
  const allDone = completedCount === lessons.length;

  return {
    lessonsTotal: lessons.length,
    lessonsCompleted: completedCount,
    lessonsRemaining: lessons.length - completedCount,
    percent: Math.round((completedCount / lessons.length) * 100),
    currentLesson,
    lastActivityAt: input.lastActivityAt,
    completedKeys,
    completed: allDone,
  };
}
