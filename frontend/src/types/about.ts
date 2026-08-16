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

type GallerySource = {
  gallery?: GalleryPhoto[] | null;
  galleryImageUrls?: string[];
};

export function normalizeGallery(profile: GallerySource): GalleryPhoto[] {
  if (Array.isArray(profile.gallery)) {
    return profile.gallery;
  }
  if (Array.isArray(profile.galleryImageUrls)) {
    return profile.galleryImageUrls.map((url) => ({ url, private: false }));
  }
  return [];
}

export function publicGalleryUrls(photos?: GalleryPhoto[] | null) {
  return (photos ?? []).filter((photo) => !photo.private).map((photo) => photo.url);
}

export function normalizeAboutProfile(
  profile: Omit<AboutProfile, "gallery"> & GallerySource,
): AboutProfile {
  return {
    ...profile,
    gallery: normalizeGallery(profile),
  };
}
