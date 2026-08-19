import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { site } from "@/config/site";
import { ApiRequestError, apiGet } from "@/lib/api";
import type { CourseCertificatePublic } from "@/types/enrollment";

function formatIssued(value: string) {
  const day = value.slice(0, 10);
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(day) ? Date.parse(`${day}T00:00:00Z`) : Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(parsed));
}

function verifyUrl(path: string) {
  if (typeof window === "undefined") {
    return path;
  }
  return `${window.location.origin}${path}`;
}

function CertificateJsonLd({
  certificate,
  url,
}: {
  certificate: CourseCertificatePublic;
  url: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalCredential",
    credentialCategory: "Certificate of Completion",
    name: `Certificate of Completion · ${certificate.courseTitle}`,
    identifier: certificate.publicId,
    dateCreated: certificate.issuedAt,
    url,
    recognizedBy: { "@type": "Person", name: certificate.instructor || site.name },
    about: {
      "@type": "Course",
      name: certificate.courseTitle,
      url: `${typeof window === "undefined" ? "" : window.location.origin}/courses/${certificate.courseSlug}`,
    },
  };

  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}

function CertificateMark() {
  const initial = site.shortName.trim().charAt(0) || "R";
  return (
    <span className="grid h-14 w-14 place-items-center rounded-full border border-accent/35">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-ink font-display text-lg text-paper">
        {initial}
      </span>
    </span>
  );
}

function CertificateCorners() {
  return (
    <>
      <span aria-hidden="true" className="absolute top-5 left-5 h-5 w-5 border-t border-l border-ink/70" />
      <span aria-hidden="true" className="absolute top-5 right-5 h-5 w-5 border-t border-r border-ink/70" />
      <span aria-hidden="true" className="absolute bottom-5 left-5 h-5 w-5 border-b border-l border-ink/70" />
      <span aria-hidden="true" className="absolute right-5 bottom-5 h-5 w-5 border-r border-b border-ink/70" />
    </>
  );
}

function CertificateDocument({
  certificate,
  url,
}: {
  certificate: CourseCertificatePublic;
  url: string;
}) {
  return (
    <article className="certificate-print-sheet relative overflow-hidden rounded-[1.5rem] border border-line bg-surface px-7 py-10 sm:px-16 sm:py-14">
      <div aria-hidden="true" className="pointer-events-none absolute inset-3 border border-accent/30" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-5 border border-line" />
      <CertificateCorners />

      <div className="relative flex flex-col">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CertificateMark />
            <div>
              <p className="font-display text-lg tracking-tight text-ink">{site.name}</p>
              <p className="text-xs tracking-[0.18em] text-muted uppercase">Course certificate</p>
            </div>
          </div>
          <p className="hidden text-xs tracking-[0.18em] text-accent uppercase sm:block">Verified</p>
        </header>

        <div className="mt-10 text-center sm:mt-12">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">This certifies that</p>
          <h1 className="mt-4 font-display text-4xl tracking-tight text-ink sm:text-5xl">
            {certificate.recipientName}
          </h1>
          <p className="mt-6 text-base leading-8 text-ink-soft">has successfully completed</p>
          <p className="mt-3 font-display text-2xl tracking-tight text-ink sm:text-3xl">
            {certificate.courseTitle}
          </p>
          <div className="mx-auto mt-8 h-px w-16 bg-accent" />
        </div>

        <div className="mt-10 grid gap-8 sm:mt-12 sm:grid-cols-3 sm:items-end">
          <div>
            <p className="text-xs tracking-[0.16em] text-muted uppercase">Issued</p>
            <p className="mt-1.5 text-sm font-medium text-ink">{formatIssued(certificate.issuedAt)}</p>
          </div>
          <div className="text-center">
            <p className="font-display text-xl italic text-ink">{certificate.instructor || site.name}</p>
            <p className="mt-1 text-xs tracking-[0.16em] text-muted uppercase">Instructor</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs tracking-[0.16em] text-muted uppercase">Certificate ID</p>
            <p className="mt-1.5 font-medium tracking-wide text-ink">{certificate.publicId}</p>
          </div>
        </div>

        <p className="mt-10 text-center text-[11px] leading-6 text-muted">
          Confirm this credential at {url}
        </p>
      </div>
    </article>
  );
}

export function CourseCertificatePage() {
  const { publicId = "" } = useParams();
  const [certificate, setCertificate] = useState<CourseCertificatePublic | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!publicId) {
      setCertificate(null);
      setError("This certificate link is missing an id.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void apiGet<{ certificate: CourseCertificatePublic }>(`/course-certificates/${publicId}`)
      .then((payload) => {
        if (!cancelled) {
          setCertificate(payload.certificate);
          setError("");
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setCertificate(null);
          setError(caught instanceof ApiRequestError ? caught.message : "Could not load this certificate");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [publicId]);

  useEffect(() => {
    if (!certificate) {
      return;
    }
    const previous = document.title;
    document.title = `Certificate · ${certificate.courseTitle}`;
    return () => {
      document.title = previous;
    };
  }, [certificate]);

  useEffect(() => {
    document.documentElement.classList.add("certificate-print");
    const style = document.createElement("style");
    style.setAttribute("data-certificate-print", "true");
    style.textContent = "@media print { @page { size: A4 landscape; margin: 10mm; } }";
    document.head.appendChild(style);
    return () => {
      document.documentElement.classList.remove("certificate-print");
      style.remove();
    };
  }, []);

  const url = certificate ? verifyUrl(certificate.verifyPath) : "";

  async function copyLink() {
    if (!url) {
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="bg-paper">
      <Container className="max-w-4xl py-12 sm:py-16">
        {loading ? (
          <div className="h-[28rem] animate-pulse rounded-[1.5rem] bg-paper-muted" />
        ) : error || !certificate ? (
          <div className="space-y-3 rounded-[1.5rem] border border-line bg-surface p-8">
            <p className="text-xs tracking-[0.16em] text-accent uppercase">Certificate</p>
            <h1 className="font-display text-3xl text-ink">Not found</h1>
            <p className="text-ink-soft">{error || "This certificate id is not on record."}</p>
            <Link to="/courses" className="inline-block text-sm font-medium text-accent hover:text-accent-dark">
              Browse courses
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <CertificateJsonLd certificate={certificate} url={url} />
            <div className="print:hidden flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.18em] text-accent uppercase">Verified credential</p>
                <p className="mt-2 max-w-xl text-sm leading-7 text-ink-soft">
                  Anyone with this link can confirm the certificate. Print it, or save it as a PDF from the
                  print dialog.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent"
                  onClick={() => window.print()}
                >
                  Print or save as PDF
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent/40"
                  onClick={() => void copyLink()}
                >
                  {copied ? "Link copied" : "Copy verification link"}
                </button>
                <Link
                  to={`/courses/${certificate.courseSlug}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent/40"
                >
                  Open course
                </Link>
              </div>
            </div>

            <CertificateDocument certificate={certificate} url={url} />
          </div>
        )}
      </Container>
    </div>
  );
}
