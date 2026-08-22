import { AppError, ErrorCode } from "@common/errors/AppError";
import { notificationsRepository } from "./notifications.repository";

export const notificationsService = {
  async listMine(userId: string) {
    const [notifications, unreadCount] = await Promise.all([
      notificationsRepository.listForUser(userId),
      notificationsRepository.countUnread(userId),
    ]);
    return { notifications, unreadCount };
  },

  async unreadCount(userId: string) {
    const unreadCount = await notificationsRepository.countUnread(userId);
    return { unreadCount };
  },

  async markRead(id: string, userId: string) {
    const notification = await notificationsRepository.markRead(id, userId);
    if (!notification) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Notification not found", 404);
    }
    return { notification };
  },

  async markAllRead(userId: string) {
    await notificationsRepository.markAllRead(userId);
    return { unreadCount: 0 };
  },
};
