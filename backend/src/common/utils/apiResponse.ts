import type { Response } from "express";

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "OK",
  statusCode = 200,
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: Pagination,
  message = "OK",
) {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
}
