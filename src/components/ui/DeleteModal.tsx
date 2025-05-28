import { toast } from "sonner";
import { ConfirmationModal } from "./ConfirmationModal";

interface Props {
  onDelete: () => Promise<void>;
  onClose: () => void;
  open: boolean;
  modelName: string;
  itemDescription: string;
}

export const DeleteModal = ({ onDelete, onClose, open, itemDescription, modelName }: Props) => {
  const handleDelete = async () => {
    await onDelete();
    toast.success(`${modelName} deleted successfully`);
    onClose();
  };

  return (
    <ConfirmationModal
      open={open}
      onClose={onClose}
      onConfirm={handleDelete}
      title={`Delete ${modelName}`}
      description={`Are you sure you want to delete this ${modelName.toLowerCase()}: ${itemDescription}? This action cannot be undone.`}
    />
  );  
};