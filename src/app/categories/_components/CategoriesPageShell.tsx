"use client";

import { PageShell } from "@/components";
import { ConfirmationModal, DeleteModal } from "@/components/ui";
import { categoryService } from "@/lib/client/services";
import { Category } from "@prisma/client";
import { useState } from "react";
import { CategoryGroupWithCategories } from "../types";
import { CategoryList, CategoryFormModal } from "./";
import { useRouter } from "next/navigation";

interface Props {
  groups: CategoryGroupWithCategories[];
};

export const CategoriesPageShell = ({ groups }: Props) => {
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
  }

  const confirmDelete = async () => {
    if (!selectedCategory) return;

    await categoryService.deleteCategory(selectedCategory.id);
    router.refresh();
    setSelectedCategory(null);
  };

  return (
    <PageShell
      title="Categories"
      subtitle="Manage your budget categories by group."
      actionButton={{
        text: "+ New Category",
        variant: "primary",
        size: "lg",
        onClick: handleCreate,
      }} 
    >
      <CategoryList groups={groups} onEdit={handleEdit} onDelete={handleDelete} />

      <CategoryFormModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        groups={groups}
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