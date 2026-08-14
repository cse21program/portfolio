import type { RequestHandler } from "express";
import type { ZodType } from "zod";

type RequestPart = "body" | "query" | "params";

export const validateRequest = (
  schema: ZodType,
  part: RequestPart = "body",
): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.parse(req[part]);
    req[part] = result as typeof req[typeof part];
    next();
  };
};
