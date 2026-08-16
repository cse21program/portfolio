import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: { label: string; to: string };
  children?: ReactNode;
};

export function EmptyState({ title, description, action, children }: EmptyStateProps) {
  return (
    <section className="rounded-3xl border border-dashed border-line bg-surface/70 px-6 py-10">
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <p className="mt-3 max-w-xl text-sm leading-7 text-ink-soft">{description}</p>
      {action ? (
        <Link
          to={action.to}
          className="mt-6 inline-flex rounded-full bg-ink px-4 py-2 text-sm text-paper hover:bg-accent"
        >
          {action.label}
        </Link>
      ) : null}
      {children}
    </section>
  );
}
