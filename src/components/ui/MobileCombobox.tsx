"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { SelectModal } from "./SelectModal";
import { Button } from "./Button";
import { ComboboxOption, optionsShowCurrency } from "./Combobox";

type Props = {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allValues?: boolean;
  disabled?: boolean;
  onCreateOption?: (label: string) => void;
  createLabel?: string;
  size?: "sm" | "md" | "lg";
};

export const MobileCombobox = ({
  options,
  value,
  onChange,
  placeholder,
  allValues = false,
  disabled = false,
  onCreateOption,
  createLabel,
  size = "lg",
}: Props) => {
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  const selected = options.find((opt) => opt.value === value);
  const showCurrency = optionsShowCurrency(options);

  return (
    <div className="w-full min-w-0 max-w-full">
      <Button
        onClick={() => !disabled && setIsMobileModalOpen(true)}
        disabled={disabled}
        variant="outline"
        size={size}
        className="w-full justify-between text-left"
      >
        <span className={`flex min-w-0 flex-1 items-center justify-between gap-2 ${selected?.label ? "text-gray-900" : "text-gray-500"}`}>
          <span className="truncate">{selected?.label || placeholder || "Select an option"}</span>
          {showCurrency && selected?.currency ? (
            <span className="shrink-0 text-xs font-medium text-grayNeutral">{selected.currency}</span>
          ) : null}
        </span>
        <Icon name="chevronDown" className="size-4 shrink-0 fill-black/60" />
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
