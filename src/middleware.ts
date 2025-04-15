import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/login(/.*)?",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"],
};