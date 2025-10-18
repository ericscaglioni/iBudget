import { Account } from "@prisma/client";

// Serialized account type for client-side usage (Decimal fields converted to numbers)
export type SerializedAccount = Omit<Account, 'initialBalance'> & {
  initialBalance: number;
};