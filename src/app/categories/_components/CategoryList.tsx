"use client";

import { Button, Icon } from "@/components/ui";
import { TrashIcon } from "@heroicons/react/20/solid";
import { Category } from "@prisma/client";
import { CategoryGroupWithCategories } from "../types";

interface Props {
  groups: CategoryGroupWithCategories[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export const CategoryList = ({ groups, onEdit, onDelete}: Props) => {
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

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(cat)}
                  >
                    <Icon name="edit" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(cat)}
                  >
                    <Icon name="delete" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    ))
  );
};