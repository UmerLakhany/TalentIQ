"user-server";

import { APP_URL } from "@/config/constants";

/**
 * Make a request to the given endpoint with the given config
 * @param {string} endpoint - the endpoint to make the request to
 * @param {object} config - the request config
 * @param {string} config.method - the request method (defaults to "GET")
 * @param {object} config.body - the request body (defaults to null)
 * @param {object} config.headers - the request headers (defaults to {})
 * @returns {Promise<object>} the response data
 * @throws {Error} if the request fails
 */
interface NextApiConfig {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  cache?: RequestCache;
}

async function nextApi(
  endpoint: string,
  params?: Record<string, string>,
  { method = "GET", body, headers = {}, cache = "no-store" }: NextApiConfig = {}
) {
  const config: RequestInit & { headers: Record<string, string> } = {
    method,
    headers: { ...headers },
    cache,
  };

  if (body instanceof FormData) {
    config.body = body;
  } else if (body) {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(body);
  }

  let url = `${APP_URL}/api/${endpoint}`;

  if (method === "GET" && params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }

  const res = await fetch(url, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Something went wrong");
  }

  return data;
}

export default nextApi;
