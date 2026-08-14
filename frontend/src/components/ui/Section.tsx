import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Container } from "@/components/ui/Container";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  to?: string;
  actionLabel?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  to,
  actionLabel = "View all",
}: SectionHeaderProps) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="flex items-center gap-2 text-xs tracking-[0.18em] text-accent uppercase">
          <span className="inline-block h-px w-6 bg-accent" />
          {eyebrow}
        </p>
        <h2 className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl">
          {title}
        </h2>
        {description ? <p className="mt-3 leading-7 text-ink-soft">{description}</p> : null}
      </div>
      {to ? (
        <Link
          to={to}
          className="text-sm text-accent transition hover:text-accent-dark"
        >
          {actionLabel} →
        </Link>
      ) : null}
    </div>
  );
}

type SectionProps = {
  children: ReactNode;
  className?: string;
};

export function Section({ children, className = "" }: SectionProps) {
  return (
    <section className={`py-16 sm:py-24 ${className}`.trim()}>
      <Container>{children}</Container>
    </section>
  );
}
