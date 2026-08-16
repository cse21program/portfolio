export type ProfileLink = {
  label: string;
  href: string;
};

export type GalleryPhoto = {
  url: string;
  private: boolean;
};

export type AboutProfile = {
  fullName: string;
  professionalTitle: string;
  shortBiography: string;
  detailedBiography: string[];
  careerObjectives: string;
  philosophy: string;
  interests: string[];
  location: string;
  yearsOfExperience: string;
  languages: string[];
  availability: string;
  profilePhotoUrl: string;
  coverImageUrl: string | null;
  gallery: GalleryPhoto[];
  introVideoUrl: string | null;
  embedVideoUrl: string | null;
  links: ProfileLink[];
  version: number;
  updatedAt: string;
};

export type AboutProfileWrite = Omit<AboutProfile, "version" | "updatedAt">;

export const DEFAULT_PROFILE_ID = "default";

export function parseGallery(value: unknown): GalleryPhoto[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const photos: GalleryPhoto[] = [];

  for (const item of value) {
    if (typeof item === "string") {
      const url = item.trim();
      if (!url || seen.has(url)) {
        continue;
      }
      seen.add(url);
      photos.push({ url, private: false });
      continue;
    }

    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as { url?: unknown; private?: unknown };
    const url = typeof record.url === "string" ? record.url.trim() : "";
    if (!url || seen.has(url)) {
      continue;
    }
    seen.add(url);
    photos.push({ url, private: record.private === true });
  }

  return photos;
}

export function publicGallery(photos?: GalleryPhoto[] | null) {
  return (photos ?? []).filter((photo) => !photo.private);
}

export function toPublicAboutProfile(profile: AboutProfile): AboutProfile {
  return {
    ...profile,
    gallery: publicGallery(profile.gallery),
  };
}

export const defaultAboutProfile: AboutProfileWrite = {
  fullName: "Rezaul Karim",
  professionalTitle: "Software Engineer",
  shortBiography:
    "I build backend systems, deployment pipelines, and cloud setups that stay understandable after launch.",
  detailedBiography: [
    "I work across backend APIs, DevOps, and cloud engineering, with a bias toward systems that are observable, documented, and cheap to operate.",
    "This platform will eventually host case studies, structured skill notes, tutorials, courses, and professional services. The public pages here are a static first version so the product can be designed before the CMS and payments go live.",
    "When I take on work, I care about requirements, architecture, delivery, and handing over something another engineer can maintain.",
  ],
  careerObjectives:
    "Help teams ship production-grade backend and cloud systems, and teach the same craft through writing and courses.",
  philosophy: "Prefer boring, proven infrastructure. Make the domain model explicit. Automate the path to production.",
  interests: [
    "Distributed systems",
    "Platform engineering",
    "Developer experience",
    "Technical writing",
  ],
  location: "Sylhet, Bangladesh",
  yearsOfExperience: "Hands-on backend and DevOps work",
  languages: ["English", "Bangla"],
  availability: "Open for hire",
  profilePhotoUrl: "/images/profile.png?v=2",
  coverImageUrl: null,
  gallery: [],
  introVideoUrl: null,
  embedVideoUrl: null,
  links: [
    { label: "GitHub", href: "https://github.com/swe-rezaul-karim" },
    { label: "Email", href: "mailto:hello@rezaul.dev" },
  ],
};
