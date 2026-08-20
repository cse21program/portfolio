import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FilterChip, FilterSearch, FilterToolbar } from "@/components/ui/FilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { AuthError } from "@/features/auth/AuthForm";
import { apiGet, apiPost } from "@/lib/api";
import { cartKindLabel } from "@/types/cart";
import {
  formatOrderDate,
  orderStatusLabel,
  type CommerceOrder,
  type OrderStatus,
} from "@/types/order";

type StatusFilter = "all" | OrderStatus;

function matchesFilter(order: CommerceOrder, filter: StatusFilter) {
  if (filter === "all") {
    return true;
  }
  if (filter === "pending_payment") {
    return order.status === "pending_payment" || order.status === "processing" || order.status === "failed";
  }
  return order.status === filter;
}

export function AdminPurchasesPage() {
  const [orders, setOrders] = useState<CommerceOrder[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("pending_payment");
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ orders: CommerceOrder[] }>("/orders/admin", { cache: "no-store" });
      setOrders(payload.orders ?? []);
      setError("");
    } catch {
      setError("Could not load purchases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function refund(id: string) {
    setPending(`refund:${id}`);
    setError("");
    try {
      await apiPost(`/payments/${id}/refund`);
      await reload();
    } catch {
      setError("Could not refund this payment");
    } finally {
      setPending("");
    }
  }

  async function confirm(id: string) {
    setPending(`confirm:${id}`);
    setError("");
    try {
      await apiPost(`/payments/${id}/confirm`);
      await reload();
    } catch {
      setError("Could not confirm this transfer");
    } finally {
      setPending("");
    }
  }

  const pendingCount = orders.filter(
    (order) => order.status === "pending_payment" || order.status === "processing" || order.status === "failed",
  ).length;
  const paidCount = orders.filter((order) => order.status === "paid").length;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (!matchesFilter(order, filter)) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const haystack = [
        order.orderNumber,
        order.billing.name,
        order.billing.email,
        order.user?.email ?? "",
        order.user?.name ?? "",
        order.status,
        order.paymentMethodLabel,
        ...order.items.map((item) => item.title),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [filter, orders, query]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Studio</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Purchases</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Checkout orders and payments. A paid webhook grants course seats. Catalog service requests stay
          under Service orders.
        </p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surface px-4 py-3">
            <dt className="text-xs tracking-[0.16em] text-muted uppercase">Awaiting payment</dt>
            <dd className="mt-1 font-display text-2xl text-ink">{pendingCount}</dd>
          </div>
          <div className="rounded-2xl border border-line bg-surface px-4 py-3">
            <dt className="text-xs tracking-[0.16em] text-muted uppercase">Paid</dt>
            <dd className="mt-1 font-display text-2xl text-ink">{paidCount}</dd>
          </div>
          <div className="rounded-2xl border border-line bg-surface px-4 py-3">
            <dt className="text-xs tracking-[0.16em] text-muted uppercase">All</dt>
            <dd className="mt-1 font-display text-2xl text-ink">{orders.length}</dd>
          </div>
        </dl>
      </div>

      {error ? <AuthError>{error}</AuthError> : null}

      <FilterToolbar>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          <FilterChip
            label="Awaiting payment"
            active={filter === "pending_payment"}
            onClick={() => setFilter("pending_payment")}
          />
          <FilterChip label="Paid" active={filter === "paid"} onClick={() => setFilter("paid")} />
          <FilterChip label="Canceled" active={filter === "canceled"} onClick={() => setFilter("canceled")} />
          <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
        </div>
        <FilterSearch
          id="purchase-search"
          label="Search purchases"
          value={query}
          placeholder="Order number, email, or title"
          resultLabel={`${visible.length} ${visible.length === 1 ? "purchase" : "purchases"}`}
          filtering={query.trim().length > 0 || filter !== "pending_payment"}
          onChange={setQuery}
          onClear={() => {
            setQuery("");
            setFilter("pending_payment");
          }}
        />
      </FilterToolbar>

      {loading && orders.length === 0 ? (
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No purchases in this view"
          description="Paid checkouts show here. Bank transfers wait here until you confirm them."
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((order) => (
            <li key={order.id} className="rounded-[1.75rem] border border-line bg-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[0.16em] text-muted uppercase">
                    {orderStatusLabel(order.status)} · {formatOrderDate(order.createdAt)} ·{" "}
                    {order.paymentMethodLabel}
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-ink">{order.orderNumber}</h2>
                  <p className="mt-2 text-sm text-ink-soft">
                    {order.user?.name || order.billing.name} · {order.user?.email || order.billing.email}
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-ink">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {cartKindLabel(item.kind)}
                        {item.packageName ? ` · ${item.packageName}` : ""} — {item.title} · {item.lineLabel}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm font-medium text-ink">
                    Total {order.summary.totalLabel}
                    {order.payment ? ` · ${order.payment.providerName}` : ""}
                  </p>
                  {order.payment?.provider === "bank" &&
                  typeof order.payment.metadata.reference === "string" &&
                  order.payment.metadata.reference ? (
                    <p className="mt-2 text-sm text-ink-soft">
                      Transfer reference · {order.payment.metadata.reference}
                    </p>
                  ) : order.payment?.provider === "bank" && order.payment.metadata.reported ? (
                    <p className="mt-2 text-sm text-ink-soft">Customer reported a transfer.</p>
                  ) : null}
                  {order.payment?.provider === "bank" &&
                  (order.payment.status === "pending" || order.payment.status === "processing") ? (
                    <button
                      type="button"
                      className="mt-3 text-sm font-medium text-accent hover:text-accent-dark disabled:opacity-60"
                      disabled={pending === `confirm:${order.payment.id}`}
                      onClick={() => void confirm(order.payment!.id)}
                    >
                      {pending === `confirm:${order.payment.id}` ? "Confirming…" : "Confirm transfer"}
                    </button>
                  ) : null}
                  {order.payment?.status === "paid" ? (
                    <button
                      type="button"
                      className="mt-3 block text-sm font-medium text-accent hover:text-accent-dark disabled:opacity-60"
                      disabled={pending === `refund:${order.payment.id}`}
                      onClick={() => void refund(order.payment!.id)}
                    >
                      {pending === `refund:${order.payment.id}` ? "Refunding…" : "Refund"}
                    </button>
                  ) : null}
                </div>
                <Link
                  to={`/checkout/thanks/${order.orderNumber}`}
                  className="text-sm font-medium text-accent hover:text-accent-dark"
                >
                  Open order →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
