import { authHandler } from "@/lib/middlewares";
import { budgetService } from "@/lib/server/services";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";

export const POST = authHandler(async ({ userId, request }) => {
  try {
    const data = await request.json();
    return createSuccessResponse(
      await budgetService.copyPreviousMonth(userId, {
        yearMonth: data.yearMonth,
        currency: data.currency,
        view: data.view === "all" ? "all" : undefined,
        overwrite: Boolean(data.overwrite),
      })
    );
  } catch (error) {
    return createErrorResponse(error);
  }
});
