// proxy.ts  (project root, next to package.json)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Everything a guest (signed in or not) must reach, plus PayFast's servers.
// NOTE: "/booking/(.*)" has the slash on purpose so it does NOT match the
// admin "/bookings" route.
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/rooms",
  "/rooms/(.*)",
  "/amenities",
  "/activities",
  "/about",
  "/booking/(.*)",
  "/api/payfast/checkout", // guests start payment before they have an account
  "/api/payfast/notify", // PayFast ITN: server-to-server, never has a Clerk session
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
