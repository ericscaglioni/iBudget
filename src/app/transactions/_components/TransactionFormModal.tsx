"use client";

import { ComboboxOption, FormModal, FormTextInput } from "@/components/ui";
import { transactionService } from "@/lib/client/services";
import { TransactionTypeEnum } from "@/lib/constants";
import { dayjs } from "@/lib/utils/dayjs";
import { Radio, RadioGroup } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { TransactionFormInput, TransactionFormSchema } from "../schema";
import { CategoryOption, TransactionWithDetails } from "../types";
import { FormFieldsByType } from "./FormFieldsByType";
import { showError, showSuccess } from "@/lib/utils/toast";

const getDefaultValues = (type: TransactionTypeEnum) => ({
  type,
  amount: "",
  accountId: "",
  categoryId: "",
  description: "",
  date: dayjs().format("YYYY-MM-DD"),
  fromAccountId: "",
  toAccountId: "",
}) as Partial<TransactionFormInput>;

type Props = {
  open: boolean;
  onClose: () => void;
  accountOptions: ComboboxOption[];
  categoryOptions: CategoryOption[];
  transaction?: TransactionWithDetails;
};

export const TransactionFormModal = ({ open, onClose, accountOptions, categoryOptions, transaction }: Props) => {
  const [mode, setMode] = useState<TransactionTypeEnum>(TransactionTypeEnum.expense);

  const form = useForm<TransactionFormInput>({
  resolver: zodResolver(TransactionFormSchema),
  defaultValues: getDefaultValues(mode),
});

  const { reset } = form;

  const loadTransferTransaction = async (transaction: TransactionWithDetails) => {
    const transferTransaction = await transactionService.getTransferTransactionByTransferId(transaction.transferId!);
    setMode(TransactionTypeEnum.transfer);
    form.reset({
      amount: String(transaction.amount),
      date: dayjs(transaction.date).format("YYYY-MM-DD"),
      description: transaction.description,
      type: TransactionTypeEnum.transfer,
      fromAccountId: transaction.accountId,
      toAccountId: transferTransaction.accountId,
    });
  }

  const loadRegularTransaction = async (transaction: TransactionWithDetails) => {
    const mode = transaction.type as TransactionTypeEnum;
    setMode(mode);
    form.reset({
      amount: String(transaction.amount),
      date: dayjs(transaction.date).format("YYYY-MM-DD"),
      description: transaction.description,
      accountId: transaction.accountId,
      categoryId: transaction.categoryId!,
      type: mode,
    });
  }

  const resetFormToDefault = () => {
    setMode(TransactionTypeEnum.expense);
    form.reset(getDefaultValues(TransactionTypeEnum.expense));
  };

  useEffect(() => {
    if (!transaction) {
      resetFormToDefault();
      return;
    }
  
    if (transaction.transferId) {
      loadTransferTransaction(transaction);
    } else {
      loadRegularTransaction(transaction);
    }
  }, [transaction, reset]);

  const onCloseModal = () => {
    resetFormToDefault();
    onClose();
  };

  const handleCreate = async (data: TransactionFormInput) => {
    const payload = {
      ...data,
      amount: parseFloat(data.amount),
      date: dayjs(data.date).toDate(),
      type: mode,
    };

    await transactionService.createTransaction(payload);
  }

  const handleUpdate = async (data: TransactionFormInput) => {
    if (!transaction) return;

    const payload = {
      ...data,
      amount: parseFloat(data.amount),
      date: dayjs(data.date).toDate(),
      type: mode,
    };

    await transactionService.updateTransaction(transaction.id, {
      ...payload,
      ...(transaction.transferId ? { transferId: transaction.transferId } : {}),
    });
  }

  const onSubmit = async (data: TransactionFormInput) => {
    if (transaction) {
      await handleUpdate(data);
    } else {
      await handleCreate(data);
    }

    onCloseModal();
  };

  const handleModeChange = (newMode: typeof mode) => {
    setMode(newMode);
    form.setValue("type", newMode);
    form.trigger("type");
  };

  const filteredCategoryOptions = categoryOptions.filter((option) => option.type === mode);

  return (
    <FormModal
      open={open}
      onClose={onCloseModal}
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

      <FormFieldsByType
        mode={mode}
        form={form}
        accountOptions={accountOptions}
        categoryOptions={filteredCategoryOptions.map((c) => ({ label: c.name, value: c.id }))}
      />

      <FormTextInput
        form={form}
        name="description"
        label="Description"
        inputProps={{ placeholder: "Description" }}
      />
    </FormModal>
  );
};