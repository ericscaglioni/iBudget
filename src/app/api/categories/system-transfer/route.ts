import { categoryService } from "@/lib/server/services";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";

export async function GET() {
  try {
    const transferCategory = await categoryService.getSystemTransferCategory();
    return createSuccessResponse(transferCategory);
  } catch (error) {
    return createErrorResponse(error);
  }
}
