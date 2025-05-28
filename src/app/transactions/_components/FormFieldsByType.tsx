// src/app/transactions/_components/formRenderUtils.tsx

import { FormCombobox } from "@/components/ui";
import { TransactionTypeEnum } from "@/lib/constants";
import { UseFormReturn } from "react-hook-form";
import { TransactionFormInput } from "../schema";
import { ComboboxOption } from "@/components/ui";
import { TransferFields } from "./TransferFields";

type FormFieldsByTypeParams = {
  mode: TransactionTypeEnum;
  form: UseFormReturn<TransactionFormInput>;
  accountOptions: ComboboxOption[];
  categoryOptions: ComboboxOption[];
};

export function FormFieldsByType({
  mode,
  form,
  accountOptions,
  categoryOptions,
}: FormFieldsByTypeParams) {
  const { watch, setValue } = form;

  if (mode === TransactionTypeEnum.transfer) {
    return (
      <TransferFields
        form={form}
        accountOptions={accountOptions}
      />
    );
  }

  return (
    <>
      <FormCombobox
        form={form}
        name="accountId"
        label="Account"
        value={watch("accountId") ?? ""}
        onChange={(val) => setValue("accountId", val)}
        options={accountOptions}
      />
      <FormCombobox
        form={form}
        name="categoryId"
        label="Category"
        value={watch("categoryId") ?? ""}
        onChange={(val) => setValue("categoryId", val)}
        options={categoryOptions}
      />
    </>
  );
}