'use client';

import {
  Description,
  Dialog,
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
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
};

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export const Modal = ({ open, onClose, title, children, description, maxWidth = 'md' }: Props) => {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center sm:p-4">
        <DialogPanel className={`w-full h-full sm:h-auto sm:max-h-[90vh] ${maxWidthClasses[maxWidth]} rounded-none sm:rounded bg-white p-4 shadow-xl flex flex-col`}>
          <DialogTitle className="text-lg font-semibold text-slate-800 mb-4 flex-shrink-0">
            {title}
          </DialogTitle>
          {/* Optional description can be added here */}
          {description && (
            <Description className="text-sm text-slate-600 mb-4 flex-shrink-0">
              {description}
            </Description>
          )}
          <div className="flex-1 overflow-y-auto min-h-0 p-2">
            {children}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};