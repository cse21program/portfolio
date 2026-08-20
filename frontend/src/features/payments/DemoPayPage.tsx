import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { useAuth } from "@/features/auth/AuthContext";
import { OrderLineList, OrderTotals } from "@/features/checkout/orderUi";
import { apiGet, apiPost } from "@/lib/api";
import type { CommerceOrder } from "@/types/order";
import {
  bankDetailsFromUnknown,
  paymentStatusLabel,
  type BankTransferDetails,
  type Payment,
} from "@/types/payment";

const bankRows: Array<{ key: keyof BankTransferDetails; label: string; copy?: boolean }> = [
  { key: "bankName", label: "Bank" },
  { key: "accountName", label: "Account name", copy: true },
  { key: "accountNumber", label: "Account number", copy: true },
  { key: "branch", label: "Branch" },
  { key: "routingNumber", label: "Routing / sort code", copy: true },
  { key: "swiftBic", label: "SWIFT / BIC", copy: true },
];

function BankDetails({
  details,
  orderNumber,
}: {
  details: BankTransferDetails;
  orderNumber: string;
}) {
  const [copied, setCopied] = useState("");

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied("");
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-line bg-paper/60 p-4 sm:p-5">
      <p className="text-xs tracking-[0.16em] text-muted uppercase">Transfer to</p>
      <dl className="mt-3 space-y-3 text-sm">
        {bankRows.map((row) => {
          const value = details[row.key];
          if (!value) {
            return null;
          }
          return (
            <div key={row.key} className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <dt className="text-muted">{row.label}</dt>
                <dd className="mt-0.5 break-all text-ink">{value}</dd>
              </div>
              {row.copy ? (
                <button
                  type="button"
                  className="text-sm font-medium text-accent hover:text-accent-dark"
                  onClick={() => void copy(row.label, value)}
                >
                  {copied === row.label ? "Copied" : "Copy"}
                </button>
              ) : null}
            </div>
          );
        })}
        <div>
          <dt className="text-muted">Payment reference</dt>
          <dd className="mt-0.5 flex flex-wrap items-center justify-between gap-2 text-ink">
            <span>{orderNumber}</span>
            <button
              type="button"
              className="text-sm font-medium text-accent hover:text-accent-dark"
              onClick={() => void copy("Payment reference", orderNumber)}
            >
              {copied === "Payment reference" ? "Copied" : "Copy"}
            </button>
          </dd>
        </div>
      </dl>
      {details.instructions ? <p className="mt-4 text-sm text-ink-soft">{details.instructions}</p> : null}
    </div>
  );
}

