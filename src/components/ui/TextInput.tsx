'use client';

import { InputHTMLAttributes } from 'react';
import { FieldValues, Path, UseFormRegisterReturn, UseFormReturn } from 'react-hook-form';

type Props<TData extends FieldValues> = {
  form: UseFormReturn<TData>;
  label: string;
  name: Path<TData>;
  className?: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
} & Partial<UseFormRegisterReturn>;

export const TextInput = <TData extends FieldValues,>({
  form,
  label,
  name,
  className,
  inputProps,
}: Props<TData>) => {
  const { formState: { errors } } = form;
  const error = errors[name]?.message as string | undefined;
  
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        {...form.register(name)}
        {...inputProps}
        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};