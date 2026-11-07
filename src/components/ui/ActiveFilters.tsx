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
          className="inline-flex max-w-full items-center gap-1 rounded-full border border-line bg-paper px-2.5 py-1 text-xs text-ink hover:bg-paper focus:outline-none focus:ring-2 focus:ring-brand/50"
          aria-label={`Remove ${item.label} filter`}
        >
          <span className="truncate">
            <span className="text-muted">{item.label}:</span> {item.display}
          </span>
          <Icon name="close" className="size-3.5 shrink-0 text-muted" />
        </button>
      ))}
      <Button variant="ghost" size="sm" onClick={onClearAll} className="px-2 py-1 text-xs">
        Clear filters
      </Button>
    </div>
  );
};
