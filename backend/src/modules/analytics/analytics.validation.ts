import { z } from "zod";

export const pageviewSchema = z.object({
  path: z.string().trim().min(1, "Path is required").max(200, "Path is too long"),
});

export type PageviewInput = z.infer<typeof pageviewSchema>;
