import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FormField } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { useAuth } from "@/features/auth/AuthContext";
import { ApiRequestError } from "@/lib/api";
import { mediaHref } from "@/lib/mediaUrl";
import { useFormErrors } from "@/lib/useFormErrors";
import {
  collectErrors,
  validateCountry,
  validateName,
  validatePhone,
} from "@/lib/validation";
import { userInitials } from "@/types/auth";

type ProfileFields = "name" | "phone" | "country";

function errorMessage(caught: unknown, fallback: string) {
  if (caught instanceof ApiRequestError) {
    return caught.message;
  }
  return fallback;
}

function AvatarField() {
  const { user, uploadAvatar, removeAvatar } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const photo = mediaHref(user?.imageUrl);

  async function onPick(files: FileList) {
    const file = files[0];
    if (!file) {
      return;
    }
    setBusy(true);
    setUploadError("");
    try {
      await uploadAvatar(file);
    } catch (caught) {
      setUploadError(errorMessage(caught, "Could not upload that photo"));
    } finally {
      setBusy(false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 0) {
      void onPick(files);
    }
    event.target.value = "";
  }

  async function handleRemove() {
    setBusy(true);
    setUploadError("");
    try {
      await removeAvatar();
    } catch (caught) {
      setUploadError(errorMessage(caught, "Could not remove that photo"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-sm text-ink">Profile photo</p>
      <p className="mt-1 text-xs text-muted">Square works best. JPEG, PNG, WebP, or GIF · 5 MB.</p>
      <div className="mt-3 flex items-center gap-4">
        {photo ? (
          <img
            src={photo}
            alt=""
            className="h-16 w-16 rounded-full border border-line bg-paper object-cover"
          />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-full border border-dashed border-line bg-paper font-display text-lg text-ink">
            {userInitials(user)}
          </span>
        )}
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
            disabled={busy}
            onChange={handleChange}
          />
          <button
            className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent disabled:opacity-60"
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Uploading…" : photo ? "Replace" : "Upload"}
          </button>
          {photo ? (
            <button
              className="cursor-pointer text-sm text-muted hover:text-ink disabled:opacity-60"
              type="button"
              disabled={busy}
              onClick={() => void handleRemove()}
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
      {uploadError ? (
        <p className="mt-2 text-sm text-accent" role="alert">
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}

export function DashboardProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [country, setCountry] = useState(user?.country ?? "");
  const [notifyProduct, setNotifyProduct] = useState(user?.notifyProduct !== false);
  const [notifyMarketing, setNotifyMarketing] = useState(user?.notifyMarketing === true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const { fieldErrors, formError, setFieldError, clearField, resetErrors, applyFieldErrors, applyCaughtError } =
    useFormErrors<ProfileFields>();

  useEffect(() => {
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
    setCountry(user?.country ?? "");
    setNotifyProduct(user?.notifyProduct !== false);
    setNotifyMarketing(user?.notifyMarketing === true);
  }, [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetErrors();
    setMessage("");

    if (
      applyFieldErrors(
        collectErrors({
          name: validateName(name),
          phone: validatePhone(phone),
          country: validateCountry(country),
        }),
      )
    ) {
      return;
    }

    setPending(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        country: country.trim(),
        notifyProduct,
        notifyMarketing,
      });
      setMessage("Profile saved.");
    } catch (caught) {
      applyCaughtError(caught, "Could not save profile");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Account</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Profile</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Name, photo, phone, country, and email notices. Password and sign-in stay under Settings.
        </p>
      </div>

      <form
        className="rounded-[1.75rem] border border-line bg-surface p-6 shadow-[0_1px_0_rgb(26_22_18/0.04)] sm:p-8"
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
      >
        <div className="space-y-6">
          <AvatarField />

          <div className="border-t border-line pt-6">
            <p className="text-xs tracking-[0.16em] text-muted uppercase">Details</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <FormField
                label="Name"
                name="name"
                autoComplete="name"
                value={name}
                error={fieldErrors.name}
                onChange={(event) => {
                  setName(event.target.value);
                  clearField("name");
                }}
                onBlur={(event) => setFieldError("name", validateName(event.target.value))}
              />
              <FormField
                label="Email"
                name="email"
                type="email"
                value={user?.email ?? ""}
                readOnly
                hint="Used to sign in. Change is not available yet."
              />
              <FormField
                label="Phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                hint="Optional"
                error={fieldErrors.phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  clearField("phone");
                }}
                onBlur={(event) => setFieldError("phone", validatePhone(event.target.value))}
              />
              <FormField
                label="Country"
                name="country"
                autoComplete="country-name"
                value={country}
                hint="Optional"
                error={fieldErrors.country}
                onChange={(event) => {
                  setCountry(event.target.value);
                  clearField("country");
                }}
                onBlur={(event) => setFieldError("country", validateCountry(event.target.value))}
              />
            </div>
          </div>

          <div className="border-t border-line pt-6">
            <p className="text-xs tracking-[0.16em] text-muted uppercase">Email notices</p>
            <div className="mt-4 space-y-4">
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-line accent-accent"
                  checked={notifyProduct}
                  onChange={(event) => setNotifyProduct(event.target.checked)}
                />
                <span>
                  <span className="text-ink">Product updates</span>
                  <span className="mt-0.5 block text-muted">
                    Enrollment, payments, and in-app notices.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-line accent-accent"
                  checked={notifyMarketing}
                  onChange={(event) => setNotifyMarketing(event.target.checked)}
                />
                <span>
                  <span className="text-ink">Occasional notes</span>
                  <span className="mt-0.5 block text-muted">
                    Newsletter and similar notes. Follow from About or Writing for in-app studio updates.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {formError ? (
          <div className="mt-6">
            <AuthError>{formError}</AuthError>
          </div>
        ) : null}
        {message && !formError ? (
          <p className="mt-6 text-sm text-ink-soft" role="status">
            {message}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:opacity-60"
            disabled={pending}
          >
            {pending ? "Saving…" : "Save profile"}
          </button>
          <Link to="/dashboard/settings" className="text-sm font-medium text-accent hover:text-accent-dark">
            Password and sign-in →
          </Link>
        </div>
      </form>
    </div>
  );
}
