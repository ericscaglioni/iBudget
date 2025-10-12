"use client";

import { ComboboxOption, FormCombobox, FormModal, FormTextInput } from "@/components/ui";
import { transactionService } from "@/lib/client/services";
import { TransactionTypeEnum } from "@/lib/constants";
import { dayjs } from "@/lib/utils/dayjs";
import { showSuccess } from "@/lib/utils/toast";
import { Radio, RadioGroup } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { TransactionFormInput, TransactionFormSchema } from "../schema";
import { CategoryOption, TransactionWithDetails } from "../types";
import { EditRecurringModal } from "./EditRecurringModal";
import { FormFieldsByType } from "./FormFieldsByType";

const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const getDefaultValues = (type: TransactionTypeEnum) => ({
  type,
  amount: "",
  accountId: "",
  categoryId: "",
  description: "",
  date: dayjs().format("YYYY-MM-DD"),
  fromAccountId: "",
  toAccountId: "",
  isRecurring: false,
  frequency: undefined,
  endsAt: undefined,
}) as Partial<TransactionFormInput>;

type Props = {
  open: boolean;
  onClose: () => void;
  accountOptions: ComboboxOption[];
  categoryOptions: CategoryOption[];
  transaction?: TransactionWithDetails;
  transferCategoryId: string;
};

export const TransactionFormModal = ({ open, onClose, accountOptions, categoryOptions, transaction, transferCategoryId }: Props) => {
  const router = useRouter();
  const [mode, setMode] = useState<TransactionTypeEnum>(TransactionTypeEnum.expense);
  const [openEditRecurringModal, setOpenEditRecurringModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<TransactionFormInput | null>(null);
  
  const form = useForm<TransactionFormInput>({
    resolver: zodResolver(TransactionFormSchema),
    defaultValues: getDefaultValues(mode),
  });
  
  const { reset, watch, setValue } = form;
  const isRecurring = watch("isRecurring");
  const selectedFrequency = watch("frequency");
  
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
      categoryId: transferCategoryId,
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
      isRecurring: transaction.isRecurring || false,
      frequency: transaction.frequency as any,
      endsAt: transaction.endsAt ? dayjs(transaction.endsAt).format("YYYY-MM-DD") : undefined,
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
    setPendingFormData(null);
    setOpenEditRecurringModal(false);
    onClose();
  };

  const handleCloseEditRecurringModal = () => {
    setOpenEditRecurringModal(false);
    setPendingFormData(null);
  };

  const handleCreate = async (data: TransactionFormInput) => {
    const payload = {
      ...data,
      amount: parseFloat(data.amount),
      date: dayjs(data.date).toDate(),
      type: mode,
      endsAt: data.endsAt ? dayjs(data.endsAt).toDate() : undefined,
    };

    await transactionService.createTransaction(payload);
  }

  const handleUpdate = async (data: TransactionFormInput, updateScope?: 'one' | 'future') => {
    if (!transaction) return;

    const payload = {
      ...data,
      amount: parseFloat(data.amount),
      date: dayjs(data.date).toDate(),
      type: mode,
      endsAt: data.endsAt ? dayjs(data.endsAt).toDate() : undefined,
    };

    await transactionService.updateTransaction(
      transaction.id,
      {
        ...payload,
        ...(transaction.transferId ? { transferId: transaction.transferId } : {}),
      },
      updateScope
    );
  }

  const onSubmit = async (data: TransactionFormInput) => {
    if (transaction) {
      // Check if editing a recurring transaction
      if (transaction.isRecurring && transaction.recurringId) {
        // Store form data and show the edit recurring modal
        setPendingFormData(data);
        setOpenEditRecurringModal(true);
        return; // Don't close the form modal yet
      }
      
      // Non-recurring transaction - update directly
      await handleUpdate(data);
      router.refresh();
      showSuccess('Transaction updated successfully');
    } else {
      await handleCreate(data);
      router.refresh();
      showSuccess('Transaction created successfully');
    }

    onCloseModal();
  };

  const handleConfirmRecurringUpdate = async (scope: 'one' | 'future') => {
    if (!pendingFormData || !transaction) return;

    try {
      await handleUpdate(pendingFormData, scope);
      router.refresh();
      onCloseModal();
    } catch (error) {
      // Error is already handled in EditRecurringModal
      throw error;
    }
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
      showToast={false}
      refreshOnSubmit={false}
      toastErrorMessage="Failed to save transaction"
      maxWidth="xl"
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

      {/* Recurring Transaction Section - Only for expense/income */}
      {(mode === TransactionTypeEnum.expense || mode === TransactionTypeEnum.income) && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          {/* Checkbox for recurring */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRecurring"
              {...form.register("isRecurring")}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
            <label 
              htmlFor="isRecurring" 
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              Make this a recurring transaction
            </label>
          </div>

          {/* Conditional fields when isRecurring is true */}
          {isRecurring && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6 border-l-2 border-primary/20">
              {/* Frequency dropdown */}
              <FormCombobox
                form={form as any}
                name="frequency"
                label="Frequency"
                options={frequencyOptions}
                value={selectedFrequency || ""}
                onChange={(val) => setValue("frequency", val as any)}
              />

              {/* End date input */}
              <FormTextInput
                form={form}
                name="endsAt"
                label="End Date (Optional)"
                inputProps={{ type: "date" }}
              />
            </div>
          )}
        </div>
      )}

      <EditRecurringModal
        open={openEditRecurringModal}
        onClose={handleCloseEditRecurringModal}
        itemDescription={transaction?.description ?? ""}
        onUpdate={handleConfirmRecurringUpdate}
      />
    </FormModal>
  );
};