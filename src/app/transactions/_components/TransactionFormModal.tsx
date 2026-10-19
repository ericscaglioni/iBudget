"use client";

import { ComboboxOption, FormCombobox, FormModal, FormTextInput } from "@/components/ui";
import { transactionService } from "@/lib/client/services";
import { TransactionTypeEnum } from "@/lib/constants";
import { dayjs } from "@/lib/utils/dayjs.js";
import { showSuccess } from "@/lib/utils/toast";
import { Radio, RadioGroup } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { TransactionFormInput, createTransactionFormSchema } from "../schema";
import { CategoryOption, TransactionWithDetails } from "../types";
import { EditRecurringModal } from "./EditRecurringModal";
import { AccountField, FormFieldsByType } from "./FormFieldsByType";
import { AccountFormModal } from "@/app/accounts/_components/AccountFormModal";
import { CategoryFormModal } from "@/app/categories/_components/CategoryFormModal";

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
  toAmount: "",
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

export const TransactionFormModal = ({ open, onClose, accountOptions: baseAccountOptions, categoryOptions: baseCategoryOptions, transaction, transferCategoryId }: Props) => {
  const router = useRouter();
  const [mode, setMode] = useState<TransactionTypeEnum>(TransactionTypeEnum.expense);
  const [openEditRecurringModal, setOpenEditRecurringModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<TransactionFormInput | null>(null);
  const [openAccountModal, setOpenAccountModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [accountFieldToFill, setAccountFieldToFill] = useState<AccountField>("accountId");
  const [createdAccountOptions, setCreatedAccountOptions] = useState<ComboboxOption[]>([]);
  const [openCategoryModal, setOpenCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [createdCategoryOptions, setCreatedCategoryOptions] = useState<CategoryOption[]>([]);

  // Accounts created from inside this modal, merged with the ones passed in (deduped by id)
  const accountOptions = useMemo(
    () => [
      ...baseAccountOptions,
      ...createdAccountOptions.filter((created) => !baseAccountOptions.some((o) => o.value === created.value)),
    ],
    [baseAccountOptions, createdAccountOptions]
  );

  // Same for categories created from inside this modal
  const categoryOptions = useMemo(
    () => [
      ...baseCategoryOptions,
      ...createdCategoryOptions.filter((created) => !baseCategoryOptions.some((o) => o.id === created.id)),
    ],
    [baseCategoryOptions, createdCategoryOptions]
  );
  
  const form = useForm<TransactionFormInput>({
    resolver: zodResolver(createTransactionFormSchema(accountOptions, categoryOptions)),
    defaultValues: getDefaultValues(mode),
  });
  
  const { reset, watch, setValue } = form;
  const isRecurring = watch("isRecurring");
  const selectedFrequency = watch("frequency");
  
  const loadTransferTransaction = useCallback(async (transaction: TransactionWithDetails) => {
    const transferTransaction = await transactionService.getTransferTransactionByTransferId(transaction.transferId!);
    setMode(TransactionTypeEnum.transfer);
    form.reset({
      amount: String(transaction.amount),
      date: dayjs(transaction.date).format("YYYY-MM-DD"),
      description: transaction.description,
      type: TransactionTypeEnum.transfer,
      fromAccountId: transaction.accountId,
      toAccountId: transferTransaction.accountId,
      toAmount: String(transferTransaction.amount),
      categoryId: transferCategoryId,
    });
  }, [form, transferCategoryId]);

  const loadRegularTransaction = useCallback(async (transaction: TransactionWithDetails) => {
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
      frequency: transaction.frequency as "daily" | "weekly" | "monthly" | "yearly",
      endsAt: transaction.endsAt ? dayjs(transaction.endsAt).format("YYYY-MM-DD") : undefined,
    });
  }, [form]);

  const resetFormToDefault = useCallback(() => {
    setMode(TransactionTypeEnum.expense);
    form.reset(getDefaultValues(TransactionTypeEnum.expense));
  }, [form]);

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
  }, [transaction, reset, loadRegularTransaction, loadTransferTransaction, resetFormToDefault]);

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
      toAmount: data.toAmount ? parseFloat(data.toAmount) : undefined,
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
      toAmount: data.toAmount ? parseFloat(data.toAmount) : undefined,
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

  // Save and keep the modal open for the next entry. Type, date and account(s) carry over since
  // batches of entries usually share them; everything else is cleared so nothing is saved twice by accident.
  const onSubmitAndAddAnother = async (data: TransactionFormInput) => {
    await handleCreate(data);
    router.refresh();
    showSuccess('Transaction created successfully');

    form.reset({
      ...getDefaultValues(mode),
      date: data.date,
      ...(mode === TransactionTypeEnum.transfer
        ? { fromAccountId: data.fromAccountId, toAccountId: data.toAccountId }
        : { accountId: data.accountId }),
    });
    form.setFocus("amount");
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

  const handleCreateAccountRequest = (field: AccountField, name: string) => {
    setAccountFieldToFill(field);
    setNewAccountName(name);
    setOpenAccountModal(true);
  };

  const handleAccountCreated = (account: { id: string; name: string; currency: string }) => {
    setCreatedAccountOptions((prev) => [...prev, { label: account.name, value: account.id, currency: account.currency }]);
    setValue(accountFieldToFill, account.id, { shouldValidate: true, shouldDirty: true });
  };

  const handleCreateCategoryRequest = (name: string) => {
    setNewCategoryName(name);
    setOpenCategoryModal(true);
  };

  const handleCategoryCreated = (category: CategoryOption) => {
    setCreatedCategoryOptions((prev) => [...prev, category]);
    // The dropdown only lists categories matching the current mode, so only select it if it matches
    if (category.type === mode) {
      setValue("categoryId", category.id, { shouldValidate: true, shouldDirty: true });
    }
  };

  const filteredCategoryOptions = categoryOptions.filter((option) => option.type === mode);

  return (
    <>
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
        secondaryAction={
          transaction ? undefined : { label: "Save & add another", onSubmit: onSubmitAndAddAnother }
        }
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
          inputProps={{ type: "number", step: "0.01", autoFocus: true }}
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
          onCreateAccount={handleCreateAccountRequest}
          onCreateCategory={handleCreateCategoryRequest}
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
                  form={form}
                  name="frequency"
                  label="Frequency"
                  options={frequencyOptions}
                  value={selectedFrequency || ""}
                  onChange={(val) => setValue("frequency", val as "daily" | "weekly" | "monthly" | "yearly")}
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
      <AccountFormModal
        open={openAccountModal}
        onClose={() => setOpenAccountModal(false)}
        defaultName={newAccountName}
        onCreate={handleAccountCreated}
      />
      <CategoryFormModal
        open={openCategoryModal}
        onClose={() => setOpenCategoryModal(false)}
        defaultName={newCategoryName}
        defaultType={mode === TransactionTypeEnum.income ? "income" : "expense"}
        onCreate={handleCategoryCreated}
      />
    </>
  );
};