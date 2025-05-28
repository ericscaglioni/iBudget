import { TransactionTypeEnum } from "@/lib/constants";
import { z } from "zod";

export const TransactionFormSchema = z
  .object({
    type: z.nativeEnum(TransactionTypeEnum),
    amount: z.string().min(1, "Amount is required"),
    date: z.string().min(1, "Date is required"),
    description: z.string().min(3, "Description is required"),

    accountId: z.string().optional(),
    categoryId: z.string().optional(),

    fromAccountId: z.string().optional(),
    toAccountId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "expense" || data.type === "income") {
      if (!data.accountId) {
        ctx.addIssue({
          path: ["accountId"],
          code: z.ZodIssueCode.custom,
          message: "Account is required",
        });
      }

      if (!data.categoryId) {
        ctx.addIssue({
          path: ["categoryId"],
          code: z.ZodIssueCode.custom,
          message: "Category is required",
        });
      }
    }

    if (data.type === "transfer") {
      if (!data.fromAccountId) {
        ctx.addIssue({
          path: ["fromAccountId"],
          code: z.ZodIssueCode.custom,
          message: "From account is required",
        });
      }

      if (!data.toAccountId) {
        ctx.addIssue({
          path: ["toAccountId"],
          code: z.ZodIssueCode.custom,
          message: "To account is required",
        });
      }

      if (data.fromAccountId && data.fromAccountId === data.toAccountId) {
        ctx.addIssue({
          path: ["toAccountId"],
          code: z.ZodIssueCode.custom,
          message: "Cannot transfer to the same account",
        });
      }
    }
  });

export type TransactionFormInput = z.infer<typeof TransactionFormSchema>;