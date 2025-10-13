import { getBaseUrl } from "@/lib/utils/url";

export const post = async <TData extends object, TResult = unknown>(
  url: string,
  data: TData,
  headersOverride?: HeadersInit
): Promise<TResult> => {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headersOverride,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`POST ${url} failed: ${errText}`);
  }

  return res.json();
};