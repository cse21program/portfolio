import { createSign, publicEncrypt, randomBytes } from "node:crypto";
import { env } from "@common/config/env";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { publicBankDetails } from "../providers/catalog";
import {
  paymentProviderCatalog,
  type GatewayCheckoutInput,
  type GatewayCheckoutSession,
  type GatewayWebhookEvent,
  type PaymentGateway,
  type PaymentProviderId,
} from "./gateway";
import { verifyStripeSignature } from "./stripe-signature";

type Credentials = Record<string, string>;

function catalogOf(id: PaymentProviderId) {
  const catalog = paymentProviderCatalog.find((item) => item.id === id);
  if (!catalog) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Unknown payment provider", 400);
  }
  return catalog;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function amountMajor(amountCents: number) {
  return (amountCents / 100).toFixed(2);
}

function sandbox(credentials: Credentials) {
  return (credentials.environment ?? "sandbox").toLowerCase() !== "live";
}

function paidEvent(
  provider: PaymentProviderId,
  transactionId: string,
  input: { amountCents: number; currency: string; metadata?: Record<string, unknown> },
): GatewayWebhookEvent {
  return {
    provider,
    transactionId,
    status: "paid",
    amountCents: input.amountCents,
    currency: input.currency,
    paidAt: new Date().toISOString(),
    metadata: { adapter: "live", ...input.metadata },
  };
}

function statusEvent(
  provider: PaymentProviderId,
  transactionId: string,
  status: GatewayWebhookEvent["status"],
  input: { amountCents?: number; currency?: string; metadata?: Record<string, unknown> } = {},
): GatewayWebhookEvent {
  return {
    provider,
    transactionId,
    status,
    amountCents: input.amountCents ?? 0,
    currency: input.currency ?? "USD",
    paidAt: status === "paid" ? new Date().toISOString() : null,
    metadata: { adapter: "live", ...input.metadata },
  };
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return asRecord(JSON.parse(text) as unknown);
  } catch {
    return { raw: text };
  }
}

async function requestJson(
  name: string,
  url: string,
  init: RequestInit,
): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `${name} could not be reached. Check the credentials and environment in Studio.`,
      400,
    );
  }
  const body = await readJson(response);
  if (!response.ok) {
    const message =
      typeof body.error === "object" && body.error && "message" in (body.error as object)
        ? String((body.error as { message?: unknown }).message ?? "")
        : typeof body.message === "string"
          ? body.message
          : typeof body.error === "string"
            ? body.error
            : "";
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      message
        ? `${name} rejected the request: ${message}`
        : `${name} rejected the request (${response.status}). Check the credentials in Studio.`,
      400,
    );
  }
  return body;
}

function parseBody(rawBody: string): Record<string, unknown> {
  const trimmed = rawBody.trim();
  if (!trimmed) {
    return {};
  }
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return asRecord(JSON.parse(trimmed) as unknown);
    } catch {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid webhook payload", 400);
    }
  }
  return Object.fromEntries(new URLSearchParams(trimmed).entries());
}

function stringValue(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value) {
      return value;
    }
  }
  return "";
}

function liveSession(
  provider: PaymentProviderId,
  input: GatewayCheckoutInput,
  transactionId: string,
  checkoutUrl: string,
  extra: Record<string, unknown> = {},
): GatewayCheckoutSession {
  return {
    provider,
    transactionId,
    checkoutUrl,
    metadata: {
      adapter: "live",
      orderNumber: input.orderNumber,
      paymentId: input.paymentId,
      checkoutUrl,
      ...extra,
    },
  };
}

