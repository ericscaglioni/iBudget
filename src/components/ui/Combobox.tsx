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
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  return (
    <div className="w-full sm:w-auto">
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      
      {/* Mobile Modal Version */}
      {isMobile ? (
        <>
          <div 
            onClick={() => !disabled && setIsMobileModalOpen(true)}
            className={`w-full border rounded px-3 py-2 text-base cursor-pointer flex items-center justify-between ${
              disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white"
            }`}
          >
            <span className={selected?.label ? "text-gray-900" : "text-gray-500"}>
              {selected?.label || placeholder || "Select an option"}
            </span>
            <Icon name="chevronDown" className="size-4 fill-black/60" />
          </div>
          
          {/* Mobile Modal */}
          {isMobileModalOpen && (
            <div className="fixed inset-0 bg-white z-50 flex flex-col">
              <div className="bg-white w-full h-full flex flex-col">
                <div className="p-4 border-b">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">Select Option</h3>
                    <button 
                      onClick={() => setIsMobileModalOpen(false)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Icon name="close" className="size-6" />
                    </button>
                  </div>
                  {/* Search input for mobile */}
                  <input
                    type="text"
                    placeholder="Search options..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {allValues && (
                    <button
                      onClick={() => {
                        onChange("");
                        setIsMobileModalOpen(false);
                        setQuery("");
                      }}
                      className="w-full px-4 py-4 text-left border-b border-gray-100 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Icon name='checkMark' className={`size-5 ${value === "" ? "visible" : "invisible"}`} />
                      All
                    </button>
                  )}
                  {filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onChange(option.value);
                        setIsMobileModalOpen(false);
                        setQuery("");
                      }}
                      className="w-full px-4 py-4 text-left border-b border-gray-100 hover:bg-gray-50 last:border-b-0 flex items-center gap-3"
                    >
                      <Icon name='checkMark' className={`size-5 ${value === option.value ? "visible" : "invisible"}`} />
                      {option.label}
                    </button>
                  ))}
                  {filteredOptions.length === 0 && query && (
                    <div className="px-4 py-4 text-gray-500 text-center">
                      No options found
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Desktop Version */
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
      )}
    </div>
  );
};