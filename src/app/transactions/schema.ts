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

    // Recurring transaction fields
    isRecurring: z.boolean().optional(),
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
    endsAt: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Validate expense/income fields
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

    // Validate transfer fields
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

    // Validate recurring transaction fields
    if (data.isRecurring === true) {
      if (!data.frequency) {
        ctx.addIssue({
          path: ["frequency"],
          code: z.ZodIssueCode.custom,
          message: "Frequency is required for recurring transactions",
        });
      }
    }

    // Validate endsAt is after date
    if (data.endsAt && data.date) {
      const transactionDate = new Date(data.date);
      const endsAtDate = new Date(data.endsAt);
      
      if (endsAtDate <= transactionDate) {
        ctx.addIssue({
          path: ["endsAt"],
          code: z.ZodIssueCode.custom,
          message: "End date must be after transaction date",
        });
      }
    }
  });

export type TransactionFormInput = z.infer<typeof TransactionFormSchema>;