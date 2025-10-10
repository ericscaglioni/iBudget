"use client";

import { ComboboxOption, SegmentedControl, Combobox, Input, MonthYearPicker } from "@/components/ui";
import { useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/lib/hooks/useDebounce";

type FilterConfig = {
  name: string;
  type: "segmentedControl" | "combobox" | "text" | "monthYear";
  label: string;
  options?: ComboboxOption[];
  conditionalFilter?: {
    dependsOn: string;
    showWhen: string[];
    filterOptionsBy?: string;
  };
};

const filtersConfig: FilterConfig[] = [
  {
    name: "type",
    type: "segmentedControl",
    label: "Type",
    options: [
      { value: "", label: "All" },
      { value: "expense", label: "Expense" },
      { value: "income", label: "Income" },
    ],
  },
  {
    name: "categoryId",
    type: "combobox",
    label: "Category",
    options: [], // will be passed from props
    conditionalFilter: {
      dependsOn: "type",
      showWhen: ["expense", "income"],
      filterOptionsBy: "type",
    },
  },
  {
    name: "month",
    type: "monthYear",
    label: "Month",
  },
  {
    name: "accountId",
    type: "combobox",
    label: "Account",
    options: [], // will be passed from props
  },
  {
    name: "description",
    type: "text",
    label: "Description",
  },
];

interface Props {
  accountOptions: ComboboxOption[];
  categoryOptions: ComboboxOption[];
  searchParams: URLSearchParams;
  basePath: string;
  startTransition: (callback: () => void) => void;
}

export const TransactionFilters = ({ accountOptions, categoryOptions, searchParams, basePath, startTransition }: Props) => {
  const router = useRouter();
  const [pendingTextFilters, setPendingTextFilters] = useState<Record<string, string>>({});

  const debouncedTextFilters = useDebounce(pendingTextFilters, 500);

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

  // Update the filtersConfig with the actual options
  const updatedFiltersConfig = filtersConfig.map((filter) => {
    if (filter.name === "accountId") {
      return { ...filter, options: accountOptions };
    }
    if (filter.name === "categoryId") {
      return { ...filter, options: categoryOptions };
    }
    return filter;
  });

  // Separate filters into groups
  const typeFilter = updatedFiltersConfig.find(f => f.name === "type");
  const categoryFilter = updatedFiltersConfig.find(f => f.name === "categoryId");
  const otherFilters = updatedFiltersConfig.filter(f => f.name !== "type" && f.name !== "categoryId");

  const renderFilter = (filter: FilterConfig) => {
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
      filteredOptions = filter.options.filter((opt: any) => {
        return opt[filter.conditionalFilter!.filterOptionsBy!] === dependentValue;
      });
    }

    if (filter.type === "segmentedControl") {
      return (
        <SegmentedControl
          key={filter.name}
          options={filter.options || []}
          label={filter.label}
          value={currentValue}
          onChange={(value: string) => handleFilterChange(filter.name, value)}
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
          onChange={(value: string) => handleFilterChange(filter.name, value)}
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTextChange(filter.name, e.target.value)}
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
          onChange={(value: string) => handleFilterChange(filter.name, value)}
          placeholder="Month/Year"
        />
      );
    }

    return null;
  };

  return (
    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4">
      {/* First row: Type and Category filters */}
      <div className="flex flex-wrap gap-3 sm:gap-4">
        {typeFilter && renderFilter(typeFilter)}
        {categoryFilter && renderFilter(categoryFilter)}
      </div>
      
      {/* Second row: Other filters */}
      <div className="flex flex-wrap gap-3 sm:gap-4">
        {otherFilters.map(renderFilter)}
      </div>
    </div>
  );
};
