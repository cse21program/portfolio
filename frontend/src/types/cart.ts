export const cartItemKinds = ["course", "tutorial", "service"] as const;
export type CartItemKind = (typeof cartItemKinds)[number];

export type CartItem = {
  id: string;
  kind: CartItemKind;
  slug: string;
  title: string;
  packageName: string;
  href: string;
  thumbnailUrl: string | null;
  unitLabel: string;
  unitCents: number;
  currency: string;
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

export type Cart = {
  items: CartItem[];
  summary: CartSummary;
  checkoutReady: boolean;
};

export const emptyCart: Cart = {
  items: [],
  summary: {
    itemCount: 0,
    subtotalCents: 0,
    subtotalLabel: "$0",
    discountCents: 0,
    discountLabel: "$0",
    taxCents: 0,
    taxLabel: "$0",
    totalCents: 0,
    totalLabel: "$0",
    currency: "USD",
    couponCode: "",
    couponPercentOff: null,
  },
  checkoutReady: false,
};

export function cartKindLabel(kind: string) {
  if (kind === "course") {
    return "Course";
  }
  if (kind === "tutorial") {
    return "Tutorial";
  }
  if (kind === "service") {
    return "Service";
  }
  return kind;
}

export const CART_CHANGED = "portfolio-cart";

export function notifyCartChanged() {
  window.dispatchEvent(new Event(CART_CHANGED));
}
