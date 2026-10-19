import { Button, ButtonProps } from "./Button";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
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
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
    >
      <div className="flex justify-end mt-4">
        <Button
          variant="outline"
          onClick={onClose}
          className="mr-2"
        >
          Cancel
        </Button>
        <Button
          variant={confirmVariant}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};