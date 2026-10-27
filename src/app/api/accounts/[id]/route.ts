import { authHandler } from "@/lib/middlewares";
import { accountService } from "@/lib/server/services";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";

export const PATCH = authHandler(async ({ userId, request, params }) => {
  try {
    const { id } = await params;
    const { name, type, currency, initialBalance } = await request.json();

    const updated = await accountService.updateAccount(userId, id, { name, type, currency, initialBalance });
    return createSuccessResponse(updated);
  } catch (error) {
    return createErrorResponse(error);
  }
});

// The service refuses to delete an account that still has transactions
export const DELETE = authHandler(async ({ userId, params }) => {
  try {
    const { id } = await params;

    const result = await accountService.deleteAccount(userId, id);
    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
});
