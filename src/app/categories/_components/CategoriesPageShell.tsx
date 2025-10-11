"use client";

import { PageShell } from "@/components";
import { DeleteModal } from "@/components/ui";
import { categoryService } from "@/lib/client/services";
import { Category } from "@prisma/client";
import { useState } from "react";
import { CategoryList, CategoryFormModal } from "./";
import { useRouter } from "next/navigation";

interface Props {
  categories: Category[];
}

export const CategoriesPageShell = ({ categories }: Props) => {
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
      <CategoryList 
        categories={categories} 
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