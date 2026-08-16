import { prisma } from "@common/database/prisma";
import {
  DEFAULT_PROFILE_ID,
  defaultAboutProfile,
  parseGallery,
  type AboutProfile,
  type ProfileLink,
} from "./portfolio.types";
import type { UpdateAboutInput } from "./portfolio.validation";

type ProfileRow = {
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
  gallery: unknown;
  introVideoUrl: string | null;
  embedVideoUrl: string | null;
  links: unknown;
  version: number;
  updatedAt: Date;
};

function asLinks(value: unknown): ProfileLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }
    const record = item as { label?: unknown; href?: unknown };
    const label = typeof record.label === "string" ? record.label.trim() : "";
    const href = typeof record.href === "string" ? record.href.trim() : "";
    if (!label || !href) {
      return [];
    }
    return [{ label, href }];
  });
}

function toAboutProfile(row: ProfileRow): AboutProfile {
  return {
    fullName: row.fullName,
    professionalTitle: row.professionalTitle,
    shortBiography: row.shortBiography,
    detailedBiography: row.detailedBiography,
    careerObjectives: row.careerObjectives,
    philosophy: row.philosophy,
    interests: row.interests,
    location: row.location,
    yearsOfExperience: row.yearsOfExperience,
    languages: row.languages,
    availability: row.availability,
    profilePhotoUrl: row.profilePhotoUrl,
    coverImageUrl: row.coverImageUrl,
    gallery: parseGallery(row.gallery),
    introVideoUrl: row.introVideoUrl,
    embedVideoUrl: row.embedVideoUrl,
    links: asLinks(row.links),
    version: row.version,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const portfolioRepository = {
  async getOrCreate(): Promise<AboutProfile> {
    const existing = await prisma.profile.findUnique({
      where: { id: DEFAULT_PROFILE_ID },
    });

    if (existing) {
      return toAboutProfile(existing);
    }

    const created = await prisma.profile.create({
      data: {
        id: DEFAULT_PROFILE_ID,
        ...defaultAboutProfile,
        links: defaultAboutProfile.links,
      },
    });

    return toAboutProfile(created);
  },

  async update(input: UpdateAboutInput, expectedVersion: number): Promise<AboutProfile | null> {
    const result = await prisma.profile.updateMany({
      where: { id: DEFAULT_PROFILE_ID, version: expectedVersion },
      data: {
        ...input,
        links: input.links,
        version: expectedVersion + 1,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.getOrCreate();
  },

  async updateGallery(
    gallery: UpdateAboutInput["gallery"],
    expectedVersion: number,
  ): Promise<AboutProfile | null> {
    const result = await prisma.profile.updateMany({
      where: { id: DEFAULT_PROFILE_ID, version: expectedVersion },
      data: {
        gallery,
        version: expectedVersion + 1,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.getOrCreate();
  },
};
