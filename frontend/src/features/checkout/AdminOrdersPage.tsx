import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FilterChip, FilterGroups, FilterRow, FilterSearch, FilterToolbar } from "@/components/ui/FilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { cartKindLabel } from "@/types/cart";
import {
  formatOrderDate,
  orderStatusLabel,
  type CommerceOrder,
  type OrderStatus,
} from "@/types/order";

type StatusFilter = "all" | "awaiting" | OrderStatus;
type KindFilter = "all" | "course" | "tutorial" | "service";

function matchesStatus(order: CommerceOrder, filter: StatusFilter) {
  if (filter === "all") {
    return true;
  }
  if (filter === "awaiting") {
    return order.status === "pending_payment" || order.status === "processing" || order.status === "failed";
  }
  return order.status === filter;
}

function canCancel(order: CommerceOrder) {
  return order.status === "pending_payment" || order.status === "processing" || order.status === "failed";
}

function OrderCard({
  order,
  expanded,
  pending,
  onToggle,
  onConfirm,
  onRefund,
  onCancel,
  onSaveNote,
}: {
  order: CommerceOrder;
  expanded: boolean;
  pending: string;
  onToggle: () => void;
  onConfirm: (id: string) => void;
  onRefund: (id: string) => void;
  onCancel: (orderNumber: string) => void;
  onSaveNote: (orderNumber: string, adminNote: string) => Promise<void>;
}) {
  const [note, setNote] = useState(order.adminNote ?? "");
  const busy = pending.startsWith(`${order.id}:`) || pending === order.orderNumber;

  useEffect(() => {
    setNote(order.adminNote ?? "");
  }, [order.adminNote]);

  return (
    <li className="rounded-[1.75rem] border border-line bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs tracking-[0.16em] text-muted uppercase">
            {orderStatusLabel(order.status)} · {formatOrderDate(order.createdAt)} · {order.paymentMethodLabel}
          </p>
          <h2 className="mt-2 font-display text-2xl text-ink">{order.orderNumber}</h2>
          <p className="mt-2 text-sm text-ink-soft">
            {order.user?.name || order.billing.name} · {order.user?.email || order.billing.email}
          </p>
          <ul className="mt-3 space-y-1 text-sm break-words text-ink">
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
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            className="text-sm font-medium text-accent hover:text-accent-dark"
            aria-expanded={expanded}
            onClick={onToggle}
          >
            {expanded ? "Collapse" : "Manage"}
          </button>
          <Link
            to={`/checkout/thanks/${order.orderNumber}`}
            className="text-sm font-medium text-accent hover:text-accent-dark"
          >
            Open order →
          </Link>
        </div>
      </div>

      {expanded ? (
        <div className="mt-6 space-y-5 border-t border-line pt-5">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Billing</dt>
              <dd className="mt-1 text-ink">
                {order.billing.address}, {order.billing.city} {order.billing.postal}, {order.billing.country}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Payment</dt>
              <dd className="mt-1 text-ink">
                {order.payment
                  ? `${order.payment.providerName} · ${order.payment.status}`
                  : `${order.paymentMethodLabel} · not started`}
              </dd>
            </div>
          </dl>
          {order.payment?.provider === "bank" &&
          typeof order.payment.metadata.reference === "string" &&
          order.payment.metadata.reference ? (
            <p className="text-sm text-ink-soft">Transfer reference · {order.payment.metadata.reference}</p>
          ) : order.payment?.provider === "bank" && order.payment.metadata.reported ? (
            <p className="text-sm text-ink-soft">Customer reported a transfer.</p>
          ) : null}

          <FormTextArea
            label="Studio note"
            name={`note-${order.id}`}
            hint="Internal. The customer does not see this."
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition hover:border-accent disabled:opacity-60"
              disabled={busy || note.trim() === (order.adminNote ?? "").trim()}
              onClick={() => void onSaveNote(order.orderNumber, note)}
            >
              {pending === `${order.id}:note` ? "Saving…" : "Save note"}
            </button>
            {order.payment?.provider === "bank" &&
            (order.payment.status === "pending" || order.payment.status === "processing") ? (
              <button
                type="button"
                className="text-sm font-medium text-accent hover:text-accent-dark disabled:opacity-60"
                disabled={busy}
                onClick={() => onConfirm(order.payment!.id)}
              >
                {pending === `${order.id}:confirm` ? "Confirming…" : "Confirm transfer"}
              </button>
            ) : null}
            {order.payment?.status === "paid" ? (
              <button
                type="button"
                className="text-sm font-medium text-accent hover:text-accent-dark disabled:opacity-60"
                disabled={busy}
                onClick={() => onRefund(order.payment!.id)}
              >
                {pending === `${order.id}:refund` ? "Refunding…" : "Refund"}
              </button>
            ) : null}
            {canCancel(order) ? (
              <button
                type="button"
                className="text-sm font-medium text-accent hover:text-accent-dark disabled:opacity-60"
                disabled={busy}
                onClick={() => onCancel(order.orderNumber)}
              >
                {pending === order.orderNumber ? "Cancelling…" : "Cancel order"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<CommerceOrder[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("awaiting");
  const [kind, setKind] = useState<KindFilter>("all");
  const [openId, setOpenId] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ orders: CommerceOrder[] }>("/orders/admin", { cache: "no-store" });
      setOrders(payload.orders ?? []);
      setError("");
    } catch {
      setError("Could not load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function refund(id: string) {
    setPending(`${orders.find((item) => item.payment?.id === id)?.id ?? id}:refund`);
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
    setPending(`${orders.find((item) => item.payment?.id === id)?.id ?? id}:confirm`);
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

  async function cancel(orderNumber: string) {
    setPending(orderNumber);
    setError("");
    try {
      await apiPatch(`/orders/admin/${orderNumber}`, { status: "canceled" });
      await reload();
    } catch {
      setError("Could not cancel this order");
    } finally {
      setPending("");
    }
  }

  async function saveNote(orderNumber: string, adminNote: string) {
    const order = orders.find((item) => item.orderNumber === orderNumber);
    setPending(`${order?.id ?? orderNumber}:note`);
    setError("");
    try {
      const payload = await apiPatch<{ order: CommerceOrder }>(`/orders/admin/${orderNumber}`, { adminNote });
      setOrders((current) => current.map((item) => (item.id === payload.order.id ? payload.order : item)));
    } catch {
      setError("Could not save that note");
    } finally {
      setPending("");
    }
  }

  const awaitingCount = orders.filter((order) => matchesStatus(order, "awaiting")).length;
  const paidCount = orders.filter((order) => order.status === "paid").length;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (!matchesStatus(order, filter)) {
        return false;
      }
      if (kind !== "all" && !order.items.some((item) => item.kind === kind)) {
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
        order.adminNote ?? "",
        ...order.items.map((item) => `${item.kind} ${item.title} ${item.packageName}`),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [filter, kind, orders, query]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Studio</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Orders</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Checkout orders for courses, tutorials, and priced service packages. Search, filter, add a Studio
          note, confirm bank transfers, or refund. Catalog service requests stay under Service orders.
        </p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surface px-4 py-3">
            <dt className="text-xs tracking-[0.16em] text-muted uppercase">Awaiting payment</dt>
            <dd className="mt-1 font-display text-2xl text-ink">{awaitingCount}</dd>
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

      {!loading || orders.length > 0 ? (
        <FilterToolbar>
          <FilterSearch
            id="order-search"
            label="Search orders"
            value={query}
            placeholder="Order number, email, product, or note"
            resultLabel={`${visible.length} ${visible.length === 1 ? "order" : "orders"}`}
            filtering={query.trim().length > 0 || filter !== "awaiting" || kind !== "all"}
            onChange={setQuery}
            onClear={() => {
              setQuery("");
              setFilter("awaiting");
              setKind("all");
            }}
          />
          <FilterGroups>
            <FilterRow label="Status" groupLabel="Filter by status">
              <FilterChip label="Awaiting payment" active={filter === "awaiting"} onClick={() => setFilter("awaiting")} />
              <FilterChip label="Paid" active={filter === "paid"} onClick={() => setFilter("paid")} />
              <FilterChip label="Refunded" active={filter === "refunded"} onClick={() => setFilter("refunded")} />
              <FilterChip label="Canceled" active={filter === "canceled"} onClick={() => setFilter("canceled")} />
              <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
            </FilterRow>
            <FilterRow label="Product" groupLabel="Filter by product">
              <FilterChip label="All products" active={kind === "all"} onClick={() => setKind("all")} />
              <FilterChip label="Courses" active={kind === "course"} onClick={() => setKind("course")} />
              <FilterChip label="Tutorials" active={kind === "tutorial"} onClick={() => setKind("tutorial")} />
              <FilterChip label="Services" active={kind === "service"} onClick={() => setKind("service")} />
            </FilterRow>
          </FilterGroups>
        </FilterToolbar>
      ) : null}

      {loading && orders.length === 0 ? (
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      ) : error && orders.length === 0 ? null : orders.length === 0 ? (
        <EmptyState
          title="No checkout orders yet"
          description="Paid courses, tutorials, and service packages from the cart land here."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No orders in this view"
          description="Paid checkouts and bank transfers waiting for confirmation show here."
        />
      ) : (
        <ul className="[overflow-anchor:none] space-y-3">
          {visible.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={openId === order.id}
              pending={pending}
              onToggle={() => setOpenId((current) => (current === order.id ? "" : order.id))}
              onConfirm={(id) => void confirm(id)}
              onRefund={(id) => void refund(id)}
              onCancel={(orderNumber) => void cancel(orderNumber)}
              onSaveNote={saveNote}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
