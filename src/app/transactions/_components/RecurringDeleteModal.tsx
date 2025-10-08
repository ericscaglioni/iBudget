'use client';

import { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { showSuccess, showError } from '@/lib/utils/toast';

interface Props {
  onDelete: (scope: 'one' | 'future') => Promise<void>;
  onClose: () => void;
  open: boolean;
  itemDescription: string;
}

export const RecurringDeleteModal = ({
  onDelete,
  onClose,
  open,
  itemDescription,
}: Props) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (scope: 'one' | 'future') => {
    setIsDeleting(true);
    try {
      await onDelete(scope);
      showSuccess(
        scope === 'one'
          ? 'Transaction deleted successfully'
          : 'Transaction and future occurrences deleted successfully'
      );
      onClose();
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      showError(
        error?.message || 'Failed to delete transaction. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete Recurring Transaction"
      description={`This is part of a recurring series: "${itemDescription}". What would you like to delete?`}
    >
      <div className="space-y-3 mt-4">
        <Button
          variant="outline"
          onClick={() => handleDelete('one')}
          disabled={isDeleting}
          className="w-full"
        >
          Only this transaction
        </Button>
        <Button
          variant="danger"
          onClick={() => handleDelete('future')}
          disabled={isDeleting}
          className="w-full"
        >
          This and future transactions
        </Button>
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={isDeleting}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
};
