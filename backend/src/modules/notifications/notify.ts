import { logger } from "@common/utils/logger";
import { authRepository } from "../auth/auth.repository";
import type { NotificationType } from "../../generated/prisma/client";
import { notificationsRepository } from "./notifications.repository";

const PRODUCT_TYPES = new Set<NotificationType>([
  "PURCHASE_SUCCESSFUL",
  "PAYMENT_FAILED",
  "COURSE_ENROLLMENT",
  "SERVICE_ORDER_CREATED",
  "ORDER_STATUS_CHANGED",
  "COURSE_COMPLETED",
]);

export type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
};

export async function notifyInApp(input: NotifyInput) {
  try {
    const user = await authRepository.findById(input.userId);
    if (!user || user.status === "DELETED") {
      return;
    }
    if (PRODUCT_TYPES.has(input.type) && !user.notifyProduct) {
      return;
    }
    await notificationsRepository.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href?.trim() ?? "",
    });
  } catch (error) {
    logger.error("notifications.failed", {
      userId: input.userId,
      type: input.type,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function notifyAdmins(input: Omit<NotifyInput, "userId"> & { exceptUserId?: string }) {
  const admins = await authRepository.listActiveAdmins();
  await Promise.all(
    admins
      .filter((admin) => admin.id !== input.exceptUserId)
      .map((admin) =>
        notifyInApp({
          userId: admin.id,
          type: input.type,
          title: input.title,
          body: input.body,
          href: input.href,
        }),
      ),
  );
}
