"use client";

import type { ActiveFilterItem } from "@/lib/utils/active-filters";
import { Button } from "./Button";
import { Icon } from "./Icon";

type Props = {
  items: ActiveFilterItem[];
  onRemove: (name: string) => void;
  onClearAll: () => void;
};

export const ActiveFilters = ({ items, onRemove, onClearAll }: Props) => {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <button
          key={item.name}
          type="button"
          onClick={() => onRemove(item.name)}
          className="inline-flex max-w-full items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label={`Remove ${item.label} filter`}
        >
          <span className="truncate">
            <span className="text-grayNeutral">{item.label}:</span> {item.display}
          </span>
          <Icon name="close" className="size-3.5 shrink-0 text-gray-400" />
        </button>
      ))}
      <Button variant="ghost" size="sm" onClick={onClearAll} className="px-2 py-1 text-xs">
        Clear filters
      </Button>
    </div>
  );
};
