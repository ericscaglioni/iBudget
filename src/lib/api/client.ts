import { getBaseUrl } from "@/lib/utils/url";
import { showError, showSuccess } from "@/lib/utils/toast";

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
      showError(err || "Something went wrong.");
      throw new Error(err);
    }

    showSuccess("Success!");
    return res.json();
  } catch (err) {
    showError("Network error");
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
      showError(err || "Failed to update data");
      throw new Error(err);
    }

    showSuccess("Updated successfully!");
    return res.json();
  } catch (err) {
    showError("Network error");
    throw err;
  }
};

export const del = async (url: string): Promise<void> => {
  try {
    const res = await fetch(url, { method: "DELETE" });

    if (!res.ok) {
      const err = await res.text();
      showError(err || "Delete failed");
      throw new Error(err);
    }

    showSuccess("Deleted successfully");
  } catch (err) {
    showError("Network error");
    throw err;
  }
};