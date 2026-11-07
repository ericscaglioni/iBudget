'use client';

import { Input as HeadlessInput } from '@headlessui/react';
import { InputHTMLAttributes } from 'react';
import { FieldLabel } from './FieldLabel';

type Props = { label?: string; required?: boolean } & InputHTMLAttributes<HTMLInputElement>;

export const Input = (props: Props) => {
  const { label, required, ...rest } = props;
  return (
    <div className="w-full min-w-0 max-w-full sm:w-auto">
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <HeadlessInput
        {...rest}
        aria-required={required || undefined}
        className="w-full min-w-0 max-w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/50"
      />
    </div>
  );
};