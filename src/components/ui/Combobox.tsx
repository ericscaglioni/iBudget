"use client";

import {
  Combobox as HeadlessCombobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { useState, useEffect } from "react";
import { Icon } from "./Icon";
import { MobileCombobox } from "./MobileCombobox";

export type ComboboxOption = {
  label: string;
  value: string;
  type?: string;
  /** Extra info for account options: the account's currency. */
  currency?: string;
};

type Props = {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  allValues?: boolean;
  disabled?: boolean;
  /** Called with the typed text when the user chooses "Create new ...". The parent owns creation and the options list. */
  onCreateOption?: (label: string) => void;
  /** What gets created, e.g. "account". Used for the always-visible "Create new account…" row. */
  createLabel?: string;
  /** Size of the mobile trigger. Desktop keeps the same input. */
  size?: "sm" | "md" | "lg";
};

const CREATE_VALUE = "__create__";

export const Combobox = ({
  options,
  value,
  onChange,
  placeholder,
  label,
  allValues = false,
  disabled = false,
  onCreateOption,
  createLabel,
  size = "lg",
}: Props) => {
  const [query, setQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // The input falls back to the typed text when nothing is selected. If the value changes from
  // outside (selecting an option, or a form reset such as "Save & add another"), drop that text.
  // Otherwise a cleared field keeps showing the old text and looks selected when it isn't.
  const [lastValue, setLastValue] = useState(value);
  if (lastValue !== value) {
    setLastValue(value);
    setQuery("");
  }

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) =>
          option.label.toLowerCase().includes(query.toLowerCase())
        );

  const selected = options.find((opt) => opt.value === value);

  const handleChange = (selectedValue: string) => {
    if (selectedValue === CREATE_VALUE) {
      onCreateOption?.(query.trim());
      setQuery("");
      return;
    }
    onChange(selectedValue);
  };

  const showCreate =
    !!onCreateOption &&
    query.trim() !== "" &&
    !options.some((opt) => opt.label.toLowerCase() === query.trim().toLowerCase());
  // Nothing typed yet: still show the row, so users can tell they are able to add a new one
  const showCreatePrompt = !!onCreateOption && !showCreate;

  return (
    <div className="w-full min-w-0 max-w-full sm:w-auto">
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      
      {/* Mobile Modal Version */}
      {isMobile ? (
        <MobileCombobox
          options={options}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          allValues={allValues}
          disabled={disabled}
          onCreateOption={onCreateOption}
          createLabel={createLabel}
          size={size}
        />
      ) : (
        /* Desktop Version */
        <HeadlessCombobox value={value ?? ""} onChange={handleChange} disabled={disabled}>
          <div className="relative">
            <ComboboxInput
              className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
              }`}
              onChange={(event) => setQuery(event.target.value)}
              displayValue={() => selected?.label ?? query}
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
              {(showCreate || showCreatePrompt) && (
                <ComboboxOption
                  value={CREATE_VALUE}
                  className="cursor-pointer px-3 py-2 group flex items-center gap-2 bg-white text-blue-600 data-[focus]:bg-blue-100 border-t border-gray-100"
                >
                  <Icon name="plus" className="size-5" />
                  {showCreate ? <>Create new “{query.trim()}”</> : <>Create new {createLabel ?? "option"}…</>}
                </ComboboxOption>
              )}
              {filteredOptions.length === 0 && !showCreate && query && (
                <div className="px-3 py-2 text-gray-500 text-center text-sm">
                  No options found
                </div>
              )}
            </ComboboxOptions>
          </div>
        </HeadlessCombobox>
      )}
    </div>
  );
};