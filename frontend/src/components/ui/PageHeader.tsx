import { Link } from "react-router-dom";
import { Container } from "@/components/ui/Container";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { label: string; to: string };
};

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-surface">
      <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      <Container className="relative py-14 sm:py-20">
        {eyebrow ? (
          <p className="flex items-center gap-2 text-xs tracking-[0.18em] text-accent uppercase">
            <span className="inline-block h-px w-6 bg-accent" />
            {eyebrow}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl tracking-tight text-ink sm:text-5xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">{description}</p>
            ) : null}
          </div>
          {action ? (
            <Link to={action.to} className="text-sm text-accent hover:text-accent-dark">
              {action.label} →
            </Link>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
