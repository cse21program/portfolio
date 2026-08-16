import { Link, useParams } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { Tag } from "@/components/ui/Tag";
import { getService } from "@/content/services";

export function ServiceDetailPage() {
  const { slug = "" } = useParams();
  const service = getService(slug);

  if (!service) {
    return <NotFoundState title="Service not found" />;
  }

  return (
    <Container className="space-y-10 py-16">
      <div className="max-w-3xl">
        <p className="text-sm tracking-wide text-accent uppercase">{service.pricingType}</p>
        <h1 className="mt-3 font-display text-5xl text-ink">{service.title}</h1>
        <p className="mt-4 text-lg text-ink-soft">{service.description}</p>
        <p className="mt-4 text-sm text-muted">
          {service.startingPrice} · {service.deliveryTime}
        </p>
        <Link
          to="/contact"
          className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm text-paper"
        >
          Request this service
        </Link>
      </div>
      <section>
        <h2 className="font-display text-3xl text-ink">Included</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-soft">
          {service.features.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <div className="flex flex-wrap gap-2">
        {service.technologies.map((tech) => (
          <Tag key={tech}>{tech}</Tag>
        ))}
      </div>
      <section>
        <h2 className="font-display text-3xl text-ink">FAQ</h2>
        <div className="mt-6 space-y-6">
          {service.faq.map((item) => (
            <article key={item.question}>
              <h3 className="font-medium text-ink">{item.question}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </Container>
  );
}
