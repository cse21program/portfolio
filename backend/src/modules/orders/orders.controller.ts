import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { ordersService } from "./orders.service";
import type { PlaceOrderInput } from "./orders.validation";

function actor(req: Request) {
  return {
    id: req.user!.id,
    email: req.user!.email,
    role: req.user!.role,
  };
}

export const ordersController = {
  async listMine(req: Request, res: Response) {
    const orders = await ordersService.listMine(req.user!.id);
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { orders });
  },

  async listAdmin(_req: Request, res: Response) {
    const orders = await ordersService.listAdmin();
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { orders });
  },

  async getByOrderNumber(req: Request, res: Response) {
    const order = await ordersService.getByOrderNumber(String(req.params.orderNumber ?? ""), actor(req));
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { order });
  },

  async cancelMine(req: Request, res: Response) {
    const order = await ordersService.cancelMine(String(req.params.orderNumber ?? ""), actor(req));
    sendSuccess(res, { order }, "Order cancelled");
  },
};
