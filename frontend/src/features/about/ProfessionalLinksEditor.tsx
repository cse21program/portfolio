import type { ProfileLink } from "@/types/about";
import { PlatformIcon } from "@/features/about/PlatformIcon";
import {
  CUSTOM_PLATFORM,
  LINK_PLATFORMS,
  matchPlatform,
  toHref,
  toInputValue,
} from "@/features/about/linkPlatforms";

type ProfessionalLinksEditorProps = {
  links: ProfileLink[];
  onChange: (links: ProfileLink[]) => void;
  error?: string;
};

function fieldsFromLinks(links: ProfileLink[]) {
  const values: Record<string, string> = {};
  for (const platform of LINK_PLATFORMS) {
    values[platform.id] = "";
  }
  for (const link of links) {
    const platform = matchPlatform(link);
    if (platform.id !== "custom") {
      values[platform.id] = toInputValue(link.href, platform);
    }
  }
  return values;
}

function customFromLinks(links: ProfileLink[]) {
  return links.filter((link) => matchPlatform(link).id === "custom");
}

function toLinks(values: Record<string, string>, custom: ProfileLink[]): ProfileLink[] {
  const known = LINK_PLATFORMS.flatMap((platform) => {
    const raw = (values[platform.id] ?? "").trim();
    if (!raw) {
      return [];
    }
    const href = toHref(raw, platform);
    if (!href) {
      return [];
    }
    return [{ label: platform.label, href }];
  });
  return [...known, ...custom];
}

export function ProfessionalLinksEditor({ links, onChange, error }: ProfessionalLinksEditorProps) {
  const values = fieldsFromLinks(links);
  const custom = customFromLinks(links);

  function setValue(id: string, input: string) {
    onChange(toLinks({ ...values, [id]: input }, custom));
  }

  function setCustom(next: ProfileLink[]) {
    onChange(toLinks(values, next));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">Leave a row blank to hide it. Username or full URL.</p>

      <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
        {LINK_PLATFORMS.map((platform) => {
          const fieldId = `platform-${platform.id}`;
          return (
            <li key={platform.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-paper-muted text-ink">
                <PlatformIcon id={platform.id} className="h-4 w-4" />
              </span>
              <label htmlFor={fieldId} className="w-24 shrink-0 text-sm text-ink sm:w-32">
                {platform.label}
              </label>
              <input
                id={fieldId}
                className="min-w-0 flex-1 rounded-xl border border-line bg-paper/50 px-3 py-2 text-sm outline-none focus:border-accent"
                placeholder={platform.placeholder}
                inputMode={platform.id === "email" ? "email" : "url"}
                autoComplete="off"
                value={values[platform.id]}
                onChange={(event) => setValue(platform.id, event.target.value)}
              />
            </li>
          );
        })}
      </ul>

      {custom.map((link, index) => (
        <div key={index} className="flex flex-wrap items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-line bg-paper-muted text-ink">
            <PlatformIcon id="custom" className="h-4 w-4" />
          </span>
          <input
            aria-label={`Custom link ${index + 1} name`}
            className="w-28 rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="Label"
            value={link.label}
            onChange={(event) =>
              setCustom(
                custom.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, label: event.target.value } : item,
                ),
              )
            }
          />
          <input
            aria-label={`Custom link ${index + 1} URL`}
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder={CUSTOM_PLATFORM.placeholder}
            value={link.href}
            onChange={(event) =>
              setCustom(
                custom.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, href: event.target.value } : item,
                ),
              )
            }
          />
          <button
            type="button"
            className="text-sm text-muted hover:text-ink"
            onClick={() => setCustom(custom.filter((_, itemIndex) => itemIndex !== index))}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        className="text-sm text-accent hover:text-accent-dark"
        onClick={() => setCustom([...custom, { label: "", href: "" }])}
      >
        Add a custom link
      </button>

      {error ? (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
