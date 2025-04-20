import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type HandlerFn = (ctx: { userId: string; request: Request }) => Promise<Response>;

export const authHandler = (handler: HandlerFn) => {
  return async (request: Request) => {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
      return await handler({ userId, request });
    } catch (err) {
      console.error("Route error:", err);
      return new NextResponse("Server Error", { status: 500 });
    }
  };
}