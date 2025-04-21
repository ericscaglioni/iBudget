import { toast } from "sonner";
import { CheckIcon, XCircleIcon } from "@heroicons/react/24/outline";

export const showSuccess = (message: string) =>
  toast.success(message, {
    icon: <CheckIcon className="h-4 w-4 text-primary" />,
  });

export const showError = (message: string) =>
  toast.error(message, {
    icon: <XCircleIcon className="h-4 w-4 text-red-600" />,
  });