"use client";

import { Button } from "@/components/ui";
import { CategoryGroupWithCategories } from "../types";
import { Category } from "@prisma/client";

interface Props {
  groups: CategoryGroupWithCategories[];
  onEdit: (category: Category) => void;
}

export const CategoryList = ({ groups, onEdit }: Props) => {
  return (
    groups.map((group) => (
      <div key={group.id} className="mb-8">
        <h3 className="text-lg font-semibold mb-2">{group.name}</h3>

        {group.categories.length === 0 ? (
          <p className="text-sm text-gray-400">No categories yet.</p>
        ) : (
          <ul className="border rounded divide-y divide-gray-200 bg-white shadow-sm">
            {group.categories.map((cat) => (
              <li key={cat.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-3 h-3 rounded-full`}
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.name}</span>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(cat)}
                >
                  Edit
                </Button>
                {/* We'll add edit/delete buttons here */}
              </li>
            ))}
          </ul>
        )}
      </div>
    ))
  );
};