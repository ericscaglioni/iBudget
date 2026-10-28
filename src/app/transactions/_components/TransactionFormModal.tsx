"use client";

import { ComboboxOption, FormCombobox, FormModal, FormTextInput } from "@/components/ui";
import { transactionService } from "@/lib/client/services";
import { TransactionTypeEnum } from "@/lib/constants";
import { calendarDateString } from "@/lib/utils/format";
import { dayjs } from "@/lib/utils/dayjs.js";
import { showError, showSuccess } from "@/lib/utils/toast";
import { Radio, RadioGroup } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { TransactionFormInput, createTransactionFormResolver } from "../schema";
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
  // Editing a transfer needs the receiving side, which isn't in the list row and has to be fetched
  const [isLoadingTransaction, setIsLoadingTransaction] = useState(false);
  // onClose changes on every render of the page; reading it through a ref keeps the load effect from re-running
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
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
  
  const accountOptionsRef = useRef(accountOptions);
  const categoryOptionsRef = useRef(categoryOptions);
  accountOptionsRef.current = accountOptions;
  categoryOptionsRef.current = categoryOptions;

  const form = useForm<TransactionFormInput>({
    resolver: createTransactionFormResolver(
      () => accountOptionsRef.current,
      () => categoryOptionsRef.current,
    ),
    defaultValues: getDefaultValues(mode),
  });
  
  const { reset, watch, setValue } = form;
  const isRecurring = watch("isRecurring");
  const selectedFrequency = watch("frequency");
  
  const loadTransferTransaction = useCallback(async (transaction: TransactionWithDetails, isStale: () => boolean) => {
    const baseValues = {
      amount: String(transaction.amount),
      date: calendarDateString(transaction.date),
      description: transaction.description,
      type: TransactionTypeEnum.transfer,
      fromAccountId: transaction.accountId,
      categoryId: transferCategoryId,
    };

    // Show what the row already knows right away; only the receiving side needs a request
    setMode(TransactionTypeEnum.transfer);
    form.reset({ ...baseValues, toAccountId: "", toAmount: "" });
    setIsLoadingTransaction(true);

    try {
      const transferTransaction = await transactionService.getTransferTransactionByTransferId(transaction.transferId!);
      if (isStale()) return; // the modal was closed or moved on to another transaction meanwhile

      form.reset({
        ...baseValues,
        toAccountId: transferTransaction.accountId,
        toAmount: String(transferTransaction.amount),
      });
      setIsLoadingTransaction(false);
    } catch {
      if (isStale()) return;
      // A form without the receiving side would be misleading (and saving it would overwrite the transfer)
      setIsLoadingTransaction(false);
      showError("Could not load the transfer. Please try again.");
      onCloseRef.current();
    }
  }, [form, transferCategoryId]);

  const loadRegularTransaction = useCallback(async (transaction: TransactionWithDetails) => {
    const mode = transaction.type as TransactionTypeEnum;
    setMode(mode);
    form.reset({
      amount: String(transaction.amount),
      date: calendarDateString(transaction.date),
      description: transaction.description,
      accountId: transaction.accountId,
      // Database NULLs arrive as null, which the form schema rejects (and for recurring-only fields
      // the error would sit on a field that isn't on screen, making Save look broken)
      categoryId: transaction.categoryId ?? "",
      type: mode,
      isRecurring: transaction.isRecurring || false,
      frequency: (transaction.frequency ?? undefined) as "daily" | "weekly" | "monthly" | "yearly" | undefined,
      endsAt: transaction.endsAt ? calendarDateString(transaction.endsAt) : undefined,
    });
  }, [form]);

  const resetFormToDefault = useCallback(() => {
    setMode(TransactionTypeEnum.expense);
    form.reset(getDefaultValues(TransactionTypeEnum.expense));
  }, [form]);

  useEffect(() => {
    // Set when this effect is replaced, so a slow response can't fill a modal that has moved on
    let stale = false;

    if (!transaction) {
      setIsLoadingTransaction(false);
      resetFormToDefault();
      return;
    }

    if (transaction.transferId) {
      loadTransferTransaction(transaction, () => stale);
    } else {
      setIsLoadingTransaction(false);
      loadRegularTransaction(transaction);
    }

    return () => {
      stale = true;
    };
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
      date: data.date,
      type: mode,
      endsAt: data.endsAt || undefined,
    };

    await transactionService.createTransaction(payload);
  }

  const handleUpdate = async (data: TransactionFormInput, updateScope?: 'one' | 'future') => {
    if (!transaction) return;

    const payload = {
      ...data,
      amount: parseFloat(data.amount),
      toAmount: data.toAmount ? parseFloat(data.toAmount) : undefined,
      date: data.date,
      type: mode,
      endsAt: data.endsAt || undefined,
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

  // Save and keep the modal open for the next entry. Type, date, account(s) and category carry over
  // since batches of entries usually share them; only the amount, description and the like are cleared.
  const onSubmitAndAddAnother = async (data: TransactionFormInput) => {
    await handleCreate(data);
    router.refresh();
    showSuccess('Transaction created successfully');

    form.reset({
      ...getDefaultValues(mode),
      date: data.date,
      ...(mode === TransactionTypeEnum.transfer
        ? { fromAccountId: data.fromAccountId, toAccountId: data.toAccountId }
        : { accountId: data.accountId, categoryId: data.categoryId }),
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
    const created = { label: account.name, value: account.id, currency: account.currency };
    const nextCreated = [...createdAccountOptions, created];
    accountOptionsRef.current = [
      ...baseAccountOptions,
      ...nextCreated.filter((item) => !baseAccountOptions.some((o) => o.value === item.value)),
    ];
    setCreatedAccountOptions(nextCreated);
    setValue(accountFieldToFill, account.id, { shouldValidate: true, shouldDirty: true });
  };

  const handleCreateCategoryRequest = (name: string) => {
    setNewCategoryName(name);
    setOpenCategoryModal(true);
  };

  const handleCategoryCreated = (category: CategoryOption) => {
    const nextCreated = [...createdCategoryOptions, category];
    categoryOptionsRef.current = [
      ...baseCategoryOptions,
      ...nextCreated.filter((item) => !baseCategoryOptions.some((o) => o.id === item.id)),
    ];
    setCreatedCategoryOptions(nextCreated);
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
        isLoading={isLoadingTransaction}
        title={transaction ? "Edit Transaction" : "New Transaction"}
        description={
          transaction
            ? "Change the details of this transaction."
            : "Log an expense, income, or transfer between accounts."
        }
        showToast={false}
        refreshOnSubmit={false}
        toastErrorMessage="Failed to save transaction"
        maxWidth="xl"
        secondaryAction={
          transaction ? undefined : { label: "Save & add another", onSubmit: onSubmitAndAddAnother }
        }
      >
        <RadioGroup value={mode} onChange={handleModeChange} className="flex gap-2 mb-4 min-w-0">
          {["expense", "income", "transfer"].map((type) => (
            <Radio
              key={type}
              value={type}
              className={({ checked }) =>
                `flex-1 min-w-0 text-center px-2 py-1.5 rounded-md text-sm font-medium cursor-pointer ${
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
                  onChange={(val) => setValue("frequency", val as "daily" | "weekly" | "monthly" | "yearly", { shouldDirty: true, shouldValidate: true })}
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