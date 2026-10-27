import { authHandler } from "@/lib/middlewares";
import { accountService } from "@/lib/server/services";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";

// Saves the order the user chose for their accounts: { accountIds: [first, second, ...] }
export const PUT = authHandler(async ({ userId, request }) => {
  try {
    const body = await request.json();
    await accountService.reorderAccounts(userId, body?.accountIds);
    return createSuccessResponse({ message: "Accounts reordered successfully" });
  } catch (error) {
    return createErrorResponse(error);
  }
});
