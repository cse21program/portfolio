import { Link } from "react-router-dom";

type NotFoundStateProps = {
  title?: string;
  description?: string;
};

export function NotFoundState({
  title = "Not found",
  description = "That page is not in the static catalog yet.",
}: NotFoundStateProps) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <h1 className="font-display text-4xl text-ink">{title}</h1>
      <p className="mt-4 text-ink-soft">{description}</p>
      <Link to="/" className="mt-8 inline-block text-sm text-accent">
        Back home
      </Link>
    </section>
  );
}
