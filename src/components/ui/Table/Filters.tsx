"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Combobox, ComboboxOption, Input } from "@/components/ui";

type FilterType = "combobox" | "text";

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
}

export const Filters = ({ filtersConfig, basePath, searchParams }: Props) => {
  const router = useRouter();

  const handleFilterChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    router.push(`${basePath}?${params.toString()}`);
  };

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
              value={currentValue}
              onChange={(e) => handleFilterChange(filter.name, e.target.value)}
              placeholder={`Search ${filter.label}`}
            />
          );
        }

        return null;
      })}
    </div>
  );
};