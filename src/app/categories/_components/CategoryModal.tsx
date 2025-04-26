"use client";

import { ColorInput, ComboboxField, FormModal, TextInput } from "@/components/ui";
import { categoryService } from "@/lib/client/services";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category, CategoryGroup } from "@prisma/client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { CategoryInput, categorySchema } from "./schema";

const DEFAULT_VALUES = {
  name: "",
  color: "#10B981",
  groupId: "",
};

type Props = {
  open: boolean;
  onClose: () => void;
  groups: CategoryGroup[];
  category?: Category;
};

export const CategoryModal = ({ open, onClose, category, groups }: Props) => {
  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { reset, watch, setValue } = form;
  const selectedGroupId = watch("groupId");

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        color: category.color,
        groupId: category.groupId,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [category, reset]);

  const onCloseModal = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: CategoryInput) => {
    const isEdit = !!category;
    if (isEdit) {
      await categoryService.updateCategory(category!.id, data);
    } else {
      await categoryService.createCategory(data);
    }

    onCloseModal();
  };

  return (
    <FormModal<CategoryInput>
      open={open}
      onClose={onCloseModal}
      onSubmit={onSubmit}
      form={form}
      title={!!category ? "Edit Category" : "New Category"}
      description="Choose a name, color, and group for your category."
      toastSuccessMessage="Category saved successfully"
      toastErrorMessage="Failed to save category"
    >
      <TextInput
        name="name"
        label="Name"
        form={form}
        inputProps={{ disabled: !!category?.isSystem }}
      />

      <ComboboxField
        form={form}
        name="groupId"
        label="Group"
        options={groups.map((g) => ({
          id: g.id,
          label: g.name,
        }))}
        value={selectedGroupId}
        onChange={(val) => setValue("groupId", val)}
      />

      <ColorInput
        form={form}
        name="color"
        label="Color"
      />
    </FormModal>
  );
};