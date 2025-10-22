"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { ComboboxOption } from "./Combobox";

interface SelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allValues?: boolean;
  searchPlaceholder?: string;
}

export const SelectModal = ({
  isOpen,
  onClose,
  title,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  allValues = false,
  searchPlaceholder = "Search options...",
}: SelectModalProps) => {
  const [query, setQuery] = useState("");

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) =>
          option.label.toLowerCase().includes(query.toLowerCase())
        );

  const selected = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    onClose();
    setQuery("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="bg-white w-full h-full flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Icon name="close" className="size-6" />
            </button>
          </div>
          {/* Search input */}
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {allValues && (
            <button
              onClick={() => handleSelect("")}
              className="w-full px-4 py-4 text-left border-b border-gray-100 hover:bg-gray-50 flex items-center gap-3"
            >
              <Icon name='checkMark' className={`size-5 ${value === "" ? "visible" : "invisible"}`} />
              All
            </button>
          )}
          {filteredOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
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
  );
};
