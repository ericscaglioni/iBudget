"use client";

import { FormCombobox, ComboboxOption } from "@/components/ui";
import { UseFormReturn } from "react-hook-form";
import { TransactionFormInput } from "../schema";
import { AccountField } from "./FormFieldsByType";

type Props = {
  form: UseFormReturn<TransactionFormInput>;
  accountOptions: ComboboxOption[];
  onCreateAccount?: (field: AccountField, name: string) => void;
};

export const TransferFields = ({ form, accountOptions, onCreateAccount }: Props) => {
  const fromAccountId = form.watch("fromAccountId");

  return (
    <>
      <FormCombobox
        form={form}
        name="fromAccountId"
        label="From Account"
        value={fromAccountId ?? ""}
        onChange={(val) => form.setValue("fromAccountId", val)}
        options={accountOptions}
        onCreateOption={onCreateAccount && ((name) => onCreateAccount("fromAccountId", name))}
      />

      <FormCombobox
        form={form}
        name="toAccountId"
        label="To Account"
        value={form.watch("toAccountId") ?? ""}
        onChange={(val) => form.setValue("toAccountId", val)}
        disabled={!fromAccountId}
        options={accountOptions.filter((option) => option.value !== fromAccountId)}
        onCreateOption={onCreateAccount && ((name) => onCreateAccount("toAccountId", name))}
      />
    </>
  );
};