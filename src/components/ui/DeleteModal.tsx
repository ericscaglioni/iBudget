import { showSuccess, showError } from "@/lib/utils/toast";
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
    try {
      await onDelete();
      showSuccess(`${modelName} deleted successfully`);
      onClose();
    } catch (error: unknown) {
      console.error(`Error deleting ${modelName}:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to delete ${modelName.toLowerCase()}. Please try again.`;
      showError(errorMessage);
    }
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