import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { services } from "@/content/services";

export function ContactPage() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Field label="Name" name="name" required />
            <Field label="Email" name="email" type="email" required />
            <Field label="Phone" name="phone" />
            <Field label="Company" name="company" />
            <Field label="Subject" name="subject" required />
            <label className="block text-sm">
              <span className="text-ink">Service</span>
              <select
                name="service"
                className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3"
                defaultValue=""
              >
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service.slug} value={service.slug}>
                    {service.title}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Budget" name="budget" />
            <label className="block text-sm">
              <span className="text-ink">Message</span>
              <textarea
                name="message"
                required
                rows={6}
                className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3"
              />
            </label>
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

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3"
      />
    </label>
  );
}
