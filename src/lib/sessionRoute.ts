// Server-only: shared by the route handlers that start a session (login, verify email).
import { NextResponse } from "next/server";
import { setAuthCookie } from "@/lib/authCookie";
import { backendErrorResponse, postToBackend, readJson } from "@/lib/backendRoute";

/** Backend session payload (login / verify-email). */
interface BackendSession {
  access_token: string;
  token_type: "Bearer";
  expires_in: string;
  user: Record<string, unknown>;
}

/**
 * Forwards the request; on success stores access_token in the httpOnly session cookie and
 * returns everything except the token, so it never reaches browser JavaScript.
 * `remember` decides whether the cookie outlives the browser session.
 */
export async function startSession(req: Request, path: string, remember: (body: Record<string, unknown>) => boolean) {
  try {
    const body = await readJson(req);
    const { status, data } = await postToBackend<BackendSession>(path, body);

    const { access_token: accessToken, ...session } = data.data;
    const response = NextResponse.json({ ...data, data: session }, { status });
    if (accessToken) {
      await setAuthCookie(response, accessToken, remember(body));
    }
    return response;
  } catch (error) {
    return backendErrorResponse(error);
  }
}
