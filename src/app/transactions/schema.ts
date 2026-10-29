import { DESCRIPTION_MAX_LENGTH, TransactionTypeEnum } from "@/lib/constants";
import { parseCalendarDate } from "@/lib/utils/format";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { z } from "zod";

export const createTransactionFormSchema = (accountOptions: { value: string; currency?: string }[], categoryOptions: { id: string }[]) => z
  .object({
    type: z.enum(TransactionTypeEnum),
    amount: z.string().min(1, "Amount is required"),
    date: z.string().min(1, "Date is required"),
    description: z
      .string()
      .min(3, "Description has to be at least 3 characters long")
      .max(DESCRIPTION_MAX_LENGTH, `Description can be at most ${DESCRIPTION_MAX_LENGTH} characters long`),

    // Comboboxes can send null when the selection is cleared; optional() alone rejects it
    accountId: z.string().nullish(),
    categoryId: z.string().nullish(),

    fromAccountId: z.string().nullish(),
    toAccountId: z.string().nullish(),
    // Amount that arrives in the destination account, for transfers between different currencies
    toAmount: z.string().nullish(),

    // Recurring transaction fields
    isRecurring: z.boolean().optional(),
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).nullish(),
    endsAt: z.string().nullish(),
  })
  .superRefine((data, ctx) => {
    // Validate expense/income fields
    if (data.type === "expense" || data.type === "income") {
      if (!data.accountId) {
        ctx.addIssue({
          path: ["accountId"],
          code: "custom",
          message: "Account is required",
        });
      } else if (!accountOptions.some(option => option.value === data.accountId)) {
        ctx.addIssue({
          path: ["accountId"],
          code: "custom",
          message: "Please select a valid account",
        });
      }

      if (!data.categoryId) {
        ctx.addIssue({
          path: ["categoryId"],
          code: "custom",
          message: "Category is required",
        });
      } else if (!categoryOptions.some(option => option.id === data.categoryId)) {
        ctx.addIssue({
          path: ["categoryId"],
          code: "custom",
          message: "Please select a valid category",
        });
      }
    }

    // Validate transfer fields
    if (data.type === "transfer") {
      if (!data.fromAccountId) {
        ctx.addIssue({
          path: ["fromAccountId"],
          code: "custom",
          message: "From account is required",
        });
      } else if (!accountOptions.some(option => option.value === data.fromAccountId)) {
        ctx.addIssue({
          path: ["fromAccountId"],
          code: "custom",
          message: "Please select a valid from account",
        });
      }

      if (!data.toAccountId) {
        ctx.addIssue({
          path: ["toAccountId"],
          code: "custom",
          message: "To account is required",
        });
      } else if (!accountOptions.some(option => option.value === data.toAccountId)) {
        ctx.addIssue({
          path: ["toAccountId"],
          code: "custom",
          message: "Please select a valid to account",
        });
      }

      // Transfers between currencies need to know how much arrived
      const fromCurrency = accountOptions.find(option => option.value === data.fromAccountId)?.currency;
      const toCurrency = accountOptions.find(option => option.value === data.toAccountId)?.currency;
      if (fromCurrency && toCurrency && fromCurrency !== toCurrency) {
        const received = Number(data.toAmount);
        if (!data.toAmount || !Number.isFinite(received) || received <= 0) {
          ctx.addIssue({
            path: ["toAmount"],
            code: "custom",
            message: `Enter the amount received in ${toCurrency}`,
          });
        }
      }

      if (data.fromAccountId && data.fromAccountId === data.toAccountId) {
        ctx.addIssue({
          path: ["toAccountId"],
          code: "custom",
          message: "Cannot transfer to the same account",
        });
      }
    }

    // Validate recurring transaction fields
    if (data.isRecurring === true) {
      if (!data.frequency) {
        ctx.addIssue({
          path: ["frequency"],
          code: "custom",
          message: "Frequency is required for recurring transactions",
        });
      }
    }

    // Validate endsAt is after date
    if (data.endsAt && data.date) {
      const transactionDate = parseCalendarDate(data.date);
      const endsAtDate = parseCalendarDate(data.endsAt);

      if (endsAtDate <= transactionDate) {
        ctx.addIssue({
          path: ["endsAt"],
          code: "custom",
          message: "End date must be after transaction date",
        });
      }
    }
  });

export type TransactionFormInput = z.infer<ReturnType<typeof createTransactionFormSchema>>;

// Keep the old schema for backward compatibility
export const TransactionFormSchema = createTransactionFormSchema([], []);

/**
 * Resolver that re-reads the account and category lists on every validate.
 * Needed when a category or account is created from inside the modal: setValue
 * runs before the next render, so a schema closed over the old lists would
 * reject the new id.
 */
export const createTransactionFormResolver = (
  getAccountOptions: () => { value: string; currency?: string }[],
  getCategoryOptions: () => { id: string }[],
): Resolver<TransactionFormInput> =>
  async (values, context, options) =>
    zodResolver(createTransactionFormSchema(getAccountOptions(), getCategoryOptions()))(
      values,
      context,
      options,
    );