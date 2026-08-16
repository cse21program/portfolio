export type UserRole = "CUSTOMER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  emailVerified: boolean;
  status: UserStatus;
  hasPassword: boolean;
  googleLinked: boolean;
};

export type AuthPayload = {
  user: AuthUser;
  verificationUrl?: string;
  resetUrl?: string;
  alreadyVerified?: boolean;
};
