import type { AxiosError } from "axios";
import type { ErrorRes } from "@/types/core";

export function getApiErrorMessage(
  status: number | undefined,
  backendMessage?: string,
  fallback = "Something went wrong. Please try again."
): string {
  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }
  if (status === 403) {
    return "You don't have permission for this action.";
  }
  if (status === 404) {
    return "We couldn't find what you were looking for.";
  }
  if (status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (status != null && status >= 500) {
    return "Something went wrong on our side. Please try again.";
  }

  const trimmed = backendMessage?.trim();
  if (!trimmed) return fallback;

  const lower = trimmed.toLowerCase();
  if (
    lower.includes("jwt") ||
    lower.includes("token expired") ||
    lower.includes("unauthenticated") ||
    lower.includes("unauthorized") ||
    lower.includes("invalid token") ||
    lower.includes("not authenticated")
  ) {
    return "Your session has expired. Please sign in again.";
  }

  return trimmed;
}

export function getAxiosErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  const ax = error as AxiosError<ErrorRes> | undefined;
  return getApiErrorMessage(
    ax?.response?.status,
    ax?.response?.data?.message,
    fallback
  );
}

export function isAuthHttpStatus(status: number | undefined): boolean {
  return status === 401 || status === 403;
}
