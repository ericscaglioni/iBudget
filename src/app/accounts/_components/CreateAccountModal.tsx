"use client";

import { ComboboxField, FormModal, TextInput } from "@/components/ui";
import { accountService } from "@/lib/client/services";
import {
  accountCurrencies,
  accountTypes,
} from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { CreateAccountInput, createAccountSchema } from "./schema";

type Props = {
  open: boolean;
  onClose: () => void;
};

export const CreateAccountModal = ({ open, onClose }: Props) => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      name: "",
      type: "cash",
      currency: "USD",
      initialBalance: "0",
    },
  });

  const selectedType = watch('type');
  const selectedCurrency = watch('currency');

  const onCloseModal = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: CreateAccountInput) => {
    await accountService.createAccount({
      name: data.name,
      type: data.type as AccountType,
      currency: data.currency,
      initialBalance: parseFloat(data.initialBalance),
    });

    router.refresh();
    onCloseModal();
  };

  return (
    <FormModal
      open={open}
      onClose={onCloseModal}
      title="Create New Account"
      description="Fill in the details to create a new account."
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextInput
          label="Name"
          {...register('name')}
          error={errors.name?.message}
        />

        <ComboboxField
          label="Type"
          options={accountTypes}
          value={selectedType}
          onChange={(val) => setValue('type', val)}
          error={errors.type?.message}
        />

        <ComboboxField
          label="Currency"
          options={accountCurrencies} 
          value={selectedCurrency}
          onChange={(val) => setValue('currency', val)}
          error={errors.currency?.message}
        />

        <TextInput
          label="Initial Balance"
          {...register('initialBalance')}
          inputProps={{ type: 'number', step: '0.01' }}
          error={errors.initialBalance?.message}
          />
      </form>
    </FormModal>
  );
};