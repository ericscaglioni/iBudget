"use client";

import { FormCombobox, ComboboxOption } from "@/components/ui";
import { UseFormReturn } from "react-hook-form";
import { TransactionFormInput } from "../schema";

type Props = {
  form: UseFormReturn<TransactionFormInput>;
  accountOptions: ComboboxOption[];
};

export const TransferFields = ({ form, accountOptions }: Props) => {
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
      />

      <FormCombobox
        form={form}
        name="toAccountId"
        label="To Account"
        value={form.watch("toAccountId") ?? ""}
        onChange={(val) => form.setValue("toAccountId", val)}
        disabled={!fromAccountId}
        options={accountOptions.filter((option) => option.value !== fromAccountId)}
      />
    </>
  );
};