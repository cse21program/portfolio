import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { useAuth } from "@/features/auth/AuthContext";
import { useCart } from "@/features/cart/CartContext";
import { OrderLineList, OrderTotals } from "@/features/checkout/orderUi";
import { apiPost } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import {
  collectErrors,
  validateAccepted,
  validateAddress,
  validateCity,
  validateCountry,
  validateEmail,
  validateName,
  validatePhone,
  validatePostal,
  validateRequired,
} from "@/lib/validation";
import { notifyCartChanged } from "@/types/cart";
import { paymentMethodOptions, type CommerceOrder, type PaymentMethod } from "@/types/order";

type CheckoutFields =
  | "billingName"
  | "billingEmail"
  | "billingPhone"
  | "country"
  | "address"
  | "city"
  | "postal"
  | "paymentMethod"
  | "termsAccepted";

export function CheckoutPage() {
  const { user } = useAuth();
  const { cart, loading, reload } = useCart();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const {
    fieldErrors,
    formError,
    setFieldError,
    clearField,
    resetErrors,
    applyFieldErrors,
    applyCaughtError,
  } = useFormErrors<CheckoutFields>();

  if (!user) {
    return (
      <Container className="py-16">
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Checkout</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Checkout</h1>
        <p className="mt-3 max-w-xl text-ink-soft">Sign in to place an order from your cart.</p>
        <div className="mt-8">
          <Link
            to="/login"
            state={{ from: "/checkout" }}
            className="inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper shadow-sm transition hover:bg-accent"
          >
            Sign in
          </Link>
        </div>
      </Container>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    resetErrors();

    const payload = {
      billingName: String(data.get("billingName") ?? ""),
      billingEmail: String(data.get("billingEmail") ?? ""),
      billingPhone: String(data.get("billingPhone") ?? ""),
      country: String(data.get("country") ?? ""),
      address: String(data.get("address") ?? ""),
      city: String(data.get("city") ?? ""),
      postal: String(data.get("postal") ?? ""),
      paymentMethod,
      termsAccepted,
    };

    const errors = collectErrors<CheckoutFields>({
      billingName: validateName(payload.billingName),
      billingEmail: validateEmail(payload.billingEmail),
      billingPhone: validatePhone(payload.billingPhone),
      country: validateRequired(payload.country, "Country") ?? validateCountry(payload.country),
      address: validateAddress(payload.address),
      city: validateCity(payload.city),
      postal: validatePostal(payload.postal),
      paymentMethod: payload.paymentMethod ? undefined : "Choose a payment method",
      termsAccepted: validateAccepted(payload.termsAccepted, "Accept the terms to place the order"),
    });

    if (applyFieldErrors(errors) || !payload.paymentMethod) {
      return;
    }

    setPending(true);
    try {
      const result = await apiPost<{ order: CommerceOrder }>("/checkout", {
        ...payload,
        paymentMethod: payload.paymentMethod,
      });
      notifyCartChanged();
      await reload();
      navigate(`/checkout/thanks/${result.order.orderNumber}`);
    } catch (caught) {
      applyCaughtError(caught, "Could not place that order");
    } finally {
      setPending(false);
    }
  }

  const items = cart.items;
  const ready = cart.checkoutReady;

  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Checkout</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Place order</h1>
        <p className="mt-3 text-ink-soft">
          Billing, a payment preference, and terms. Payment is not collected in this step, so access stays
          locked until it is paid.
        </p>
      </div>

      {formError ? (
        <div className="mt-6">
          <AuthError>{formError}</AuthError>
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <div className="mt-8 h-40 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      ) : items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Cart is empty"
            description="Add a paid course, tutorial, or service package, then come back to check out."
            action={{ label: "Open cart", to: "/cart" }}
          />
        </div>
      ) : !ready ? (
        <div className="mt-8">
          <EmptyState
            title="Cart needs a change"
            description="Remove unavailable items before checkout."
            action={{ label: "Open cart", to: "/cart" }}
          />
        </div>
      ) : (
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18.5rem]">
          <form
            className="rounded-[1.75rem] border border-line bg-surface p-6 shadow-[0_1px_0_rgb(26_22_18/0.04)] sm:p-8"
            onSubmit={(event) => void handleSubmit(event)}
            noValidate
          >
            <div className="space-y-5">
              <div>
                <p className="text-xs tracking-[0.16em] text-muted uppercase">You</p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <FormField
                    label="Name"
                    name="billingName"
                    autoComplete="name"
                    defaultValue={user.name ?? ""}
                    error={fieldErrors.billingName}
                    onChange={() => clearField("billingName")}
                    onBlur={(event) => setFieldError("billingName", validateName(event.target.value))}
                  />
                  <FormField
                    label="Email"
                    name="billingEmail"
                    type="email"
                    autoComplete="email"
                    defaultValue={user.email}
                    error={fieldErrors.billingEmail}
                    onChange={() => clearField("billingEmail")}
                    onBlur={(event) => setFieldError("billingEmail", validateEmail(event.target.value))}
                  />
                  <FormField
                    label="Phone"
                    name="billingPhone"
                    type="tel"
                    autoComplete="tel"
                    hint="Optional"
                    defaultValue={user.phone ?? ""}
                    error={fieldErrors.billingPhone}
                    onChange={() => clearField("billingPhone")}
                    onBlur={(event) => setFieldError("billingPhone", validatePhone(event.target.value))}
                  />
                  <FormField
                    label="Country"
                    name="country"
                    autoComplete="country-name"
                    defaultValue={user.country ?? ""}
                    error={fieldErrors.country}
                    onChange={() => clearField("country")}
                    onBlur={(event) =>
                      setFieldError(
                        "country",
                        validateRequired(event.target.value, "Country") ?? validateCountry(event.target.value),
                      )
                    }
                  />
                </div>
              </div>

              <div className="border-t border-line pt-6">
                <p className="text-xs tracking-[0.16em] text-muted uppercase">Address</p>
                <div className="mt-4 space-y-5">
                  <FormField
                    label="Street address"
                    name="address"
                    autoComplete="street-address"
                    error={fieldErrors.address}
                    onChange={() => clearField("address")}
                    onBlur={(event) => setFieldError("address", validateAddress(event.target.value))}
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      label="City"
                      name="city"
                      autoComplete="address-level2"
                      error={fieldErrors.city}
                      onChange={() => clearField("city")}
                      onBlur={(event) => setFieldError("city", validateCity(event.target.value))}
                    />
                    <FormField
                      label="Postal code"
                      name="postal"
                      autoComplete="postal-code"
                      error={fieldErrors.postal}
                      onChange={() => clearField("postal")}
                      onBlur={(event) => setFieldError("postal", validatePostal(event.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-line pt-6">
                <p className="text-xs tracking-[0.16em] text-muted uppercase">Payment method</p>
                <p className="mt-2 text-sm text-ink-soft">
                  Record a preference. No card number is stored, and nothing is charged yet.
                </p>
                <fieldset className="mt-4 space-y-3" aria-invalid={fieldErrors.paymentMethod ? true : undefined}>
                  <legend className="sr-only">Payment method</legend>
                  {paymentMethodOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
                        paymentMethod === option.value ? "border-accent bg-accent/5" : "border-line bg-paper/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        className="mt-1 accent-accent"
                        value={option.value}
                        checked={paymentMethod === option.value}
                        onChange={() => {
                          setPaymentMethod(option.value);
                          clearField("paymentMethod");
                        }}
                      />
                      <span>
                        <span className="font-medium text-ink">{option.label}</span>
                        <span className="mt-0.5 block text-muted">{option.hint}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                {fieldErrors.paymentMethod ? (
                  <p className="mt-2 text-sm text-accent" role="alert">
                    {fieldErrors.paymentMethod}
                  </p>
                ) : null}
              </div>

              <div className="border-t border-line pt-6">
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-line accent-accent"
                    checked={termsAccepted}
                    onChange={(event) => {
                      setTermsAccepted(event.target.checked);
                      clearField("termsAccepted");
                    }}
                  />
                  <span>
                    <span className="text-ink">I accept the terms for this order</span>
                    <span className="mt-0.5 block text-muted">
                      This records a purchase request. Payment, seats, and service work come after.
                    </span>
                  </span>
                </label>
                {fieldErrors.termsAccepted ? (
                  <p className="mt-2 text-sm text-accent" role="alert">
                    {fieldErrors.termsAccepted}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:opacity-60"
                disabled={pending}
              >
                {pending ? "Placing…" : "Place order"}
              </button>
              <Link to="/cart" className="text-sm font-medium text-accent hover:text-accent-dark">
                Back to cart
              </Link>
            </div>
          </form>

          <aside className="space-y-5 lg:sticky lg:top-8">
            <div className="rounded-[1.75rem] border border-line bg-surface p-6">
              <p className="text-xs tracking-[0.16em] text-muted uppercase">Products</p>
              <div className="mt-4">
                <OrderLineList items={items} />
              </div>
              <div className="mt-5 border-t border-line pt-5">
                <OrderTotals summary={cart.summary} />
              </div>
            </div>
          </aside>
        </div>
      )}
    </Container>
  );
}
