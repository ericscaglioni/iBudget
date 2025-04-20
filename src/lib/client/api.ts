import { toast } from "sonner";
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
      toast.error(err || "Something went wrong.");
      throw new Error(err);
    }

    toast.success("Success!");
    return res.json();
  } catch (err) {
    toast.error("Network error");
    throw err;
  }
};