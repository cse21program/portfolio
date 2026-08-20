import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { ordersService } from "@modules/orders/orders.service";
import type { PlaceOrderInput } from "@modules/orders/orders.validation";

export const checkoutController = {
  async place(req: Request, res: Response) {
    const order = await ordersService.place(req.body as PlaceOrderInput, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
    });
    sendSuccess(res, { order }, "Order placed", 201);
  },
};
