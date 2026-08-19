import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { serviceOrdersService } from "./service-orders.service";
import type {
  CreateServiceOrderInput,
  GrantServiceOrderInput,
  UpdateServiceOrderInput,
} from "./service-orders.validation";

function actor(req: Request) {
  return {
    id: req.user!.id,
    email: req.user!.email,
    role: req.user!.role,
  };
}

export const serviceOrdersController = {
  async listMine(req: Request, res: Response) {
    const orders = await serviceOrdersService.listMine(req.user!.id);
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { orders });
  },

  async create(req: Request, res: Response) {
    const { order, created } = await serviceOrdersService.create(req.body as CreateServiceOrderInput, actor(req));
    sendSuccess(res, { order }, created ? "Request sent" : "You already have an open request", created ? 201 : 200);
  },

  async cancelMine(req: Request, res: Response) {
    const order = await serviceOrdersService.cancelMine(String(req.params.id ?? ""), actor(req));
    sendSuccess(res, { order }, "Request cancelled");
  },

  async listAdmin(_req: Request, res: Response) {
    const orders = await serviceOrdersService.listAdmin();
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { orders });
  },

  async grant(req: Request, res: Response) {
    const { order, created } = await serviceOrdersService.grant(req.body as GrantServiceOrderInput, actor(req));
    sendSuccess(res, { order }, created ? "Order created" : "An open request already exists", created ? 201 : 200);
  },

  async updateAdmin(req: Request, res: Response) {
    const order = await serviceOrdersService.updateAdmin(
      String(req.params.id ?? ""),
      req.body as UpdateServiceOrderInput,
      actor(req),
    );
    sendSuccess(res, { order }, "Order updated");
  },
};
