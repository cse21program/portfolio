import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { AuthError } from "@/features/auth/AuthForm";
import { useAuth } from "@/features/auth/AuthContext";
import { OrderLineList, OrderTotals } from "@/features/checkout/orderUi";
import { apiGet, apiPost } from "@/lib/api";
import { formatOrderDate, orderStatusLabel, type CommerceOrder } from "@/types/order";
import {
  defaultProviderForMethod,
  paymentStatusLabel,
  type Payment,
  type PaymentProvider,
  type PaymentProviderId,
} from "@/types/payment";

function checkoutPath(url: string) {
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    /* fall through */
  }
  return url;
}

export function CheckoutThanksPage() {
  const { orderNumber = "" } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<CommerceOrder | null>(null);
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [provider, setProvider] = useState<PaymentProviderId | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user || !orderNumber) {
      setOrder(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiGet<{ order: CommerceOrder }>(`/orders/${orderNumber}`, { cache: "no-store" }),
      apiGet<{ providers: PaymentProvider[] }>("/payments/providers", { cache: "no-store" }),
    ])
      .then(([orderPayload, providerPayload]) => {
        if (cancelled) {
          return;
        }
        setOrder(orderPayload.order);
        const listed = providerPayload.providers ?? [];
        setProviders(listed);
        const fromOrder = orderPayload.order.payment?.provider;
        setProvider(
          fromOrder && listed.some((item) => item.id === fromOrder)
            ? fromOrder
            : defaultProviderForMethod(orderPayload.order.paymentMethod, listed),
        );
        setError("");
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

  useEffect(() => {
    const paymentId = order?.payment?.id;
    if (!user || !paymentId || searchParams.get("paid") !== "1") {
      return;
    }
    let cancelled = false;
    apiPost<{ payment: Payment; order: CommerceOrder | null }>(`/payments/${paymentId}/sync`)
      .then((payload) => {
        if (!cancelled && payload.order) {
          setOrder(payload.order);
        }
      })
      .catch(() => {
        /* webhook or a later confirm can still mark this paid */
      });
    return () => {
      cancelled = true;
    };
  }, [order?.payment?.id, searchParams, user]);

  async function startPayment() {
    if (!order || !provider) {
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await apiPost<{ payment: Payment; checkoutUrl: string }>("/payments", {
        orderNumber: order.orderNumber,
        provider,
      });
      const path = checkoutPath(result.checkoutUrl);
      if (path.startsWith("http")) {
        window.location.assign(path);
        return;
      }
      navigate(path);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start payment");
    } finally {
      setPending(false);
    }
  }

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

  const payable = order && (order.status === "pending_payment" || order.status === "failed" || order.status === "processing");

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
            <p className="text-xs tracking-[0.16em] text-accent uppercase">
              {order.status === "paid" ? "Paid" : "Received"}
            </p>
            <h1 className="mt-2 font-display text-4xl text-ink">Order {order.orderNumber}</h1>
            <p className="mt-3 text-ink-soft">
              {orderStatusLabel(order.status)} · {formatOrderDate(order.createdAt)}.
              {order.status === "paid"
                ? " Course seats from this order are granted. Service work still starts from a catalog request."
                : order.payment?.provider === "bank"
                  ? " Transfer to the published account, then report it. Course seats are granted after the payment is confirmed."
                  : " Choose an enabled gateway to pay. Card numbers stay with the provider — this site never stores a PAN."}
            </p>
            {error ? (
              <div className="mt-6">
                <AuthError>{error}</AuthError>
              </div>
            ) : null}
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
                <dt className="text-muted">Gateway</dt>
                <dd className="mt-1 text-ink">
                  {order.payment
                    ? `${order.payment.providerName} · ${paymentStatusLabel(order.payment.status)}`
                    : "Not started"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted">Billing address</dt>
                <dd className="mt-1 text-ink">
                  {order.billing.address}, {order.billing.city} {order.billing.postal}, {order.billing.country}
                </dd>
              </div>
            </dl>
            {payable ? (
              providers.length === 0 ? (
                <div className="mt-8 border-t border-line pt-6">
                  <EmptyState
                    title="Payments are not configured"
                    description="The site owner still needs to enable a gateway in Studio → Payments."
                  />
                </div>
              ) : (
              <div className="mt-8 border-t border-line pt-6">
                <p className="text-xs tracking-[0.16em] text-muted uppercase">Pay now</p>
                <fieldset className="mt-4 space-y-3">
                  <legend className="sr-only">Payment provider</legend>
                  {providers.map((item) => (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
                        provider === item.id ? "border-accent bg-accent/5" : "border-line bg-paper/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="provider"
                        className="mt-1 accent-accent"
                        value={item.id}
                        checked={provider === item.id}
                        onChange={() => setProvider(item.id)}
                      />
                      <span>
                        <span className="font-medium text-ink">{item.name}</span>
                        <span className="mt-0.5 block text-muted">{item.hint}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <button
                  type="button"
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:opacity-60"
                  disabled={pending || !provider}
                  onClick={() => void startPayment()}
                >
                  {pending ? "Opening…" : "Continue to payment"}
                </button>
              </div>
              )
            ) : (
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink to="/dashboard/purchases">View purchases</ButtonLink>
                <ButtonLink to="/courses" variant="secondary">
                  Browse courses
                </ButtonLink>
              </div>
            )}
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
