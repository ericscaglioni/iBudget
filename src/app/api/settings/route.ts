import { authHandler } from "@/lib/middlewares";
import { settingsService } from "@/lib/server/services";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";

export const GET = authHandler(async ({ userId }) => {
  try {
    return createSuccessResponse(await settingsService.getSettings(userId));
  } catch (error) {
    return createErrorResponse(error);
  }
});

export const PATCH = authHandler(async ({ userId, request }) => {
  try {
    const data = await request.json();
    return createSuccessResponse(await settingsService.updateSettings(userId, data));
  } catch (error) {
    return createErrorResponse(error);
  }
});
