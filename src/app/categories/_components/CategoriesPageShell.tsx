"use client";

import { PageShell } from "@/components";
import { DeleteModal } from "@/components/ui";
import { categoryService } from "@/lib/client/services";
import { Category } from "@prisma/client";
import { useState } from "react";
import { CategoriesTable, CategoryFormModal } from "./";
import { useRouter } from "next/navigation";

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
  
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
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
      <CategoriesTable
        data={categories}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CategoryFormModal
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