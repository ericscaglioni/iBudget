'use client';

import { InputHTMLAttributes } from 'react';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { Input } from './Input';

type Props<TData extends FieldValues> = {
  form: UseFormReturn<TData>;
  label: string;
  name: Path<TData>;
  className?: string;
  /** Short help text shown under the field (hidden while there is an error) */
  hint?: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
};

export const FormTextInput = <TData extends FieldValues,>({
  form,
  label,
  name,
  className,
  hint,
  inputProps,
}: Props<TData>) => {
  const { formState: { errors } } = form;
  const error = errors[name]?.message as string | undefined;
  
  return (
    <div className={className ? `min-w-0 max-w-full ${className}` : "min-w-0 max-w-full"}>
      <Input
        label={label}
        {...form.register(name)}
        {...inputProps}
      />
      {error ? (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      ) : (
        hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>
      )}
    </div>
  );
};