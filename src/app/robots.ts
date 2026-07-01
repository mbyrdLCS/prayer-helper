import type { MetadataRoute } from "next";

// This is a private community — keep members-only pages out of search
// engines. Only the landing, auth, and legal pages may be crawled.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/$", "/sign-in", "/sign-up", "/privacy", "/terms"],
      disallow: "/",
    },
  };
}
