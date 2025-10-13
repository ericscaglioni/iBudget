"use client";

import { ColorInput, FormModal, FormRadioGroup, FormTextInput } from "@/components/ui";
import { categoryService } from "@/lib/client/services";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category } from "@prisma/client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { CategoryFormInput, CategoryFormSchema } from "../schema";

const DEFAULT_VALUES: CategoryFormInput = {
  name: "",
  color: "#10B981",
  type: "expense" as const,
};

const TYPE_OPTIONS = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  category?: Category;
};

export const CategoryFormModal = ({ open, onClose, category }: Props) => {
  const form = useForm<CategoryFormInput>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { reset } = form;

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        color: category.color,
        type: category.type,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [category, reset]);

  const onCloseModal = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: CategoryFormInput) => {
    const isEdit = !!category;
    if (isEdit) {
      await categoryService.updateCategory(category!.id, data);
    } else {
      await categoryService.createCategory(data);
    }

    onCloseModal();
  };

  return (
    <FormModal<CategoryFormInput>
      open={open}
      onClose={onCloseModal}
      onSubmit={onSubmit}
      form={form}
      title={!!category ? "Edit Category" : "New Category"}
      description="Choose a name, color, and type for your category."
      toastSuccessMessage="Category saved successfully"
      toastErrorMessage="Failed to save category"
    >
      <FormTextInput
        name="name"
        label="Name"
        form={form}
      />

      <FormRadioGroup
        form={form}
        name="type"
        label="Type"
        options={TYPE_OPTIONS}
      />

      <ColorInput
        form={form}
        name="color"
        label="Color"
      />
    </FormModal>
  );
};