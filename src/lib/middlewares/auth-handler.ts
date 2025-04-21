import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

type HandlerContext = {
  userId: string;
  request: NextRequest;
  params?: Record<string, string>;
};

export const authHandler = (
  handler: (ctx: HandlerContext) => Promise<NextResponse>
) => {
  return async (
    request: NextRequest,
    context: { params?: Record<string, string> }
  ) => {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return handler({
      userId,
      request,
      params: context.params,
    });
  };
};