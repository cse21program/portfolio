import { hasIntroVideo, IntroVideo } from "@/features/about/IntroVideo";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

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

export function SkillLead({
  back,
  field,
  trail,
}: {
  back: { label: string; to: string };
  field: { label: string; to: string };
  trail: Array<{ label: string; to?: string }>;
}) {
  return (
    <div>
      <nav aria-label="Breadcrumb" className="sr-only">
        <ol>
          {trail.map((item, index) => {
            const last = index === trail.length - 1;
            return (
              <li key={`${item.label}-${index}`}>
                {last || !item.to ? (
                  <span aria-current={last ? "page" : undefined}>{item.label}</span>
                ) : (
                  <Link to={item.to}>{item.label}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={back.to}
          className="inline-flex items-center gap-2 text-sm font-medium text-accent transition hover:text-accent-dark"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
            <path
              d="M10.5 3.5 5 8l5.5 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {back.label}
        </Link>
        <span className="hidden h-4 w-px bg-line sm:block" aria-hidden="true" />
        <Link
          to={field.to}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1 text-xs tracking-[0.16em] text-accent uppercase transition hover:border-accent hover:text-accent-dark"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          {field.label}
        </Link>
      </div>
    </div>
  );
}

export function KnowledgeVideo({
  embedUrl,
  fileUrl,
  poster,
  title,
}: {
  embedUrl?: string | null;
  fileUrl?: string | null;
  poster?: string | null;
  title: string;
}) {
  if (!hasIntroVideo(embedUrl ?? null, fileUrl ?? null)) {
    return null;
  }

  return (
    <IntroVideo
      embedUrl={embedUrl ?? null}
      fileUrl={fileUrl ?? null}
      poster={poster}
      title={title}
    />
  );
}
