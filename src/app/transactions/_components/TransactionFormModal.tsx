"use client";

import { ComboboxOption, FormCombobox, FormModal, FormTextInput } from "@/components/ui";
import { transactionService } from "@/lib/client/services";
import { TransactionTypeEnum } from "@/lib/constants";
import { dayjs } from "@/lib/utils/dayjs";
import { Radio, RadioGroup } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TransactionFormInput, TransactionFormSchema } from "../schema";

const DEFAULT_VALUES: TransactionFormInput = {
  type: "expense",
  amount: "",
  accountId: "",
  categoryId: "",
  description: "",
  date: dayjs().format("YYYY-MM-DD"),
};

type Props = {
  open: boolean;
  onClose: () => void;
  accountOptions: ComboboxOption[];
  categoryOptions: ComboboxOption[];
};

export const TransactionFormModal = ({ open, onClose, accountOptions, categoryOptions }: Props) => {
  const [mode, setMode] = useState<TransactionTypeEnum>(TransactionTypeEnum.expense);

  const form = useForm<TransactionFormInput>({
    resolver: zodResolver(TransactionFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { reset } = form;

  const isTransfer = mode === TransactionTypeEnum.transfer;

  const onCloseModal = () => {
    reset(DEFAULT_VALUES);
    onClose();
  };

  const onSubmit = async (data: TransactionFormInput) => {
    const payload = {
      ...data,
      amount: parseFloat(data.amount),
      date: dayjs(data.date).toDate(),
      description: data.description,
      type: mode,
    };
    
    await transactionService.createTransaction(payload);
    onCloseModal();
  };

  const handleModeChange = (newMode: typeof mode) => {
    setMode(newMode);
    form.reset(); // optional: reset form on mode switch
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      form={form}
      onSubmit={onSubmit}
      title="New Transaction"
      description="Log an expense, income, or transfer between accounts."
      toastErrorMessage="Failed to create transaction"
      toastSuccessMessage="Transaction created successfully"
    >
      <RadioGroup value={mode} onChange={handleModeChange} className="flex gap-4 mb-4">
        {["expense", "income", "transfer"].map((type) => (
          <Radio
            key={type}
            value={type}
            className={({ checked }) =>
              `px-4 py-1.5 rounded-md text-sm font-medium cursor-pointer ${
                checked ? "bg-primary text-white" : "bg-gray-100 text-gray-700"
              }`
            }
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Radio>
        ))}
      </RadioGroup>

      {/* Form fields */}
      <FormTextInput
        form={form}
        name="amount"
        label="Amount"
        inputProps={{ type: "number", step: "0.01" }}
      />

      <FormTextInput
        form={form}
        name="date"
        label="Date"
        inputProps={{ type: "date" }}
      />

      {isTransfer ? (
        <>
          <FormCombobox
            form={form}
            name="fromAccountId"
            label="From Account"
            value={form.watch("fromAccountId")}
            onChange={(val) => form.setValue("fromAccountId", val)}
            options={accountOptions}
          />
          <FormCombobox
            form={form}
            name="toAccountId"
            label="To Account"
            value={form.watch("toAccountId")}
            onChange={(val) => form.setValue("toAccountId", val)}
            disabled={!form.watch("fromAccountId")}
            options={accountOptions
              .filter((option) => option.value !== form.watch("fromAccountId"))
            }
          />
        </>
      ) : (
        <>
          <FormCombobox
            form={form}
            name="accountId"
            label="Account"
            value={form.watch("accountId")}
            onChange={(val) => form.setValue("accountId", val)}
            options={accountOptions}
          />
          <FormCombobox
            form={form}
            name="categoryId"
            label="Category"
            value={form.watch("categoryId")}
            onChange={(val) => form.setValue("categoryId", val)}
            options={categoryOptions}
          />
        </>
      )}

      <FormTextInput
        form={form}
        name="description"
        label="Description"
        inputProps={{ placeholder: "Description" }}
      />
    </FormModal>
  );
};