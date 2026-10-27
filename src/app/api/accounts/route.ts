import { authHandler } from "@/lib/middlewares";
import { accountService } from "@/lib/server/services";
import { parseQueryParams } from "@/lib/utils/parse-query";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";

export const GET = authHandler(async ({ userId, request }) => {
  try {
    const queryParams = await parseQueryParams(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    const result = await accountService.getAccountsByUser(userId, queryParams);
    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
});

export const POST = authHandler(async ({ userId, request }) => {
  try {
    const data = await request.json();
    const result = await accountService.createAccount(userId, data);
    return createSuccessResponse(result, 201);
  } catch (error) {
    return createErrorResponse(error);
  }
});
