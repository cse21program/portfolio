import { Link, useParams } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { getCourse } from "@/content/learning";

export function CourseDetailPage() {
  const { slug = "" } = useParams();
  const course = getCourse(slug);

  if (!course) {
    return <NotFoundState title="Course not found" />;
  }

  return (
    <Container className="space-y-10 py-16">
      <div className="max-w-3xl">
        <p className="text-sm tracking-wide text-accent uppercase">{course.difficulty}</p>
        <h1 className="mt-3 font-display text-5xl text-ink">{course.title}</h1>
        <p className="mt-3 text-lg text-ink-soft">{course.subtitle}</p>
        <p className="mt-4 leading-7 text-ink-soft">{course.description}</p>
        <p className="mt-4 text-sm text-muted">
          {course.salePrice ? (
            <>
              <span className="mr-2 line-through">{course.price}</span>
              {course.salePrice}
            </>
          ) : (
            course.price
          )}{" "}
          · {course.duration}
        </p>
        <Link
          to="/contact"
          className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm text-paper"
        >
          Inquire to enroll
        </Link>
      </div>
      <section>
        <h2 className="font-display text-3xl text-ink">What you will learn</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-soft">
          {course.outcomes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-display text-3xl text-ink">Curriculum</h2>
        <div className="mt-6 space-y-4">
          {course.modules.map((module) => (
            <article key={module.title} className="rounded-2xl border border-line bg-surface p-6">
              <h3 className="font-display text-2xl text-ink">{module.title}</h3>
              <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                {module.lessons.map((lesson) => (
                  <li key={lesson}>{lesson}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </Container>
  );
}
