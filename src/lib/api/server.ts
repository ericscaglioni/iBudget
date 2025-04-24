import { toast } from "sonner";
import { getBaseUrl } from "@/lib/utils/url";
import { cookies } from "next/headers";

export const get = async <TResult>(url: string): Promise<TResult> => {
  try {
    const baseUrl = getBaseUrl();
    const cookieString = cookies().toString();

    const res = await fetch(`${baseUrl}${url}`, {
      cache: "no-store",
      headers: {
        Cookie: cookieString,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      toast.error(err || "Failed to load data");
      throw new Error(err);
    }

    return res.json();
  } catch (err) {
    toast.error("Network error");
    throw err;
  }
};

export const post = async <TData extends object, TResult = any>(
  url: string,
  data: TData
): Promise<TResult> => {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`POST ${url} failed: ${errText}`);
  }

  return res.json();
};