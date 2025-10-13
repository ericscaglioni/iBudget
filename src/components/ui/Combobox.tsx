"use client";

import {
  Combobox as HeadlessCombobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { useState } from "react";
import { Icon } from "./Icon";

export type ComboboxOption = {
  label: string;
  value: string;
  type?: string;
};

type Props = {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  allValues?: boolean;
  disabled?: boolean;
};

export const Combobox = ({ options, value, onChange, placeholder, label, allValues = false, disabled = false }: Props) => {
  const [query, setQuery] = useState("");

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) =>
          option.label.toLowerCase().includes(query.toLowerCase())
        );

  const selected = options.find((opt) => opt.value === value);

  return (
    <div className="w-full sm:w-auto">
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <HeadlessCombobox value={value ?? ""} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <ComboboxInput
            className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
            }`}
            onChange={(event) => setQuery(event.target.value)}
            displayValue={() => selected?.label ?? ""}
            placeholder={placeholder}
          />
          <ComboboxButton className="group absolute inset-y-0 right-0 px-2.5">
            <Icon name="chevronDown" className="size-4 fill-black/60 group-data-[hover]:fill-black" />
          </ComboboxButton>
          <ComboboxOptions
            anchor="bottom"
            className="z-10 w-[var(--input-width)] bg-white border rounded shadow-md max-h-60 overflow-auto text-sm [--anchor-gap:4px] empty:invisible"
          >
            {allValues && (
              <ComboboxOption
                value=""
                className="cursor-pointer px-3 py-2 group flex gap-2 bg-white data-[focus]:bg-blue-100"
              >
                <Icon name='checkMark' className="invisible size-5 group-data-[selected]:visible" />
                All
              </ComboboxOption>
            )}
            {filteredOptions.map((option) => (
              <ComboboxOption
                key={option.value}
                value={option.value}
                className="cursor-pointer px-3 py-2 group flex gap-2 bg-white data-[focus]:bg-blue-100"
              >
                <Icon name='checkMark' className="invisible size-5 group-data-[selected]:visible" />
                {option.label}
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        </div>
      </HeadlessCombobox>
    </div>
  );
};