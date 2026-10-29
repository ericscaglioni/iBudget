"use client";

import { FormCombobox, FormModal, FormTextInput } from "@/components/ui";
import { accountService } from "@/lib/client/services";
import { useTransactionModal } from "@/lib/providers/TransactionModalProvider";
import { showInfo } from "@/lib/utils/toast";
import { useRouter } from "next/navigation";
import {
  accountCurrencies,
  accountTypes,
} from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountType } from "@prisma/client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { AccountFormInput, AccountFormSchema } from "../schema";
import { SerializedAccount } from "../types";

const DEFAULT_VALUES = {
  name: "",
  type: "cash",
  currency: "USD",
  initialBalance: "0",
};

type Props = {
  open: boolean;
  onClose: () => void;
  account?: SerializedAccount;
  defaultName?: string;
  /** Overrides the default intro text under the title (used for the guided first account) */
  description?: string;
  onCreate?: (account: { id: string; name: string; currency: string }) => void;
};

export const AccountFormModal = ({ open, onClose, account, defaultName, description, onCreate }: Props) => {
  const router = useRouter();
  const { refreshOptions } = useTransactionModal();
  const form = useForm<AccountFormInput>({
    resolver: zodResolver(AccountFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { reset, watch, setValue } = form;

  // Populate form when editing
  useEffect(() => {
    if (account) {
      reset({
        name: account.name,
        type: account.type,
        currency: account.currency,
        initialBalance: String(account.initialBalance),
      });
    } else {
      reset(DEFAULT_VALUES);
      // Set after reset so the prefilled name counts as a change (Save is disabled until the form is dirty)
      if (defaultName) {
        setValue("name", defaultName, { shouldDirty: true });
      }
    }
  }, [account, defaultName, open, reset, setValue]);

  const selectedType = watch('type');
  const selectedCurrency = watch('currency');

  const onCloseModal = () => {
    reset();
    onClose();
  };

  // The dashboard shows one currency at a time, so when a user adds a currency they didn't have
  // before, tell them right away that they can switch it and pick a default (not only on the dashboard).
  const tellAboutNewCurrency = async (currency: string) => {
    try {
      const accounts = await accountService.getAccounts();
      const isNewCurrency = accounts.filter((a) => a.currency === currency).length === 1;
      const hasSeveralCurrencies = new Set(accounts.map((a) => a.currency)).size > 1;

      if (isNewCurrency && hasSeveralCurrencies) {
        showInfo(
          `You now have accounts in more than one currency. The dashboard shows one currency at a time: switch between them there, or choose which one it opens in.`,
          { label: "Choose default", onClick: () => router.push("/settings") }
        );
      }
    } catch {
      // Only a tip: never let it get in the way of saving the account
    }
  };

  const onSubmit = async (data: AccountFormInput) => {
    const payload = {
      name: data.name,
      type: data.type as AccountType,
      currency: data.currency,
      initialBalance: parseFloat(data.initialBalance),
    };

    const isEdit = !!account;
    if (isEdit) {
      await accountService.updateAccount(account!.id, payload);
    } else {
      const createdAccount = await accountService.createAccount(payload);
      onCreate?.({ id: createdAccount.id, name: createdAccount.name, currency: createdAccount.currency });
      // Keep the + button's account list current, and explain the new currency if it is one
      void refreshOptions({ silent: true });
      void tellAboutNewCurrency(createdAccount.currency);
    }

    onCloseModal();
  };

  return (
    <FormModal<AccountFormInput>
      open={open}
      form={form}
      onSubmit={onSubmit}
      onClose={onCloseModal}
      title={!!account ? "Edit Account" : "Create New Account"}
      description={description ?? (account ? "Update the details of this account." : "Fill in the details to create a new account.")}
      toastSuccessMessage="Account saved successfully"
      toastErrorMessage="Failed to save account"
    >
      <FormTextInput
        label="Name"
        name="name"
        form={form}
        required
      />

      <FormCombobox
        form={form}
        label="Type"
        name="type"
        required
        hint="Just a label to help you tell your accounts apart."
        options={accountTypes.map((type) => ({
          value: type,
          label: type.charAt(0).toUpperCase() + type.slice(1),
        }))}
        value={selectedType}
        onChange={(val) => setValue('type', val, { shouldDirty: true, shouldValidate: true })}
      />

      <FormCombobox
        form={form}
        label="Currency"
        name="currency"
        required
        hint="The currency this account is held in. Accounts in different currencies are shown separately on the dashboard."
        options={accountCurrencies.map((currency) => ({
          value: currency,
          label: currency,
        }))} 
        value={selectedCurrency}
        onChange={(val) => setValue('currency', val, { shouldDirty: true, shouldValidate: true })}
      />

      <FormTextInput
        label="Initial Balance"
        name="initialBalance"
        form={form}
        hint="How much is in the account right now. Transactions you add are applied on top of it."
        inputProps={{ type: 'number', step: '0.01' }}
        />
    </FormModal>
  );
};