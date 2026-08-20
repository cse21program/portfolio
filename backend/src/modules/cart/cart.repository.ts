import { prisma } from "@common/database/prisma";
import type { CartItemKind } from "./cart.types";

export const cartRepository = {
  findCoupon(code: string) {
    return prisma.coupon.findUnique({ where: { code } });
  },

  getOrCreateCart(userId: string) {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { items: { orderBy: { createdAt: "asc" } } },
    });
  },

  findItem(id: string) {
    return prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    });
  },

  addItem(
    cartId: string,
    data: {
      kind: CartItemKind;
      slug: string;
      title: string;
      packageName: string;
      href: string;
      thumbnailUrl: string | null;
      unitLabel: string;
      unitCents: number;
      currency: string;
    },
  ) {
    return prisma.cartItem.upsert({
      where: {
        cartId_kind_slug_packageName: {
          cartId,
          kind: data.kind,
          slug: data.slug,
          packageName: data.packageName,
        },
      },
      update: {
        title: data.title,
        href: data.href,
        thumbnailUrl: data.thumbnailUrl,
        unitLabel: data.unitLabel,
        unitCents: data.unitCents,
        currency: data.currency,
      },
      create: {
        cartId,
        ...data,
        quantity: 1,
      },
    });
  },

  updateItem(
    id: string,
    data: {
      quantity?: number;
      title?: string;
      href?: string;
      thumbnailUrl?: string | null;
      unitLabel?: string;
      unitCents?: number;
      currency?: string;
    },
  ) {
    return prisma.cartItem.update({ where: { id }, data });
  },

  deleteItem(id: string) {
    return prisma.cartItem.delete({ where: { id } });
  },

  clearItems(cartId: string) {
    return prisma.cartItem.deleteMany({ where: { cartId } });
  },

  setCoupon(cartId: string, couponCode: string) {
    return prisma.cart.update({
      where: { id: cartId },
      data: { couponCode },
    });
  },
};
