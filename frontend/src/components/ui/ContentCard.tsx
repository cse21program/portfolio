import { Link } from "react-router-dom";
import { Tag } from "@/components/ui/Tag";

type ContentCardProps = {
  to: string;
  eyebrow?: string;
  title: string;
  description: string;
  meta?: string;
  tags?: string[];
  featured?: boolean;
  image?: string | null;
};

export function ContentCard({
  to,
  eyebrow,
  title,
  description,
  meta,
  tags,
  featured = false,
  image,
}: ContentCardProps) {
  return (
    <Link
      to={to}
      className={`group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_1px_0_rgb(26_22_18/0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-[0_18px_40px_rgb(26_22_18/0.08)]`}
    >
      {image ? (
        <img src={image} alt="" className="aspect-[16/9] w-full object-cover" />
      ) : null}
      <div className={`flex flex-1 flex-col p-6 ${featured ? "sm:p-8" : ""}`}>
      {eyebrow ? (
        <p className="text-xs tracking-[0.16em] text-accent uppercase">{eyebrow}</p>
      ) : null}
      <h3
        className={`mt-2 font-display text-ink transition group-hover:text-accent-dark ${
          featured ? "text-3xl sm:text-4xl" : "text-2xl"
        }`}
      >
        {title}
      </h3>
      <p className={`mt-3 flex-1 leading-7 text-ink-soft ${featured ? "text-base" : "text-sm"}`}>
        {description}
      </p>
      {tags && tags.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      ) : null}
      {meta ? <p className="mt-4 text-xs text-muted">{meta}</p> : null}
      </div>
    </Link>
  );
}
