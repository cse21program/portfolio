import { Link } from "react-router-dom";
import { cartKindLabel } from "@/types/cart";
import type { OrderItem, OrderSummary } from "@/types/order";

export function OrderTotals({ summary }: { summary: OrderSummary }) {
  return (
    <dl className="space-y-3 text-sm">
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
      <div className="flex justify-between gap-4">
        <dt className="text-muted">Currency</dt>
        <dd className="text-ink">{summary.currency}</dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-line pt-3">
        <dt className="font-medium text-ink">Total</dt>
        <dd className="font-display text-2xl text-ink">{summary.totalLabel}</dd>
      </div>
    </dl>
  );
}

export function OrderLineList({ items }: { items: OrderItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl border border-line bg-paper/60 px-4 py-3">
          <p className="text-xs tracking-[0.16em] text-muted uppercase">
            {cartKindLabel(item.kind)}
            {item.packageName ? ` · ${item.packageName}` : ""}
          </p>
          <p className="mt-1 font-medium text-ink">
            <Link to={item.href} className="hover:text-accent">
              {item.title}
            </Link>
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {item.lineLabel}
            {item.quantity > 1 ? ` · ${item.quantity}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
