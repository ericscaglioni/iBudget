"use client";

import { useLoading } from "@/lib/hooks/useLoading";

export const LoadingOverlay = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
};