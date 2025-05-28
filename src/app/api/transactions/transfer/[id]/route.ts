import { transactionService } from "@/lib/server/services";
import { authHandler } from "@/lib/middlewares";

export const PATCH = authHandler(async ({ userId, request, params }) => {
  const { id } = await params ?? {};
  const body = await request.json();
  const {
    type,
    amount,
    accountId,
    categoryId,
    description,
    date,
    transferId,
  } = body;

  return await transactionService.updateTransferTransaction(userId, {
    id,
    type,
    amount,
    accountId,
    categoryId,
    description,
    date,
    transferId,
  });
});

export const GET = authHandler(async ({ userId, params }) => {
  const { id: transferId } = await params ?? {};
  return await transactionService.getTransferTransactionByTransferId({ transferId, userId });
});