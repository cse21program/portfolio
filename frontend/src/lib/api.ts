import { env } from "@/config/env";
import type { ApiResponse } from "@/types/api";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    credentials: "include",
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || payload.success === false) {
    const error = payload.success === false ? payload.error : undefined;
    throw new ApiRequestError(
      error?.message ?? "Request failed",
      response.status,
      error?.code ?? "REQUEST_FAILED",
    );
  }

  return payload.data;
}
