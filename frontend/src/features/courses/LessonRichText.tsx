import { parseRichBody } from "@/types/course";

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
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
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

export function LessonRichText({
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
