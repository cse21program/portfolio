import { Link } from "react-router-dom";

export function ViewPageLink({ to, subject }: { to: string; subject: string }) {
  return (
    <Link
      to={to}
      aria-label={`View ${subject}`}
      className="mt-1 shrink-0 text-sm font-medium text-accent transition hover:text-accent-dark"
    >
      View →
    </Link>
  );
}
