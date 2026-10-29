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
  /** Short help text shown under the field (hidden while there is an error) */
  hint?: string;
  required?: boolean;
  onCreateOption?: (label: string) => void;
  createLabel?: string;
};

export const FormCombobox = <TData extends FieldValues>({
  label,
  name,
  options,
  value,
  onChange,
  form,
  disabled = false,
  hint,
  required,
  onCreateOption,
  createLabel,
}: Props<TData>) => {
  // Note: query and setQuery are not used in this component but may be needed for future functionality
  
  const { formState: { errors } } = form;
  const error = errors[name]?.message as string | undefined;

  return (
    <div className="min-w-0 max-w-full">
      <Combobox
        options={options}
        label={label}
        required={required}
        value={value}
        onChange={onChange}
        disabled={disabled}
        onCreateOption={onCreateOption}
        createLabel={createLabel}
      />
      {error ? (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      ) : (
        hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>
      )}
    </div>
  );
};