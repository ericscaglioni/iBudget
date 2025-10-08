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
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className={`w-full ${maxWidthClasses[maxWidth]} rounded bg-white p-6 shadow-xl`}>
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