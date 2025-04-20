'use client';

import { ReactNode } from 'react';
import { Modal } from './Modal';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSubmit: () => void;
  isSubmitting?: boolean;
  description?: string;
};

export const FormModal = ({
  open,
  onClose,
  title,
  children,
  onSubmit,
  isSubmitting = false,
  description,
}: Props) => {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <form onSubmit={onSubmit} className="space-y-4">
        {children}

        <div className="pt-4 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 text-sm"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
};