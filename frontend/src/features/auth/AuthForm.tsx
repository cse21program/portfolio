import type { ReactNode } from "react";

export { FormField as AuthField } from "@/components/ui/FormField";

export function AuthError({ children }: { children: ReactNode }) {
  if (!children) {
    return null;
  }

  return (
    <p className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent" role="alert">
      {children}
    </p>
  );
}

export function AuthSubmit({
  children,
  pending,
}: {
  children: ReactNode;
  pending?: boolean;
}) {
  return (
    <button
      className="w-full rounded-full bg-ink py-3 text-sm text-paper hover:bg-accent disabled:opacity-60"
      type="submit"
      disabled={pending}
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}
