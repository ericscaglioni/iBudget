"use client";

import { ComboboxOption, FormCombobox, FormModal, FormTextInput } from "@/components/ui";
import { transactionService } from "@/lib/client/services";
import { TransactionTypeEnum } from "@/lib/constants";
import { dayjs } from "@/lib/utils/dayjs";
import { Radio, RadioGroup } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { TransactionFormInput, TransactionFormSchema } from "../schema";
import { TransactionWithDetails } from "../types";

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
  categoryOptions: ComboboxOption[];
  transaction?: TransactionWithDetails;
};

export const TransactionFormModal = ({ open, onClose, accountOptions, categoryOptions, transaction }: Props) => {
  const [mode, setMode] = useState<TransactionTypeEnum>(TransactionTypeEnum.expense);

  const form = useForm<TransactionFormInput>({
  resolver: zodResolver(TransactionFormSchema),
  defaultValues: getDefaultValues(mode),
});

  const { reset } = form;

  useEffect(() => {
    const fetchTransferTransaction = async () => {
      if (!transaction) return;
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

    if (transaction) {
      if (transaction.transferId) {
        fetchTransferTransaction();
        return;
      }

      setMode(transaction.type as TransactionTypeEnum);
      form.reset({
        amount: String(transaction.amount),
        date: dayjs(transaction.date).format("YYYY-MM-DD"),
        description: transaction.description,
        accountId: transaction.accountId,
        categoryId: transaction.categoryId!,
        type: transaction.type as TransactionTypeEnum,
      });
    } else {
      setMode(TransactionTypeEnum.expense);
      reset(getDefaultValues(mode));
    }
  }, [transaction, reset]);

  const onCloseModal = () => {
    reset(getDefaultValues(mode));
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
  
    const isEdit = !!transaction;
    if (isEdit) {
      await transactionService.updateTransaction(transaction.id, {
        ...payload,
        ...(transaction.transferId ? { transferId: transaction.transferId } : {}),
      });
    } else {
      await transactionService.createTransaction(payload);
    }

    onCloseModal();
  };

  const handleModeChange = (newMode: typeof mode) => {
    setMode(newMode);
    form.setValue("type", newMode);
    form.trigger("type");
  };

  const isTransfer = mode === TransactionTypeEnum.transfer;

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

      {isTransfer ? (
        <>
          <FormCombobox
            form={form}
            name="fromAccountId"
            label="From Account"
            value={form.watch("fromAccountId") ?? ""}
            onChange={(val) => form.setValue("fromAccountId", val, { shouldDirty: true })}
            options={accountOptions}
          />
          <FormCombobox
            form={form}
            name="toAccountId"
            label="To Account"
            value={form.watch("toAccountId") ?? ""}
            onChange={(val) => form.setValue("toAccountId", val, { shouldDirty: true })}
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
            value={form.watch("accountId") ?? ""}
            onChange={(val) => form.setValue("accountId", val)}
            options={accountOptions}
          />
          <FormCombobox
            form={form}
            name="categoryId"
            label="Category"
            value={form.watch("categoryId") ?? ""}
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