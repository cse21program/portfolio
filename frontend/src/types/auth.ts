export type UserRole = "CUSTOMER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  imageUrl?: string | null;
  phone?: string;
  country?: string;
  notifyProduct?: boolean;
  notifyMarketing?: boolean;
  role: UserRole;
  emailVerified: boolean;
  status: UserStatus;
  hasPassword: boolean;
  googleLinked: boolean;
};

export type ProfileUpdateInput = {
  name: string;
  phone: string;
  country: string;
  notifyProduct: boolean;
  notifyMarketing: boolean;
};

export type AuthPayload = {
  user: AuthUser;
};

export type EmailVerificationStatus = {
  alreadyVerified?: boolean;
};

export function userInitials(user: Pick<AuthUser, "name" | "email"> | null | undefined) {
  const name = user?.name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
    return `${first}${last}`.toUpperCase();
  }
  return (user?.email?.[0] ?? "A").toUpperCase();
}

export function profileGaps(user: AuthUser | null | undefined) {
  if (!user) {
    return [];
  }
  const gaps: string[] = [];
  if (!user.imageUrl) {
    gaps.push("a photo");
  }
  if (!user.phone?.trim()) {
    gaps.push("a phone number");
  }
  if (!user.country?.trim()) {
    gaps.push("your country");
  }
  return gaps;
}
