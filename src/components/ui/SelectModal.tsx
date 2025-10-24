"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { Button } from "./Button";
import { Input } from "./Input";
import { ComboboxOption } from "./Combobox";

interface SelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
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
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="p-1"
            >
              <Icon name="close" className="size-6" />
            </Button>
          </div>
          {/* Search input */}
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-base"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {allValues && (
            <Button
              onClick={() => handleSelect("")}
              variant="ghost"
              size="lg"
              className="w-full justify-start border-b border-gray-100 hover:bg-gray-50 rounded-none"
            >
              <Icon name='checkMark' className={`size-5 ${selected?.value === "" ? "visible" : "invisible"}`} />
              All
            </Button>
          )}
          {filteredOptions.map((option) => (
            <Button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              variant="ghost"
              size="lg"
              className="w-full justify-start border-b border-gray-100 hover:bg-gray-50 last:border-b-0 rounded-none"
            >
              <Icon name='checkMark' className={`size-5 ${selected?.value === option.value ? "visible" : "invisible"}`} />
              {option.label}
            </Button>
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
