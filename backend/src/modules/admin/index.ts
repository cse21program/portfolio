import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import type { AppModule } from "@common/types/module";
import { adminController } from "./admin.controller";

const router = Router();

router.get(
  "/dashboard",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => adminController.dashboard(req, res)),
);

export const adminModule: AppModule = {
  name: "admin",
  basePath: "/admin",
  router,
};
