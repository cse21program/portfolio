import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { ContentCard } from "@/components/ui/ContentCard";
import { services } from "@/content/services";

export function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Professional work"
        description="Backend, DevOps, reviews, and mentoring. Orders and packages will be dynamic later."
      />
      <Container className="grid gap-4 py-16 md:grid-cols-2">
        {services.map((service) => (
          <ContentCard
            key={service.slug}
            to={`/services/${service.slug}`}
            eyebrow={service.pricingType}
            title={service.title}
            description={service.shortDescription}
            meta={`${service.startingPrice} · ${service.deliveryTime}`}
          />
        ))}
      </Container>
    </>
  );
}
