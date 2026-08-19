import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { FormField, FormSelect, FormTextArea } from "@/components/ui/FormField";
import { site } from "@/config/site";
import { AuthError } from "@/features/auth/AuthForm";
import { publishedServices, useServices } from "@/features/services/useServices";
import { apiPost } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import {
  collectErrors,
  validateEmail,
  validateMessage,
  validateName,
  validatePhone,
  validateSubject,
} from "@/lib/validation";

type ContactFields = "name" | "email" | "phone" | "subject" | "message" | "file";

function FileField({ error }: { error?: string }) {
  const [fileName, setFileName] = useState("");

  return (
    <div className="block text-sm">
      <label className="text-ink" htmlFor="file">
        Attachment
      </label>
      <label
        htmlFor="file"
        className={`mt-2 flex min-h-24 cursor-pointer flex-col items-start justify-center rounded-2xl border border-dashed px-4 py-4 transition hover:border-accent/50 ${
          error ? "border-accent bg-accent/5" : "border-line bg-paper/50"
        }`}
      >
        <span className="font-medium text-ink">{fileName || "Attach a PDF or image"}</span>
        <span className="mt-1 text-muted">Optional · JPEG, PNG, WebP, GIF, or PDF · 5 MB</span>
        <input
          id="file"
          name="file"
          type="file"
          className="sr-only"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
        />
      </label>
      {error ? (
        <span id="file-error" className="mt-1.5 block text-accent" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function ContactPage() {
  const [searchParams] = useSearchParams();
  const defaultSubject = searchParams.get("subject") ?? "";
  const defaultService = searchParams.get("service") ?? "";
  const { services } = useServices();
  const catalog = publishedServices(services);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const {
    fieldErrors,
    formError,
    setFieldError,
    clearField,
    resetErrors,
    applyFieldErrors,
    applyCaughtError,
  } = useFormErrors<ContactFields>();

  useEffect(() => {
    const previous = document.title;
    document.title = `Hire me — ${site.name}`;
    return () => {
      document.title = previous;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    resetErrors();

    const errors = collectErrors<ContactFields>({
      name: validateName(String(data.get("name") ?? "")),
      email: validateEmail(String(data.get("email") ?? "")),
      phone: validatePhone(String(data.get("phone") ?? "")),
      subject: validateSubject(String(data.get("subject") ?? "")),
      message: validateMessage(String(data.get("message") ?? "")),
    });

    if (applyFieldErrors(errors)) {
      return;
    }

    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      company: String(data.get("company") ?? ""),
      subject: String(data.get("subject") ?? ""),
      serviceSlug: String(data.get("service") ?? ""),
      budget: String(data.get("budget") ?? ""),
      message: String(data.get("message") ?? ""),
    };

    setPending(true);
    try {
      if (file instanceof File && file.size > 0) {
        const body = new FormData();
        for (const [key, value] of Object.entries(payload)) {
          body.append(key, value);
        }
        body.append("file", file);
        await apiPost("/contact", body);
      } else {
        await apiPost("/contact", payload);
      }
      setSent(true);
    } catch (caught) {
      applyCaughtError(caught, "Could not send that message");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
        <Container className="relative py-14 sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1 text-xs tracking-[0.16em] text-accent uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Contact
          </p>
          <h1 className="mt-5 font-display text-4xl tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Hire me
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">
            Send a brief: the system, the constraint, and the outcome. I reply from {site.email}. Catalog
            requests with packages live on Services.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink to="/services" variant="secondary">
              View services
            </ButtonLink>
            <p className="text-sm text-muted">{site.availability}</p>
          </div>
        </Container>
      </section>

      <section className="border-b border-line bg-paper-muted/35 py-12 sm:py-16">
        <Container>
          {sent ? (
            <div className="mx-auto max-w-2xl rounded-[1.75rem] border border-line bg-surface p-8 sm:p-10">
              <p className="text-xs tracking-[0.16em] text-accent uppercase">Received</p>
              <h2 className="mt-3 font-display text-3xl text-ink">I have the message</h2>
              <p className="mt-3 leading-7 text-ink-soft">
                Thanks. I will read the brief and reply from this address. If the work matches a published
                package, you can also request it from the catalog after you sign in.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink to="/services">Browse services</ButtonLink>
                <ButtonLink to="/" variant="secondary">
                  Back home
                </ButtonLink>
              </div>
            </div>
          ) : (
            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_18.5rem]">
              <form
                className="rounded-[1.75rem] border border-line bg-surface p-6 shadow-[0_1px_0_rgb(26_22_18/0.04)] sm:p-8"
                onSubmit={(event) => void handleSubmit(event)}
                noValidate
              >
                <div className="space-y-5">
                  <div>
                    <p className="text-xs tracking-[0.16em] text-muted uppercase">Who you are</p>
                    <div className="mt-4 grid gap-5 sm:grid-cols-2">
                      <FormField
                        label="Name"
                        name="name"
                        autoComplete="name"
                        error={fieldErrors.name}
                        onChange={() => clearField("name")}
                        onBlur={(event) => setFieldError("name", validateName(event.target.value))}
                      />
                      <FormField
                        label="Email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        error={fieldErrors.email}
                        onChange={() => clearField("email")}
                        onBlur={(event) => setFieldError("email", validateEmail(event.target.value))}
                      />
                      <FormField
                        label="Phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        hint="Optional"
                        error={fieldErrors.phone}
                        onChange={() => clearField("phone")}
                        onBlur={(event) => setFieldError("phone", validatePhone(event.target.value))}
                      />
                      <FormField label="Company" name="company" autoComplete="organization" hint="Optional" />
                    </div>
                  </div>

                  <div className="border-t border-line pt-6">
                    <p className="text-xs tracking-[0.16em] text-muted uppercase">The brief</p>
                    <div className="mt-4 space-y-5">
                      <FormField
                        label="Subject"
                        name="subject"
                        defaultValue={defaultSubject}
                        error={fieldErrors.subject}
                        onChange={() => clearField("subject")}
                        onBlur={(event) => setFieldError("subject", validateSubject(event.target.value))}
                      />
                      <div className="grid gap-5 sm:grid-cols-2">
                        <FormSelect label="Service" name="service" defaultValue={defaultService} hint="Optional">
                          <option value="">General inquiry</option>
                          {catalog.map((service) => (
                            <option key={service.slug} value={service.slug}>
                              {service.title}
                            </option>
                          ))}
                        </FormSelect>
                        <FormField label="Budget" name="budget" hint="Optional" />
                      </div>
                      <FormTextArea
                        label="Message"
                        name="message"
                        rows={7}
                        hint="System, deadline, and outcome — at least 20 characters"
                        error={fieldErrors.message}
                        onChange={() => clearField("message")}
                        onBlur={(event) => setFieldError("message", validateMessage(event.target.value))}
                      />
                    </div>
                  </div>

                  <div className="border-t border-line pt-6">
                    <FileField error={fieldErrors.file} />
                  </div>
                </div>

                {formError ? (
                  <div className="mt-6">
                    <AuthError>{formError}</AuthError>
                  </div>
                ) : null}

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:opacity-60"
                    disabled={pending}
                  >
                    {pending ? "Sending…" : "Send message"}
                  </button>
                  <p className="text-sm text-muted">No account required.</p>
                </div>
              </form>

              <aside className="space-y-5 lg:sticky lg:top-8">
                <div className="rounded-[1.75rem] border border-line bg-surface p-6">
                  <p className="text-xs tracking-[0.16em] text-muted uppercase">Working together</p>
                  <dl className="mt-4 space-y-4 text-sm">
                    <div>
                      <dt className="text-muted">Availability</dt>
                      <dd className="mt-1 text-ink">{site.availability}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Based in</dt>
                      <dd className="mt-1 text-ink">{site.location}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Direct email</dt>
                      <dd className="mt-1">
                        <a className="text-accent hover:text-accent-dark" href={`mailto:${site.email}`}>
                          {site.email}
                        </a>
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-[1.75rem] border border-line bg-surface p-6">
                  <p className="text-xs tracking-[0.16em] text-muted uppercase">What happens next</p>
                  <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-ink-soft">
                    <li>I read the brief and reply from this address.</li>
                    <li>If it is a catalog package, we can move it to a signed-in request.</li>
                    <li>Scope, timeline, and commercial terms stay off this form.</li>
                  </ol>
                  <p className="mt-5 text-sm">
                    <Link to="/services" className="font-medium text-accent hover:text-accent-dark">
                      Open the service catalog →
                    </Link>
                  </p>
                </div>
              </aside>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
