'use client';

// import { useState } from 'react'; // Commented out as it's not currently used
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { Combobox, ComboboxOption } from './Combobox';


type Props<TData extends FieldValues> = {
  form: UseFormReturn<TData>;
  label: string;
  name: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export const FormCombobox = <TData extends FieldValues>({
  label,
  name,
  options,
  value,
  onChange,
  form,
  disabled = false,
}: Props<TData>) => {
  // Note: query and setQuery are not used in this component but may be needed for future functionality
  
  const { formState: { errors } } = form;
  const error = errors[name]?.message as string | undefined;

  return (
    <div>
      <Combobox
        options={options}
        label={label}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};