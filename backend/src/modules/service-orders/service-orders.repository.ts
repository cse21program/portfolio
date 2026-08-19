import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import {
  openServiceOrderStatuses,
  type ServiceOrderRecord,
  type ServiceOrderStatus,
} from "./service-orders.types";

type OrderRow = {
  id: string;
  userId: string;
  serviceSlug: string;
  serviceTitle: string;
  packageName: string;
  requirements: string;
  budget: string;
  timeline: string;
  status: string;
  adminNote: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  canceledAt: Date | null;
  user?: { id: string; email: string; name: string | null } | null;
};

function toRecord(row: OrderRow): ServiceOrderRecord {
  const status = (row.status as ServiceOrderStatus) || "pending";
  return {
    id: row.id,
    userId: row.userId,
    serviceSlug: row.serviceSlug,
    serviceTitle: row.serviceTitle,
    packageName: row.packageName,
    requirements: row.requirements,
    budget: row.budget,
    timeline: row.timeline,
    status,
    adminNote: row.adminNote,
    source: row.source === "admin" ? "admin" : "self",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    canceledAt: row.canceledAt ? row.canceledAt.toISOString() : null,
    service: null,
    user: row.user ?? undefined,
  };
}

const userSelect = { id: true, email: true, name: true } as const;

export const serviceOrdersRepository = {
  async listForUser(userId: string): Promise<ServiceOrderRecord[]> {
    const rows = await prisma.serviceOrder.findMany({
      where: { userId },
      include: { user: { select: userSelect } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toRecord);
  },

  async listAll(): Promise<ServiceOrderRecord[]> {
    const rows = await prisma.serviceOrder.findMany({
      include: { user: { select: userSelect } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toRecord);
  },

  async findById(id: string): Promise<ServiceOrderRecord | null> {
    const row = await prisma.serviceOrder.findUnique({
      where: { id },
      include: { user: { select: userSelect } },
    });
    return row ? toRecord(row) : null;
  },

  async findOpenForUserService(userId: string, serviceSlug: string): Promise<ServiceOrderRecord | null> {
    const row = await prisma.serviceOrder.findFirst({
      where: {
        userId,
        serviceSlug,
        status: { in: [...openServiceOrderStatuses] },
      },
      include: { user: { select: userSelect } },
      orderBy: { createdAt: "desc" },
    });
    return row ? toRecord(row) : null;
  },

  async create(input: {
    userId: string;
    serviceSlug: string;
    serviceTitle: string;
    packageName: string;
    requirements: string;
    budget: string;
    timeline: string;
    source: "self" | "admin";
    status?: ServiceOrderStatus;
  }): Promise<ServiceOrderRecord> {
    const row = await prisma.serviceOrder.create({
      data: {
        userId: input.userId,
        serviceSlug: input.serviceSlug,
        serviceTitle: input.serviceTitle,
        packageName: input.packageName,
        requirements: input.requirements,
        budget: input.budget,
        timeline: input.timeline,
        source: input.source,
        status: input.status ?? "pending",
      },
      include: { user: { select: userSelect } },
    });
    return toRecord(row);
  },

  async update(
    id: string,
    data: { status?: ServiceOrderStatus; adminNote?: string; canceledAt?: Date | null },
  ): Promise<ServiceOrderRecord> {
    try {
      const row = await prisma.serviceOrder.update({
        where: { id },
        data,
        include: { user: { select: userSelect } },
      });
      return toRecord(row);
    } catch {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Order not found", 404);
    }
  },
};
