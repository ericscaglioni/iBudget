import { authHandler } from "@/lib/middlewares";
import { budgetService } from "@/lib/server/services";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";

export const GET = authHandler(async ({ userId, request }) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const direction = searchParams.get("direction") === "out" ? ("out" as const) : ("in" as const);
    return createSuccessResponse(
      await budgetService.getExchangeStatus(userId, {
        yearMonth: searchParams.get("yearMonth") ?? "",
        currency: searchParams.get("currency") ?? "",
        direction,
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
      await budgetService.upsertExchangeExpected(userId, {
        yearMonth: data.yearMonth,
        currency: data.currency,
        direction: data.direction,
        expectedAmount: data.expectedAmount,
      })
    );
  } catch (error) {
    return createErrorResponse(error);
  }
});
