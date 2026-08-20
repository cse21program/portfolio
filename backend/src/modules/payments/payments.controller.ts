import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { paymentsService } from "./payments.service";
import { PAYMENT_SIGNATURE_HEADER } from "./gateways/signature";
import type { PaymentProviderId } from "./gateways/gateway";
import type {
  DemoPaymentInput,
  ReportPaymentInput,
  StartPaymentInput,
  UpdateProviderSettingInput,
} from "./payments.validation";

function actor(req: Request) {
  return {
    id: req.user!.id,
    email: req.user!.email,
    role: req.user!.role,
  };
}

function headerMap(req: Request) {
  return {
    [PAYMENT_SIGNATURE_HEADER]: req.header(PAYMENT_SIGNATURE_HEADER) ?? undefined,
    "stripe-signature": req.header("stripe-signature") ?? undefined,
  };
}

function rawBodyOf(req: Request) {
  if (req.rawBody) {
    return req.rawBody;
  }
  if (typeof req.body === "string") {
    return req.body;
  }
  return JSON.stringify(req.body ?? {});
}

export const paymentsController = {
  async listProviders(_req: Request, res: Response) {
    sendSuccess(res, { providers: await paymentsService.listProviders() });
  },

  async listAdminProviders(req: Request, res: Response) {
    const providers = await paymentsService.listAdminProviders(actor(req));
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { providers });
  },

  async updateAdminProvider(req: Request, res: Response) {
    const provider = await paymentsService.updateAdminProvider(
      String(req.params.provider ?? ""),
      req.body as UpdateProviderSettingInput,
      actor(req),
    );
    sendSuccess(res, { provider }, "Payment provider saved");
  },

  async start(req: Request, res: Response) {
    const result = await paymentsService.start(req.body as StartPaymentInput, actor(req));
    sendSuccess(res, result, "Payment started", 201);
  },

  async getById(req: Request, res: Response) {
    const result = await paymentsService.getById(String(req.params.id ?? ""), actor(req));
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, result);
  },

  async demoComplete(req: Request, res: Response) {
    const result = await paymentsService.demoComplete(
      String(req.params.id ?? ""),
      req.body as DemoPaymentInput,
      actor(req),
    );
    sendSuccess(res, result, "Payment updated");
  },

  async reportTransfer(req: Request, res: Response) {
    const result = await paymentsService.reportTransfer(
      String(req.params.id ?? ""),
      req.body as ReportPaymentInput,
      actor(req),
    );
    sendSuccess(res, result, "Transfer reported");
  },

  async confirm(req: Request, res: Response) {
    const result = await paymentsService.confirm(String(req.params.id ?? ""), actor(req));
    sendSuccess(res, result, "Payment confirmed");
  },

  async sync(req: Request, res: Response) {
    const result = await paymentsService.sync(String(req.params.id ?? ""), actor(req));
    sendSuccess(res, result, "Payment refreshed");
  },

  async webhook(req: Request, res: Response) {
    const result = await paymentsService.handleWebhook(
      String(req.params.provider ?? "") as PaymentProviderId,
      headerMap(req),
      rawBodyOf(req),
    );
    sendSuccess(res, result, "Webhook accepted");
  },

  async refund(req: Request, res: Response) {
    const result = await paymentsService.refund(String(req.params.id ?? ""), actor(req));
    sendSuccess(res, result, "Refund recorded");
  },
};
