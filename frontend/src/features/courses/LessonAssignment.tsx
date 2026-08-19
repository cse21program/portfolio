import type { CourseAssignment } from "@/types/course";
import { LessonRichText } from "@/features/courses/LessonRichText";

function submissionLabel(value: CourseAssignment["submission"]) {
  switch (value) {
    case "link":
      return "A repository or document link";
    case "file":
      return "A file upload";
    case "text":
      return "A written answer";
    default:
      return "No hand-in in the product yet — keep the work in your notes";
  }
}

export function LessonAssignment({ assignment }: { assignment: CourseAssignment }) {
  const brief = assignment.brief ?? [];
  const requirements = assignment.requirements ?? [];

  return (
    <div className="space-y-6">
      {brief.length > 0 ? <LessonRichText paragraphs={brief} lead /> : null}
      {requirements.length > 0 ? (
        <div>
          <p className="text-xs tracking-[0.16em] text-muted uppercase">Requirements</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-lg leading-8 text-ink-soft">
            {requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="rounded-2xl border border-line bg-paper/70 px-5 py-4">
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Hand-in</p>
        <p className="mt-2 text-base leading-7 text-ink">{submissionLabel(assignment.submission)}</p>
        {assignment.dueNote ? <p className="mt-2 text-sm leading-6 text-ink-soft">{assignment.dueNote}</p> : null}
        <p className="mt-3 text-sm leading-6 text-muted">
          File drop-off is not live yet. Complete the work in your own repo; this page keeps the brief honest
          instead of faking a submit button.
        </p>
      </div>
    </div>
  );
}
