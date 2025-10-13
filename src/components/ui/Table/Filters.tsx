"use client";

import { Combobox, ComboboxOption, Input, MonthYearPicker, SegmentedControl } from "@/components/ui";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type FilterType = "combobox" | "text" | "monthYear" | "segmentedControl";

export type TableFilter = {
  type: FilterType;
  label: string;
  name: string;
  options?: ComboboxOption[];
  conditionalFilter?: {
    dependsOn: string; // Name of the filter this depends on
    showWhen: string[]; // Array of values that enable this filter
    filterOptionsBy?: string; // Property to filter options by
  };
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

    // Clear dependent filters when their parent filter changes
    if (name === "type") {
      params.delete("categoryId"); // Clear category when type changes
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

      // Trigger search for empty values (to clear filter) or when user has typed at least 3 characters
      if (value.length === 0 || value.length >= 3) {
        handleFilterChange(name, value);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTextFilters]);

  return (
    <div className="flex flex-wrap gap-3 sm:gap-4 p-3 sm:p-4">
      {filtersConfig.map((filter) => {
        const currentValue = searchParams.get(filter.name) || "";

        // Check if filter should be disabled based on conditional logic
        let isDisabled = false;
        if (filter.conditionalFilter) {
          const dependentValue = searchParams.get(filter.conditionalFilter.dependsOn) || "";
          const shouldEnable = filter.conditionalFilter.showWhen.includes(dependentValue);
          isDisabled = !shouldEnable;
        }

        // Filter options if conditional filter specifies it
        let filteredOptions = filter.options;
        if (filter.conditionalFilter?.filterOptionsBy && filter.options) {
          const dependentValue = searchParams.get(filter.conditionalFilter.dependsOn) || "";
          filteredOptions = filter.options.filter((opt: ComboboxOption) => {
            return (opt as Record<string, unknown>)[filter.conditionalFilter!.filterOptionsBy!] === dependentValue;
          });
        }

        if (filter.type === "segmentedControl") {
          return (
            <SegmentedControl
              key={filter.name}
              options={filter.options || []}
              label={filter.label}
              value={currentValue}
              onChange={(value) => handleFilterChange(filter.name, value)}
            />
          );
        }

        if (filter.type === "combobox") {
          return (
            <Combobox
              key={filter.name}
              options={filteredOptions || []}
              label={filter.label}
              value={currentValue}
              onChange={(value) => handleFilterChange(filter.name, value)}
              placeholder={`Select ${filter.label}`}
              allValues={true}
              disabled={isDisabled}
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