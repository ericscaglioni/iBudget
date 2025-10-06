import { categoryService } from "@/lib/server/services";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(new Error("Unauthorized"));
    }

    const data = await request.json();
    const result = await categoryService.createCategory(userId, data);
    return createSuccessResponse(result, 201);
  } catch (error) {
    return createErrorResponse(error);
  }
}