function createStripeGateway(credentials: Credentials): PaymentGateway {
  const catalog = catalogOf("stripe");
  const secretKey = credentials.secretKey;
  const webhookSecret = credentials.webhookSecret;

  async function stripeForm(path: string, params: URLSearchParams) {
    return requestJson("Stripe", `https://api.stripe.com/v1/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
  }

  async function stripeGet(path: string) {
    return requestJson("Stripe", `https://api.stripe.com/v1/${path}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
  }

  function sessionEvent(session: Record<string, unknown>, fallback: GatewayWebhookEvent["status"] = "processing") {
    const paymentStatus = String(session.payment_status ?? "");
    const status: GatewayWebhookEvent["status"] =
      paymentStatus === "paid" || session.status === "complete" ? "paid" : fallback;
    return statusEvent("stripe", String(session.id ?? ""), status, {
      amountCents: Number(session.amount_total ?? 0),
      currency: String(session.currency ?? "usd").toUpperCase(),
      metadata: {
        paymentIntent: session.payment_intent ?? null,
        paymentId: asRecord(session.metadata).paymentId ?? session.client_reference_id ?? null,
      },
    });
  }

  return {
    id: catalog.id,
    name: catalog.name,
    demo: false,
    methods: catalog.methods,
    async createCheckout(input) {
      const params = new URLSearchParams();
      params.set("mode", "payment");
      params.set("success_url", `${input.returnUrl}${input.returnUrl.includes("?") ? "&" : "?"}paid=1`);
      params.set("cancel_url", input.cancelUrl);
      params.set("client_reference_id", input.paymentId);
      params.set("customer_email", input.customerEmail);
      params.set("metadata[paymentId]", input.paymentId);
      params.set("metadata[orderNumber]", input.orderNumber);
      params.set("payment_intent_data[metadata][paymentId]", input.paymentId);
      params.set("line_items[0][quantity]", "1");
      params.set("line_items[0][price_data][currency]", input.currency.toLowerCase());
      params.set("line_items[0][price_data][unit_amount]", String(input.amountCents));
      params.set("line_items[0][price_data][product_data][name]", `Order ${input.orderNumber}`);
      const session = await stripeForm("checkout/sessions", params);
      const checkoutUrl = String(session.url ?? "");
      if (!checkoutUrl || !session.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Stripe did not return a checkout URL", 400);
      }
      return liveSession("stripe", input, String(session.id), checkoutUrl, {
        paymentIntent: session.payment_intent ?? null,
      });
    },
    async parseWebhook(headers, rawBody) {
      verifyStripeSignature(rawBody, headers["stripe-signature"], webhookSecret);
      const event = parseBody(rawBody);
      const type = String(event.type ?? "");
      const object = asRecord(asRecord(event.data).object);
      if (type === "checkout.session.completed" || type === "checkout.session.async_payment_succeeded") {
        return sessionEvent(object, "paid");
      }
      if (type === "checkout.session.async_payment_failed") {
        return sessionEvent(object, "failed");
      }
      if (type === "checkout.session.expired") {
        return sessionEvent(object, "canceled");
      }
      return null;
    },
    async refund(transactionId, _amountCents, metadata) {
      const params = new URLSearchParams();
      const paymentIntent =
        typeof metadata?.paymentIntent === "string"
          ? metadata.paymentIntent
          : String((await stripeGet(`checkout/sessions/${transactionId}`)).payment_intent ?? "");
      if (!paymentIntent) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Stripe payment intent is missing for this refund", 400);
      }
      params.set("payment_intent", paymentIntent);
      const refund = await stripeForm("refunds", params);
      return { transactionId: String(refund.id ?? `${transactionId}:refund`) };
    },
    async reconcile(transactionId) {
      const session = await stripeGet(`checkout/sessions/${transactionId}`);
      if (String(session.payment_status ?? "") === "paid" || session.status === "complete") {
        return sessionEvent(session, "paid");
      }
      if (session.status === "expired") {
        return sessionEvent(session, "canceled");
      }
      return null;
    },
  };
}

function paypalAmount(order: Record<string, unknown>) {
  const units = Array.isArray(order.purchase_units) ? order.purchase_units : [];
  const amount = asRecord(asRecord(units[0]).amount);
  return {
    amountCents: Math.round(Number(amount.value ?? 0) * 100),
    currency: String(amount.currency_code ?? "USD"),
  };
}

function paypalCaptureId(order: Record<string, unknown>) {
  const units = Array.isArray(order.purchase_units) ? order.purchase_units : [];
  const payments = asRecord(asRecord(units[0]).payments);
  const captures = Array.isArray(payments.captures) ? payments.captures : [];
  return String(asRecord(captures[0]).id ?? "");
}

