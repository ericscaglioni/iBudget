import { toast } from "sonner";
import { CheckIcon, XCircleIcon } from "@heroicons/react/24/outline";

const cssRgb = (name: string, fallback: string) => {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value ? `rgb(${value})` : fallback;
};

export const showSuccess = (message: string) =>
  toast.success(message, {
    icon: <CheckIcon className="h-4 w-4 text-on-brand" />,
    duration: 4000,
    style: {
      backgroundColor: cssRgb("--income", "#2F9E6B"),
      color: cssRgb("--on-brand", "#F6F4F0"),
    },
  });

export const showError = (message: string) =>
  toast.error(message, {
    icon: <XCircleIcon className="h-4 w-4 text-on-brand" />,
    duration: 5000,
    style: {
      backgroundColor: cssRgb("--expense", "#C2413B"),
      color: cssRgb("--on-brand", "#F6F4F0"),
    },
  });

export const showInfo = (message: string, action?: { label: string; onClick: () => void }) =>
  toast(message, {
    duration: 10000,
    action,
    style: {
      backgroundColor: cssRgb("--surface", "#FFFFFF"),
      color: cssRgb("--ink", "#1A1F1C"),
      border: `1px solid ${cssRgb("--line", "#E6E2DB")}`,
    },
  });
