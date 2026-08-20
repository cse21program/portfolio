import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { cartService } from "./cart.service";
import type { AddCartItemInput, ApplyCouponInput, UpdateCartItemInput } from "./cart.validation";

export const cartController = {
  async get(req: Request, res: Response) {
    const cart = await cartService.get(req.user!.id);
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { cart });
  },

  async add(req: Request, res: Response) {
    const cart = await cartService.add(req.user!.id, req.body as AddCartItemInput);
    sendSuccess(res, { cart }, "Added to cart");
  },

  async update(req: Request, res: Response) {
    const cart = await cartService.update(req.user!.id, String(req.params.id), req.body as UpdateCartItemInput);
    sendSuccess(res, { cart }, "Cart updated");
  },

  async remove(req: Request, res: Response) {
    const cart = await cartService.remove(req.user!.id, String(req.params.id));
    sendSuccess(res, { cart }, "Removed from cart");
  },

  async clear(req: Request, res: Response) {
    const cart = await cartService.clear(req.user!.id);
    sendSuccess(res, { cart }, "Cart cleared");
  },

  async applyCoupon(req: Request, res: Response) {
    const cart = await cartService.applyCoupon(req.user!.id, req.body as ApplyCouponInput);
    sendSuccess(res, { cart }, "Coupon applied");
  },

  async removeCoupon(req: Request, res: Response) {
    const cart = await cartService.removeCoupon(req.user!.id);
    sendSuccess(res, { cart }, "Coupon removed");
  },
};
