import type { ProfileLink } from "@/types/about";

export type LinkPlatform = {
  id: string;
  label: string;
  prefix: string;
  placeholder: string;
  hint: string;
  hosts: string[];
};

export const LINK_PLATFORMS: LinkPlatform[] = [
  {
    id: "github",
    label: "GitHub",
    prefix: "https://github.com/",
    placeholder: "username",
    hint: "Username or a full GitHub URL",
    hosts: ["github.com"],
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    prefix: "https://www.linkedin.com/in/",
    placeholder: "profile-id",
    hint: "Profile ID or a full LinkedIn URL",
    hosts: ["linkedin.com"],
  },
  {
    id: "youtube",
    label: "YouTube",
    prefix: "https://www.youtube.com/@",
    placeholder: "channel",
    hint: "Channel name or a full YouTube URL",
    hosts: ["youtube.com", "youtu.be"],
  },
  {
    id: "facebook",
    label: "Facebook",
    prefix: "https://www.facebook.com/",
    placeholder: "username",
    hint: "Username or a full Facebook URL",
    hosts: ["facebook.com", "fb.com"],
  },
  {
    id: "x",
    label: "X",
    prefix: "https://x.com/",
    placeholder: "handle",
    hint: "Handle without @, or a full X / Twitter URL",
    hosts: ["x.com", "twitter.com"],
  },
  {
    id: "stackoverflow",
    label: "Stack Overflow",
    prefix: "https://stackoverflow.com/users/",
    placeholder: "user-id",
    hint: "Easier to paste the full profile URL",
    hosts: ["stackoverflow.com"],
  },
  {
    id: "medium",
    label: "Medium",
    prefix: "https://medium.com/@",
    placeholder: "username",
    hint: "Username or a full Medium URL",
    hosts: ["medium.com"],
  },
  {
    id: "email",
    label: "Email",
    prefix: "mailto:",
    placeholder: "hello@example.com",
    hint: "Public contact address",
    hosts: [],
  },
  {
    id: "website",
    label: "Website",
    prefix: "https://",
    placeholder: "your-site.com",
    hint: "Domain or a full https URL",
    hosts: [],
  },
];

export const CUSTOM_PLATFORM: LinkPlatform = {
  id: "custom",
  label: "Custom",
  prefix: "",
  placeholder: "https://",
  hint: "Any https, mailto, or site path",
  hosts: [],
};

function hostOf(href: string) {
  try {
    if (href.startsWith("mailto:")) {
      return "mailto";
    }
    return new URL(href).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function matchPlatform(link: ProfileLink): LinkPlatform {
  const byLabel = LINK_PLATFORMS.find(
    (platform) => platform.label.toLowerCase() === link.label.trim().toLowerCase(),
  );
  if (byLabel) {
    return byLabel;
  }

  if (link.href.startsWith("mailto:")) {
    return LINK_PLATFORMS.find((platform) => platform.id === "email") ?? CUSTOM_PLATFORM;
  }

  const host = hostOf(link.href);
  const byHost = LINK_PLATFORMS.find((platform) =>
    platform.hosts.some((item) => host === item || host.endsWith(`.${item}`)),
  );
  return byHost ?? CUSTOM_PLATFORM;
}

export function toInputValue(href: string, platform: LinkPlatform) {
  const value = href.trim();
  if (!value) {
    return "";
  }
  if (platform.id === "email" && value.toLowerCase().startsWith("mailto:")) {
    return value.slice("mailto:".length);
  }
  if (platform.prefix && value.startsWith(platform.prefix)) {
    return value.slice(platform.prefix.length).replace(/^@/, "");
  }
  return value;
}

export function toHref(input: string, platform: LinkPlatform) {
  const value = input.trim().replace(/^@/, "");
  if (!value) {
    return "";
  }
  if (platform.id === "email") {
    return value.toLowerCase().startsWith("mailto:") ? value : `mailto:${value}`;
  }
  if (/^http:\/\//i.test(value)) {
    return `https://${value.slice("http://".length)}`;
  }
  if (/^(https:\/\/|mailto:|\/)/i.test(value)) {
    return value;
  }
  if (platform.prefix) {
    return `${platform.prefix}${value}`;
  }
  if (value.includes(".")) {
    return `https://${value}`;
  }
  return value;
}

export function isUsableHref(href: string) {
  return /^(https:\/\/|mailto:|\/)/i.test(href.trim());
}
