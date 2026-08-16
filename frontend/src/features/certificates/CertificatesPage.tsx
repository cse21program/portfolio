import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { certificates } from "@/content/certificates";

export function CertificatesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Certificates"
        title="Credentials"
        description="Certificates linked to skills. Images, PDFs, and verification URLs will attach from the CMS later."
      />
      <Container className="grid gap-4 py-16 md:grid-cols-2">
        {certificates.map((item) => (
          <article key={item.slug} className="rounded-2xl border border-line bg-surface p-6">
            <p className="text-xs tracking-wide text-accent uppercase">{item.organization}</p>
            <h2 className="mt-2 font-display text-2xl text-ink">{item.title}</h2>
            <p className="mt-2 text-sm text-muted">
              {item.issueDate} · {item.skill}
            </p>
            <p className="mt-4 text-sm leading-6 text-ink-soft">{item.description}</p>
          </article>
        ))}
      </Container>
    </>
  );
}
