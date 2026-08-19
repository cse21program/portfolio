import { useId, useState, type FormEvent } from "react";
import { FormField } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { apiPost } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors, validateEmail, validateName } from "@/lib/validation";

type NewsletterFields = "email" | "name";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const formId = useId();
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const {
    fieldErrors,
    formError,
    setFieldError,
    clearField,
    resetErrors,
    applyFieldErrors,
    applyCaughtError,
  } = useFormErrors<NewsletterFields>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "");
    const name = String(data.get("name") ?? "");
    resetErrors();

    const errors = collectErrors<NewsletterFields>({
      email: validateEmail(email),
      name: name.trim() ? validateName(name) : undefined,
    });
    if (applyFieldErrors(errors)) {
      return;
    }

    setPending(true);
    try {
      await apiPost("/newsletter", { email, name: name.trim() });
      form.reset();
      setDone(true);
    } catch (caught) {
      applyCaughtError(caught, "Could not subscribe");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-ink-soft" role="status">
        You're on the list.
      </p>
    );
  }

  return (
    <form className={compact ? "w-full max-w-md space-y-3" : "space-y-4"} onSubmit={handleSubmit} noValidate>
      <AuthError>{formError}</AuthError>
      {compact ? null : (
        <FormField
          id={`${formId}-name`}
          label="Name (optional)"
          name="name"
          autoComplete="name"
          error={fieldErrors.name}
          onChange={() => clearField("name")}
        />
      )}
      <div className={compact ? "flex flex-col gap-3 sm:flex-row sm:items-end" : "space-y-4"}>
        <div className="min-w-0 flex-1">
          <FormField
            id={`${formId}-email`}
            label="Newsletter email"
            name="email"
            type="email"
            autoComplete="email"
            error={fieldErrors.email}
            onChange={() => clearField("email")}
            onBlur={(event) => setFieldError("email", validateEmail(event.target.value))}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-accent disabled:opacity-60"
        >
          Subscribe
        </button>
      </div>
    </form>
  );
}
