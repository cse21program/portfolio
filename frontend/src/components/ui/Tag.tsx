import type { ReactNode } from "react";

type TagProps = {
  children: ReactNode;
};

export function Tag({ children }: TagProps) {
  return (
    <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs tracking-wide text-ink-soft">
      {children}
    </span>
  );
}
