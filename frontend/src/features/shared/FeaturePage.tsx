import { PagePlaceholder } from "@/components/ui/PagePlaceholder";

type FeaturePageProps = {
  title: string;
  description: string;
};

export function FeaturePage({ title, description }: FeaturePageProps) {
  return <PagePlaceholder title={title} description={description} />;
}