export function DemoPayPage() {
  const { paymentId = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [order, setOrder] = useState<CommerceOrder | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState("");
  const [reference, setReference] = useState("");

  useEffect(() => {
    if (!user || !paymentId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    apiGet<{ payment: Payment; order: CommerceOrder | null }>(`/payments/${paymentId}`, { cache: "no-store" })
      .then((payload) => {
        if (!cancelled) {
          setPayment(payload.payment);
          setOrder(payload.order);
          const stored = payload.payment.metadata.reference;
          setReference(typeof stored === "string" ? stored : "");
          setError("");
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Could not load this payment");
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
  }, [paymentId, user]);

  async function confirmLive() {
    if (!payment) {
      return;
    }
    setPending("sync");
    setError("");
    try {
      const result = await apiPost<{ payment: Payment; order: CommerceOrder | null }>(
        `/payments/${payment.id}/sync`,
      );
      setPayment(result.payment);
      setOrder(result.order);
      if (result.payment.status === "paid") {
        const number = result.order?.orderNumber ?? result.payment.orderNumber;
        navigate(`/checkout/thanks/${number}`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not confirm this payment");
    } finally {
      setPending("");
    }
  }

  async function reportTransfer() {
    if (!payment) {
      return;
    }
    setPending("report");
    setError("");
    setNotice("");
    try {
      const result = await apiPost<{ payment: Payment; order: CommerceOrder | null }>(
        `/payments/${payment.id}/report`,
        { reference },
      );
      setPayment(result.payment);
      setOrder(result.order);
      setNotice("Transfer reported. Access is granted after the site owner confirms the payment.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not report this transfer");
    } finally {
      setPending("");
    }
  }

  async function complete(action: "succeed" | "fail" | "cancel") {
    if (!payment) {
      return;
    }
    setPending(action);
    setError("");
    try {
      const result = await apiPost<{ payment: Payment; order: CommerceOrder | null }>(
        `/payments/${payment.id}/demo`,
        { action },
      );
      const number = result.order?.orderNumber ?? result.payment.orderNumber;
      navigate(`/checkout/thanks/${number}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not complete this payment");
    } finally {
      setPending("");
    }
  }

  if (!user) {
    return (
      <Container className="py-16">
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Payment</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Checkout</h1>
        <p className="mt-3 max-w-xl text-ink-soft">Sign in to finish this payment.</p>
        <div className="mt-8">
          <ButtonLink to="/login">Sign in</ButtonLink>
        </div>
      </Container>
    );
  }

  const open = payment && (payment.status === "pending" || payment.status === "processing");
  const bank = payment ? bankDetailsFromUnknown(payment.metadata.bank) : null;
  const isBank = payment?.provider === "bank";
  const reported = Boolean(payment?.metadata.reported);

  return (
    <Container className="py-12 sm:py-16">
      {loading ? (
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      ) : !payment ? (
        <div>
          {error ? <AuthError>{error}</AuthError> : null}
          <div className="mt-6">
            <EmptyState
              title="Payment not found"
              description="That checkout session is not on this account."
              action={{ label: "View purchases", to: "/dashboard/purchases" }}
            />
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18.5rem]">
          <div className="rounded-[1.75rem] border border-line bg-surface p-6 sm:p-8">
            <p className="text-xs tracking-[0.16em] text-accent uppercase">
              {isBank ? "Bank transfer" : payment.demo ? "Demo checkout" : "Live checkout"}
            </p>
            <h1 className="mt-2 font-display text-4xl text-ink">{payment.providerName}</h1>
            <p className="mt-3 text-ink-soft">
              {paymentStatusLabel(payment.status)}.{" "}
              {isBank && (bank || !payment.demo)
                ? reported
                  ? "The transfer is waiting for confirmation. Course seats are granted after it is confirmed."
                  : "Send the exact amount using the order number as the reference, then report the transfer."
                : payment.demo
                  ? "This on-site demo uses the same adapter contract as live gateways. No card number is stored."
                  : "Finish payment on the provider site. Return here if the order is still processing."}
            </p>
            {error ? (
              <div className="mt-6">
                <AuthError>{error}</AuthError>
              </div>
            ) : null}
            {notice ? <p className="mt-6 text-sm text-ink-soft">{notice}</p> : null}
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Order</dt>
                <dd className="mt-1 text-ink">{payment.orderNumber}</dd>
              </div>
              <div>
                <dt className="text-muted">Amount</dt>
                <dd className="mt-1 text-ink">
                  {payment.amountLabel} {payment.currency}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Transaction</dt>
                <dd className="mt-1 break-all text-ink">{payment.transactionId}</dd>
              </div>
            </dl>
            {isBank && bank ? <BankDetails details={bank} orderNumber={payment.orderNumber} /> : null}
            {open && isBank && (bank || !payment.demo) ? (
              <div className="mt-8 space-y-4">
                <FormField
                  label="Your transfer reference (optional)"
                  name="bank-reference"
                  hint="Bank receipt number or the last digits of the sending account."
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:opacity-60"
                    disabled={Boolean(pending)}
                    onClick={() => void reportTransfer()}
                  >
                    {pending === "report" ? "Reporting…" : reported ? "Update transfer report" : "I've transferred"}
                  </button>
                  {payment.demo ? (
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent disabled:opacity-60"
                      disabled={Boolean(pending)}
                      onClick={() => void complete("succeed")}
                    >
                      {pending === "succeed" ? "Paying…" : "Mark paid (demo)"}
                    </button>
                  ) : null}
                  {payment.demo ? (
                    <button
                      type="button"
                      className="text-sm font-medium text-accent hover:text-accent-dark disabled:opacity-60"
                      disabled={Boolean(pending)}
                      onClick={() => void complete("cancel")}
                    >
                      {pending === "cancel" ? "Cancelling…" : "Cancel"}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : open ? (
              payment.demo ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:opacity-60"
                    disabled={Boolean(pending)}
                    onClick={() => void complete("succeed")}
                  >
                    {pending === "succeed" ? "Paying…" : `Pay ${payment.amountLabel} (demo)`}
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent disabled:opacity-60"
                    disabled={Boolean(pending)}
                    onClick={() => void complete("fail")}
                  >
                    {pending === "fail" ? "Failing…" : "Simulate failure"}
                  </button>
                  <button
                    type="button"
                    className="text-sm font-medium text-accent hover:text-accent-dark disabled:opacity-60"
                    disabled={Boolean(pending)}
                    onClick={() => void complete("cancel")}
                  >
                    {pending === "cancel" ? "Cancelling…" : "Cancel"}
                  </button>
                </div>
              ) : (
                <div className="mt-8 flex flex-wrap gap-3">
                  {typeof payment.metadata.checkoutUrl === "string" ? (
                    <a
                      href={String(payment.metadata.checkoutUrl)}
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent"
                    >
                      Open {payment.providerName}
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent disabled:opacity-60"
                    disabled={Boolean(pending)}
                    onClick={() => void confirmLive()}
                  >
                    {pending === "sync" ? "Checking…" : "I already paid"}
                  </button>
                </div>
              )
            ) : (
              <div className="mt-8">
                <ButtonLink to={`/checkout/thanks/${payment.orderNumber}`}>Back to order</ButtonLink>
              </div>
            )}
          </div>
          {order ? (
            <aside className="rounded-[1.75rem] border border-line bg-surface p-6">
              <p className="text-xs tracking-[0.16em] text-muted uppercase">Products</p>
              <div className="mt-4">
                <OrderLineList items={order.items} />
              </div>
              <div className="mt-5 border-t border-line pt-5">
                <OrderTotals summary={order.summary} />
              </div>
              <p className="mt-4 text-sm text-ink-soft">
                <Link to={`/checkout/thanks/${order.orderNumber}`} className="font-medium text-accent hover:text-accent-dark">
                  Order details →
                </Link>
              </p>
            </aside>
          ) : null}
        </div>
      )}
    </Container>
  );
}
