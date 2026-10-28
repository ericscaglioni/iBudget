'use client';

import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { ReactNode } from 'react';
import { Icon } from './Icon';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  description?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fullHeight?: boolean;
  /** Long forms fill the phone screen. Short confirmations stay a centred card. */
  fullScreenOnMobile?: boolean;
};

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export const Modal = ({
  open,
  onClose,
  title,
  children,
  description,
  maxWidth = 'md',
  fullHeight = false,
  fullScreenOnMobile = false,
}: Props) => {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
      <div
        className={`fixed inset-0 flex items-center justify-center overflow-hidden overscroll-x-none ${
          fullScreenOnMobile ? "sm:p-4" : "p-4"
        }`}
      >
        <DialogPanel
          className={`w-full min-w-0 overflow-x-hidden overscroll-x-none touch-pan-y ${maxWidthClasses[maxWidth]} bg-white p-4 shadow-xl flex flex-col ${
            fullScreenOnMobile
              ? `h-full rounded-none sm:rounded ${fullHeight ? "sm:h-full" : "sm:h-auto sm:max-h-[90vh]"}`
              : `h-auto max-h-[90vh] rounded ${fullHeight ? "sm:h-full" : ""}`
          }`}
        >
          <DialogTitle className="text-lg font-semibold text-slate-800 mb-4 flex-shrink-0 flex items-center justify-between">
            <span>{title}</span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Close modal"
            >
              <Icon name="close" className="size-5 text-gray-500" />
            </button>
          </DialogTitle>
          {description && (
            <Description className="text-sm text-slate-600 mb-4 flex-shrink-0">
              {description}
            </Description>
          )}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 min-w-0 p-3">
            {children}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
