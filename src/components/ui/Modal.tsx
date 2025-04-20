'use client';

import {
  Description,
  Dialog,
  DialogDescription,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  description?: string;
};

export const Modal = ({ open, onClose, title, children, description }: Props) => {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded bg-white p-6 shadow-xl">
          <DialogTitle className="text-lg font-semibold text-slate-800 mb-4">
            {title}
          </DialogTitle>
          {/* Optional description can be added here */}
          {description && (
            <Description className="text-sm text-slate-600 mb-4">
              {description}
            </Description>
          )}
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
};