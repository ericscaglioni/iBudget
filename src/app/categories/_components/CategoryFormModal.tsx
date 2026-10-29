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
  defaultName?: string;
  defaultType?: CategoryFormInput["type"];
  onCreate?: (category: { id: string; name: string; type: Category["type"] }) => void;
};

export const CategoryFormModal = ({ open, onClose, category, defaultName, defaultType, onCreate }: Props) => {
  const form = useForm<CategoryFormInput>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { reset, setValue } = form;

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        color: category.color,
        type: category.type,
      });
    } else {
      reset({ ...DEFAULT_VALUES, type: defaultType ?? DEFAULT_VALUES.type });
      // Set after reset so the prefilled name counts as a change (Save is disabled until the form is dirty)
      if (defaultName) {
        setValue("name", defaultName, { shouldDirty: true });
      }
    }
  }, [category, defaultName, defaultType, open, reset, setValue]);

  const onCloseModal = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: CategoryFormInput) => {
    const isEdit = !!category;
    if (isEdit) {
      await categoryService.updateCategory(category!.id, data);
    } else {
      const created = await categoryService.createCategory(data);
      onCreate?.({ id: created.id, name: created.name, type: created.type });
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
        required
      />

      <FormRadioGroup
        form={form}
        name="type"
        label="Type"
        required
        options={TYPE_OPTIONS}
      />

      <ColorInput
        form={form}
        name="color"
        label="Color"
        required
      />
    </FormModal>
  );
};