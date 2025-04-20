export const getBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    // ✅ On the client – use relative URLs
    return "";
  }

  // ✅ On the server – use process.env
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
};