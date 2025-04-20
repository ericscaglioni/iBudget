"use client";

import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAccountSchema, CreateAccountInput } from "./schema";
import {
  accountCurrencies,
  AccountCurrency,
  accountTypes,
} from "@/lib/constants";
import { accountService } from "@/lib/client/services";
import { useRouter } from "next/navigation";
import { ComboboxField, TextInput } from "@/components/ui";
import { AccountType } from "@prisma/client";

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
    <Dialog open={open} onClose={onCloseModal} className="relative z-50">
      <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded bg-white p-6 shadow-xl">
          <DialogTitle className="text-lg font-semibold text-slate-800 mb-4">
            Create New Account
          </DialogTitle>

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


            {/* Actions */}
            <div className="pt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 text-sm"
              >
                {isSubmitting ? "Saving..." : "Create"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
};