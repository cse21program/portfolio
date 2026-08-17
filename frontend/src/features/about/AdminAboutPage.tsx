import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { FormField, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { ApiRequestError, apiGet, apiPatch, apiPut } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors, validateName, validateRequired } from "@/lib/validation";
import type { AboutProfile, GalleryPhoto, ProfileLink } from "@/types/about";
import { normalizeAboutProfile } from "@/types/about";
import { GalleryPicker, IdentityStage, VideoPicker } from "@/features/about/MediaPicker";
import { ProfessionalLinksEditor } from "@/features/about/ProfessionalLinksEditor";
import { fallbackAboutProfile } from "@/features/about/fallback";
import { isUsableHref } from "@/features/about/linkPlatforms";
import { useAboutProfile } from "@/features/about/AboutProfileContext";

type AboutFields =
  | "fullName"
  | "professionalTitle"
  | "shortBiography"
  | "detailedBiography"
  | "careerObjectives"
  | "philosophy"
  | "interests"
  | "location"
  | "yearsOfExperience"
  | "languages"
  | "availability"
  | "profilePhotoUrl"
  | "coverImageUrl"
  | "gallery"
  | "introVideoUrl"
  | "embedVideoUrl"
  | "links";

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitParagraphs(value: string) {
  return value
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function privacyOnlyChange(current: GalleryPhoto[], next: GalleryPhoto[]) {
  return (
    current.length === next.length &&
    current.every((photo, index) => photo.url === next[index]?.url) &&
    current.some((photo, index) => photo.private !== next[index]?.private)
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-3xl border border-line bg-surface p-6 shadow-[0_1px_0_rgb(26_22_18/0.04)] sm:p-7">
      <div>
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function AdminAboutPage() {
  const { reload: reloadPublicProfile } = useAboutProfile();
  const [profile, setProfile] = useState<AboutProfile>(fallbackAboutProfile);
  const [links, setLinks] = useState<ProfileLink[]>(fallbackAboutProfile.links);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(fallbackAboutProfile.profilePhotoUrl);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(fallbackAboutProfile.coverImageUrl);
  const [gallery, setGallery] = useState<GalleryPhoto[]>(fallbackAboutProfile.gallery);
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(fallbackAboutProfile.introVideoUrl);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [gallerySaved, setGallerySaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [formEpoch, setFormEpoch] = useState(0);
  const versionRef = useRef(0);
  const persistQueue = useRef(Promise.resolve());
  const { fieldErrors, formError, resetErrors, applyFieldErrors, applyCaughtError } =
    useFormErrors<AboutFields>();

  function applyProfile(raw: AboutProfile) {
    const next = normalizeAboutProfile(raw);
    versionRef.current = next.version;
    setProfile(next);
    setLinks(next.links);
    setProfilePhotoUrl(next.profilePhotoUrl);
    setCoverImageUrl(next.coverImageUrl);
    setGallery(next.gallery);
    setIntroVideoUrl(next.introVideoUrl);
  }

  useEffect(() => {
    void apiGet<{ profile: AboutProfile }>("/portfolio/about/studio", { cache: "no-store" })
      .then((payload) => {
        applyProfile(payload.profile);
      })
      .catch((caught: unknown) => {
        applyCaughtError(caught, "Could not load the about profile");
      })
      .finally(() => setLoading(false));
  }, [applyCaughtError]);

  function persistGallery(photos: GalleryPhoto[]) {
    persistQueue.current = persistQueue.current.then(async () => {
      try {
        const payload = await apiPatch<{ profile: AboutProfile }>(
          "/portfolio/about/gallery",
          { gallery: photos },
          { headers: { "If-Match": `"${versionRef.current}"` } },
        );
        const next = normalizeAboutProfile(payload.profile);
        versionRef.current = next.version;
        setProfile((current) => ({
          ...current,
          gallery: next.gallery,
          version: next.version,
          updatedAt: next.updatedAt,
        }));
        setGallery(next.gallery);
        setGallerySaved(true);
        await reloadPublicProfile();
      } catch (caught) {
        applyCaughtError(caught, "Could not update photo privacy");
      }
    });
  }

  function onGalleryChange(photos: GalleryPhoto[]) {
    const hideOrShow = privacyOnlyChange(gallery, photos);
    setGallery(photos);
    if (hideOrShow) {
      persistGallery(photos);
      return;
    }
    setDirty(true);
    setGallerySaved(false);
  }

  useEffect(() => {
    if (!dirty) {
      return;
    }
    function onLeave(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  function validate(next: AboutProfile) {
    return collectErrors<AboutFields>({
      fullName: validateName(next.fullName, "Full name"),
      professionalTitle: validateRequired(next.professionalTitle, "Professional title"),
      shortBiography:
        next.shortBiography.trim().length < 20
          ? "Short biography must be at least 20 characters"
          : undefined,
      detailedBiography:
        next.detailedBiography.length === 0 ? "Add at least one biography paragraph" : undefined,
      careerObjectives: validateRequired(next.careerObjectives, "Career objectives"),
      philosophy: validateRequired(next.philosophy, "Philosophy"),
      languages: next.languages.length === 0 ? "Add at least one language" : undefined,
      location: validateRequired(next.location, "Location"),
      yearsOfExperience: validateRequired(next.yearsOfExperience, "Years of experience"),
      availability: validateRequired(next.availability, "Availability"),
      profilePhotoUrl: validateRequired(next.profilePhotoUrl, "Profile photo"),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next: AboutProfile = {
      fullName: String(form.get("fullName")),
      professionalTitle: String(form.get("professionalTitle")),
      shortBiography: String(form.get("shortBiography")),
      detailedBiography: splitParagraphs(String(form.get("detailedBiography"))),
      careerObjectives: String(form.get("careerObjectives")),
      philosophy: String(form.get("philosophy")),
      interests: splitList(String(form.get("interests"))),
      location: String(form.get("location")),
      yearsOfExperience: String(form.get("yearsOfExperience")),
      languages: splitList(String(form.get("languages"))),
      availability: String(form.get("availability")),
      profilePhotoUrl: profilePhotoUrl.trim(),
      coverImageUrl,
      gallery,
      introVideoUrl,
      embedVideoUrl: emptyToNull(String(form.get("embedVideoUrl"))),
      links: links
        .map((link) => ({ label: link.label.trim(), href: link.href.trim() }))
        .filter((link) => link.label && isUsableHref(link.href)),
      version: profile.version,
      updatedAt: profile.updatedAt,
    };

    resetErrors();
    setSaved(false);

    if (applyFieldErrors(validate(next))) {
      return;
    }

    setPending(true);
    try {
      await persistQueue.current;
      const payload = await apiPut<{ profile: AboutProfile }>(
        "/portfolio/about",
        next,
        { headers: { "If-Match": `"${versionRef.current}"` } },
      );
      applyProfile(payload.profile);
      setSaved(true);
      setGallerySaved(false);
      setDirty(false);
      setFormEpoch((value) => value + 1);
      await reloadPublicProfile();
    } catch (caught) {
      if (caught instanceof ApiRequestError && caught.status === 412) {
        applyCaughtError(caught, "This page was updated elsewhere. Reload and try again.");
      } else {
        applyCaughtError(caught, "Could not save the about profile");
      }
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-full bg-paper-muted" />
        <div className="h-48 animate-pulse rounded-3xl bg-paper-muted" />
      </div>
    );
  }

  const updatedLabel =
    profile.version > 0
      ? `Version ${profile.version} · ${new Date(profile.updatedAt).toLocaleString()}`
      : "Not loaded from the API";

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-accent uppercase">Portfolio</p>
          <h1 className="mt-2 font-display text-3xl text-ink">About me</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
            Public identity for the site. Changes go live after save. Experience and education have
            their own editors.
          </p>
          <p className="mt-2 text-xs text-muted">{updatedLabel}</p>
        </div>
        <Link to="/about" className="text-sm text-accent hover:text-accent-dark">
          View public page →
        </Link>
      </div>

      <AuthError>{formError}</AuthError>
      {saved ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="status">
          About page published.
        </p>
      ) : null}
      {gallerySaved ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="status">
          Photo privacy is live on the public site.
        </p>
      ) : null}

      <form
        key={formEpoch}
        className="space-y-6"
        onSubmit={handleSubmit}
        onInput={() => setDirty(true)}
        noValidate
      >
        <SectionCard title="Identity" description="How visitors first read you.">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" name="fullName" defaultValue={profile.fullName} error={fieldErrors.fullName} />
            <FormField
              label="Professional title"
              name="professionalTitle"
              defaultValue={profile.professionalTitle}
              error={fieldErrors.professionalTitle}
            />
            <FormField label="Location" name="location" defaultValue={profile.location} error={fieldErrors.location} />
            <FormField
              label="Availability"
              name="availability"
              defaultValue={profile.availability}
              error={fieldErrors.availability}
            />
            <FormField
              label="Years of experience"
              name="yearsOfExperience"
              defaultValue={profile.yearsOfExperience}
              error={fieldErrors.yearsOfExperience}
            />
            <FormField
              label="Languages"
              name="languages"
              defaultValue={profile.languages.join(", ")}
              hint="Comma-separated"
              error={fieldErrors.languages}
            />
          </div>
        </SectionCard>

        <SectionCard title="Narrative" description="Short biography is the pull quote on the public page.">
          <FormTextArea
            label="Short biography"
            name="shortBiography"
            rows={3}
            maxLength={500}
            defaultValue={profile.shortBiography}
            hint="20–500 characters"
            error={fieldErrors.shortBiography}
          />
          <FormTextArea
            label="Detailed biography"
            name="detailedBiography"
            rows={8}
            defaultValue={profile.detailedBiography.join("\n\n")}
            hint="Separate paragraphs with a blank line"
            error={fieldErrors.detailedBiography}
          />
          <FormTextArea
            label="Career objectives"
            name="careerObjectives"
            rows={3}
            defaultValue={profile.careerObjectives}
            error={fieldErrors.careerObjectives}
          />
          <FormTextArea
            label="Professional philosophy"
            name="philosophy"
            rows={3}
            defaultValue={profile.philosophy}
            error={fieldErrors.philosophy}
          />
          <FormField
            label="Current interests"
            name="interests"
            defaultValue={profile.interests.join(", ")}
            hint="Comma-separated"
            error={fieldErrors.interests}
          />
        </SectionCard>

        <SectionCard
          title="Media"
          description="Upload photos and video from this device. YouTube and Vimeo stay as a link."
        >
          <IdentityStage
            profileUrl={profilePhotoUrl || null}
            coverUrl={coverImageUrl}
            profileError={fieldErrors.profilePhotoUrl}
            coverError={fieldErrors.coverImageUrl}
            onProfileChange={(url) => {
              setDirty(true);
              setProfilePhotoUrl(url ?? "");
            }}
            onCoverChange={(url) => {
              setDirty(true);
              setCoverImageUrl(url);
            }}
          />
          <div className="border-t border-line pt-6">
            <GalleryPicker
              label="Gallery"
              hint="Make private hides the photo on About immediately."
              error={fieldErrors.gallery}
              photos={gallery}
              onChange={onGalleryChange}
            />
          </div>
          <div className="border-t border-line pt-6">
            <p className="text-[11px] tracking-[0.18em] text-accent uppercase">Introduction</p>
            <p className="mt-1.5 text-sm text-ink-soft">
              A YouTube or Vimeo link is used instead of an uploaded file.
            </p>
            <div className="mt-4 space-y-5">
              <FormField
                label="YouTube or Vimeo URL"
                name="embedVideoUrl"
                defaultValue={profile.embedVideoUrl ?? ""}
                hint="Optional."
                error={fieldErrors.embedVideoUrl}
              />
              <VideoPicker
                label="Intro video"
                hint="MP4 or WebM · up to 40 MB."
                error={fieldErrors.introVideoUrl}
                value={introVideoUrl}
                onChange={(url) => {
                  setDirty(true);
                  setIntroVideoUrl(url);
                }}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Professional links"
          description="Fill in the profiles visitors should see. Username or full URL."
        >
          <ProfessionalLinksEditor
            links={links}
            error={fieldErrors.links}
            onChange={(next) => {
              setDirty(true);
              setLinks(next);
            }}
          />
        </SectionCard>

        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-xs text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</p>
          <button
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-accent disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {pending ? "Publishing…" : "Publish about page"}
          </button>
        </div>
      </form>
    </div>
  );
}
