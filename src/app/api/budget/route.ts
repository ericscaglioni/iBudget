import { authHandler } from "@/lib/middlewares";
import { budgetService } from "@/lib/server/services";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";

export const GET = authHandler(async ({ userId, request }) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const view = searchParams.get("view") === "all" ? ("all" as const) : undefined;
    return createSuccessResponse(
      await budgetService.getBudget(userId, {
        yearMonth: searchParams.get("yearMonth") || undefined,
        currency: searchParams.get("currency") || undefined,
        view,
      })
    );
  } catch (error) {
    return createErrorResponse(error);
  }
});

export const PUT = authHandler(async ({ userId, request }) => {
  try {
    const data = await request.json();
    return createSuccessResponse(
      await budgetService.upsertExpected(userId, {
        yearMonth: data.yearMonth,
        currency: data.currency,
        categoryId: data.categoryId,
        expectedAmount: data.expectedAmount,
      })
    );
  } catch (error) {
    return createErrorResponse(error);
  }
});
