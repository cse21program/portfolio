import { z } from "zod";

export const updateSiteAccessSchema = z.object({
  catalogs: z.object({
    projects: z.boolean(),
    skills: z.boolean(),
    blogs: z.boolean(),
    tutorials: z.boolean(),
    courses: z.boolean(),
    services: z.boolean(),
    certificates: z.boolean(),
    experience: z.boolean(),
    education: z.boolean(),
    testimonials: z.boolean(),
    follow: z.boolean(),
  }),
});

export type UpdateSiteAccessInput = z.infer<typeof updateSiteAccessSchema>;
