import { z } from "zod";

export const TransactionFormSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("expense"),
    amount: z.string().min(1, "Amount is required"),
    accountId: z.string().min(1, "Account is required"),
    categoryId: z.string().min(1, "Category is required"),
    description: z.string().min(3, "Description is required"),
    date: z.string().min(1, "Date is required"),
  }),
  z.object({
    type: z.literal("income"),
    amount: z.string().min(1, "Amount is required"),
    accountId: z.string().min(1, "Account is required"),
    categoryId: z.string().min(1, "Category is required"),
    description: z.string().min(3, "Description is required"),
    date: z.string().min(1, "Date is required"),
  }),
  z.object({
    type: z.literal("transfer"),
    amount: z.string().min(1, "Amount is required"),
    fromAccountId: z.string().min(1, "From account is required"),
    toAccountId: z.string().min(1, "To account is required"),
    description: z.string().min(3, "Description is required"),
    date: z.string().min(1, "Date is required"),
  }),
]);

export type TransactionFormInput = z.infer<typeof TransactionFormSchema>;