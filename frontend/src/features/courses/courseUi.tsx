import { Link } from "react-router-dom";
import { site } from "@/config/site";
import { accessLabel, formatCourseDate, lessonCount, type Course } from "@/types/course";
import { Chip } from "@/features/tutorials/tutorialUi";

export { ActionButton, Chip, CodeBlock } from "@/features/tutorials/tutorialUi";

export function CourseByline({ course }: { course: Course }) {
  const date = formatCourseDate(course.publishedAt ?? "");
  const lessons = lessonCount(course);
  const length = `${lessons} ${lessons === 1 ? "lesson" : "lessons"}`;
  const meta = [date, course.duration, length].filter(Boolean).join(" · ");
  const initials = (course.instructor || site.name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper font-display text-sm text-ink">
        {initials || "RK"}
      </span>
      <div>
        <p className="font-medium text-ink">{course.instructor || site.name}</p>
        {meta ? <p>{meta}</p> : null}
      </div>
    </div>
  );
}

export function CourseCard({
  course,
  featured = false,
}: {
  course: Course;
  featured?: boolean;
}) {
  const image = course.thumbnailUrl?.trim() || null;
  const wide = featured && Boolean(image);
  const access = accessLabel(course);
  const lessons = lessonCount(course);
  const price = course.free
    ? "Free"
    : course.salePrice
      ? course.salePrice
      : course.price;

  return (
    <Link
      to={`/courses/${course.slug}`}
      className={`group relative flex h-full overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_1px_0_rgb(26_22_18/0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-[0_18px_40px_rgb(26_22_18/0.08)] ${
        wide ? "flex-col md:flex-row" : "flex-col"
      }`}
    >
      {featured ? (
        <span className="absolute inset-y-0 left-0 w-1 bg-accent" aria-hidden="true" />
      ) : null}
      {image ? (
        <img
          src={image}
          alt=""
          className={`object-cover ${wide ? "aspect-[16/10] md:aspect-auto md:w-[46%]" : "aspect-[16/9] w-full"}`}
        />
      ) : null}
      <div className={`flex flex-1 flex-col p-5 sm:p-7 ${featured ? "md:p-8" : ""}`}>
        <div className="flex flex-wrap gap-2">
          {featured ? <Chip accent>Featured</Chip> : null}
          <Chip accent={!featured}>{access}</Chip>
          {course.difficulty ? <Chip>{course.difficulty}</Chip> : null}
          {course.skill ? <Chip>{course.skill}</Chip> : null}
        </div>
        <h2
          className={`mt-5 font-display tracking-tight text-ink transition group-hover:text-accent-dark ${
            featured ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
          }`}
        >
          {course.title}
        </h2>
        <p className="mt-3 flex-1 text-base leading-8 text-ink-soft">{course.subtitle || course.description}</p>
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {[price, course.duration, `${lessons} ${lessons === 1 ? "lesson" : "lessons"}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="text-sm font-medium text-accent group-hover:text-accent-dark">Open course →</p>
        </div>
      </div>
    </Link>
  );
}
