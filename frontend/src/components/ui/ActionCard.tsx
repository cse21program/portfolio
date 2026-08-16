import { Link } from "react-router-dom";

type ActionCardProps = {
  to: string;
  eyebrow?: string;
  title: string;
  description: string;
  actionLabel?: string;
};

export function ActionCard({
  to,
  eyebrow,
  title,
  description,
  actionLabel = "Open",
}: ActionCardProps) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-3xl border border-line bg-surface p-6 shadow-[0_1px_0_rgb(26_22_18/0.04)] transition hover:border-accent/40"
    >
      {eyebrow ? (
        <p className="text-xs tracking-[0.16em] text-muted uppercase">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 font-display text-2xl text-ink">{title}</h2>
      <p className="mt-3 flex-1 text-sm leading-7 text-ink-soft">{description}</p>
      <p className="mt-5 text-sm text-accent group-hover:text-accent-dark">{actionLabel} →</p>
    </Link>
  );
}
