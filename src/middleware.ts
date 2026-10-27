import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/api/clerk(.*)", // Clerk webhooks: authenticated by their svix signature in the route itself
  "/__clerk(.*)", // Production Clerk Frontend API proxy (same-origin on vercel.app)
]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return;
  }

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}, process.env.NEXT_PUBLIC_CLERK_PROXY_URL
  ? { proxyUrl: process.env.NEXT_PUBLIC_CLERK_PROXY_URL }
  : undefined
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk(.*)",
  ],
};