import { authHandler } from "@/lib/middlewares";
import { categoryService } from "@/lib/server/services";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";

export const GET = authHandler(async ({ userId }) => {
  try {
    const categories = await categoryService.getUserCategories(userId);
    return createSuccessResponse(categories);
  } catch (error) {
    return createErrorResponse(error);
  }
});

export const POST = authHandler(async ({ userId, request }) => {
  try {
    const data = await request.json();
    const result = await categoryService.createCategory(userId, data);
    return createSuccessResponse(result, 201);
  } catch (error) {
    return createErrorResponse(error);
  }
});
