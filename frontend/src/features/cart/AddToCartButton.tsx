import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { useOptionalCart } from "@/features/cart/CartContext";
import { apiPost } from "@/lib/api";
import { notifyCartChanged, type CartItemKind } from "@/types/cart";

const filled =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60";
const outline =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent/40";

export function AddToCartButton({
  kind,
  slug,
  packageName = "",
  label = "Add to cart",
  primary = true,
}: {
  kind: CartItemKind;
  slug: string;
  packageName?: string;
  label?: string;
  primary?: boolean;
}) {
  const { user } = useAuth();
  const cart = useOptionalCart();
  const location = useLocation();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const inCart = cart?.cart.items.some(
    (item) => item.kind === kind && item.slug === slug && item.packageName === packageName,
  );

  if (!user) {
    return (
      <Link to="/login" state={{ from: location.pathname }} className={primary ? filled : outline}>
        Sign in to add to cart
      </Link>
    );
  }

  if (inCart) {
    return (
      <Link to="/cart" className={primary ? filled : outline}>
        In cart
      </Link>
    );
  }

  async function add() {
    setPending(true);
    setError("");
    try {
      if (cart) {
        await cart.addItem({ kind, slug, packageName });
      } else {
        await apiPost("/cart/items", { kind, slug, packageName });
        notifyCartChanged();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add that item");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-2">
      <button type="button" className={primary ? filled : outline} disabled={pending} onClick={() => void add()}>
        {pending ? "Adding…" : label}
      </button>
      {error ? (
        <span className="text-sm text-accent" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
