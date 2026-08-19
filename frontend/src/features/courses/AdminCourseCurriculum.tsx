import { FormField, FormSelect, FormTextArea } from "@/components/ui/FormField";
import { VideoPicker } from "@/features/about/MediaPicker";
import { DocumentPicker } from "@/features/education/DocumentPicker";
import { ImagesPicker } from "@/features/projects/ImagesPicker";
import {
  courseLessonKinds,
  emptyAssignment,
  emptyLesson,
  emptyModule,
  emptyQuestion,
  emptyQuiz,
  lessonKindLabel,
  paragraphsFromBody,
  type Course,
  type CourseLesson,
  type CourseModule,
  type CourseQuizQuestion,
} from "@/types/course";
import type { TopicLink, TopicSnippet } from "@/types/public";

const LANGUAGES = [
  "java",
  "typescript",
  "javascript",
  "python",
  "go",
  "sql",
  "bash",
  "docker",
  "json",
  "yaml",
  "html",
  "css",
  "text",
];

function languageOptions(current: string) {
  const value = current.trim() || "text";
  return [...new Set([value, ...LANGUAGES])];
}

function patchModule(modules: CourseModule[], index: number, patch: Partial<CourseModule>) {
  return modules.map((item, current) => (current === index ? { ...item, ...patch } : item));
}

function patchLesson(lessons: CourseLesson[], index: number, patch: Partial<CourseLesson>) {
  return lessons.map((item, current) => (current === index ? { ...item, ...patch } : item));
}

