"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { SelectModal } from "./SelectModal";
import { Button } from "./Button";
import { ComboboxOption } from "./Combobox";

type Props = {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  allValues?: boolean;
  disabled?: boolean;
  onCreateOption?: (label: string) => void;
  createLabel?: string;
};

export const MobileCombobox = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  label, 
  allValues = false, 
  disabled = false,
  onCreateOption,
  createLabel,
}: Props) => {
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  const selected = options.find((opt) => opt.value === value);

  return (
    <div className="w-full sm:w-auto">
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      
      <Button
        onClick={() => !disabled && setIsMobileModalOpen(true)}
        disabled={disabled}
        variant="outline"
        size="lg"
        className="w-full justify-between text-left"
      >
        <span className={selected?.label ? "text-gray-900" : "text-gray-500"}>
          {selected?.label || placeholder || "Select an option"}
        </span>
        <Icon name="chevronDown" className="size-4 fill-black/60" />
      </Button>
      
      <SelectModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        title="Select Option"
        options={options}
        value={value}
        onChange={onChange}
        allValues={allValues}
        searchPlaceholder={onCreateOption ? "Search, or type a new name..." : "Search options..."}
        onCreateOption={onCreateOption}
        createLabel={createLabel}
      />
    </div>
  );
};
