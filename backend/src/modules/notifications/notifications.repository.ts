import { prisma } from "@common/database/prisma";
import type { NotificationType } from "../../generated/prisma/client";

export type NotificationRecord = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

function toRecord(row: {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  readAt: Date | null;
  createdAt: Date;
}): NotificationRecord {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export const notificationsRepository = {
  create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    href: string;
  }) {
    return prisma.notification
      .create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          body: data.body,
          href: data.href,
        },
      })
      .then(toRecord);
  },

  createMany(
    rows: Array<{
      userId: string;
      type: NotificationType;
      title: string;
      body: string;
      href: string;
    }>,
  ) {
    if (rows.length === 0) {
      return Promise.resolve();
    }
    return prisma.notification.createMany({ data: rows });
  },

  listForUser(userId: string, take = 50) {
    return prisma.notification
      .findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take,
      })
      .then((rows) => rows.map(toRecord));
  },

  countUnread(userId: string) {
    return prisma.notification.count({
      where: { userId, readAt: null },
    });
  },

  findForUser(id: string, userId: string) {
    return prisma.notification.findFirst({ where: { id, userId } }).then((row) => (row ? toRecord(row) : null));
  },

  markRead(id: string, userId: string) {
    return prisma.notification
      .updateMany({
        where: { id, userId, readAt: null },
        data: { readAt: new Date() },
      })
      .then(() => prisma.notification.findFirst({ where: { id, userId } }))
      .then((row) => (row ? toRecord(row) : null));
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  },
};