function LinkRows({
  label,
  addLabel,
  prefix,
  items,
  onChange,
}: {
  label: string;
  addLabel: string;
  prefix: string;
  items: TopicLink[];
  onChange: (items: TopicLink[]) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink">{label}</p>
      {items.map((item, index) => (
        <div key={`${prefix}-${index}`} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <FormField
            label="Label"
            name={`${prefix}-label-${index}`}
            value={item.label}
            onChange={(event) => {
              const next = [...items];
              next[index] = { ...item, label: event.target.value };
              onChange(next);
            }}
          />
          <FormField
            label="URL"
            name={`${prefix}-url-${index}`}
            value={item.url}
            onChange={(event) => {
              const next = [...items];
              next[index] = { ...item, url: event.target.value };
              onChange(next);
            }}
          />
          <button
            className="cursor-pointer self-end pb-2 text-sm text-muted hover:text-ink"
            type="button"
            onClick={() => onChange(items.filter((_, current) => current !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent"
        type="button"
        onClick={() => onChange([...items, { label: "", url: "" }])}
      >
        {addLabel}
      </button>
    </div>
  );
}

function SnippetRows({
  prefix,
  items,
  onChange,
}: {
  prefix: string;
  items: TopicSnippet[];
  onChange: (items: TopicSnippet[]) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink">Code examples</p>
      {items.map((snippet, index) => (
        <div key={`${prefix}-${index}`} className="space-y-3 rounded-2xl border border-line bg-paper/40 p-4">
          <div className="flex justify-end">
            <button
              className="cursor-pointer text-sm text-muted hover:text-ink"
              type="button"
              onClick={() => onChange(items.filter((_, current) => current !== index))}
            >
              Remove snippet
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="Snippet title"
              name={`${prefix}-label-${index}`}
              value={snippet.label}
              onChange={(event) => {
                const next = [...items];
                next[index] = { ...snippet, label: event.target.value };
                onChange(next);
              }}
            />
            <FormSelect
              label="Language"
              name={`${prefix}-lang-${index}`}
              value={snippet.language.trim() || "text"}
              onChange={(event) => {
                const next = [...items];
                next[index] = { ...snippet, language: event.target.value };
                onChange(next);
              }}
            >
              {languageOptions(snippet.language).map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </FormSelect>
          </div>
          <FormTextArea
            label="Code"
            name={`${prefix}-code-${index}`}
            rows={6}
            value={snippet.code}
            onChange={(event) => {
              const next = [...items];
              next[index] = { ...snippet, code: event.target.value };
              onChange(next);
            }}
          />
        </div>
      ))}
      <button
        className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent"
        type="button"
        onClick={() => onChange([...items, { label: "", language: "text", code: "" }])}
      >
        Add snippet
      </button>
    </div>
  );
}

function PdfRows({
  prefix,
  items,
  pending,
  onChange,
}: {
  prefix: string;
  items: Array<{ label: string; url: string; fileName?: string }>;
  pending: boolean;
  onChange: (items: Array<{ label: string; url: string; fileName: string }>) => void;
}) {
  const pdfs = items.map((item) => ({
    label: item.label,
    url: item.url,
    fileName: item.fileName ?? "",
  }));
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-ink">PDFs</p>
      {pdfs.map((item, index) => (
        <div key={`${prefix}-${index}`} className="space-y-3 rounded-2xl border border-line bg-paper/40 p-4">
          <div className="flex justify-end">
            <button
              className="cursor-pointer text-sm text-muted hover:text-ink"
              type="button"
              onClick={() => onChange(pdfs.filter((_, current) => current !== index))}
            >
              Remove PDF
            </button>
          </div>
          <FormField
            label="Label"
            name={`${prefix}-label-${index}`}
            value={item.label}
            onChange={(event) => {
              const next = [...pdfs];
              next[index] = { ...item, label: event.target.value };
              onChange(next);
            }}
          />
          <FormField
            label="PDF URL"
            name={`${prefix}-url-${index}`}
            value={item.url}
            hint="https URL or an uploaded site path."
            onChange={(event) => {
              const next = [...pdfs];
              next[index] = { ...item, url: event.target.value };
              onChange(next);
            }}
          />
          <DocumentPicker
            label="Upload PDF"
            hint="Optional. PDF · up to 10 MB."
            url={item.url || null}
            fileName={item.fileName || null}
            disabled={pending}
            onChange={(next) => {
              const copy = [...pdfs];
              copy[index] = {
                label: item.label || next.fileName || "PDF",
                url: next.url ?? "",
                fileName: next.fileName ?? "",
              };
              onChange(copy);
            }}
          />
        </div>
      ))}
      <button
        className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent"
        type="button"
        onClick={() => onChange([...pdfs, { label: "", url: "", fileName: "" }])}
      >
        Add PDF
      </button>
    </div>
  );
}

function QuizEditor({
  prefix,
  quiz,
  onChange,
}: {
  prefix: string;
  quiz: { passingScore: number; questions: CourseQuizQuestion[] };
  onChange: (quiz: { passingScore: number; questions: CourseQuizQuestion[] }) => void;
}) {
  const questions = quiz.questions;
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-display text-lg text-ink">Quiz</h4>
        <p className="mt-1 text-sm text-muted">Multiple choice. Visitors check answers on the page; scores are not stored yet.</p>
      </div>
      <FormField
        label="Passing score"
        name={`${prefix}-pass`}
        type="number"
        min={1}
        max={100}
        value={String(quiz.passingScore)}
        hint="Percent. Default 70."
        onChange={(event) => onChange({ ...quiz, passingScore: Number(event.target.value) || 70 })}
      />
      {questions.map((question, index) => (
        <div key={`${prefix}-q-${index}`} className="space-y-3 rounded-2xl border border-line bg-paper/40 p-4">
          <div className="flex justify-end">
            <button
              className="cursor-pointer text-sm text-muted hover:text-ink"
              type="button"
              onClick={() => onChange({ ...quiz, questions: questions.filter((_, current) => current !== index) })}
            >
              Remove question
            </button>
          </div>
          <FormTextArea
            label="Question"
            name={`${prefix}-prompt-${index}`}
            rows={2}
            value={question.prompt}
            onChange={(event) => {
              const next = [...questions];
              next[index] = { ...question, prompt: event.target.value };
              onChange({ ...quiz, questions: next });
            }}
          />
          <FormTextArea
            label="Choices"
            name={`${prefix}-choices-${index}`}
            rows={4}
            hint="One choice per line. At least two."
            value={question.choices.join("\n")}
            onChange={(event) => {
              const choices = event.target.value.split("\n");
              const next = [...questions];
              next[index] = {
                ...question,
                choices,
                answerIndex: Math.min(question.answerIndex, Math.max(choices.filter((line) => line.trim()).length - 1, 0)),
              };
              onChange({ ...quiz, questions: next });
            }}
          />
          <FormSelect
            label="Correct answer"
            name={`${prefix}-answer-${index}`}
            value={String(question.answerIndex)}
            onChange={(event) => {
              const next = [...questions];
              next[index] = { ...question, answerIndex: Number(event.target.value) };
              onChange({ ...quiz, questions: next });
            }}
          >
            {question.choices.map((choice, choiceIndex) => (
              <option key={`${choice}-${choiceIndex}`} value={choiceIndex}>
                {choice.trim() || `Choice ${choiceIndex + 1}`}
              </option>
            ))}
          </FormSelect>
          <FormTextArea
            label="Explanation"
            name={`${prefix}-explain-${index}`}
            rows={2}
            hint="Shown after the visitor checks answers."
            value={question.explanation ?? ""}
            onChange={(event) => {
              const next = [...questions];
              next[index] = { ...question, explanation: event.target.value };
              onChange({ ...quiz, questions: next });
            }}
          />
        </div>
      ))}
      <button
        className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent"
        type="button"
        onClick={() => onChange({ ...quiz, questions: [...questions, emptyQuestion()] })}
      >
        Add question
      </button>
    </div>
  );
}

function AssignmentEditor({
  prefix,
  assignment,
  onChange,
}: {
  prefix: string;
  assignment: NonNullable<CourseLesson["assignment"]>;
  onChange: (assignment: NonNullable<CourseLesson["assignment"]>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-display text-lg text-ink">Assignment</h4>
        <p className="mt-1 text-sm text-muted">
          Brief and requirements. File drop-off waits on enrollment; the public page does not fake a submit.
        </p>
      </div>
      <FormTextArea
        label="Brief"
        name={`${prefix}-brief`}
        rows={5}
        hint="Separate paragraphs with a blank line. Same text marks as lesson text."
        value={(assignment.brief ?? []).join("\n\n")}
        onChange={(event) => onChange({ ...assignment, brief: paragraphsFromBody(event.target.value) })}
      />
      <FormTextArea
        label="Requirements"
        name={`${prefix}-reqs`}
        rows={4}
        hint="One requirement per line."
        value={(assignment.requirements ?? []).join("\n")}
        onChange={(event) =>
          onChange({
            ...assignment,
            requirements: event.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          })
        }
      />
      <FormSelect
        label="Expected hand-in"
        name={`${prefix}-submit`}
        value={assignment.submission}
        onChange={(event) =>
          onChange({ ...assignment, submission: event.target.value as NonNullable<CourseLesson["assignment"]>["submission"] })
        }
      >
        <option value="none">None yet</option>
        <option value="link">Link</option>
        <option value="file">File</option>
        <option value="text">Written answer</option>
      </FormSelect>
      <FormField
        label="Timing note"
        name={`${prefix}-due`}
        value={assignment.dueNote ?? ""}
        hint="Shown on the public lesson. Not a calendar due date."
        onChange={(event) => onChange({ ...assignment, dueNote: event.target.value })}
      />
    </div>
  );
}

function toEmbedUrlSafe(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return false;
  }
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(trimmed);
}

export function AdminCourseCurriculum({
  courseIndex,
  item,
  pending,
  openModule,
  openLesson,
  onOpenModule,
  onOpenLesson,
  onChange,
}: {
  courseIndex: number;
  item: Course;
  pending: boolean;
  openModule: number;
  openLesson: number;
  onOpenModule: (index: number) => void;
  onOpenLesson: (index: number) => void;
  onChange: (modules: CourseModule[]) => void;
}) {
  const modules = item.modules;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-xl text-ink">Curriculum</h3>
        <p className="mt-1 text-sm text-muted">
          Pick a lesson type, then add video, text, code, images, PDFs, a quiz, or an assignment.
        </p>
      </div>
      {modules.map((courseModule, moduleIndex) => {
        const expanded = openModule === moduleIndex;
        return (
          <div key={`module-${courseIndex}-${moduleIndex}`} className="space-y-4 rounded-2xl border border-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink">
                {courseModule.title.trim() || `Module ${moduleIndex + 1}`}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  className="cursor-pointer text-sm text-accent hover:text-accent-dark"
                  type="button"
                  onClick={() => {
                    onOpenModule(expanded ? -1 : moduleIndex);
                    onOpenLesson(-1);
                  }}
                >
                  {expanded ? "Collapse module" : "Edit module"}
                </button>
                <button
                  className="cursor-pointer text-sm text-muted hover:text-ink"
                  type="button"
                  onClick={() => {
                    onChange(modules.filter((_, current) => current !== moduleIndex));
                    onOpenModule(-1);
                    onOpenLesson(-1);
                  }}
                >
                  Remove module
                </button>
              </div>
            </div>
            {expanded ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Module title"
                    name={`module-title-${courseIndex}-${moduleIndex}`}
                    maxLength={160}
                    value={courseModule.title}
                    onChange={(event) =>
                      onChange(patchModule(modules, moduleIndex, { title: event.target.value }))
                    }
                  />
                  <FormField
                    label="Module summary"
                    name={`module-summary-${courseIndex}-${moduleIndex}`}
                    maxLength={400}
                    value={courseModule.summary ?? ""}
                    onChange={(event) =>
                      onChange(patchModule(modules, moduleIndex, { summary: event.target.value }))
                    }
                  />
                </div>
                {courseModule.lessons.map((lesson, lessonIndex) => {
                  const lessonOpen = openLesson === lessonIndex;
                  return (
                    <div
                      key={`lesson-${courseIndex}-${moduleIndex}-${lessonIndex}`}
                      className="space-y-4 rounded-2xl border border-line bg-paper/40 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-ink">
                          {lesson.title.trim() || `Lesson ${lessonIndex + 1}`}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <button
                            className="cursor-pointer text-sm text-accent hover:text-accent-dark"
                            type="button"
                            onClick={() => onOpenLesson(lessonOpen ? -1 : lessonIndex)}
                          >
                            {lessonOpen ? "Collapse lesson" : "Edit lesson"}
                          </button>
                          <button
                            className="cursor-pointer text-sm text-muted hover:text-ink"
                            type="button"
                            onClick={() => {
                              onChange(
                                patchModule(modules, moduleIndex, {
                                  lessons: courseModule.lessons.filter((_, current) => current !== lessonIndex),
                                }),
                              );
                              onOpenLesson(-1);
                            }}
                          >
                            Remove lesson
                          </button>
                        </div>
                      </div>
                      {lessonOpen ? (
                        <>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                              label="Lesson title"
                              name={`lesson-title-${courseIndex}-${moduleIndex}-${lessonIndex}`}
                              maxLength={160}
                              value={lesson.title}
                              onChange={(event) =>
                                onChange(
                                  patchModule(modules, moduleIndex, {
                                    lessons: patchLesson(courseModule.lessons, lessonIndex, {
                                      title: event.target.value,
                                    }),
                                  }),
                                )
                              }
                            />
                            <FormSelect
                              label="Lesson type"
                              name={`lesson-kind-${courseIndex}-${moduleIndex}-${lessonIndex}`}
                              value={lesson.kind ?? "text"}
                              onChange={(event) =>
                                onChange(
                                  patchModule(modules, moduleIndex, {
                                    lessons: patchLesson(courseModule.lessons, lessonIndex, {
                                      kind: event.target.value as CourseLesson["kind"],
                                      quiz: event.target.value === "quiz" ? (lesson.quiz ?? emptyQuiz()) : lesson.quiz,
                                      assignment:
                                        event.target.value === "assignment"
                                          ? (lesson.assignment ?? emptyAssignment())
                                          : lesson.assignment,
                                    }),
                                  }),
                                )
                              }
                            >
                              {courseLessonKinds.map((kind) => (
                                <option key={kind} value={kind}>
                                  {lessonKindLabel(kind)}
                                </option>
                              ))}
                            </FormSelect>
                            <FormField
                              label="Lesson summary"
                              name={`lesson-summary-${courseIndex}-${moduleIndex}-${lessonIndex}`}
                              maxLength={400}
                              value={lesson.summary}
                              onChange={(event) =>
                                onChange(
                                  patchModule(modules, moduleIndex, {
                                    lessons: patchLesson(courseModule.lessons, lessonIndex, {
                                      summary: event.target.value,
                                    }),
                                  }),
                                )
                              }
                            />
                          </div>
                          {lesson.kind === "video" ? (
                            <>
                              <FormField
                                label="YouTube or Vimeo URL"
                                name={`lesson-video-${courseIndex}-${moduleIndex}-${lessonIndex}`}
                                value={lesson.videoUrl ?? ""}
                                hint="Paste a watch URL, or upload an MP4 below."
                                onChange={(event) =>
                                  onChange(
                                    patchModule(modules, moduleIndex, {
                                      lessons: patchLesson(courseModule.lessons, lessonIndex, {
                                        videoUrl: event.target.value.trim() || null,
                                      }),
                                    }),
                                  )
                                }
                              />
                              <VideoPicker
                                label={`Lesson video · ${lesson.title.trim() || lessonIndex + 1}`}
                                hint="Optional MP4 or WebM."
                                value={toEmbedUrlSafe(lesson.videoUrl) ? null : (lesson.videoUrl ?? null)}
                                onChange={(url) =>
                                  onChange(
                                    patchModule(modules, moduleIndex, {
                                      lessons: patchLesson(courseModule.lessons, lessonIndex, { videoUrl: url }),
                                    }),
                                  )
                                }
                              />
                            </>
                          ) : null}
                          {lesson.kind === "text" ||
                          lesson.kind === "video" ||
                          lesson.kind === "code" ||
                          lesson.kind === "images" ||
                          lesson.kind === "pdf" ? (
                            <FormTextArea
                              label="Lesson text"
                              name={`lesson-body-${courseIndex}-${moduleIndex}-${lessonIndex}`}
                              rows={5}
                              hint="Blank line = new paragraph. Start with ## for a heading, - for a list, > for a callout. **bold** and `code` inline."
                              value={(lesson.body ?? []).join("\n\n")}
                              onChange={(event) =>
                                onChange(
                                  patchModule(modules, moduleIndex, {
                                    lessons: patchLesson(courseModule.lessons, lessonIndex, {
                                      body: paragraphsFromBody(event.target.value),
                                    }),
                                  }),
                                )
                              }
                            />
                          ) : null}
                          {lesson.kind === "code" || lesson.kind === "text" ? (
                            <SnippetRows
                              prefix={`snippet-${courseIndex}-${moduleIndex}-${lessonIndex}`}
                              items={lesson.codeSnippets ?? []}
                              onChange={(codeSnippets) =>
                                onChange(
                                  patchModule(modules, moduleIndex, {
                                    lessons: patchLesson(courseModule.lessons, lessonIndex, { codeSnippets }),
                                  }),
                                )
                              }
                            />
                          ) : null}
                          {lesson.kind === "images" || lesson.kind === "text" ? (
                            <ImagesPicker
                              urls={lesson.images ?? []}
                              disabled={pending}
                              onChange={(urls) =>
                                onChange(
                                  patchModule(modules, moduleIndex, {
                                    lessons: patchLesson(courseModule.lessons, lessonIndex, { images: urls }),
                                  }),
                                )
                              }
                            />
                          ) : null}
                          {lesson.kind === "pdf" ? (
                            <PdfRows
                              prefix={`pdf-${courseIndex}-${moduleIndex}-${lessonIndex}`}
                              items={lesson.pdfs ?? []}
                              pending={pending}
                              onChange={(pdfs) =>
                                onChange(
                                  patchModule(modules, moduleIndex, {
                                    lessons: patchLesson(courseModule.lessons, lessonIndex, { pdfs }),
                                  }),
                                )
                              }
                            />
                          ) : null}
                          {lesson.kind === "quiz" ? (
                            <QuizEditor
                              prefix={`quiz-${courseIndex}-${moduleIndex}-${lessonIndex}`}
                              quiz={lesson.quiz ?? emptyQuiz()}
                              onChange={(quiz) =>
                                onChange(
                                  patchModule(modules, moduleIndex, {
                                    lessons: patchLesson(courseModule.lessons, lessonIndex, { quiz }),
                                  }),
                                )
                              }
                            />
                          ) : null}
                          {lesson.kind === "assignment" ? (
                            <AssignmentEditor
                              prefix={`hw-${courseIndex}-${moduleIndex}-${lessonIndex}`}
                              assignment={lesson.assignment ?? emptyAssignment()}
                              onChange={(assignment) =>
                                onChange(
                                  patchModule(modules, moduleIndex, {
                                    lessons: patchLesson(courseModule.lessons, lessonIndex, { assignment }),
                                  }),
                                )
                              }
                            />
                          ) : null}
                          <LinkRows
                            label="Resources"
                            addLabel="Add resource"
                            prefix={`resource-${courseIndex}-${moduleIndex}-${lessonIndex}`}
                            items={lesson.resources ?? []}
                            onChange={(resources) =>
                              onChange(
                                patchModule(modules, moduleIndex, {
                                  lessons: patchLesson(courseModule.lessons, lessonIndex, { resources }),
                                }),
                              )
                            }
                          />
                          <LinkRows
                            label="Downloads"
                            addLabel="Add download"
                            prefix={`download-${courseIndex}-${moduleIndex}-${lessonIndex}`}
                            items={lesson.downloads ?? []}
                            onChange={(downloads) =>
                              onChange(
                                patchModule(modules, moduleIndex, {
                                  lessons: patchLesson(courseModule.lessons, lessonIndex, { downloads }),
                                }),
                              )
                            }
                          />
                        </>
                      ) : (
                        <p className="text-sm text-muted">
                          {lessonKindLabel(lesson.kind)}
                          {lesson.summary.trim() ? ` · ${lesson.summary.trim()}` : ""}
                        </p>
                      )}
                    </div>
                  );
                })}
                <button
                  className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent"
                  type="button"
                  onClick={() => {
                    onChange(
                      patchModule(modules, moduleIndex, {
                        lessons: [...courseModule.lessons, emptyLesson()],
                      }),
                    );
                    onOpenLesson(courseModule.lessons.length);
                  }}
                >
                  Add lesson
                </button>
              </>
            ) : (
              <p className="text-sm text-muted">
                {courseModule.summary?.trim() ||
                  `${courseModule.lessons.length} ${courseModule.lessons.length === 1 ? "lesson" : "lessons"}`}
              </p>
            )}
          </div>
        );
      })}
      <button
        className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent"
        type="button"
        onClick={() => {
          onChange([...modules, emptyModule()]);
          onOpenModule(modules.length);
          onOpenLesson(0);
        }}
      >
        Add module
      </button>
    </div>
  );
}
