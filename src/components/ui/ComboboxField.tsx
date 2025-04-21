'use client';

import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { FieldValues, UseFormReturn } from 'react-hook-form';

type Props<T extends string, TData extends FieldValues> = {
  form: UseFormReturn<TData>;
  label: string;
  name: string;
  options: T[];
  value: T;
  onChange: (value: T) => void;
};

export const ComboboxField = <T extends string, TData extends FieldValues>({
  label,
  name,
  options,
  value,
  onChange,
  form,
}: Props<T, TData>) => {
  const { formState: { errors } } = form;
  const error = errors[name]?.message as string | undefined;
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <Combobox value={value} onChange={onChange}>
        <div className="relative">
          <ComboboxInput
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            onChange={(event) => onChange(event.target.value as T)}
            displayValue={(val: string) => val}
          />
          <ComboboxButton className="group absolute inset-y-0 right-0 px-2.5">
            <ChevronDownIcon className="size-4 fill-black/60 group-data-[hover]:fill-black" />
          </ComboboxButton>
          <ComboboxOptions className="absolute z-10 mt-1 w-full bg-white border rounded shadow-md max-h-60 overflow-auto text-sm">
            {options.map((option) => (
              <ComboboxOption
                key={option}
                value={option}
                className="cursor-pointer px-3 py-2 group flex gap-2 bg-white data-[focus]:bg-blue-100"
              >
                <CheckIcon className="invisible size-5 group-data-[selected]:visible" />
                {option}
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        </div>
      </Combobox>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};