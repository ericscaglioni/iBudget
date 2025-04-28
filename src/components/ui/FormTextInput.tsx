'use client';

import { InputHTMLAttributes } from 'react';
import { FieldValues, Path, UseFormRegisterReturn, UseFormReturn } from 'react-hook-form';
import { Input } from './Input';

type Props<TData extends FieldValues> = {
  form: UseFormReturn<TData>;
  label: string;
  name: Path<TData>;
  className?: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
};

export const FormTextInput = <TData extends FieldValues,>({
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
      <Input
        label={label}
        {...form.register(name)}
        {...inputProps}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};