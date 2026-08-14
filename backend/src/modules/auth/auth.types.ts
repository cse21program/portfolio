export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};
