import { AppError } from "@/lib/errors/AppError";
import { notFound, redirect } from "next/navigation";

export const handleServerError = (error: unknown, fallback?: () => never): never => {
  console.error("Server error:", error);

  if (error instanceof AppError) {
    switch (error.statusCode) {
      case 404:
        notFound();
      case 401:
        redirect("/login");
      case 403:
        throw error; // Let Next.js handle forbidden errors
      default:
        throw error; // Let error boundary handle other app errors
    }
  }

  // For unexpected errors, use fallback or throw
  if (fallback) {
    return fallback();
  }
  
  throw error;
}; 