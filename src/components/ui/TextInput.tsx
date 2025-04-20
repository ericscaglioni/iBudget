'use client';

import { InputHTMLAttributes } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

type Props = {
  label: string;
  error?: string;
  className?: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
} & Partial<UseFormRegisterReturn>;

export const TextInput = ({
  label,
  error,
  className,
  inputProps,
  ...register
}: Props) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        {...register}
        {...inputProps}
        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};