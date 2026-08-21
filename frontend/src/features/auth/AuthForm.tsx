import { useState, type InputHTMLAttributes, type ReactNode } from "react";

const inputClass = (error?: string) =>
  `w-full rounded-xl border bg-paper px-3.5 py-[0.85rem] text-[15px] text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.6)] outline-none transition duration-200 placeholder:italic placeholder:text-muted/55 ${
    error
      ? "border-accent ring-2 ring-accent/15"
      : "border-line hover:border-ink/25 focus:border-accent focus:bg-paper focus:ring-2 focus:ring-accent/15"
  }`;

function FieldShell({
  label,
  htmlFor,
  error,
  hint,
  action,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="block">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-ink" htmlFor={htmlFor}>
          {label}
        </label>
        {action}
      </div>
      <div className="mt-1.5">{children}</div>
      {error || hint ? (
        <p
          id={error ? `${htmlFor}-error` : `${htmlFor}-hint`}
          className={`mt-1.5 text-sm leading-5 ${error ? "text-accent" : "text-muted"}`}
          role={error ? "alert" : undefined}
        >
          {error ?? hint}
        </p>
      ) : null}
    </div>
  );
}

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  action?: ReactNode;
};

export function AuthField({ label, error, hint, action, id, name, className, ...props }: AuthFieldProps) {
  const fieldId = id ?? name ?? label.toLowerCase().replace(/\s+/g, "-");
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint} action={action}>
      <input
        {...props}
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={className ?? inputClass(error)}
      />
    </FieldShell>
  );
}

export function AuthPasswordField({
  label,
  error,
  hint,
  action,
  id,
  name,
  className,
  ...props
}: AuthFieldProps) {
  const [visible, setVisible] = useState(false);
  const fieldId = id ?? name ?? label.toLowerCase().replace(/\s+/g, "-");
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint} action={action}>
      <div className="relative">
        <input
          {...props}
          id={fieldId}
          name={name}
          type={visible ? "text" : "password"}
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={className ?? `${inputClass(error)} pr-12`}
        />
        <button
          type="button"
          className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-muted transition hover:text-ink"
          onClick={() => setVisible((open) => !open)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </FieldShell>
  );
}

export function AuthError({ children }: { children: ReactNode }) {
  if (!children) {
    return null;
  }

  return (
    <p
      className="rounded-xl border border-accent/20 bg-accent/5 px-3.5 py-3 text-sm leading-6 text-accent"
      role="alert"
    >
      {children}
    </p>
  );
}

export function AuthSubmit({
  children,
  pending,
  pendingLabel = "Please wait…",
}: {
  children: ReactNode;
  pending?: boolean;
  pendingLabel?: string;
}) {
  return (
    <button
      className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-medium tracking-wide text-paper transition duration-200 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
      type="submit"
      disabled={pending}
    >
      {pending ? pendingLabel : children}
      {pending ? null : <AuthSubmitMark />}
    </button>
  );
}

function AuthSubmitMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M3 8h10M9.5 4.5 13 8l-3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
