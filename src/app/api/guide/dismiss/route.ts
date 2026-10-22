import { authHandler } from "@/lib/middlewares";
import { guideService } from "@/lib/server/services";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";

export const POST = authHandler(async ({ userId, request }) => {
  try {
    const { tipId } = await request.json();
    await guideService.dismissTip(userId, tipId);
    return createSuccessResponse({ tipId });
  } catch (error) {
    return createErrorResponse(error);
  }
});
