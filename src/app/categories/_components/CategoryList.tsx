"use client";

import { Button, Icon } from "@/components/ui";
import { Category } from "@prisma/client";

interface Props {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export const CategoryList = ({ categories, onEdit, onDelete }: Props) => {
  // Group categories by type
  const expenseCategories = categories.filter((cat) => cat.type === "expense");
  const incomeCategories = categories.filter((cat) => cat.type === "income");

  const renderCategorySection = (title: string, categoryList: Category[]) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>

      {categoryList.length === 0 ? (
        <p className="text-sm text-gray-400">No categories yet.</p>
      ) : (
        <ul className="border rounded divide-y divide-gray-200 bg-white shadow-sm">
          {categoryList.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full"
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
  );

  return (
    <>
      {renderCategorySection("Expense Categories", expenseCategories)}
      {renderCategorySection("Income Categories", incomeCategories)}
    </>
  );
};