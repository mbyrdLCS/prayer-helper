/**
 * Preview mode lets you run the app locally with NO external accounts:
 *  - an in-process Postgres (PGlite) instead of Neon
 *  - login bypassed (you are a signed-in admin)
 *  - sample data seeded automatically
 *
 * Turn it on with PREVIEW_MODE=1 in .env.local. Turn it OFF (or remove it) and
 * add real Neon + Clerk keys for the real app.
 */
export const PREVIEW_MODE = process.env.PREVIEW_MODE === "1";

export const PREVIEW_USER = {
  id: "preview-admin",
  email: "preview@local.test",
  name: "Preview Admin",
  imageUrl: null as string | null,
  isAdmin: true,
  createdAt: new Date(),
};
