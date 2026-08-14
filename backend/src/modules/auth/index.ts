import type { AppModule } from "@common/types/module";
import { authRouter } from "./auth.routes";

export const authModule: AppModule = {
  name: "auth",
  basePath: "/auth",
  router: authRouter,
};
