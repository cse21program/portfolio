import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCertificates } from "@/features/certificates/useCertificates";
import { publishedCertificates } from "@/types/certificates";

export function CertificatesPage() {
  const { certificates, loading } = useCertificates();
  const visible = publishedCertificates(certificates);

  return (
    <>
      <PageHeader
        eyebrow="Certificates"
        title="Credentials"
        description="Issued credentials linked to skills, with verification and files when they are available."
      />
      <Container className="py-16">
        {loading && visible.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-40 animate-pulse rounded-2xl bg-paper-muted" />
            <div className="h-40 animate-pulse rounded-2xl bg-paper-muted" />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState title="No certificates published yet." description="Live credentials will appear here after they are published in Studio." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((item) => (
              <article key={item.slug} className="rounded-2xl border border-line bg-surface p-6">
                <p className="text-xs tracking-wide text-accent uppercase">{item.organization}</p>
                <h2 className="mt-2 font-display text-2xl text-ink">
                  <Link to={`/certificates/${item.slug}`} className="hover:text-accent">
                    {item.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-muted">
                  {[item.issueDate, item.skill].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-4 text-sm leading-6 text-ink-soft">{item.description}</p>
              </article>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
