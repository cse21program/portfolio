import { z } from "zod";

export const followAdminQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const followAdminUserParamsSchema = z.object({
  userId: z.uuid("Follower id must be a UUID"),
});

export type FollowAdminQuery = z.infer<typeof followAdminQuerySchema>;
