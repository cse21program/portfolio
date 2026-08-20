import { AppError, ErrorCode } from "@common/errors/AppError";
import { refreshOffer, resolveCatalogOffer } from "./cart.catalog";
import { formatUsd, lineCents } from "./cart.money";
import { cartRepository } from "./cart.repository";
import type { CartItemKind, CartItemRecord, CartRecord, CartSummary } from "./cart.types";
import type { AddCartItemInput, ApplyCouponInput, UpdateCartItemInput } from "./cart.validation";

function emptySummary(couponCode = ""): CartSummary {
  return {
    itemCount: 0,
    subtotalCents: 0,
    subtotalLabel: formatUsd(0),
    discountCents: 0,
    discountLabel: formatUsd(0),
    taxCents: 0,
    taxLabel: formatUsd(0),
    totalCents: 0,
    totalLabel: formatUsd(0),
    currency: "USD",
    couponCode,
    couponPercentOff: null,
  };
}

function buildSummary(
  items: CartItemRecord[],
  couponCode: string,
  percentOff: number | null,
): CartSummary {
  const available = items.filter((item) => item.available);
  const subtotalCents = available.reduce((sum, item) => sum + item.lineCents, 0);
  const discountCents =
    percentOff && percentOff > 0 ? Math.round((subtotalCents * Math.min(percentOff, 100)) / 100) : 0;
  const totalCents = Math.max(0, subtotalCents - discountCents);
  const itemCount = available.reduce((sum, item) => sum + item.quantity, 0);
  return {
    itemCount,
    subtotalCents,
    subtotalLabel: formatUsd(subtotalCents),
    discountCents,
    discountLabel: formatUsd(discountCents),
    taxCents: 0,
    taxLabel: formatUsd(0),
    totalCents,
    totalLabel: formatUsd(totalCents),
    currency: "USD",
    couponCode,
    couponPercentOff: percentOff,
  };
}

async function couponPercent(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { code: "", percentOff: null as number | null };
  }
  const coupon = await cartRepository.findCoupon(normalized);
  if (!coupon || !coupon.active || coupon.percentOff <= 0) {
    return { code: "", percentOff: null as number | null };
  }
  return { code: coupon.code, percentOff: coupon.percentOff };
}

async function toCart(userId: string): Promise<CartRecord> {
  const cart = await cartRepository.getOrCreateCart(userId);
  const items: CartItemRecord[] = [];
  for (const row of cart.items) {
    const offer = await refreshOffer(row.kind as CartItemKind, row.slug, row.packageName, userId);
    const quantity = Math.max(1, row.quantity);
    if (offer) {
      if (
        offer.unitCents !== row.unitCents ||
        offer.unitLabel !== row.unitLabel ||
        offer.title !== row.title
      ) {
        await cartRepository.updateItem(row.id, {
          title: offer.title,
          href: offer.href,
          thumbnailUrl: offer.thumbnailUrl,
          unitLabel: offer.unitLabel,
          unitCents: offer.unitCents,
          currency: offer.currency,
        });
      }
      const line = lineCents(offer.unitCents, quantity);
      items.push({
        ...offer,
        id: row.id,
        quantity,
        lineCents: line,
        lineLabel: formatUsd(line),
        available: true,
      });
    } else {
      const line = lineCents(row.unitCents, quantity);
      items.push({
        id: row.id,
        kind: row.kind as CartItemKind,
        slug: row.slug,
        title: row.title,
        packageName: row.packageName,
        href: row.href,
        thumbnailUrl: row.thumbnailUrl,
        unitLabel: row.unitLabel,
        unitCents: row.unitCents,
        currency: row.currency,
        quantity,
        lineCents: line,
        lineLabel: formatUsd(line),
        available: false,
      });
    }
  }

  const applied = await couponPercent(cart.couponCode);
  if (cart.couponCode && !applied.percentOff) {
    await cartRepository.setCoupon(cart.id, "");
  } else if (applied.code && applied.code !== cart.couponCode) {
    await cartRepository.setCoupon(cart.id, applied.code);
  }

  return {
    items,
    summary: buildSummary(items, applied.code, applied.percentOff),
    checkoutReady: items.length > 0 && items.every((item) => item.available),
  };
}

export const cartService = {
  get(userId: string) {
    return toCart(userId);
  },

  async add(userId: string, input: AddCartItemInput) {
    const offer = await resolveCatalogOffer({
      kind: input.kind,
      slug: input.slug,
      packageName: input.packageName,
      userId,
    });
    const cart = await cartRepository.getOrCreateCart(userId);
    await cartRepository.addItem(cart.id, offer);
    return toCart(userId);
  },

  async update(userId: string, itemId: string, input: UpdateCartItemInput) {
    const item = await cartRepository.findItem(itemId);
    if (!item || item.cart.userId !== userId) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Cart item not found", 404);
    }
    if (item.kind !== "service" && input.quantity !== 1) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Quantity is fixed for this item", 400);
    }
    await cartRepository.updateItem(itemId, { quantity: input.quantity });
    return toCart(userId);
  },

  async remove(userId: string, itemId: string) {
    const item = await cartRepository.findItem(itemId);
    if (!item || item.cart.userId !== userId) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Cart item not found", 404);
    }
    await cartRepository.deleteItem(itemId);
    return toCart(userId);
  },

  async clear(userId: string) {
    const cart = await cartRepository.getOrCreateCart(userId);
    await cartRepository.clearItems(cart.id);
    await cartRepository.setCoupon(cart.id, "");
    return toCart(userId);
  },

  async applyCoupon(userId: string, input: ApplyCouponInput) {
    const applied = await couponPercent(input.code);
    if (!applied.percentOff) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "That code is not valid", 400);
    }
    const cart = await cartRepository.getOrCreateCart(userId);
    await cartRepository.setCoupon(cart.id, applied.code);
    return toCart(userId);
  },

  async removeCoupon(userId: string) {
    const cart = await cartRepository.getOrCreateCart(userId);
    await cartRepository.setCoupon(cart.id, "");
    return toCart(userId);
  },
};
