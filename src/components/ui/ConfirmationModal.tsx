import { Button } from "./Button";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export const ConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
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
          variant="danger"
          onClick={onClose}
          className="mr-2"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Confirm
        </Button>
      </div>
    </Modal>
  );
};