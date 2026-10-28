"use client";

import { useState } from "react";
import { Button, ButtonProps } from "./Button";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: ButtonProps["variant"];
}

export const ConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
}: Props) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Stay open so the error toast can be read and they can try again
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={isConfirming ? () => undefined : onClose}
      title={title}
      description={description}
    >
      <div className="flex justify-end mt-4">
        <Button
          variant="outline"
          onClick={onClose}
          className="mr-2"
          disabled={isConfirming}
        >
          Cancel
        </Button>
        <Button
          variant={confirmVariant}
          onClick={handleConfirm}
          isLoading={isConfirming}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};
