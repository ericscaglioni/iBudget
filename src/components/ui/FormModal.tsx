'use client';

import { useLoading } from '@/lib/hooks/useLoading';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { Button } from './Button';
import { Modal } from './Modal';
import { showError, showSuccess } from '@/lib/utils/toast';
import { AppError } from '@/lib/errors/AppError';

type Props<TData extends FieldValues> = {
  form: UseFormReturn<TData>;
  open: boolean;
  onSubmit: (data: TData) => Promise<void>;
  onClose: () => void;
  title: string;
  children: ReactNode;
  description?: string;
  refreshOnSubmit?: boolean;
  showToast?: boolean;
  toastSuccessMessage?: string;
  toastErrorMessage?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
};

export const FormModal = <TData extends FieldValues,>({
  form,
  open,
  onSubmit,
  onClose,
  title,
  children,
  description,
  refreshOnSubmit = true,
  showToast = true,
  toastSuccessMessage = 'Operation successful',
  toastErrorMessage = 'Operation failed',
  maxWidth = 'md',
}: Props<TData>) => {
  const router = useRouter();

  const { startLoading, stopLoading } = useLoading();

  const { formState: { isSubmitting, isDirty } } = form;
  
  const onFormSubmit = async (data: TData) => {
    try {
      startLoading();
      
      await onSubmit(data);

      if (refreshOnSubmit) {
        router.refresh();
      }
      if (showToast) {
        showSuccess(toastSuccessMessage);
      }
    } catch (error) {
      if (error instanceof AppError) {
        showError(error.message);
      } else if (error instanceof Error) {
        showError(error.message || toastErrorMessage);
      } else {
        showError(toastErrorMessage);
      }
    } finally {
      stopLoading();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} description={description} maxWidth={maxWidth}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
        {children}

        <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
          <Button
            type='button'
            variant='ghost'
            onClick={onClose}
            disabled={isSubmitting}
            size='sm'
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            type='submit'
            variant='primary'
            size='md'
            isLoading={isSubmitting}
            disabled={!isDirty}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};