import { getBaseUrl } from "@/lib/utils/url";
import { AppError } from "../errors/AppError";

type ApiErrorResponse = {
  error: {
    message: string;
    code?: string;
  };
};

type ApiSuccessResponse<T> = {
  data: T;
};

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

const isErrorResponse = (response: any): response is ApiErrorResponse => {
  return 'error' in response;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json() as ApiResponse<T>;
  
  if (!response.ok || isErrorResponse(data)) {
    const error = data as ApiErrorResponse;
    throw new AppError(
      error.error.message,
      response.status,
      error.error.code
    );
  }

  return (data as ApiSuccessResponse<T>).data;
};

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

    return handleResponse<TResult>(res);
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

    return handleResponse<TResult>(res);
  } catch (err) {
    throw err;
  }
};

export const del = async <TResult = void>(url: string): Promise<TResult> => {
  try {
    const res = await fetch(url, { method: "DELETE" });
    return handleResponse<TResult>(res);
  } catch (err) {
    throw err;
  }
};

export const get = async <TResult = any>(url: string): Promise<TResult> => {
  try {
    const res = await fetch(url);
    return handleResponse<TResult>(res);
  } catch (err) {
    throw err;
  }
};