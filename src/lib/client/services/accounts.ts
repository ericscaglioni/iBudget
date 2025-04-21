import { patch, post } from "@/lib/client/api";
import type { AccountType } from "@prisma/client";

export const createAccount = async (data: {
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
}) => {
  return post("/api/accounts", data);
};

export const updateAccount = async (
  id: string,
  data: {
    name: string;
    type: AccountType;
    currency: string;
    initialBalance: number;
  }
) => {
  return patch(`/api/accounts/${id}`, data);
};