function createPaypalGateway(credentials: Credentials): PaymentGateway {
  const catalog = catalogOf("paypal");
  const base = sandbox(credentials) ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

  async function accessToken() {
    const basic = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString("base64");
    const body = await requestJson("PayPal", `${base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const token = String(body.access_token ?? "");
    if (!token) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "PayPal did not return an access token", 400);
    }
    return token;
  }

  async function paypal(path: string, init: RequestInit = {}) {
    const token = await accessToken();
    return requestJson("PayPal", `${base}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  }

  function orderStatus(order: Record<string, unknown>): GatewayWebhookEvent["status"] | null {
    const status = String(order.status ?? "");
    if (status === "COMPLETED") {
      return "paid";
    }
    if (status === "VOIDED") {
      return "canceled";
    }
    if (status === "PAYER_ACTION_REQUIRED" || status === "APPROVED" || status === "CREATED") {
      return null;
    }
    return null;
  }

  async function captureIfNeeded(order: Record<string, unknown>) {
    if (String(order.status ?? "") === "APPROVED") {
      return paypal(`/v2/checkout/orders/${String(order.id ?? "")}/capture`, { method: "POST", body: "{}" });
    }
    return order;
  }

  return {
    id: catalog.id,
    name: catalog.name,
    demo: false,
    methods: catalog.methods,
    async createCheckout(input) {
      const order = await paypal("/v2/checkout/orders", {
        method: "POST",
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: input.paymentId,
              custom_id: input.paymentId,
              invoice_id: input.orderNumber,
              amount: { currency_code: input.currency, value: amountMajor(input.amountCents) },
            },
          ],
          application_context: {
            brand_name: "Rezaul Karim",
            user_action: "PAY_NOW",
            return_url: `${input.returnUrl}${input.returnUrl.includes("?") ? "&" : "?"}paid=1`,
            cancel_url: input.cancelUrl,
          },
        }),
      });
      const links = Array.isArray(order.links) ? order.links : [];
      const approve = links.find((item) => asRecord(item).rel === "approve" || asRecord(item).rel === "payer-action");
      const checkoutUrl = String(asRecord(approve).href ?? "");
      if (!checkoutUrl || !order.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "PayPal did not return a checkout URL", 400);
      }
      return liveSession("paypal", input, String(order.id), checkoutUrl);
    },
    async parseWebhook(_headers, rawBody) {
      const body = parseBody(rawBody);
      const resource = asRecord(body.resource);
      const transactionId = stringValue(resource, "id", "supplementary_data") || stringValue(body, "id");
      if (!transactionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Missing PayPal transaction id", 400);
      }
      const order = await paypal(`/v2/checkout/orders/${transactionId}`);
      const captured = await captureIfNeeded(order);
      const status = orderStatus(captured);
      if (!status) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "PayPal order is not complete", 400);
      }
      return statusEvent("paypal", String(captured.id ?? transactionId), status, paypalAmount(captured));
    },
    async refund(transactionId) {
      const order = await paypal(`/v2/checkout/orders/${transactionId}`);
      const captureId = paypalCaptureId(order);
      if (!captureId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "PayPal capture is missing for this refund", 400);
      }
      const refund = await paypal(`/v2/payments/captures/${captureId}/refund`, { method: "POST", body: "{}" });
      return { transactionId: String(refund.id ?? `${transactionId}:refund`) };
    },
    async reconcile(transactionId) {
      const order = await paypal(`/v2/checkout/orders/${transactionId}`);
      const captured = await captureIfNeeded(order);
      const status = orderStatus(captured);
      if (!status) {
        return null;
      }
      return statusEvent("paypal", String(captured.id ?? transactionId), status);
    },
  };
}

