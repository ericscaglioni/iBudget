import { getBaseUrl } from "@/lib/utils/url";

export const post = async <TData extends object, TResult = any>(
  url: string,
  data: TData
): Promise<TResult> => {
  try {
    const baseUrl = await getBaseUrl();
    const res = await fetch(`${baseUrl}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    return res.json();
  } catch (err) {
    throw err;
  }
};

export const patch = async <TData extends object, TResult = any>(
  url: string,
  data: TData
): Promise<TResult> => {
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    return res.json();
  } catch (err) {
    throw err;
  }
};

export const del = async (url: string): Promise<void> => {
  try {
    const res = await fetch(url, { method: "DELETE" });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    return res.json();
  } catch (err) {
    throw err;
  }
};