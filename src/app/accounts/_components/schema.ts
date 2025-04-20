import { z } from "zod";
import { accountCurrencies, accountTypes } from "@/lib/constants";

// Ensure accountTypes is a tuple
const accountTypesTuple = accountTypes as [string, ...string[]];
// Ensure accountCurrencies is a tuple
const accountCurrenciesTuple = accountCurrencies as [string, ...string[]];

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(accountTypesTuple),
  currency: z.enum(accountCurrenciesTuple),
  initialBalance: z
    .string()
    .refine((val) => !isNaN(Number(val)), {
      message: 'Initial balance must be a number',
    })
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;