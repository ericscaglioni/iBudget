"use client";

import { ColorInput, FormCombobox, FormModal, FormTextInput } from "@/components/ui";
import { categoryService } from "@/lib/client/services";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category, CategoryGroup } from "@prisma/client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { CategoryFormInput, CategoryFormSchema } from "../schema";

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

export const CategoryFormModal = ({ open, onClose, category, groups }: Props) => {
  const form = useForm<CategoryFormInput>({
    resolver: zodResolver(CategoryFormSchema),
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
      description="Choose a name, color, and group for your category."
      toastSuccessMessage="Category saved successfully"
      toastErrorMessage="Failed to save category"
    >
      <FormTextInput
        name="name"
        label="Name"
        form={form}
        inputProps={{ disabled: !!category?.isSystem }}
      />

      <FormCombobox
        form={form}
        name="groupId"
        label="Group"
        options={groups.map((g) => ({
          value: g.id,
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