import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { ContentCard } from "@/components/ui/ContentCard";
import { courses } from "@/content/learning";

export function CoursesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Courses"
        title="Learn in sequence"
        description="Full courses with modules and lessons. Checkout is next; this catalog is static."
      />
      <Container className="grid gap-4 py-16 md:grid-cols-2">
        {courses.map((course) => (
          <ContentCard
            key={course.slug}
            to={`/courses/${course.slug}`}
            eyebrow={course.difficulty}
            title={course.title}
            description={course.description}
            meta={`${course.salePrice ?? course.price} · ${course.duration}`}
          />
        ))}
      </Container>
    </>
  );
}
