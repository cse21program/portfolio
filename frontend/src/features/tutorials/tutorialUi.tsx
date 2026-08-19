import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { site } from "@/config/site";
import { accessLabel, formatTutorialDate, type Tutorial } from "@/types/tutorial";

export function Chip({
  children,
  accent = false,
}: {
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs ${
        accent
          ? "border-accent/25 bg-accent/10 text-accent-dark"
          : "border-line bg-paper text-ink-soft"
      }`}
    >
      {children}
    </span>
  );
}

export function ActionButton({
  children,
  onClick,
  primary = false,
}: {
  children: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition ${
        primary
          ? "bg-ink text-paper hover:bg-accent"
          : "border border-line bg-surface text-ink hover:border-accent/40"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function TutorialByline({ tutorial }: { tutorial: Tutorial }) {
  const date = formatTutorialDate(tutorial.publishedAt ?? "");
  const length = `${tutorial.sections.length} ${tutorial.sections.length === 1 ? "section" : "sections"}`;
  const meta = [date, tutorial.duration, length].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper font-display text-sm text-ink">
        RK
      </span>
      <div>
        <p className="font-medium text-ink">{site.name}</p>
        {meta ? <p>{meta}</p> : null}
      </div>
    </div>
  );
}

export function TutorialCard({
  tutorial,
  featured = false,
}: {
  tutorial: Tutorial;
  featured?: boolean;
}) {
  const image = tutorial.thumbnailUrl?.trim() || null;
  const wide = featured && Boolean(image);
  const access = accessLabel(tutorial);

  return (
    <Link
      to={`/tutorials/${tutorial.slug}`}
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
          {featured ? <Chip accent>Latest</Chip> : null}
          <Chip accent={!featured}>{access}</Chip>
          {tutorial.difficulty ? <Chip>{tutorial.difficulty}</Chip> : null}
          {tutorial.skill ? <Chip>{tutorial.skill}</Chip> : null}
        </div>
        <h2
          className={`mt-5 font-display tracking-tight text-ink transition group-hover:text-accent-dark ${
            featured ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
          }`}
        >
          {tutorial.title}
        </h2>
        <p className="mt-3 flex-1 text-base leading-8 text-ink-soft">{tutorial.description}</p>
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {[tutorial.duration, `${tutorial.sections.length} sections`].filter(Boolean).join(" · ")}
          </p>
          <p className="text-sm font-medium text-accent group-hover:text-accent-dark">Open tutorial →</p>
        </div>
      </div>
    </Link>
  );
}

export function CodeBlock({
  label,
  language,
  code,
}: {
  label: string;
  language: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);
  const title = label.trim() || "Snippet";

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper/70 px-4 py-2">
        <p className="text-sm text-ink">{title}</p>
        <div className="flex items-center gap-3">
          <p className="text-xs tracking-[0.14em] text-muted uppercase">{language}</p>
          <button
            type="button"
            className="cursor-pointer text-xs font-medium text-accent hover:text-accent-dark"
            onClick={() => void copyCode()}
          >
            {copied ? "Copied" : "Copy code"}
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto bg-ink px-4 py-4 text-sm leading-7 text-paper">
        <code>{code}</code>
      </pre>
    </div>
  );
}
