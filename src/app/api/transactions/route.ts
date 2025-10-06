import { TransactionTypeEnum } from "@/lib/constants";
import { transactionService } from "@/lib/server/services";
import { sanitizeFilterInput } from "@/lib/utils/sanitize";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(new Error("Unauthorized"));
    }

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

    let result;

    if (type === TransactionTypeEnum.transfer) {
      result = await transactionService.createTransferTransaction(userId, {
        fromAccountId,
        toAccountId,
        amount,
        description: sanitizedDescription,
        date,
      });
    } else {
      result = await transactionService.createTransaction(userId, {
        type,
        amount,
        accountId,
        categoryId,
        description: sanitizedDescription,
        date,
      });
    }

    return createSuccessResponse(result, 201);
  } catch (error) {
    return createErrorResponse(error);
  }
}