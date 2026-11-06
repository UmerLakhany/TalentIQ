/* eslint-disable @typescript-eslint/no-explicit-any */
import { APP_URL } from "@/config/constants";
import { route } from "@/constants/routes";

interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
}

/** Error thrown for any failed request, with the HTTP status and the backend's error list. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: string[] = []
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function buildFetchConfig(method: string, body: unknown, headers: Record<string, string>): RequestInit {
  const config: RequestInit = { method, headers: { ...headers } };
  if (body instanceof FormData) {
    config.body = body;
  } else if (body) {
    config.headers = { ...config.headers, "Content-Type": "application/json" };
    config.body = JSON.stringify(body);
  }
  return config;
}

function buildUrl(endpoint: string, method: string, params?: Record<string, string>): string {
  let url = `${APP_URL}/api/${endpoint}`;
  if (method === "GET" && params && Object.keys(params).length > 0) {
    url += `?${new URLSearchParams(params).toString()}`;
  }
  return url;
}

/**
 * The session token expired or was rejected: clear the httpOnly cookie (only the server can) and
 * go to the login page with a full page load, so no cached private pages remain.
 */
async function endSession() {
  try {
    await fetch(`${APP_URL}/api/auth/logout`, { method: "POST" });
  } finally {
    if (typeof window !== "undefined") {
      window.location.replace(route.login);
    }
  }
}

/**
 * Calls this app's /api/... route handlers, which forward to the backend.
 * Throws ApiError with the backend's specific message (e.g. "Enter a valid email address.").
 */
async function clientApi<T = any>(
  endpoint: string,
  params?: Record<string, any>,
  { method = "GET", body, headers = {} }: RequestConfig = {}
): Promise<T> {
  const url = buildUrl(endpoint, method, params);
  const config = buildFetchConfig(method, body, headers);

  let res: Response;
  try {
    res = await fetch(url, config);
  } catch {
    throw new ApiError("Cannot reach the server. Please try again.", 0);
  }

  const data = await res.json().catch(() => null);

  // 401 outside the auth pages = session expired (on login it just means wrong email/password)
  if (res.status === 401 && !endpoint.startsWith("auth/")) {
    await endSession();
    throw new ApiError("Your session has expired. Please log in again.", 401);
  }

  if (!res.ok) {
    // Backend errors look like { success: false, statusCode, message, errors?: string[] };
    // the first item of `errors` is the specific reason (e.g. "Enter a valid email address.")
    const apiError = (data ?? {}) as { message?: string; errors?: string[] };
    throw new ApiError(apiError.errors?.[0] || apiError.message || "Something went wrong", res.status, apiError.errors);
  }

  return data as T;
}

export default clientApi;
