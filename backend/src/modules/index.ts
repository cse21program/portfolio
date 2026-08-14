import type { Express } from "express";
import type { AppModule } from "@common/types/module";
import { healthModule } from "./health";
import { authModule } from "./auth";
import { usersModule } from "./users";
import { portfolioModule } from "./portfolio";
import { educationModule } from "./education";
import { experienceModule } from "./experience";
import { projectsModule } from "./projects";
import { skillsModule } from "./skills";
import { fieldsModule } from "./fields";
import { topicsModule } from "./topics";
import { certificatesModule } from "./certificates";
import { blogsModule } from "./blogs";
import { tutorialsModule } from "./tutorials";
import { coursesModule } from "./courses";
import { enrollmentsModule } from "./enrollments";
import { servicesModule } from "./services";
import { cartModule } from "./cart";
import { ordersModule } from "./orders";
import { paymentsModule } from "./payments";
import { reviewsModule } from "./reviews";
import { contactModule } from "./contact";
import { notificationsModule } from "./notifications";
import { mediaModule } from "./media";
import { analyticsModule } from "./analytics";
import { searchModule } from "./search";
import { adminModule } from "./admin";
import { auditModule } from "./audit";

export const modules: AppModule[] = [
  healthModule,
  authModule,
  usersModule,
  portfolioModule,
  educationModule,
  experienceModule,
  projectsModule,
  skillsModule,
  fieldsModule,
  topicsModule,
  certificatesModule,
  blogsModule,
  tutorialsModule,
  coursesModule,
  enrollmentsModule,
  servicesModule,
  cartModule,
  ordersModule,
  paymentsModule,
  reviewsModule,
  contactModule,
  notificationsModule,
  mediaModule,
  analyticsModule,
  searchModule,
  adminModule,
  auditModule,
];

export function registerModules(app: Express, apiPrefix: string) {
  for (const mod of modules) {
    app.use(`${apiPrefix}${mod.basePath}`, mod.router);
  }
}
