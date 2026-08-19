import { FormField, FormSelect, FormTextArea } from "@/components/ui/FormField";
import { VideoPicker } from "@/features/about/MediaPicker";
import { ImagesPicker } from "@/features/projects/ImagesPicker";
import { emptySection, paragraphsFromBody, type Tutorial, type TutorialSection } from "@/types/tutorial";
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

function patchSection(sections: TutorialSection[], index: number, patch: Partial<TutorialSection>) {
  return sections.map((section, current) => (current === index ? { ...section, ...patch } : section));
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

export function AdminTutorialSections({
  tutorialIndex,
  item,
  pending,
  openSection,
  onOpenSection,
  onChange,
}: {
  tutorialIndex: number;
  item: Tutorial;
  pending: boolean;
  openSection: number;
  onOpenSection: (index: number) => void;
  onChange: (sections: TutorialSection[]) => void;
}) {
  const sections = item.sections;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-xl text-ink">Sections</h3>
        <p className="mt-1 text-sm text-muted">
          Topics, video, text, code, images, downloads, and resources for this walkthrough.
        </p>
      </div>
      {sections.map((section, sectionIndex) => {
        const expanded = openSection === sectionIndex;
        return (
          <div key={`section-${tutorialIndex}-${sectionIndex}`} className="space-y-4 rounded-2xl border border-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink">
                {section.title.trim() || `Section ${sectionIndex + 1}`}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  className="cursor-pointer text-sm text-accent hover:text-accent-dark"
                  type="button"
                  onClick={() => onOpenSection(expanded ? -1 : sectionIndex)}
                >
                  {expanded ? "Collapse section" : "Edit section"}
                </button>
                <button
                  className="cursor-pointer text-sm text-muted hover:text-ink"
                  type="button"
                  onClick={() => {
                    onChange(sections.filter((_, current) => current !== sectionIndex));
                    onOpenSection(-1);
                  }}
                >
                  Remove section
                </button>
              </div>
            </div>
            {expanded ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Section title"
                    name={`section-title-${tutorialIndex}-${sectionIndex}`}
                    maxLength={160}
                    value={section.title}
                    onChange={(event) =>
                      onChange(patchSection(sections, sectionIndex, { title: event.target.value }))
                    }
                  />
                  <FormField
                    label="Section summary"
                    name={`section-summary-${tutorialIndex}-${sectionIndex}`}
                    maxLength={400}
                    value={section.summary}
                    onChange={(event) =>
                      onChange(patchSection(sections, sectionIndex, { summary: event.target.value }))
                    }
                  />
                </div>
                <FormTextArea
                  label="Section text"
                  name={`section-body-${tutorialIndex}-${sectionIndex}`}
                  rows={5}
                  hint="Separate paragraphs with a blank line."
                  value={(section.body ?? []).join("\n\n")}
                  onChange={(event) =>
                    onChange(
                      patchSection(sections, sectionIndex, {
                        body: paragraphsFromBody(event.target.value),
                      }),
                    )
                  }
                />
                <FormField
                  label="YouTube or Vimeo URL"
                  name={`section-video-${tutorialIndex}-${sectionIndex}`}
                  value={section.videoUrl ?? ""}
                  hint="Paste a watch URL, or upload an MP4 below."
                  onChange={(event) =>
                    onChange(
                      patchSection(sections, sectionIndex, {
                        videoUrl: event.target.value.trim() || null,
                      }),
                    )
                  }
                />
                <VideoPicker
                  label={`Section video · ${section.title.trim() || sectionIndex + 1}`}
                  hint="Optional MP4 or WebM."
                  value={toEmbedUrlSafe(section.videoUrl) ? null : (section.videoUrl ?? null)}
                  onChange={(url) => onChange(patchSection(sections, sectionIndex, { videoUrl: url }))}
                />
                <ImagesPicker
                  urls={section.images ?? []}
                  disabled={pending}
                  onChange={(urls) => onChange(patchSection(sections, sectionIndex, { images: urls }))}
                />
                <SnippetRows
                  prefix={`snippet-${tutorialIndex}-${sectionIndex}`}
                  items={section.codeSnippets ?? []}
                  onChange={(codeSnippets) =>
                    onChange(patchSection(sections, sectionIndex, { codeSnippets }))
                  }
                />
                <LinkRows
                  label="Resources"
                  addLabel="Add resource"
                  prefix={`resource-${tutorialIndex}-${sectionIndex}`}
                  items={section.resources ?? []}
                  onChange={(resources) => onChange(patchSection(sections, sectionIndex, { resources }))}
                />
                <LinkRows
                  label="Downloads"
                  addLabel="Add download"
                  prefix={`download-${tutorialIndex}-${sectionIndex}`}
                  items={section.downloads ?? []}
                  onChange={(downloads) => onChange(patchSection(sections, sectionIndex, { downloads }))}
                />
              </>
            ) : (
              <p className="text-sm text-muted">{section.summary.trim() || "No summary yet."}</p>
            )}
          </div>
        );
      })}
      <button
        className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent"
        type="button"
        onClick={() => {
          onChange([...sections, emptySection()]);
          onOpenSection(sections.length);
        }}
      >
        Add section
      </button>
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
