import { parseRichBody } from "@/lib/richText";
import { EMBED_IFRAME_ALLOW, toEmbedUrl } from "@/features/about/videoEmbed";
import { mediaHref } from "@/lib/mediaUrl";

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code key={index} className="rounded-md border border-line bg-paper px-1.5 py-0.5 text-[0.95em]">
              {part.slice(1, -1)}
            </code>
          );
        }
        const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        if (link) {
          const href = link[2] ?? "";
          const external = /^https?:\/\//i.test(href);
          return (
            <a
              key={index}
              href={href}
              className="text-accent underline decoration-accent/30 underline-offset-4 hover:text-accent-dark"
              {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              {link[1]}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

export function RichText({
  paragraphs,
  lead = false,
}: {
  paragraphs: string[];
  lead?: boolean;
}) {
  const blocks = parseRichBody(paragraphs);
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h3 key={`h-${index}`} className="font-display text-2xl tracking-tight text-ink">
              <InlineText text={block.text} />
            </h3>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={`l-${index}`} className="list-disc space-y-2 pl-5 text-lg leading-8 text-ink-soft">
              {block.items.map((item) => (
                <li key={item}>
                  <InlineText text={item} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "ordered-list") {
          return (
            <ol key={`o-${index}`} className="list-decimal space-y-2 pl-5 text-lg leading-8 text-ink-soft">
              {block.items.map((item) => (
                <li key={item}>
                  <InlineText text={item} />
                </li>
              ))}
            </ol>
          );
        }
        if (block.type === "callout") {
          return (
            <blockquote
              key={`c-${index}`}
              className="rounded-2xl border border-line bg-paper/70 px-5 py-4 text-lg leading-8 text-ink"
            >
              <InlineText text={block.text} />
            </blockquote>
          );
        }
        if (block.type === "code") {
          return (
            <pre
              key={`code-${index}`}
              className="overflow-x-auto rounded-2xl border border-line bg-ink px-5 py-4 text-sm leading-7 text-paper"
            >
              <code>{block.code}</code>
            </pre>
          );
        }
        if (block.type === "table") {
          return (
            <div key={`t-${index}`} className="overflow-x-auto rounded-2xl border border-line">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-paper-muted/80 text-ink">
                  <tr>
                    {block.headers.map((header) => (
                      <th key={header} className="px-4 py-3 font-medium">
                        <InlineText text={header} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-line">
                      {row.map((cell, cellIndex) => (
                        <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-3 text-ink-soft">
                          <InlineText text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (block.type === "image") {
          const src = mediaHref(block.src);
          if (!src) {
            return null;
          }
          return (
            <figure key={`img-${index}`}>
              <img src={src} alt={block.alt} className="w-full rounded-2xl border border-line" />
              {block.alt ? <figcaption className="mt-2 text-sm text-muted">{block.alt}</figcaption> : null}
            </figure>
          );
        }
        if (block.type === "video") {
          const embed = toEmbedUrl(block.url);
          if (!embed) {
            return null;
          }
          return (
            <div key={`v-${index}`} className="overflow-hidden rounded-2xl border border-line">
              <iframe
                title="Embedded video"
                src={embed}
                className="aspect-video w-full"
                allow={EMBED_IFRAME_ALLOW}
                allowFullScreen
              />
            </div>
          );
        }
        if (block.type !== "paragraph") {
          return null;
        }
        return (
          <p
            key={`p-${index}`}
            className={lead && index === 0 ? "text-xl leading-9 text-ink" : "text-lg leading-8 text-ink-soft"}
          >
            <InlineText text={block.text} />
          </p>
        );
      })}
    </div>
  );
}
