type PagePlaceholderProps = {
  title: string;
  description: string;
};

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <section className="py-8">
      <p className="text-sm tracking-wide text-accent uppercase">Coming next</p>
      <h1 className="mt-3 font-display text-4xl text-ink">{title}</h1>
      <p className="mt-4 max-w-2xl text-ink-soft">{description}</p>
    </section>
  );
}
