const CLERK_FRONTEND_API_ORIGIN = "https://frontend-api.clerk.services";
const PROXY_PREFIX = "/__clerk";

const HOP_BY_HOP = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

/**
 * Forwards Clerk Frontend API calls that the browser makes to `/__clerk`, so production
 * can use a same-origin proxy instead of a CNAME on vercel.app (which we cannot set).
 */
export async function proxyClerkFrontendApi(request: Request): Promise<Response> {
  const proxyUrl = process.env.NEXT_PUBLIC_CLERK_PROXY_URL;
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!proxyUrl || !secretKey) {
    return new Response("Clerk proxy is not configured", { status: 404 });
  }

  const incoming = new URL(request.url);
  const remainder = incoming.pathname.startsWith(PROXY_PREFIX)
    ? incoming.pathname.slice(PROXY_PREFIX.length)
    : incoming.pathname;
  const dest = `${CLERK_FRONTEND_API_ORIGIN}${remainder || "/"}${incoming.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower) || lower === "clerk-secret-key") {
      return;
    }
    headers.set(key, value);
  });
  headers.set("Clerk-Proxy-Url", proxyUrl);
  headers.set("Clerk-Secret-Key", secretKey);

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  const upstream = await fetch(dest, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("transfer-encoding");
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
