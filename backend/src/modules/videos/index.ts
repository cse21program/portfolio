import type { AppModule } from "@common/types/module";
import { videosRouter } from "./videos.routes";

export const videosModule: AppModule = {
  name: "videos",
  basePath: "/videos",
  router: videosRouter,
};
