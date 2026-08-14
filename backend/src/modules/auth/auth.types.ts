export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  token: string;
  password: string;
};

export type VerifyEmailInput = {
  token: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: "CUSTOMER" | "ADMIN";
  emailVerified: boolean;
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type RequestMeta = {
  userAgent?: string;
  ip?: string;
};
