import { Link, useParams } from "react-router-dom";
import { PreviewBanner } from "@/components/content/PreviewBanner";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { useCertificates } from "@/features/certificates/useCertificates";
import { isLiveContent } from "@/lib/publishing";
import { findCertificate } from "@/types/certificates";

export function CertificateDetailPage() {
  const { slug = "" } = useParams();
  const { certificates, loading } = useCertificates();
  const certificate = findCertificate(certificates, slug);

  if (loading && !certificate) {
    return (
      <Container className="py-16">
        <div className="h-48 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      </Container>
    );
  }

  if (!certificate) {
    return <NotFoundState title="Certificate not found" />;
  }

  const live = isLiveContent(certificate);

  return (
    <Container className="space-y-8 py-14 sm:py-16">
      {!live ? <PreviewBanner status={certificate.status} /> : null}
      <div>
        <Link to="/certificates" className="text-sm font-medium text-accent hover:text-accent-dark">
          ← All credentials
        </Link>
        <p className="mt-5 text-xs tracking-[0.16em] text-accent uppercase">{certificate.organization}</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-ink sm:text-5xl">{certificate.title}</h1>
        <p className="mt-3 text-sm text-muted">
          {[certificate.issueDate, certificate.expiryDate, certificate.skill].filter(Boolean).join(" · ")}
        </p>
        {certificate.credentialId ? (
          <p className="mt-2 text-sm text-ink-soft">Credential ID {certificate.credentialId}</p>
        ) : null}
      </div>
      {certificate.imageUrl ? (
        <img
          src={certificate.imageUrl}
          alt=""
          className="max-h-80 w-full rounded-[1.75rem] border border-line bg-paper object-contain"
        />
      ) : null}
      {certificate.description ? (
        <p className="max-w-3xl text-lg leading-8 text-ink-soft">{certificate.description}</p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {certificate.verificationUrl ? (
          <a
            href={certificate.verificationUrl}
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-accent"
            target="_blank"
            rel="noreferrer"
          >
            Verify credential
          </a>
        ) : null}
        {certificate.documentUrl ? (
          <a
            href={certificate.documentUrl}
            className="rounded-full border border-line px-5 py-2.5 text-sm text-ink hover:border-accent"
            target="_blank"
            rel="noreferrer"
          >
            Download PDF
          </a>
        ) : null}
      </div>
    </Container>
  );
}
