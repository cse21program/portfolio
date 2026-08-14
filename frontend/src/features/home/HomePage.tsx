import { Link } from "react-router-dom";
import { site } from "@/config/site";

export function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <p className="text-sm tracking-wide text-accent uppercase">{site.title}</p>
      <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight text-ink sm:text-6xl">
        {site.name}
      </h1>
      <p className="mt-5 max-w-xl text-lg text-ink-soft">{site.tagline}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/projects"
          className="rounded-full bg-ink px-5 py-3 text-sm text-paper hover:bg-ink-soft"
        >
          View projects
        </Link>
        <Link
          to="/services"
          className="rounded-full border border-line px-5 py-3 text-sm text-ink hover:bg-paper-muted"
        >
          Hire me
        </Link>
        <Link
          to="/courses"
          className="rounded-full border border-line px-5 py-3 text-sm text-ink hover:bg-paper-muted"
        >
          Explore courses
        </Link>
      </div>
    </section>
  );
}
