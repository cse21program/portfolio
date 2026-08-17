import { site } from "@/config/site";
import { isUsableHref } from "@/features/about/linkPlatforms";
import type { AboutProfile, ProfileLink } from "@/types/about";
import type { ResumeDocument } from "@/types/resume";

export type ContactItem = {
  href?: string;
  label: string;
};

export type ResumeViewModel = {
  profile: AboutProfile;
  resume: ResumeDocument;
  headline: string;
  summary: string;
  contacts: ContactItem[];
};

export function dateRange(start: string, end?: string) {
  return end ? `${start} – ${end}` : start;
}

export function displayHref(href: string) {
  if (href.startsWith("mailto:")) {
    return href.slice("mailto:".length);
  }
  try {
    const url = new URL(href);
    return `${url.host.replace(/^www\./, "")}${url.pathname}`.replace(/\/$/, "");
  } catch {
    return href.replace(/^\//, "");
  }
}

export function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return {
    first: parts[0] ?? fullName,
    rest: parts.slice(1).join(" "),
  };
}

function emailLink(links: ProfileLink[], fallback: string): ProfileLink {
  return (
    links.find((link) => link.href.startsWith("mailto:")) ?? {
      label: "Email",
      href: `mailto:${fallback}`,
    }
  );
}

export function contactItems(profile: AboutProfile): ContactItem[] {
  const email = emailLink(profile.links, site.email);
  const web = profile.links.filter((link) => isUsableHref(link.href) && !link.href.startsWith("mailto:"));
  return [
    { label: profile.location },
    { href: email.href, label: displayHref(email.href) },
    ...web.slice(0, 3).map((link) => ({ href: link.href, label: displayHref(link.href) })),
  ];
}

export function createResumeView(profile: AboutProfile, resume: ResumeDocument): ResumeViewModel {
  return {
    profile,
    resume,
    headline: resume.headline || profile.professionalTitle,
    summary: resume.summary || profile.shortBiography,
    contacts: contactItems(profile),
  };
}
