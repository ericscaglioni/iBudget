'use client';

import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from '@headlessui/react';
import clsx from 'clsx';

type Props<T extends string> = {
  label: string;
  options: T[];
  value: T;
  onChange: (value: T) => void;
  error?: string;
};

export const ComboboxField = <T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: Props<T>) => {
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
          <ComboboxOptions className="absolute z-10 mt-1 w-full bg-white border rounded shadow-md max-h-60 overflow-auto text-sm">
            {options.map((option) => (
              <ComboboxOption
                key={option}
                value={option}
                className={({ active }) =>
                  clsx(
                    'cursor-pointer px-3 py-1',
                    active ? 'bg-gray-100' : ''
                  )
                }
              >
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