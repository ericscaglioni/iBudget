import { TransactionTypeEnum } from "@/lib/constants";
import { authHandler } from "@/lib/middlewares";
import { transactionService } from "@/lib/server/services";
import { sanitizeFilterInput } from "@/lib/utils/sanitize";

export const POST = authHandler(async ({ userId, request }) => {
  const body = await request.json();

  const {
    type,
    amount,
    accountId,
    fromAccountId,
    toAccountId,
    categoryId,
    description,
    date,
  } = body;

  const sanitizedDescription = sanitizeFilterInput(description);

  if (type === TransactionTypeEnum.transfer) {
    return await transactionService.createTransferTransaction(userId, {
      fromAccountId,
      toAccountId,
      amount,
      description: sanitizedDescription,
      date,
    });
  }

  return await transactionService.createTransaction(userId, {
    type,
    amount,
    accountId,
    categoryId,
    description: sanitizedDescription,
    date,
  });
});