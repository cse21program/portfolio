import { prisma } from "@common/database/prisma";
import type { FollowTargetType } from "../../generated/prisma/client";

export type FollowRecord = {
  id: string;
  userId: string;
  targetType: FollowTargetType;
  targetKey: string;
  createdAt: string;
};

export type FollowAdminRow = {
  userId: string;
  name: string;
  email: string;
  createdAt: string;
};

function toRecord(row: {
  id: string;
  userId: string;
  targetType: FollowTargetType;
  targetKey: string;
  createdAt: Date;
}): FollowRecord {
  return {
    id: row.id,
    userId: row.userId,
    targetType: row.targetType,
    targetKey: row.targetKey,
    createdAt: row.createdAt.toISOString(),
  };
}

export const followsRepository = {
  upsert(userId: string, targetType: FollowTargetType, targetKey: string) {
    return prisma.follow
      .upsert({
        where: {
          userId_targetType_targetKey: { userId, targetType, targetKey },
        },
        create: { userId, targetType, targetKey },
        update: {},
      })
      .then(toRecord);
  },

  remove(userId: string, targetType: FollowTargetType, targetKey: string) {
    return prisma.follow.deleteMany({
      where: { userId, targetType, targetKey },
    });
  },

  isFollowing(userId: string, targetType: FollowTargetType, targetKey: string) {
    return prisma.follow
      .findUnique({
        where: {
          userId_targetType_targetKey: { userId, targetType, targetKey },
        },
        select: { id: true },
      })
      .then((row) => Boolean(row));
  },

  count(targetType: FollowTargetType, targetKey: string) {
    return prisma.follow.count({ where: { targetType, targetKey } });
  },

  listActiveFollowerIds(
    targetType: FollowTargetType,
    targetKey: string,
    exceptUserId?: string,
  ) {
    return prisma.follow
      .findMany({
        where: {
          targetType,
          targetKey,
          ...(exceptUserId ? { userId: { not: exceptUserId } } : {}),
          user: { status: "ACTIVE" },
        },
        select: { userId: true },
      })
      .then((rows) => rows.map((row) => row.userId));
  },

  async listAdmin(
    targetType: FollowTargetType,
    targetKey: string,
    page: number,
    limit: number,
  ) {
    const where = { targetType, targetKey };
    const [total, rows] = await prisma.$transaction([
      prisma.follow.count({ where }),
      prisma.follow.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true, status: true },
          },
        },
      }),
    ]);

    const follows: FollowAdminRow[] = rows.map((row) => ({
      userId: row.user.id,
      name: row.user.name?.trim() || "",
      email: row.user.email,
      createdAt: row.createdAt.toISOString(),
    }));

    return { total, follows };
  },
};
