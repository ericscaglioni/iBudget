// src/app/transactions/_components/formRenderUtils.tsx

import { FormCombobox } from "@/components/ui";
import { TransactionTypeEnum } from "@/lib/constants";
import { UseFormReturn } from "react-hook-form";
import { TransactionFormInput } from "../schema";
import { ComboboxOption } from "@/components/ui";
import { TransferFields } from "./TransferFields";

export type AccountField = "accountId" | "fromAccountId" | "toAccountId";

type FormFieldsByTypeParams = {
  mode: TransactionTypeEnum;
  form: UseFormReturn<TransactionFormInput>;
  accountOptions: ComboboxOption[];
  categoryOptions: ComboboxOption[];
  onCreateAccount?: (field: AccountField, name: string) => void;
  onCreateCategory?: (name: string) => void;
};

export function FormFieldsByType({
  mode,
  form,
  accountOptions,
  categoryOptions,
  onCreateAccount,
  onCreateCategory,
}: FormFieldsByTypeParams) {
  const { watch, setValue } = form;

  if (mode === TransactionTypeEnum.transfer) {
    return (
      <TransferFields
        form={form}
        accountOptions={accountOptions}
        onCreateAccount={onCreateAccount}
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
        onCreateOption={onCreateAccount && ((name) => onCreateAccount("accountId", name))}
      />
      <FormCombobox
        form={form}
        name="categoryId"
        label="Category"
        value={watch("categoryId") ?? ""}
        onChange={(val) => setValue("categoryId", val)}
        options={categoryOptions}
        onCreateOption={onCreateCategory}
      />
    </>
  );
}