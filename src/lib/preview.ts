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

// For tutorial capture: PREVIEW_ADMIN=0 renders the app as a regular (non-admin)
// member so member-only screens look right. Defaults to admin.
const PREVIEW_ADMIN = process.env.PREVIEW_ADMIN !== "0";

export const PREVIEW_USER = {
  id: PREVIEW_ADMIN ? "preview-admin" : "preview-member",
  email: PREVIEW_ADMIN ? "preview@local.test" : "member@local.test",
  name: PREVIEW_ADMIN ? "Preview Admin" : "Sarah",
  imageUrl: null as string | null,
  isAdmin: PREVIEW_ADMIN,
  approved: true,
  createdAt: new Date(),
};
