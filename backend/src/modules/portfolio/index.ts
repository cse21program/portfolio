import type { AppModule } from "@common/types/module";
import { portfolioRouter } from "./portfolio.routes";

export const portfolioModule: AppModule = {
  name: "portfolio",
  basePath: "/portfolio",
  router: portfolioRouter,
};
