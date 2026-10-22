import { toast } from "sonner";
import { CheckIcon, XCircleIcon } from "@heroicons/react/24/outline";

export const showSuccess = (message: string) =>
  toast.success(message, {
    icon: <CheckIcon className="h-4 w-4 text-white" />,
    duration: 4000,
    style: {
      backgroundColor: "#22c55e", // Tailwind's green-500
      color: "#fff",
    },
  });

export const showError = (message: string) =>
  toast.error(message, {
    icon: <XCircleIcon className="h-4 w-4 text-white" />,
    duration: 5000,
    style: {
      backgroundColor: "#ef4444", // Tailwind's red-500
      color: "#fff",
    },
  });

export const showInfo = (message: string, action?: { label: string; onClick: () => void }) =>
  toast(message, {
    duration: 10000,
    action,
    style: {
      backgroundColor: "#eff6ff", // Tailwind's blue-50
      color: "#1e3a8a", // Tailwind's blue-900
      border: "1px solid #bfdbfe", // Tailwind's blue-200
    },
  });
