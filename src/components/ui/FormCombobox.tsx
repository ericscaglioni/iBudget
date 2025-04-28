'use client';

import { useState } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { Combobox, ComboboxOption } from './Combobox';


type Props<TData extends FieldValues> = {
  form: UseFormReturn<TData>;
  label: string;
  name: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
};

export const FormCombobox = <TData extends FieldValues>({
  label,
  name,
  options,
  value,
  onChange,
  form,
}: Props<TData>) => {
  const [query, setQuery] = useState("");
  
  const { formState: { errors } } = form;
  const error = errors[name]?.message as string | undefined;

  return (
    <div>
      <Combobox
        options={options}
        label={label}
        value={value}
        onChange={onChange}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};