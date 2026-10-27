import { authHandler } from "@/lib/middlewares";
import { categoryService } from "@/lib/server/services";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";

export const PATCH = authHandler(async ({ userId, request, params }) => {
  try {
    const { id } = await params;
    const { name, color, type } = await request.json();

    const updated = await categoryService.updateCategory(userId, id, { name, color, type });
    return createSuccessResponse(updated);
  } catch (error) {
    return createErrorResponse(error);
  }
});

// The service refuses to delete a category that still has transactions
export const DELETE = authHandler(async ({ userId, params }) => {
  try {
    const { id } = await params;

    const result = await categoryService.deleteCategory(userId, id);
    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
});
