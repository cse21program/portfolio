import { profile, socialLinks } from "@/content/profile";
import type { AboutProfile } from "@/types/about";

export const fallbackAboutProfile: AboutProfile = {
  fullName: profile.fullName,
  professionalTitle: profile.professionalTitle,
  shortBiography: profile.shortBiography,
  detailedBiography: [...profile.detailedBiography],
  careerObjectives: profile.careerObjectives,
  philosophy: profile.philosophy,
  interests: [...profile.interests],
  location: profile.location,
  yearsOfExperience: profile.yearsOfExperience,
  languages: [...profile.languages],
  availability: profile.availability,
  profilePhotoUrl: profile.profileImage,
  coverImageUrl: null,
  gallery: [],
  introVideoUrl: null,
  embedVideoUrl: null,
  links: socialLinks.map((link) => ({ ...link })),
  version: 0,
  updatedAt: new Date(0).toISOString(),
};
