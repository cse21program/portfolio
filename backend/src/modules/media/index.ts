import type { AppModule } from "@common/types/module";
import { mediaRouter } from "./media.routes";

export const mediaModule: AppModule = {
  name: "media",
  basePath: "/media",
  router: mediaRouter,
};
