import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { PREVIEW_MODE } from "@/lib/preview";

// Everything is behind login EXCEPT the auth pages and the cron endpoint
// (the cron is protected separately by a secret header).
const isPublic = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy",
  "/terms",
  "/help(.*)",
  "/api/cron(.*)",
]);

// In preview mode there is no auth — let everything through.
export default PREVIEW_MODE
  ? () => undefined
  : clerkMiddleware(async (auth, req) => {
      if (!isPublic(req)) {
        await auth.protect();
      }
    });

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
