import { NextRequest } from "next/server";

/** Builds the request a route handler would receive. */
export const makeRequest = (path: string, init: { method?: string; body?: unknown } = {}) =>
  new NextRequest(`http://localhost${path}`, {
    method: init.method ?? "GET",
    ...(init.body !== undefined
      ? { body: JSON.stringify(init.body), headers: { "content-type": "application/json" } }
      : {}),
  });

/** The second argument Next gives route handlers: the dynamic parts of the URL. */
export const routeContext = (params: Record<string, string> = {}) => ({ params: Promise.resolve(params) });

/** Status and JSON body of a response, ready to assert on. */
export const readJson = async (response: Response) => ({
  status: response.status,
  body: (await response.json()) as Record<string, unknown>,
});
