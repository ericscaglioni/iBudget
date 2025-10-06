import { accountService } from "@/lib/server/services";
import { parseQueryParams } from "@/lib/utils/parse-query";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(new Error("Unauthorized"));
    }

    const queryParams = await parseQueryParams(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    const result = await accountService.getAccountsByUser(userId, queryParams);
    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(new Error("Unauthorized"));
    }

    const data = await request.json();
    const result = await accountService.createAccount(userId, data);
    return createSuccessResponse(result, 201);
  } catch (error) {
    return createErrorResponse(error);
  }
}