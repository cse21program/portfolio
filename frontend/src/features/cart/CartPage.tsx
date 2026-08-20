import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { useAuth } from "@/features/auth/AuthContext";
import { useCart } from "@/features/cart/CartContext";
import { cartKindLabel } from "@/types/cart";

export function CartPage() {
  const { user } = useAuth();
  const { cart, loading, removeItem, applyCoupon, removeCoupon, clear } = useCart();
  const [coupon, setCoupon] = useState(cart.summary.couponCode);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");

  async function run(label: string, action: () => Promise<void>) {
    setPending(label);
    setError("");
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update the cart");
    } finally {
      setPending("");
    }
  }

  async function handleCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run("coupon", () => applyCoupon(coupon));
  }

  if (!user) {
    return (
      <Container className="py-16">
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Cart</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Your cart</h1>
        <p className="mt-3 max-w-xl text-ink-soft">Sign in to add paid courses, tutorials, and service packages.</p>
        <div className="mt-8">
          <ButtonLink to="/login" variant="primary">
            Sign in
          </ButtonLink>
        </div>
      </Container>
    );
  }

  const items = cart.items;
  const summary = cart.summary;

  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Cart</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Your cart</h1>
        <p className="mt-3 text-ink-soft">
          Paid courses, tutorials, and priced service packages. Checkout records the order; payment is next.
        </p>
      </div>

      {error ? (
        <div className="mt-6">
          <AuthError>{error}</AuthError>
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <div className="mt-8 h-40 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      ) : items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Cart is empty"
            description="Add a paid course, tutorial, or service package from the catalog."
            action={{ label: "Browse courses", to: "/courses" }}
          />
        </div>
      ) : (
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18.5rem]">
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-[1.75rem] border border-line bg-surface p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-[0.16em] text-muted uppercase">
                      {cartKindLabel(item.kind)}
                      {item.packageName ? ` · ${item.packageName}` : ""}
                      {item.available ? "" : " · Unavailable"}
                    </p>
                    <h2 className="mt-2 font-display text-2xl text-ink">
                      <Link to={item.href} className="hover:text-accent">
                        {item.title}
                      </Link>
                    </h2>
                    <p className="mt-2 text-sm text-ink-soft">
                      {item.lineLabel}
                      {item.quantity > 1 ? ` · ${item.quantity}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-sm font-medium text-accent hover:text-accent-dark disabled:opacity-60"
                    disabled={pending === item.id}
                    onClick={() => void run(item.id, () => removeItem(item.id))}
                  >
                    {pending === item.id ? "Removing…" : "Remove"}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <aside className="space-y-5 lg:sticky lg:top-8">
            <div className="rounded-[1.75rem] border border-line bg-surface p-6">
              <p className="text-xs tracking-[0.16em] text-muted uppercase">Summary</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="text-ink">{summary.subtotalLabel}</dd>
                </div>
                {summary.discountCents > 0 ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Discount {summary.couponCode ? `(${summary.couponCode})` : ""}</dt>
                    <dd className="text-ink">−{summary.discountLabel}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Tax</dt>
                  <dd className="text-ink">{summary.taxLabel}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-line pt-3">
                  <dt className="font-medium text-ink">Total</dt>
                  <dd className="font-display text-2xl text-ink">{summary.totalLabel}</dd>
                </div>
              </dl>
              {cart.checkoutReady ? (
                <div className="mt-5">
                  <ButtonLink to="/checkout" variant="primary">
                    Checkout
                  </ButtonLink>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-ink-soft">
                  Remove unavailable items before checkout.
                </p>
              )}
            </div>

            <form className="rounded-[1.75rem] border border-line bg-surface p-6" onSubmit={(event) => void handleCoupon(event)}>
              <FormField
                label="Coupon"
                name="coupon"
                value={coupon}
                onChange={(event) => setCoupon(event.target.value)}
                hint="Optional"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:opacity-60"
                  disabled={pending === "coupon"}
                >
                  {pending === "coupon" ? "Applying…" : "Apply"}
                </button>
                {summary.couponCode ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-accent hover:text-accent-dark"
                    onClick={() => void run("coupon", removeCoupon)}
                  >
                    Remove code
                  </button>
                ) : null}
              </div>
            </form>

            <button
              type="button"
              className="text-sm font-medium text-muted hover:text-ink disabled:opacity-60"
              disabled={pending === "clear"}
              onClick={() => void run("clear", clear)}
            >
              {pending === "clear" ? "Clearing…" : "Clear cart"}
            </button>
          </aside>
        </div>
      )}
    </Container>
  );
}
