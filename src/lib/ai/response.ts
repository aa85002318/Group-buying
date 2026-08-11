import { NextResponse } from "next/server";
import type { AIErrorCode, AIResponse } from "./types";

export function aiOk<T>(
  data: T,
  usage?: AIResponse<T>["usage"],
  status = 200
) {
  const body: AIResponse<T> = { success: true, data, usage };
  return NextResponse.json(body, { status });
}

export function aiError(
  code: AIErrorCode | string,
  message: string,
  options?: {
    status?: number;
    retryable?: boolean;
    usage?: AIResponse<never>["usage"];
  }
) {
  const body: AIResponse<never> = {
    success: false,
    error: {
      code,
      message,
      retryable: options?.retryable ?? false,
    },
    usage: options?.usage,
  };
  return NextResponse.json(body, { status: options?.status ?? 400 });
}
