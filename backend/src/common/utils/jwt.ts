import jwt from "jsonwebtoken";
import { env } from "@common/config/env";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
};

export function signAccessToken(user: {
  id: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
}) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (
    typeof payload !== "object" ||
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    (payload.role !== "CUSTOMER" && payload.role !== "ADMIN")
  ) {
    throw new Error("Invalid access token");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  };
}
