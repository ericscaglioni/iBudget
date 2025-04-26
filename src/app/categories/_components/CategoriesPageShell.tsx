"use client";

import { PageShell } from "@/components";
import { useState } from "react";
import { CategoryGroupWithCategories } from "../types";
import { CategoryModal, CategoryList } from "./";
import { Category } from "@prisma/client";

interface Props {
  groups: CategoryGroupWithCategories[];
};

export const CategoriesPageShell = ({ groups }: Props) => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setOpenModal(true);
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setOpenModal(true);
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
      <CategoryList groups={groups} onEdit={handleEdit} />
      <CategoryModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        groups={groups}
        category={selectedCategory ?? undefined}
      />
    </PageShell>
  );
};