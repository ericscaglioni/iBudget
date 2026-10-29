"use client";

import { FormCombobox, FormTextInput, ComboboxOption } from "@/components/ui";
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
  const toAccountId = form.watch("toAccountId");

  const fromCurrency = accountOptions.find((option) => option.value === fromAccountId)?.currency;
  const toCurrency = accountOptions.find((option) => option.value === toAccountId)?.currency;
  const isCrossCurrency = !!fromCurrency && !!toCurrency && fromCurrency !== toCurrency;

  return (
    <>
      <FormCombobox
        form={form}
        name="fromAccountId"
        label="From Account"
        required
        value={fromAccountId ?? ""}
        onChange={(val) => form.setValue("fromAccountId", val, { shouldDirty: true, shouldValidate: true })}
        options={accountOptions}
        onCreateOption={onCreateAccount && ((name) => onCreateAccount("fromAccountId", name))}
        createLabel="account"
      />

      <FormCombobox
        form={form}
        name="toAccountId"
        label="To Account"
        required
        value={form.watch("toAccountId") ?? ""}
        onChange={(val) => form.setValue("toAccountId", val, { shouldDirty: true, shouldValidate: true })}
        disabled={!fromAccountId}
        options={accountOptions.filter((option) => option.value !== fromAccountId)}
        onCreateOption={onCreateAccount && ((name) => onCreateAccount("toAccountId", name))}
        createLabel="account"
      />

      {/* Moving money between currencies: the amount that arrives is not the amount that left */}
      {isCrossCurrency && (
        <FormTextInput
          form={form}
          name="toAmount"
          label={`Amount received (${toCurrency})`}
          required
          inputProps={{
            type: "number",
            step: "0.01",
            placeholder: `How much arrived in ${toCurrency}`,
          }}
        />
      )}
    </>
  );
};