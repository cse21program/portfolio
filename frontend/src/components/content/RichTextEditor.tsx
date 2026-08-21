import { useRef, type TextareaHTMLAttributes } from "react";

const inputClass = (error?: string) =>
  `mt-2 w-full rounded-xl border bg-surface px-4 py-3 font-mono text-sm outline-none ${
    error ? "border-accent" : "border-line focus:border-accent"
  }`;

function ToolButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded-full border border-line px-2.5 py-1 text-xs text-ink hover:border-accent"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function replaceSelection(
  field: HTMLTextAreaElement,
  before: string,
  after: string,
  placeholder: string,
  onChange: (value: string) => void,
) {
  const start = field.selectionStart;
  const end = field.selectionEnd;
  const selected = field.value.slice(start, end) || placeholder;
  const next = `${field.value.slice(0, start)}${before}${selected}${after}${field.value.slice(end)}`;
  onChange(next);
  const cursor = start + before.length + selected.length + after.length;
  requestAnimationFrame(() => {
    field.focus();
    field.setSelectionRange(cursor, cursor);
  });
}

export function RichTextEditor({
  label,
  name,
  value,
  onChange,
  error,
  hint,
  rows = 8,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  rows?: number;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value" | "name">) {
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;

  function apply(before: string, after = "", placeholder = "") {
    const field = fieldRef.current;
    if (!field) {
      onChange(`${value}${value ? "\n\n" : ""}${before}${placeholder}${after}`);
      return;
    }
    replaceSelection(field, before, after, placeholder, onChange);
  }

  function applyBlock(block: string) {
    const field = fieldRef.current;
    const prefix = value && !value.endsWith("\n\n") ? "\n\n" : "";
    if (!field) {
      onChange(`${value}${prefix}${block}`);
      return;
    }
    const start = field.selectionStart;
    const next = `${field.value.slice(0, start)}${prefix}${block}${field.value.slice(start)}`;
    onChange(next);
  }

  return (
    <div className="block text-sm">
      <label className="text-ink" htmlFor={name}>
        {label}
      </label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <ToolButton label="Heading" onClick={() => apply("## ", "", "Heading")} />
        <ToolButton label="List" onClick={() => apply("- ", "", "Item")} />
        <ToolButton label="Quote" onClick={() => apply("> ", "", "Quoted line")} />
        <ToolButton
          label="Code"
          onClick={() => applyBlock("```ts\nconst ready = true;\n```")}
        />
        <ToolButton label="Link" onClick={() => apply("[", "](https://)", "Label")} />
        <ToolButton label="Image" onClick={() => apply("![", "](/images/example.png)", "Alt text")} />
        <ToolButton
          label="Table"
          onClick={() => applyBlock("| Column | Column |\n| --- | --- |\n| Value | Value |")}
        />
        <ToolButton
          label="Video"
          onClick={() => applyBlock("https://www.youtube.com/watch?v=dQw4w9WgXcQ")}
        />
      </div>
      <textarea
        ref={fieldRef}
        id={name}
        name={name}
        rows={rows}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={inputClass(error)}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <span id={`${name}-error`} className="mt-1.5 block text-accent" role="alert">
          {error}
        </span>
      ) : (
        <span id={`${name}-hint`} className="mt-1.5 block text-muted">
          {hint ??
            "Headings, lists, quotes, tables, fenced code, [links](url), ![images](url), and a YouTube or Vimeo URL on its own line."}
        </span>
      )}
    </div>
  );
}
