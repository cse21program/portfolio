import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { FormField, FormSelect, FormTextArea } from "@/components/ui/FormField";
import { services } from "@/content/services";
import { useFormErrors } from "@/lib/useFormErrors";
import {
  collectErrors,
  validateEmail,
  validateMessage,
  validateName,
  validatePhone,
  validateSubject,
} from "@/lib/validation";

type ContactFields = "name" | "email" | "phone" | "subject" | "message";

export function ContactPage() {
  const [searchParams] = useSearchParams();
  const defaultSubject = searchParams.get("subject") ?? "";
  const [sent, setSent] = useState(false);
  const {
    fieldErrors,
    setFieldError,
    clearField,
    resetErrors,
    applyFieldErrors,
  } = useFormErrors<ContactFields>();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    resetErrors();

    const errors = collectErrors<ContactFields>({
      name: validateName(String(form.get("name"))),
      email: validateEmail(String(form.get("email"))),
      phone: validatePhone(String(form.get("phone"))),
      subject: validateSubject(String(form.get("subject"))),
      message: validateMessage(String(form.get("message"))),
    });

    if (applyFieldErrors(errors)) {
      return;
    }

    setSent(true);
  }

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Hire me"
        description="This form is static for now. Messages will later land in the admin inbox."
      />
      <Container className="max-w-2xl py-16">
        {sent ? (
          <p className="rounded-2xl border border-line bg-surface p-6 text-ink-soft">
            Thanks. In the dynamic version this becomes a lead with status tracking. For now,
            email directly if it is urgent.
          </p>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
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
            <FormField
              label="Company"
              name="company"
              autoComplete="organization"
            />
            <FormField
              label="Subject"
              name="subject"
              defaultValue={defaultSubject}
              error={fieldErrors.subject}
              onChange={() => clearField("subject")}
              onBlur={(event) => setFieldError("subject", validateSubject(event.target.value))}
            />
            <FormSelect label="Service" name="service" defaultValue="">
              <option value="">Select a service</option>
              {services.map((service) => (
                <option key={service.slug} value={service.slug}>
                  {service.title}
                </option>
              ))}
            </FormSelect>
            <FormField label="Budget" name="budget" />
            <FormTextArea
              label="Message"
              name="message"
              rows={6}
              hint="At least 20 characters"
              error={fieldErrors.message}
              onChange={() => clearField("message")}
              onBlur={(event) => setFieldError("message", validateMessage(event.target.value))}
            />
            <button
              type="submit"
              className="rounded-full bg-ink px-5 py-3 text-sm text-paper"
            >
              Send message
            </button>
          </form>
        )}
      </Container>
    </>
  );
}
