import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const inputClass = (error?: string) =>
  `mt-2 w-full rounded-xl border bg-surface px-4 py-3 outline-none ${
    error ? "border-accent" : "border-line focus:border-accent"
  }`;

function FieldShell({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="block text-sm">
      <label className="text-ink" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <span id={`${htmlFor}-error`} className="mt-1.5 block text-accent" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span id={`${htmlFor}-hint`} className="mt-1.5 block text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function FormField({ label, error, hint, id, name, className, ...props }: FormFieldProps) {
  const fieldId = id ?? name ?? label.toLowerCase().replace(/\s+/g, "-");
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint}>
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

type FormTextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function FormTextArea({
  label,
  error,
  hint,
  id,
  name,
  className,
  ...props
}: FormTextAreaProps) {
  const fieldId = id ?? name ?? label.toLowerCase().replace(/\s+/g, "-");
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint}>
      <textarea
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

type FormSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function FormSelect({
  label,
  error,
  hint,
  id,
  name,
  className,
  children,
  ...props
}: FormSelectProps) {
  const fieldId = id ?? name ?? label.toLowerCase().replace(/\s+/g, "-");
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint}>
      <select
        {...props}
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={className ?? inputClass(error)}
      >
        {children}
      </select>
    </FieldShell>
  );
}
