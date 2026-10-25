import { authHandler } from "@/lib/middlewares";
import { transactionService } from "@/lib/server/services";
import { createSuccessResponse } from "@/lib/utils/api-response";

// Transfers are edited through PATCH /api/transactions/[id], which updates both sides together
export const GET = authHandler(async ({ userId, params }) => {
  const { id: transferId } = await params ?? {};
  const transferTransaction = await transactionService.getTransferTransactionByTransferId({ transferId, userId });
  return createSuccessResponse(transferTransaction);
});
