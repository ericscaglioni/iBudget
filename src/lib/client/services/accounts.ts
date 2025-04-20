import { post } from "@/lib/client/api";
import type { AccountType } from "@prisma/client";

export const createAccount = async (data: {
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
}) => {
  return post("/api/accounts", data);
};