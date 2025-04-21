'use client';

import { ReactNode } from 'react';
import { Modal } from './Modal';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import clsx from 'clsx';
import { Button } from './Button';

type Props<TData extends FieldValues> = {
  form: UseFormReturn<TData>;
  open: boolean;
  onSubmit: (data: TData) => void;
  onClose: () => void;
  title: string;
  children: ReactNode;
  description?: string;
};

export const FormModal = <TData extends FieldValues,>({
  form,
  open,
  onSubmit,
  onClose,
  title,
  children,
  description,
}: Props<TData>) => {
  const { formState: { isSubmitting, isDirty } } = form;
  
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          {/* <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className={clsx(
              'bg-primary text-white px-4 py-2 rounded-md shadow hover:bg-primary/90 transition',
              {
                'opacity-50 cursor-not-allowed': isSubmitting || !isDirty,
              }
            )}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button> */}
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