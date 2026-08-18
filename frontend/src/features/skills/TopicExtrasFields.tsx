import type { ReactNode } from "react";
import { FormField, FormSelect, FormTextArea } from "@/components/ui/FormField";
import type { KnowledgeTopic } from "@/types/topics";

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

function StudioBlock({
  title,
  hint,
  count,
  children,
}: {
  title: string;
  hint: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-line bg-paper/50 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-ink">{title}</h3>
          <p className="mt-1 text-sm text-muted">{hint}</p>
        </div>
        {count !== undefined ? (
          <p className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
            {count}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent"
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="cursor-pointer text-sm text-muted hover:text-ink"
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function TopicExtrasFields({
  item,
  index,
  onPatch,
}: {
  item: KnowledgeTopic;
  index: number;
  onPatch: (patch: Partial<KnowledgeTopic>) => void;
}) {
  const snippets = item.codeSnippets ?? [];
  const resources = item.resources ?? [];
  const links = item.externalLinks ?? [];
  const seoTitle = item.seoTitle?.trim() || item.title.trim() || "Untitled topic";
  const seoDescription = item.seoDescription?.trim() || item.summary.trim();
  const path =
    item.skillSlug && item.slug ? `/topics/${item.skillSlug}/${item.slug}` : "/topics/skill/your-slug";

  return (
    <div className="space-y-4">
      <StudioBlock
        title="Code"
        hint="Short examples that appear on the topic page. Empty snippets are dropped on publish."
        count={snippets.length}
      >
        {snippets.length === 0 ? (
          <p className="text-sm text-ink-soft">No snippets yet.</p>
        ) : (
          <ul className="space-y-3">
            {snippets.map((snippet, snippetIndex) => (
              <li
                key={`snippet-${index}-${snippetIndex}`}
                className="space-y-4 rounded-2xl border border-line bg-surface p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">
                    {snippet.label.trim() || `Snippet ${snippetIndex + 1}`}
                  </p>
                  <RemoveButton
                    label="Remove snippet"
                    onClick={() =>
                      onPatch({
                        codeSnippets: snippets.filter((_, current) => current !== snippetIndex),
                      })
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Title"
                    name={`snippet-label-${index}-${snippetIndex}`}
                    placeholder="Record example"
                    value={snippet.label}
                    onChange={(event) => {
                      const next = [...snippets];
                      next[snippetIndex] = { ...snippet, label: event.target.value };
                      onPatch({ codeSnippets: next });
                    }}
                  />
                  <FormSelect
                    label="Language"
                    name={`snippet-lang-${index}-${snippetIndex}`}
                    value={snippet.language.trim() || "text"}
                    onChange={(event) => {
                      const next = [...snippets];
                      next[snippetIndex] = { ...snippet, language: event.target.value };
                      onPatch({ codeSnippets: next });
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
                  name={`snippet-code-${index}-${snippetIndex}`}
                  rows={6}
                  placeholder="Paste the example visitors should see."
                  value={snippet.code}
                  onChange={(event) => {
                    const next = [...snippets];
                    next[snippetIndex] = { ...snippet, code: event.target.value };
                    onPatch({ codeSnippets: next });
                  }}
                />
              </li>
            ))}
          </ul>
        )}
        <AddButton
          label="Add snippet"
          onClick={() =>
            onPatch({
              codeSnippets: [...snippets, { label: "", language: "text", code: "" }],
            })
          }
        />
      </StudioBlock>

      <StudioBlock
        title="Resources"
        hint="Docs, articles, or files worth keeping next to the lesson."
        count={resources.length}
      >
        {resources.length === 0 ? (
          <p className="text-sm text-ink-soft">No resources yet.</p>
        ) : (
          <ul className="space-y-3">
            {resources.map((link, linkIndex) => (
              <li
                key={`resource-${index}-${linkIndex}`}
                className="space-y-4 rounded-2xl border border-line bg-surface p-4"
              >
                <div className="flex justify-end">
                  <RemoveButton
                    label="Remove resource"
                    onClick={() =>
                      onPatch({
                        resources: resources.filter((_, current) => current !== linkIndex),
                      })
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Name"
                    name={`resource-label-${index}-${linkIndex}`}
                    placeholder="Oracle OOP concepts"
                    value={link.label}
                    onChange={(event) => {
                      const next = [...resources];
                      next[linkIndex] = { ...link, label: event.target.value };
                      onPatch({ resources: next });
                    }}
                  />
                  <FormField
                    label="URL"
                    name={`resource-url-${index}-${linkIndex}`}
                    placeholder="https://"
                    value={link.url}
                    onChange={(event) => {
                      const next = [...resources];
                      next[linkIndex] = { ...link, url: event.target.value };
                      onPatch({ resources: next });
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <AddButton
          label="Add resource"
          onClick={() => onPatch({ resources: [...resources, { label: "", url: "" }] })}
        />
      </StudioBlock>

      <StudioBlock
        title="Links"
        hint="Other pages that are not a resource: repos, talks, or references."
        count={links.length}
      >
        {links.length === 0 ? (
          <p className="text-sm text-ink-soft">No extra links yet.</p>
        ) : (
          <ul className="space-y-3">
            {links.map((link, linkIndex) => (
              <li
                key={`link-${index}-${linkIndex}`}
                className="space-y-4 rounded-2xl border border-line bg-surface p-4"
              >
                <div className="flex justify-end">
                  <RemoveButton
                    label="Remove link"
                    onClick={() =>
                      onPatch({
                        externalLinks: links.filter((_, current) => current !== linkIndex),
                      })
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Name"
                    name={`link-label-${index}-${linkIndex}`}
                    placeholder="GitHub example"
                    value={link.label}
                    onChange={(event) => {
                      const next = [...links];
                      next[linkIndex] = { ...link, label: event.target.value };
                      onPatch({ externalLinks: next });
                    }}
                  />
                  <FormField
                    label="URL"
                    name={`link-url-${index}-${linkIndex}`}
                    placeholder="https://"
                    value={link.url}
                    onChange={(event) => {
                      const next = [...links];
                      next[linkIndex] = { ...link, url: event.target.value };
                      onPatch({ externalLinks: next });
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <AddButton
          label="Add link"
          onClick={() => onPatch({ externalLinks: [...links, { label: "", url: "" }] })}
        />
      </StudioBlock>

      <StudioBlock
        title="Search listing"
        hint="Browser tab and search results. Leave blank to use the topic title and summary."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="SEO title"
            name={`seoTitle-${index}`}
            maxLength={80}
            hint={`${(item.seoTitle ?? "").length}/80`}
            value={item.seoTitle ?? ""}
            onChange={(event) => onPatch({ seoTitle: event.target.value })}
          />
          <FormTextArea
            label="SEO description"
            name={`seoDescription-${index}`}
            rows={3}
            maxLength={200}
            hint={`${(item.seoDescription ?? "").length}/200`}
            value={item.seoDescription ?? ""}
            onChange={(event) => onPatch({ seoDescription: event.target.value })}
          />
        </div>
        <div className="rounded-2xl border border-line bg-surface px-4 py-3">
          <p className="text-xs tracking-[0.14em] text-muted uppercase">Preview</p>
          <p className="mt-2 truncate text-xs text-accent">{path}</p>
          <p className="mt-1 font-display text-lg text-ink">{seoTitle}</p>
          {seoDescription ? (
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-soft">{seoDescription}</p>
          ) : (
            <p className="mt-1 text-sm text-muted">Add a summary or SEO description to fill this line.</p>
          )}
        </div>
      </StudioBlock>
    </div>
  );
}
