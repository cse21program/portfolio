import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChip, FilterSearch, FilterToolbar } from "@/components/ui/FilterBar";
import { AuthError } from "@/features/auth/AuthForm";
import { useOrders } from "@/features/checkout/useOrders";
import { cartKindLabel } from "@/types/cart";
import { formatOrderDate, orderStatusLabel, type OrderStatus } from "@/types/order";

type StatusFilter = "all" | "awaiting" | OrderStatus;

function matchesFilter(status: OrderStatus, filter: StatusFilter) {
  if (filter === "all") {
    return true;
  }
  if (filter === "awaiting") {
    return status === "pending_payment" || status === "processing" || status === "failed";
  }
  return status === filter;
}

export function DashboardPurchasesPage() {
  const { orders, loading, error, cancelOrder } = useOrders();
  const [pendingNumber, setPendingNumber] = useState("");
  const [leaveError, setLeaveError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  async function cancel(orderNumber: string) {
    setLeaveError("");
    setPendingNumber(orderNumber);
    try {
      await cancelOrder(orderNumber);
    } catch (caught) {
      setLeaveError(caught instanceof Error ? caught.message : "Could not cancel this order");
    } finally {
      setPendingNumber("");
    }
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (!matchesFilter(order.status, filter)) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const haystack = [
        order.orderNumber,
        order.status,
        ...order.items.map((item) => `${item.kind} ${item.title} ${item.packageName}`),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [filter, orders, query]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Account</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Purchases</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Checkout orders from the cart. Pay through an enabled gateway; course seats are granted after a
          successful payment. Service inquiries live under Orders.
        </p>
      </div>
      {leaveError ? <AuthError>{leaveError}</AuthError> : null}
      {error ? <AuthError>{error}</AuthError> : null}

      {orders.length > 0 ? (
        <FilterToolbar>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
            <FilterChip label="Awaiting payment" active={filter === "awaiting"} onClick={() => setFilter("awaiting")} />
            <FilterChip label="Paid" active={filter === "paid"} onClick={() => setFilter("paid")} />
            <FilterChip label="Canceled" active={filter === "canceled"} onClick={() => setFilter("canceled")} />
          </div>
          <FilterSearch
            id="my-order-search"
            label="Search purchases"
            value={query}
            placeholder="Order number or title"
            resultLabel={`${visible.length} ${visible.length === 1 ? "order" : "orders"}`}
            filtering={query.trim().length > 0 || filter !== "all"}
            onChange={setQuery}
            onClear={() => {
              setQuery("");
              setFilter("all");
            }}
          />
        </FilterToolbar>
      ) : null}

      {loading && orders.length === 0 ? (
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      ) : error && orders.length === 0 ? null : orders.length === 0 ? (
        <EmptyState
          title="No purchases yet"
          description="Paid courses, tutorials, and service packages check out from the cart."
          action={{ label: "Open cart", to: "/cart" }}
        />
      ) : visible.length === 0 ? (
        <EmptyState title="No orders in this view" description="Try another status or clear the search." />
      ) : (
        <ul className="space-y-3">
          {visible.map((order) => (
            <li key={order.id} className="rounded-[1.75rem] border border-line bg-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[0.16em] text-muted uppercase">
                    {orderStatusLabel(order.status)} · {formatOrderDate(order.createdAt)}
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-ink">{order.orderNumber}</h2>
                  <p className="mt-2 text-sm text-ink-soft">
                    {order.items
                      .map((item) => `${cartKindLabel(item.kind)}${item.packageName ? ` · ${item.packageName}` : ""}`)
                      .join(", ")}
                  </p>
                  <p className="mt-1 text-sm text-ink">{order.summary.totalLabel}</p>
                </div>
                <Link
                  to={`/checkout/thanks/${order.orderNumber}`}
                  className="text-sm font-medium text-accent hover:text-accent-dark"
                >
                  {order.status === "paid" || order.status === "refunded" ? "View order →" : "Pay now →"}
                </Link>
              </div>
              {order.status === "pending_payment" || order.status === "failed" || order.status === "processing" ? (
                <button
                  type="button"
                  className="mt-4 text-sm font-medium text-accent hover:text-accent-dark disabled:opacity-60"
                  disabled={pendingNumber === order.orderNumber}
                  onClick={() => void cancel(order.orderNumber)}
                >
                  {pendingNumber === order.orderNumber ? "Cancelling…" : "Cancel order"}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
