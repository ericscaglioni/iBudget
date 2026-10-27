import { afterEach, describe, expect, it, vi } from "vitest";
import { proxyClerkFrontendApi } from "./clerk-frontend-proxy";

const originalProxyUrl = process.env.NEXT_PUBLIC_CLERK_PROXY_URL;
const originalSecret = process.env.CLERK_SECRET_KEY;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  if (originalProxyUrl === undefined) {
    delete process.env.NEXT_PUBLIC_CLERK_PROXY_URL;
  } else {
    process.env.NEXT_PUBLIC_CLERK_PROXY_URL = originalProxyUrl;
  }
  if (originalSecret === undefined) {
    delete process.env.CLERK_SECRET_KEY;
  } else {
    process.env.CLERK_SECRET_KEY = originalSecret;
  }
});

describe("proxyClerkFrontendApi", () => {
  it("answers 404 when the proxy URL or secret is missing", async () => {
    delete process.env.NEXT_PUBLIC_CLERK_PROXY_URL;
    delete process.env.CLERK_SECRET_KEY;
    const response = await proxyClerkFrontendApi(new Request("https://app.test/__clerk/v1/client"));
    expect(response.status).toBe(404);
  });

  it("forwards the path, query and Clerk proxy headers to the Frontend API", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PROXY_URL", "https://app.test/__clerk");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_proxy");

    const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(
      async () => new Response("ok", { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await proxyClerkFrontendApi(
      new Request("https://app.test/__clerk/v1/client?_clerk_js_version=5", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "clerk-secret-key": "should-not-be-forwarded",
        },
        body: JSON.stringify({ ping: true }),
      })
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ok");
    expect(fetchMock).toHaveBeenCalledOnce();

    const [dest, init] = fetchMock.mock.calls[0];
    expect(dest).toBe("https://frontend-api.clerk.services/v1/client?_clerk_js_version=5");
    const headers = new Headers(init?.headers);
    expect(headers.get("Clerk-Proxy-Url")).toBe("https://app.test/__clerk");
    expect(headers.get("Clerk-Secret-Key")).toBe("sk_test_proxy");
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("does not send a body on GET", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PROXY_URL", "https://app.test/__clerk");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_proxy");

    const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(
      async () => new Response(null, { status: 204 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await proxyClerkFrontendApi(new Request("https://app.test/__clerk/v1/client"));

    const init = fetchMock.mock.calls[0][1];
    expect(init?.method).toBe("GET");
    expect(init?.body).toBeUndefined();
  });
});
