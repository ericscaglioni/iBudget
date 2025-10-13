'use client';

import { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { showSuccess, showError } from '@/lib/utils/toast';

interface Props {
  onUpdate: (scope: 'one' | 'future') => Promise<void>;
  onClose: () => void;
  open: boolean;
  itemDescription: string;
}

export const EditRecurringModal = ({
  onUpdate,
  onClose,
  open,
  itemDescription,
}: Props) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (scope: 'one' | 'future') => {
    setIsUpdating(true);
    try {
      await onUpdate(scope);
      showSuccess(
        scope === 'one'
          ? 'Transaction updated successfully'
          : 'Transaction and future occurrences updated successfully'
      );
      onClose();
    } catch (error: unknown) {
      console.error('Error updating transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update transaction. Please try again.';
      showError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update Recurring Transaction"
      description={`This is part of a recurring series: "${itemDescription}". What would you like to update?`}
    >
      <div className="space-y-3 mt-4">
        <Button
          variant="outline"
          onClick={() => handleUpdate('one')}
          disabled={isUpdating}
          className="w-full"
        >
          Only this transaction
        </Button>
        <Button
          variant="primary"
          onClick={() => handleUpdate('future')}
          disabled={isUpdating}
          className="w-full"
        >
          This and future transactions
        </Button>
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={isUpdating}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

