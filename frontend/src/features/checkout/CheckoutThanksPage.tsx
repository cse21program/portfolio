import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { AuthError } from "@/features/auth/AuthForm";
import { useAuth } from "@/features/auth/AuthContext";
import { OrderLineList, OrderTotals } from "@/features/checkout/orderUi";
import { apiGet } from "@/lib/api";
import { formatOrderDate, orderStatusLabel, type CommerceOrder } from "@/types/order";

export function CheckoutThanksPage() {
  const { orderNumber = "" } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<CommerceOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !orderNumber) {
      setOrder(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiGet<{ order: CommerceOrder }>(`/orders/${orderNumber}`, { cache: "no-store" })
      .then((payload) => {
        if (!cancelled) {
          setOrder(payload.order);
          setError("");
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setOrder(null);
          setError(caught instanceof Error ? caught.message : "Could not load that order");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [orderNumber, user]);

  if (!user) {
    return (
      <Container className="py-16">
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Checkout</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Order received</h1>
        <p className="mt-3 max-w-xl text-ink-soft">Sign in to view this order.</p>
        <div className="mt-8">
          <ButtonLink to="/login">Sign in</ButtonLink>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12 sm:py-16">
      {loading ? (
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      ) : !order ? (
        <div>
          {error ? <AuthError>{error}</AuthError> : null}
          <div className="mt-6">
            <EmptyState
              title="Order not found"
              description="That purchase is not on this account."
              action={{ label: "View purchases", to: "/dashboard/purchases" }}
            />
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18.5rem]">
          <div className="rounded-[1.75rem] border border-line bg-surface p-6 sm:p-8">
            <p className="text-xs tracking-[0.16em] text-accent uppercase">Received</p>
            <h1 className="mt-2 font-display text-4xl text-ink">Order {order.orderNumber}</h1>
            <p className="mt-3 text-ink-soft">
              {orderStatusLabel(order.status)} · {formatOrderDate(order.createdAt)}. Payment is next, so
              course seats and service work are not granted from this step.
            </p>
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Customer</dt>
                <dd className="mt-1 text-ink">{order.billing.name}</dd>
              </div>
              <div>
                <dt className="text-muted">Email</dt>
                <dd className="mt-1 text-ink">{order.billing.email}</dd>
              </div>
              <div>
                <dt className="text-muted">Payment method</dt>
                <dd className="mt-1 text-ink">{order.paymentMethodLabel}</dd>
              </div>
              <div>
                <dt className="text-muted">Billing address</dt>
                <dd className="mt-1 text-ink">
                  {order.billing.address}, {order.billing.city} {order.billing.postal}, {order.billing.country}
                </dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/dashboard/purchases">View purchases</ButtonLink>
              <ButtonLink to="/courses" variant="secondary">
                Browse courses
              </ButtonLink>
            </div>
          </div>
          <aside className="rounded-[1.75rem] border border-line bg-surface p-6">
            <p className="text-xs tracking-[0.16em] text-muted uppercase">Products</p>
            <div className="mt-4">
              <OrderLineList items={order.items} />
            </div>
            <div className="mt-5 border-t border-line pt-5">
              <OrderTotals summary={order.summary} />
            </div>
            <p className="mt-4 text-sm text-ink-soft">
              <Link to="/dashboard/purchases" className="font-medium text-accent hover:text-accent-dark">
                All purchases →
              </Link>
            </p>
          </aside>
        </div>
      )}
    </Container>
  );
}
