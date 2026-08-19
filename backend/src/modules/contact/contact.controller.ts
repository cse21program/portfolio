import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { contactService } from "./contact.service";
import type { CreateContactInput, UpdateContactInput } from "./contact.validation";

function actor(req: Request) {
  if (!req.user) {
    return undefined;
  }
  return {
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
  };
}

export const contactController = {
  async create(req: Request, res: Response) {
    const inquiry = await contactService.create(req.body as CreateContactInput, actor(req), req.file);
    sendSuccess(res, { inquiry }, "Message sent", 201);
  },

  async list(_req: Request, res: Response) {
    const inquiries = await contactService.list();
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { inquiries });
  },

  async getById(req: Request, res: Response) {
    const inquiry = await contactService.getById(String(req.params.id ?? ""));
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { inquiry });
  },

  async update(req: Request, res: Response) {
    const inquiry = await contactService.update(String(req.params.id ?? ""), req.body as UpdateContactInput);
    sendSuccess(res, { inquiry }, "Inquiry updated");
  },
};
