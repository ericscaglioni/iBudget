"use client";

import { FormCombobox, FormModal, FormTextInput } from "@/components/ui";
import { accountService } from "@/lib/client/services";
import {
  accountCurrencies,
  accountTypes,
} from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
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
};

export const AccountFormModal = ({ open, onClose, account }: Props) => {
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
    }
  }, [account, reset]);

  const selectedType = watch('type');
  const selectedCurrency = watch('currency');

  const onCloseModal = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: AccountFormInput) => {
    const payload = {
      name: data.name,
      type: data.type as AccountType,
      currency: data.currency,
      initialBalance: new Decimal(parseFloat(data.initialBalance)),
    };

    const isEdit = !!account;
    if (isEdit) {
      await accountService.updateAccount(account!.id, payload);
    } else {
      await accountService.createAccount(payload);
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
      description="Fill in the details to create a new account."
      toastSuccessMessage="Account saved successfully"
      toastErrorMessage="Failed to save account"
    >
      <FormTextInput
        label="Name"
        name="name"
        form={form}
      />

      <FormCombobox
        form={form}
        label="Type"
        name="type"
        options={accountTypes.map((type) => ({
          value: type,
          label: type.charAt(0).toUpperCase() + type.slice(1),
        }))}
        value={selectedType}
        onChange={(val) => setValue('type', val)}
      />

      <FormCombobox
        form={form}
        label="Currency"
        name="currency"
        options={accountCurrencies.map((currency) => ({
          value: currency,
          label: currency,
        }))} 
        value={selectedCurrency}
        onChange={(val) => setValue('currency', val)}
      />

      <FormTextInput
        label="Initial Balance"
        name="initialBalance"
        form={form}
        inputProps={{ type: 'number', step: '0.01' }}
        />
    </FormModal>
  );
};