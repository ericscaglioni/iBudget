import { ValidationError } from "@/lib/errors/AppError";
import { authHandler } from "@/lib/middlewares";
import { transactionService } from "@/lib/server/services";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";
import { normalizeDescription } from "@/lib/utils/sanitize";
import { NextResponse } from "next/server";

export const PATCH = authHandler(async ({ userId, request, params }) => {
  try {
    const { id } = await params ?? {};
    const body = await request.json();
    const {
      type,
      amount,
      accountId,
      categoryId,
      description,
      date,
      updateScope,
      transferId,
      fromAccountId,
      toAccountId,
      toAmount,
    } = body;

    if (updateScope && updateScope !== 'one' && updateScope !== 'future') {
      throw new ValidationError('Invalid updateScope parameter. Must be "one" or "future".');
    }

    // Same rules as when creating: trimmed, required and not too long
    const sanitizedDescription = normalizeDescription(description);

    // A transfer is two linked transactions (money out, money in) that have to be updated together
    if (transferId) {
      const result = await transactionService.updateTransferTransaction(userId, {
        id,
        fromAccountId,
        toAccountId,
        amount,
        toAmount,
        description: sanitizedDescription,
        date,
      });
      return createSuccessResponse(result);
    }

    const result = await transactionService.updateTransaction(
      userId,
      {
        id,
        type,
        amount,
        accountId,
        categoryId,
        description: sanitizedDescription,
        date,
      },
      updateScope ? { updateScope } : undefined
    );

    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
});

export const DELETE = authHandler(async ({ userId, request, params }) => {
  try {
    const { id } = await params ?? {};

    const scope = new URL(request.url).searchParams.get('scope');
    if (scope && scope !== 'future') {
      throw new ValidationError('Invalid scope parameter. Must be "future" or omitted.');
    }

    await transactionService.deleteTransaction(
      userId,
      id as string,
      scope === 'future' ? { scope: 'future' } : undefined
    );

    // Return 204 No Content on success
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return createErrorResponse(error);
  }
});
