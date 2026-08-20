export const cartItemKinds = ["course", "tutorial", "service"] as const;
export type CartItemKind = (typeof cartItemKinds)[number];

export type CatalogOffer = {
  kind: CartItemKind;
  slug: string;
  title: string;
  packageName: string;
  href: string;
  thumbnailUrl: string | null;
  unitLabel: string;
  unitCents: number;
  currency: string;
};

export type CartItemRecord = CatalogOffer & {
  id: string;
  quantity: number;
  lineCents: number;
  lineLabel: string;
  available: boolean;
};

export type CartSummary = {
  itemCount: number;
  subtotalCents: number;
  subtotalLabel: string;
  discountCents: number;
  discountLabel: string;
  taxCents: number;
  taxLabel: string;
  totalCents: number;
  totalLabel: string;
  currency: string;
  couponCode: string;
  couponPercentOff: number | null;
};

export type CartRecord = {
  items: CartItemRecord[];
  summary: CartSummary;
  checkoutReady: boolean;
};
