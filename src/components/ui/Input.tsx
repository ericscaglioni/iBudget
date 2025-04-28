'use client';

import { Input as HeadlessInput } from '@headlessui/react';
import { InputHTMLAttributes } from 'react';

type Props = { label?: string } & InputHTMLAttributes<HTMLInputElement>;

export const Input = (props: Props) => {
  const { label, ...rest } = props;
  return (
    <div>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <HeadlessInput
        {...rest}
        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
  );
};