import { authHandler } from "@/lib/middlewares";
import { transactionService } from "@/lib/server/services";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";

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
    console.log("🚀 ~ type:", type)

  try {
    const updated = await transactionService.updateTransferTransaction(userId, {
      id,
      type,
      amount,
      accountId,
      categoryId,
      description,
      date,
      transferId,
    });
    console.log("🚀 ~ updated:", updated)
  
    return createSuccessResponse(updated);
  } catch (error) {
    console.log("🚀 ~ error:", error)
    return createErrorResponse(error);
  }
});

export const GET = authHandler(async ({ userId, params }) => {
  const { id: transferId } = await params ?? {};
  const transferTransaction = await transactionService.getTransferTransactionByTransferId({ transferId, userId });
  return createSuccessResponse(transferTransaction);
});