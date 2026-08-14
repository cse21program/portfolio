import { AppError, ErrorCode } from "@common/errors/AppError";
import type { LoginInput, RegisterInput } from "./auth.types";
import { authRepository } from "./auth.repository";

export const authService = {
  async register(_input: RegisterInput) {
    throw new AppError(
      ErrorCode.NOT_IMPLEMENTED,
      "Registration will be implemented in the authentication phase",
      501,
    );
  },

  async login(_input: LoginInput) {
    throw new AppError(
      ErrorCode.NOT_IMPLEMENTED,
      "Login will be implemented in the authentication phase",
      501,
    );
  },

  async logout() {
    throw new AppError(
      ErrorCode.NOT_IMPLEMENTED,
      "Logout will be implemented in the authentication phase",
      501,
    );
  },

  async me(_userId: string) {
    return authRepository.findById(_userId);
  },
};
