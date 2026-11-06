// Server-only helpers for the /api/* route handlers that forward requests to the TalentIQ backend.
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";
import serverApi from "@/lib/serverApi";

/** Backend success envelope: { success: true, message, data }. */
export interface BackendSuccess<T = unknown> {
  success: true;
  message: string;
  data: T;
}

/** POSTs `body` to the backend and returns its status + JSON. Throws on network errors. */
export async function postToBackend<T = unknown>(path: string, body?: unknown) {
  const server = await serverApi();
  const res = await server.post<BackendSuccess<T>>(path, body ?? {});
  return { status: res.status, data: res.data };
}

/**
 * Turns an error from postToBackend into a response for the browser: the backend's own error
 * (400 validation, 401, 409, 429, ...) is passed through unchanged; a network problem becomes 503.
 */
export function backendErrorResponse(error: unknown) {
  if (isAxiosError(error) && error.response) {
    return NextResponse.json(error.response.data, { status: error.response.status });
  }
  return NextResponse.json(
    { success: false, statusCode: 503, message: "Cannot reach the server. Please try again." },
    { status: 503 }
  );
}

/** Reads the JSON body of the incoming request ({} if empty or invalid). */
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

/** Forwards a JSON POST to the backend and returns the backend's response as-is. */
export async function forwardPost(req: Request, path: string) {
  return forwardToBackend(req, "POST", path);
}

type ForwardMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Forwards a request to the backend with the session cookie as Bearer token (see serverApi) and
 * returns the backend's response as-is. GET / DELETE pass the query string through
 * (e.g. ?page=1&search=dev); POST / PUT / PATCH pass the JSON body.
 */
export async function forwardToBackend(req: Request, method: ForwardMethod, path: string) {
  try {
    const server = await serverApi();
    const hasBody = method === "POST" || method === "PUT" || method === "PATCH";
    const query = new URL(req.url).searchParams;

    const res = await server.request<BackendSuccess>({
      method,
      url: path,
      ...(hasBody ? { data: await readJson(req) } : { params: Object.fromEntries(query.entries()) }),
    });
    return NextResponse.json(res.data, { status: res.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}

/** Route segment `[id]` values are passed to the backend inside the path, so keep them URL-safe. */
export const pathParam = (value: string) => encodeURIComponent(value);