function createSslcommerzGateway(credentials: Credentials): PaymentGateway {
  const catalog = catalogOf("sslcommerz");
  const live = !sandbox(credentials);
  const gwBase = live ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com";

  return {
    id: catalog.id,
    name: catalog.name,
    demo: false,
    methods: catalog.methods,
    async createCheckout(input) {
      const params = new URLSearchParams({
        store_id: credentials.storeId,
        store_passwd: credentials.storePassword,
        total_amount: amountMajor(input.amountCents),
        currency: input.currency,
        tran_id: input.paymentId,
        success_url: `${input.returnUrl}${input.returnUrl.includes("?") ? "&" : "?"}paid=1`,
        fail_url: input.cancelUrl,
        cancel_url: input.cancelUrl,
        cus_name: input.customerName,
        cus_email: input.customerEmail,
        cus_phone: input.customerPhone || "01700000000",
        cus_add1: "N/A",
        cus_city: "N/A",
        cus_country: "Bangladesh",
        shipping_method: "NO",
        product_name: `Order ${input.orderNumber}`,
        product_category: "education",
        product_profile: "general",
      });
      const body = await requestJson("SSLCommerz", `${gwBase}/gwprocess/v4/api.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });
      const checkoutUrl = String(body.GatewayPageURL ?? body.directPaymentURLBank ?? "");
      if (!checkoutUrl) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "SSLCommerz did not return a checkout URL", 400);
      }
      return liveSession("sslcommerz", input, input.paymentId, checkoutUrl, {
        sessionKey: body.sessionkey ?? null,
      });
    },
    async parseWebhook(_headers, rawBody) {
      const body = parseBody(rawBody);
      const transactionId = stringValue(body, "tran_id");
      const valId = stringValue(body, "val_id");
      const ipnStatus = stringValue(body, "status").toUpperCase();
      if (!transactionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Missing SSLCommerz transaction id", 400);
      }
      if (valId) {
        const validated = await requestJson(
          "SSLCommerz",
          `${gwBase}/validator/api/validationserverAPI.php?${new URLSearchParams({
            val_id: valId,
            store_id: credentials.storeId,
            store_passwd: credentials.storePassword,
            format: "json",
          }).toString()}`,
          {},
        );
        const status = String(validated.status ?? ipnStatus).toUpperCase();
        if (status === "VALID" || status === "VALIDATED") {
          return paidEvent("sslcommerz", transactionId, {
            amountCents: Math.round(Number(validated.amount ?? body.amount ?? 0) * 100),
            currency: String(validated.currency ?? body.currency ?? "BDT"),
            metadata: { valId },
          });
        }
      }
      if (ipnStatus === "FAILED") {
        return statusEvent("sslcommerz", transactionId, "failed");
      }
      if (ipnStatus === "CANCELLED" || ipnStatus === "UNATTEMPTED" || ipnStatus === "EXPIRED") {
        return statusEvent("sslcommerz", transactionId, "canceled");
      }
      throw new AppError(ErrorCode.VALIDATION_ERROR, "SSLCommerz payment is not complete", 400);
    },
    async refund(transactionId, amountCents) {
      const body = await requestJson(
        "SSLCommerz",
        `${gwBase}/validator/api/merchantTransIDvalidationAPI.php?${new URLSearchParams({
          refund_amount: amountMajor(amountCents),
          refund_remarks: "Studio refund",
          refe_id: transactionId,
          store_id: credentials.storeId,
          store_passwd: credentials.storePassword,
          format: "json",
        }).toString()}`,
        {},
      );
      return { transactionId: String(body.refund_ref_id ?? `${transactionId}:refund`) };
    },
    async reconcile(transactionId) {
      const body = await requestJson(
        "SSLCommerz",
        `${gwBase}/validator/api/merchantTransIDvalidationAPI.php?${new URLSearchParams({
          tran_id: transactionId,
          store_id: credentials.storeId,
          store_passwd: credentials.storePassword,
          format: "json",
        }).toString()}`,
        {},
      );
      const element = Array.isArray(body.element) ? asRecord(body.element[0]) : asRecord(body.element);
      const status = String(element.status ?? body.status ?? "").toUpperCase();
      if (status === "VALID" || status === "VALIDATED") {
        return paidEvent("sslcommerz", transactionId, {
          amountCents: Math.round(Number(element.amount ?? 0) * 100),
          currency: String(element.currency ?? "BDT"),
        });
      }
      return null;
    },
  };
}

function createBkashGateway(credentials: Credentials): PaymentGateway {
  const catalog = catalogOf("bkash");
  const base = sandbox(credentials)
    ? "https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized"
    : "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized";

  async function token() {
    const body = await requestJson("bKash", `${base}/checkout/token/grant`, {
      method: "POST",
      headers: {
        username: credentials.username,
        password: credentials.password,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ app_key: credentials.appKey, app_secret: credentials.appSecret }),
    });
    const value = String(body.id_token ?? "");
    if (!value) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "bKash did not return an access token", 400);
    }
    return value;
  }

  async function bkash(path: string, init: RequestInit) {
    const idToken = await token();
    return requestJson("bKash", `${base}${path}`, {
      ...init,
      headers: {
        Authorization: idToken,
        "X-APP-Key": credentials.appKey,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  }

  return {
    id: catalog.id,
    name: catalog.name,
    demo: false,
    methods: catalog.methods,
    async createCheckout(input) {
      const body = await bkash("/checkout/create", {
        method: "POST",
        body: JSON.stringify({
          mode: "0011",
          payerReference: input.customerPhone || input.customerEmail,
          callbackURL: `${input.returnUrl}${input.returnUrl.includes("?") ? "&" : "?"}paid=1`,
          amount: amountMajor(input.amountCents),
          currency: input.currency === "USD" ? "BDT" : input.currency,
          intent: "sale",
          merchantInvoiceNumber: input.orderNumber,
        }),
      });
      const checkoutUrl = String(body.bkashURL ?? "");
      const paymentID = String(body.paymentID ?? "");
      if (!checkoutUrl || !paymentID) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "bKash did not return a checkout URL", 400);
      }
      return liveSession("bkash", input, paymentID, checkoutUrl, { paymentID });
    },
    async parseWebhook(_headers, rawBody) {
      const body = parseBody(rawBody);
      const paymentID = stringValue(body, "paymentID", "paymentId");
      if (!paymentID) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Missing bKash payment id", 400);
      }
      const executed = await bkash("/checkout/execute", {
        method: "POST",
        body: JSON.stringify({ paymentID }),
      });
      const status = String(executed.transactionStatus ?? executed.statusCode ?? "").toLowerCase();
      if (status === "completed" || executed.statusCode === "0000") {
        return paidEvent("bkash", paymentID, {
          amountCents: Math.round(Number(executed.amount ?? 0) * 100),
          currency: String(executed.currency ?? "BDT"),
          metadata: { trxID: executed.trxID ?? null },
        });
      }
      throw new AppError(ErrorCode.VALIDATION_ERROR, "bKash payment is not complete", 400);
    },
    async refund(transactionId, amountCents, metadata) {
      const body = await bkash("/checkout/payment/refund", {
        method: "POST",
        body: JSON.stringify({
          paymentID: transactionId,
          trxID: metadata?.trxID ?? transactionId,
          amount: amountMajor(amountCents),
          sku: "order",
          reason: "Studio refund",
        }),
      });
      return { transactionId: String(body.refundTrxID ?? `${transactionId}:refund`) };
    },
    async reconcile(transactionId) {
      const query = await bkash("/checkout/payment/status", {
        method: "POST",
        body: JSON.stringify({ paymentID: transactionId }),
      });
      const status = String(query.transactionStatus ?? "").toLowerCase();
      if (status === "completed") {
        return paidEvent("bkash", transactionId, {
          amountCents: Math.round(Number(query.amount ?? 0) * 100),
          currency: String(query.currency ?? "BDT"),
          metadata: { trxID: query.trxID ?? null },
        });
      }
      if (status === "initiated") {
        const executed = await bkash("/checkout/execute", {
          method: "POST",
          body: JSON.stringify({ paymentID: transactionId }),
        });
        if (String(executed.transactionStatus ?? "").toLowerCase() === "completed" || executed.statusCode === "0000") {
          return paidEvent("bkash", transactionId, {
            amountCents: Math.round(Number(executed.amount ?? 0) * 100),
            currency: String(executed.currency ?? "BDT"),
            metadata: { trxID: executed.trxID ?? null },
          });
        }
      }
      return null;
    },
  };
}

function normalizePem(value: string, kind: "PUBLIC KEY" | "PRIVATE KEY") {
  const trimmed = value.trim();
  if (trimmed.includes("BEGIN")) {
    return trimmed;
  }
  const lines = trimmed.replace(/\s+/g, "").match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${kind}-----\n${lines.join("\n")}\n-----END ${kind}-----`;
}

function createNagadGateway(credentials: Credentials): PaymentGateway {
  const catalog = catalogOf("nagad");
  const base = sandbox(credentials)
    ? "http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs"
    : "https://api.mynagad.com/api/dfs";

  function datetime() {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }

  function encrypt(payload: Record<string, string>) {
    const json = JSON.stringify(payload);
    const encrypted = publicEncrypt(
      { key: normalizePem(credentials.publicKey, "PUBLIC KEY") },
      Buffer.from(json, "utf8"),
    );
    const signer = createSign("SHA256");
    signer.update(json);
    signer.end();
    return {
      sensitiveData: encrypted.toString("base64"),
      signature: signer.sign(normalizePem(credentials.privateKey, "PRIVATE KEY"), "base64"),
    };
  }

  return {
    id: catalog.id,
    name: catalog.name,
    demo: false,
    methods: catalog.methods,
    async createCheckout(input) {
      const stamp = datetime();
      const orderId = input.orderNumber.replace(/[^A-Za-z0-9]/g, "").slice(-20) || input.paymentId.slice(0, 20);
      const challenge = randomBytes(8).toString("hex");
      const { sensitiveData, signature } = encrypt({
        merchantId: credentials.merchantId,
        datetime: stamp,
        orderId,
        challenge,
      });
      const initialized = await requestJson(
        "Nagad",
        `${base}/check-out/initialize/${credentials.merchantId}/${stamp}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-KM-IP-V4": "127.0.0.1",
            "X-KM-Client-Type": "PC_WEB",
            "X-KM-Api-Version": "v-0.2.0",
          },
          body: JSON.stringify({ datetime: stamp, sensitiveData, signature }),
        },
      );
      const paymentReferenceId = String(initialized.paymentReferenceId ?? initialized.paymentRefId ?? "");
      const completeSensitive = encrypt({
        merchantId: credentials.merchantId,
        orderId,
        amount: amountMajor(input.amountCents),
        currencyCode: input.currency === "USD" ? "050" : "050",
        challenge: String(initialized.challenge ?? challenge),
      });
      const completed = await requestJson("Nagad", `${base}/check-out/complete/${paymentReferenceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-KM-IP-V4": "127.0.0.1",
          "X-KM-Client-Type": "PC_WEB",
          "X-KM-Api-Version": "v-0.2.0",
        },
        body: JSON.stringify({
          sensitiveData: completeSensitive.sensitiveData,
          signature: completeSensitive.signature,
          merchantCallbackURL: `${input.returnUrl}${input.returnUrl.includes("?") ? "&" : "?"}paid=1`,
        }),
      });
      const checkoutUrl = String(completed.callBackUrl ?? completed.callbackURL ?? "");
      if (!checkoutUrl || !paymentReferenceId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Nagad did not return a checkout URL", 400);
      }
      return liveSession("nagad", input, paymentReferenceId, checkoutUrl, { orderId });
    },
    async parseWebhook(_headers, rawBody) {
      const body = parseBody(rawBody);
      const transactionId = stringValue(body, "payment_ref_id", "paymentRefId", "issuer_payment_ref");
      const status = stringValue(body, "status", "statusCode").toLowerCase();
      if (!transactionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Missing Nagad transaction id", 400);
      }
      if (status === "success" || status === "completed") {
        return paidEvent("nagad", transactionId, {
          amountCents: Math.round(Number(body.amount ?? 0) * 100),
          currency: "BDT",
        });
      }
      if (status === "failed" || status === "aborted") {
        return statusEvent("nagad", transactionId, status === "aborted" ? "canceled" : "failed");
      }
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Nagad payment is not complete", 400);
    },
    async refund(transactionId) {
      return { transactionId: `${transactionId}:refund` };
    },
    async reconcile(transactionId) {
      const body = await requestJson("Nagad", `${base}/verify/payment/${transactionId}`, {
        headers: {
          "X-KM-IP-V4": "127.0.0.1",
          "X-KM-Client-Type": "PC_WEB",
          "X-KM-Api-Version": "v-0.2.0",
        },
      });
      const status = String(body.status ?? body.statusCode ?? "").toLowerCase();
      if (status === "success" || status === "completed") {
        return paidEvent("nagad", transactionId, {
          amountCents: Math.round(Number(body.amount ?? 0) * 100),
          currency: "BDT",
        });
      }
      return null;
    },
  };
}

function createBankGateway(credentials: Credentials): PaymentGateway {
  const catalog = catalogOf("bank");
  return {
    id: catalog.id,
    name: catalog.name,
    demo: false,
    methods: catalog.methods,
    async createCheckout(input) {
      const checkoutUrl = `${env.FRONTEND_URL.replace(/\/$/, "")}/pay/${input.paymentId}`;
      const bank = publicBankDetails(credentials);
      return liveSession("bank", input, `bank_${input.paymentId.slice(0, 8)}`, checkoutUrl, {
        kind: "manual",
        ...(bank ? { bank } : {}),
      });
    },
    async parseWebhook() {
      return null;
    },
    async refund(transactionId) {
      return { transactionId: `${transactionId}:refund` };
    },
    async reconcile() {
      return null;
    },
  };
}

export function createLiveGateway(id: PaymentProviderId, credentials: Credentials): PaymentGateway {
  if (id === "stripe") {
    return createStripeGateway(credentials);
  }
  if (id === "paypal") {
    return createPaypalGateway(credentials);
  }
  if (id === "sslcommerz") {
    return createSslcommerzGateway(credentials);
  }
  if (id === "bkash") {
    return createBkashGateway(credentials);
  }
  if (id === "bank") {
    return createBankGateway(credentials);
  }
  return createNagadGateway(credentials);
}
