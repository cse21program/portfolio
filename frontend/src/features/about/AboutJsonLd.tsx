import type { AboutProfile } from "@/types/about";

function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  if (typeof window === "undefined") {
    return path;
  }
  return new URL(path, window.location.origin).href;
}

export function AboutJsonLd({ profile }: { profile: AboutProfile }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.fullName,
    jobTitle: profile.professionalTitle,
    description: profile.shortBiography,
    image: absoluteUrl(profile.profilePhotoUrl),
    address: {
      "@type": "PostalAddress",
      addressLocality: profile.location,
    },
    knowsLanguage: profile.languages,
    sameAs: profile.links.filter((link) => link.href.startsWith("http")).map((link) => link.href),
    url: typeof window === "undefined" ? undefined : `${window.location.origin}/about`,
  };

  return (
    <script type="application/ld+json">{JSON.stringify(data)}</script>
  );
}
