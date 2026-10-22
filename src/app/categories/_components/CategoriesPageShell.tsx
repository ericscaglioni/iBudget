"use client";

import { PageShell } from "@/components";
import { DeleteModal, EmptyState } from "@/components/ui";
import { categoryService } from "@/lib/client/services";
import { hasActiveFilters } from "@/lib/utils/has-active-filters";
import { Category } from "@prisma/client";
import { useState } from "react";
import { CategoriesTable, CategoryFormModal } from "./";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  categories: Category[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export const CategoriesPageShell = ({
  categories,
  totalCount,
  page,
  pageSize,
}: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Empty because nothing exists yet (not because a filter hides everything)
  const hasNoCategoriesYet = totalCount === 0 && !hasActiveFilters(searchParams);

  const handleCreate = () => {
    setSelectedCategory(null);
    setOpenEditModal(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setOpenEditModal(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setOpenDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;

    await categoryService.deleteCategory(selectedCategory.id);
    router.refresh();
    setSelectedCategory(null);
  };

  return (
    <PageShell
      title="Categories"
      subtitle="Manage your expense and income categories."
      actionButton={{
        text: "+ New Category",
        variant: "primary",
        size: "lg",
        onClick: handleCreate,
      }} 
    >
      {hasNoCategoriesYet ? (
        <EmptyState
          title="No categories yet"
          description="Categories group your transactions, like Groceries, Rent or Salary, so you can see where your money goes. Create one to get started."
          action={{ label: "Create your first category", onClick: handleCreate }}
        />
      ) : (
        <CategoriesTable
          data={categories}
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <CategoryFormModal
        key={selectedCategory?.id ?? "new"}
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        category={selectedCategory ?? undefined}
      />
      
      <DeleteModal
        open={openDelete}
        onClose={() => setOpenDeleteModal(false)}
        itemDescription={selectedCategory?.name ?? ""}
        modelName="Category"
        onDelete={confirmDelete}
      />
    </PageShell>
  );
};