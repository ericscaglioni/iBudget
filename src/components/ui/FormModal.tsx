'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { Button } from './Button';
import { Modal } from './Modal';
import { Spinner } from './Spinner';
import { showError, showSuccess } from '@/lib/utils/toast';
import { AppError } from '@/lib/errors/AppError';

type SecondaryAction<TData extends FieldValues> = {
  label: string;
  onSubmit: (data: TData) => Promise<void>;
};

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
  /** Optional second submit button next to Save (e.g. "Save & add another"). Runs its own handler. */
  secondaryAction?: SecondaryAction<TData>;
  /** The data for the form is still being fetched: show a spinner over the fields and keep Save disabled. */
  isLoading?: boolean;
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
  secondaryAction,
  isLoading = false,
}: Props<TData>) => {
  const router = useRouter();

  const { formState: { isSubmitting, isDirty } } = form;
  const [activeAction, setActiveAction] = useState<'primary' | 'secondary'>('primary');

  const runSubmit = (handler: (data: TData) => Promise<void>) => async (data: TData) => {
    // No page-wide overlay: the pressed button shows the loading state instead
    try {
      await handler(data);

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
    }
  }

  // Esc, backdrop click and the X all land here; ignore them mid-save so the form isn't reset under the request
  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  const onFormSubmit = (data: TData) => {
    setActiveAction('primary');
    return runSubmit(onSubmit)(data);
  };

  const onSecondarySubmit = (data: TData) => {
    setActiveAction('secondary');
    return runSubmit(secondaryAction!.onSubmit)(data);
  };

  return (
    <Modal open={open} onClose={handleClose} title={title} description={description} maxWidth={maxWidth} fullScreenOnMobile>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="min-w-0 max-w-full space-y-4">
        {/* Disabled while loading so nothing can be typed into (or submitted from) a half-filled form */}
        <div className="relative" aria-busy={isLoading}>
          <fieldset disabled={isLoading} className="m-0 min-w-0 space-y-4 border-0 p-0">
            {children}
          </fieldset>
          {isLoading && (
            <div
              role="status"
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-md bg-white/80"
            >
              <Spinner />
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          )}
        </div>

        <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
          <Button
            type='button'
            variant='ghost'
            onClick={onClose}
            disabled={isSubmitting}
            size='sm'
            className="w-full sm:w-auto order-3 sm:order-1"
          >
            Cancel
          </Button>
          {secondaryAction && (
            <Button
              type='button'
              variant='outline'
              size='md'
              onClick={form.handleSubmit(onSecondarySubmit)}
              isLoading={isSubmitting && activeAction === 'secondary'}
              disabled={!isDirty || isSubmitting || isLoading}
              className="w-full sm:w-auto order-2"
            >
              {isSubmitting && activeAction === 'secondary' ? 'Saving...' : secondaryAction.label}
            </Button>
          )}
          <Button
            type='submit'
            variant='primary'
            size='md'
            isLoading={isSubmitting && activeAction === 'primary'}
            disabled={!isDirty || isSubmitting || isLoading}
            className="w-full sm:w-auto order-1 sm:order-3"
          >
            {isSubmitting && activeAction === 'primary' ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};