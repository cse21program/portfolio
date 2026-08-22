import { AppError, ErrorCode } from "@common/errors/AppError";
import { logger } from "@common/utils/logger";
import { authRepository } from "../auth/auth.repository";
import { siteAccessService } from "../site-access/site-access.service";
import { STUDIO_FOLLOW_TARGET } from "./follows.constants";
import { followsRepository } from "./follows.repository";

async function studioStatus(userId?: string) {
  const [following, followerCount] = await Promise.all([
    userId
      ? followsRepository.isFollowing(userId, STUDIO_FOLLOW_TARGET.type, STUDIO_FOLLOW_TARGET.key)
      : Promise.resolve(false),
    followsRepository.count(STUDIO_FOLLOW_TARGET.type, STUDIO_FOLLOW_TARGET.key),
  ]);
  return { following, followerCount };
}

async function assertActiveUser(userId: string) {
  const user = await authRepository.findById(userId);
  if (!user || user.status === "DELETED") {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Authentication required", 401);
  }
  if (user.status === "SUSPENDED") {
    throw new AppError(ErrorCode.FORBIDDEN, "This account cannot follow right now", 403);
  }
  return user;
}

export const followsService = {
  getStudio(userId?: string) {
    return studioStatus(userId);
  },

  async followStudio(userId: string) {
    const actor = await assertActiveUser(userId);
    await siteAccessService.assertOpen("follow", { id: actor.id, role: actor.role });
    await followsRepository.upsert(userId, STUDIO_FOLLOW_TARGET.type, STUDIO_FOLLOW_TARGET.key);
    logger.info("follows.created", { userId, target: STUDIO_FOLLOW_TARGET.key });
    return studioStatus(userId);
  },

  async unfollowStudio(userId: string) {
    await assertActiveUser(userId);
    await followsRepository.remove(userId, STUDIO_FOLLOW_TARGET.type, STUDIO_FOLLOW_TARGET.key);
    logger.info("follows.removed", { userId, target: STUDIO_FOLLOW_TARGET.key });
    return studioStatus(userId);
  },

  listStudioAdmin(page: number, limit: number) {
    return followsRepository.listAdmin(STUDIO_FOLLOW_TARGET.type, STUDIO_FOLLOW_TARGET.key, page, limit);
  },

  async removeStudioFollower(userId: string) {
    await followsRepository.remove(userId, STUDIO_FOLLOW_TARGET.type, STUDIO_FOLLOW_TARGET.key);
    logger.info("follows.admin_removed", { userId, target: STUDIO_FOLLOW_TARGET.key });
    return followsRepository.count(STUDIO_FOLLOW_TARGET.type, STUDIO_FOLLOW_TARGET.key);
  },
};
