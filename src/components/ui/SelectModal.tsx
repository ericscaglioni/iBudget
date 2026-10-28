"use client";

import { useEscapeKey } from "@/lib/hooks/useEscapeKey";
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
  onCreateOption?: (label: string) => void;
  createLabel?: string;
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
  onCreateOption,
  createLabel,
}: SelectModalProps) => {
  const [query, setQuery] = useState("");

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) =>
          option.label.toLowerCase().includes(query.toLowerCase())
        );

  const selected = options.find((opt) => opt.value === value);

  const handleClose = () => {
    onClose();
    setQuery("");
  };

  // Esc closes the picker only, not the form it was opened from
  useEscapeKey(handleClose, isOpen);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    onClose();
    setQuery("");
  };

  const trimmedQuery = query.trim();
  const showCreate =
    !!onCreateOption &&
    trimmedQuery !== "" &&
    !options.some((opt) => opt.label.toLowerCase() === trimmedQuery.toLowerCase());
  const showCreatePrompt = !!onCreateOption && !showCreate;

  const handleCreate = () => {
    onClose();
    setQuery("");
    onCreateOption?.(trimmedQuery);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-x-hidden">
      <div className="bg-white w-full min-w-0 h-full flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">{title}</h3>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="p-1"
            >
              <Icon name="close" className="size-6" />
            </Button>
          </div>
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-base"
          />
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
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
          {(showCreate || showCreatePrompt) && (
            <Button
              onClick={handleCreate}
              variant="ghost"
              size="lg"
              className="w-full justify-start border-b border-gray-100 hover:bg-gray-50 rounded-none text-blue-600 hover:text-blue-700"
            >
              <Icon name="plus" className="size-5" />
              {showCreate ? <>Create new “{trimmedQuery}”</> : <>Create new {createLabel ?? "option"}…</>}
            </Button>
          )}
          {filteredOptions.length === 0 && query && !showCreate && (
            <div className="px-4 py-4 text-gray-500 text-center">
              No options found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
