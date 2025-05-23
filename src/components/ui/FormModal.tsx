'use client';

import { useLoading } from '@/lib/hooks/useLoading';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { Button } from './Button';
import { Modal } from './Modal';
import { showError, showSuccess } from '@/lib/utils/toast';

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
      showError((error instanceof Error && error.message) ? error.message : toastErrorMessage);
    } finally {
      stopLoading();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
        {children}

        <div className="pt-4 flex justify-end gap-4">
          <Button
            type='button'
            variant='ghost'
            onClick={onClose}
            disabled={isSubmitting}
            size='sm'
          >
            Cancel
          </Button>
          <Button
            type='submit'
            variant='primary'
            size='md'
            isLoading={isSubmitting}
            disabled={!isDirty}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};