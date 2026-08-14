import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { authService } from "./auth.service";
import type { LoginInput, RegisterInput } from "./auth.types";

export const authController = {
  register: async (req: Request, res: Response) => {
    const data = await authService.register(req.body as RegisterInput);
    sendSuccess(res, data, "Account created", 201);
  },

  login: async (req: Request, res: Response) => {
    const data = await authService.login(req.body as LoginInput);
    sendSuccess(res, data, "Logged in");
  },

  logout: async (_req: Request, res: Response) => {
    await authService.logout();
    sendSuccess(res, null, "Logged out");
  },
};
