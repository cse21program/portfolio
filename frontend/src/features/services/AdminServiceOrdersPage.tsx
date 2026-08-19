import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FilterSearch, FilterToolbar } from "@/components/ui/FilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, FormSelect } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { publishedServices, useServices } from "@/features/services/useServices";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors, validateEmail, validateRequired } from "@/lib/validation";
import { serviceOrderStatusLabel, type ServiceOrder, type ServiceOrderStatus } from "@/types/serviceOrder";

type GrantFields = "email" | "serviceSlug";

const statusOptions: ServiceOrderStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
  "delivered",
  "revision_requested",
  "completed",
  "cancelled",
];

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function AdminServiceOrdersPage() {
  const { services } = useServices();
  const published = publishedServices(services);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState("");
  const {
    fieldErrors,
    formError,
    setFieldError,
    clearField,
    resetErrors,
    applyFieldErrors,
    applyCaughtError,
  } = useFormErrors<GrantFields>();

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ orders: ServiceOrder[] }>("/service-orders/admin", { cache: "no-store" });
      setOrders(payload.orders ?? []);
      setError("");
    } catch {
      setError("Could not load orders");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return orders;
    }
    return orders.filter((item) => {
      const haystack = [
        item.user?.email ?? "",
        item.user?.name ?? "",
        item.serviceTitle,
        item.serviceSlug,
        item.status,
        item.packageName,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [orders, query]);

  async function grantOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email"));
    const serviceSlug = String(data.get("serviceSlug"));
    resetErrors();
    setNote("");
    setError("");
    if (
      applyFieldErrors(
        collectErrors({
          email: validateEmail(email),
          serviceSlug: validateRequired(serviceSlug, "Service"),
        }),
      )
    ) {
      return;
    }
    setPending("grant");
    try {
      await apiPost("/service-orders/admin", { email, serviceSlug });
      form.reset();
      setNote("Order created.");
      await reload();
    } catch (caught) {
      applyCaughtError(caught, "Could not create that order");
    } finally {
      setPending("");
    }
  }

  async function updateStatus(id: string, status: ServiceOrderStatus) {
    setPending(id);
    setError("");
    try {
      await apiPatch(`/service-orders/admin/${id}`, { status });
      await reload();
    } catch {
      setError("Could not update this order");
    } finally {
      setPending("");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Studio</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Service orders</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Requests from the catalog land here. Confirm, start work, mark delivery, or close. Payment is
          not wired yet, so there is no paid state to fake.
        </p>
      </div>

      <section className="space-y-5 rounded-3xl border border-line bg-surface p-6 sm:p-7">
        <div>
          <h2 className="font-display text-2xl text-ink">Create an order</h2>
          <p className="mt-1 text-sm text-muted">The client must already have an account.</p>
        </div>
        <form className="space-y-4" onSubmit={grantOrder} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Client email"
              name="email"
              type="email"
              autoComplete="email"
              error={fieldErrors.email}
              onChange={() => clearField("email")}
              onBlur={(event) => setFieldError("email", validateEmail(event.target.value))}
            />
            <FormSelect
              label="Service"
              name="serviceSlug"
              error={fieldErrors.serviceSlug}
              onChange={() => clearField("serviceSlug")}
              defaultValue=""
            >
              <option value="">Select a published service</option>
              {published.map((service) => (
                <option key={service.slug} value={service.slug}>
                  {service.title}
                </option>
              ))}
            </FormSelect>
          </div>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:opacity-60"
            disabled={pending === "grant"}
          >
            {pending === "grant" ? "Creating…" : "Create order"}
          </button>
        </form>
        {formError ? <AuthError>{formError}</AuthError> : null}
        {note ? <p className="text-sm text-ink-soft">{note}</p> : null}
      </section>

      {error ? <AuthError>{error}</AuthError> : null}

      <FilterToolbar>
        <FilterSearch
          id="search-orders"
          label="Search orders"
          value={query}
          placeholder="Email, name, or service"
          resultLabel={`${visible.length} ${visible.length === 1 ? "order" : "orders"}`}
          filtering={query.trim().length > 0}
          onChange={setQuery}
          onClear={() => setQuery("")}
        />
      </FilterToolbar>

      {visible.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Catalog requests and Studio-created orders will show here."
          action={{ label: "Edit services", to: "/admin/services" }}
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((order) => (
            <li key={order.id} className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link to={`/services/${order.serviceSlug}`} className="font-display text-2xl text-ink hover:text-accent-dark">
                    {order.serviceTitle}
                  </Link>
                  <p className="mt-1 text-sm text-ink-soft">
                    {order.user?.name || "Unnamed"} · {order.user?.email}
                    {order.packageName ? ` · ${order.packageName}` : ""}
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">{order.requirements}</p>
                  <p className="mt-2 text-xs text-muted">{formatWhen(order.createdAt)}</p>
                </div>
                <FormSelect
                  label="Status"
                  name={`status-${order.id}`}
                  value={order.status}
                  disabled={pending === order.id}
                  onChange={(event) => void updateStatus(order.id, event.target.value as ServiceOrderStatus)}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {serviceOrderStatusLabel(status)}
                    </option>
                  ))}
                </FormSelect>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
