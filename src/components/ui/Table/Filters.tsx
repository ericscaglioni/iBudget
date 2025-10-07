"use client";

import { Combobox, ComboboxOption, Input, MonthYearPicker } from "@/components/ui";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type FilterType = "combobox" | "text" | "monthYear";

export type TableFilter = {
  type: FilterType;
  label: string;
  name: string;
  options?: ComboboxOption[];
};

interface Props {
  filtersConfig: TableFilter[];
  searchParams: URLSearchParams;
  basePath?: string;
  startTransition: (callback: () => void) => void;
}

export const Filters = ({ filtersConfig, basePath, searchParams, startTransition }: Props) => {
  const router = useRouter();
  const [pendingTextFilters, setPendingTextFilters] = useState<Record<string, string>>({});

  const debouncedTextFilters = useDebounce(pendingTextFilters, 500); // ⏳ 500ms debounce

  const handleFilterChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  };

  const handleTextChange = (name: string, value: string) => {
    setPendingTextFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    for (const name in debouncedTextFilters) {
      const value = debouncedTextFilters[name];

      if (value.length === 0 || value.length > 3) {
        handleFilterChange(name, debouncedTextFilters[name]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTextFilters]);

  return (
    <div className="flex flex-wrap gap-4 p-4">
      {filtersConfig.map((filter) => {
        const currentValue = searchParams.get(filter.name) || "";

        if (filter.type === "combobox") {
          return (
            <Combobox
              key={filter.name}
              options={filter.options || []}
              label={filter.label}
              value={currentValue}
              onChange={(value) => handleFilterChange(filter.name, value)}
              placeholder={`Select ${filter.label}`}
              allValues={true}
            />
          );
        }

        if (filter.type === "text") {
          return (
            <Input
              key={filter.name}
              label={filter.label}
              value={pendingTextFilters[filter.name] ?? currentValue}
              onChange={(e) => handleTextChange(filter.name, e.target.value)}
              placeholder={`Search ${filter.label}`}
            />
          );
        }

        if (filter.type === "monthYear") {
          return (
            <MonthYearPicker
              key={filter.name}
              label={filter.label}
              value={currentValue}
              onChange={(value) => handleFilterChange(filter.name, value)}
              placeholder="Month/Year"
            />
          );
        }

        return null;
      })}
    </div>
  );
};