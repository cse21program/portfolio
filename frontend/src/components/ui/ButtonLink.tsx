import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type ButtonLinkProps = {
  to: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  external?: boolean;
};

const styles = {
  primary:
    "bg-ink text-paper shadow-sm hover:bg-accent hover:shadow-md",
  secondary:
    "border border-line bg-surface/80 text-ink hover:border-accent/40 hover:bg-surface",
  ghost: "text-ink-soft hover:text-accent",
};

export function ButtonLink({
  to,
  children,
  variant = "primary",
  external = false,
}: ButtonLinkProps) {
  const className = `inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium transition duration-200 ${styles[variant]}`;

  if (external) {
    return (
      <a href={to} className={className} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}
