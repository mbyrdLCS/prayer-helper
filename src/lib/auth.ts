import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appUsers, type AppUser } from "@/db/schema";
import { PREVIEW_MODE, PREVIEW_USER } from "@/lib/preview";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

/**
 * Ensure the signed-in Clerk user exists in our app_users table.
 * Auto-promotes emails listed in ADMIN_EMAILS to admin. Call this on
 * authenticated page loads. Returns null when not signed in.
 */
export async function syncCurrentUser(): Promise<AppUser | null> {
  if (PREVIEW_MODE) return PREVIEW_USER as AppUser;
  const u = await currentUser();
  if (!u) return null;

  const email = u.emailAddresses[0]?.emailAddress?.toLowerCase() ?? null;
  const name =
    [u.firstName, u.lastName].filter(Boolean).join(" ") ||
    u.username ||
    email ||
    "Member";
  const isSeedAdmin = email ? ADMIN_EMAILS.includes(email) : false;

  const existing = await db.query.appUsers.findFirst({
    where: eq(appUsers.id, u.id),
  });

  if (!existing) {
    const row = {
      id: u.id,
      email,
      name,
      imageUrl: u.imageUrl,
      isAdmin: isSeedAdmin,
      approved: isSeedAdmin, // admins are auto-approved
    };
    const inserted = await db
      .insert(appUsers)
      .values(row)
      .onConflictDoNothing()
      .returning({ id: appUsers.id });
    // Heads-up email to admins for real new members (not the seed admins).
    // Only when this request actually created the row — concurrent first
    // requests (nav + page both sync) would otherwise email twice.
    if (inserted.length && !isSeedAdmin) {
      const { notifyNewSignup } = await import("@/lib/email");
      await notifyNewSignup({ name, email });
    }
    return { ...row, createdAt: new Date() } as AppUser;
  }

  const isAdmin = existing.isAdmin || isSeedAdmin;
  const approved = existing.approved || isSeedAdmin;
  if (
    existing.name !== name ||
    existing.imageUrl !== u.imageUrl ||
    existing.isAdmin !== isAdmin ||
    existing.approved !== approved ||
    existing.email !== email
  ) {
    await db
      .update(appUsers)
      .set({ name, imageUrl: u.imageUrl, isAdmin, approved, email })
      .where(eq(appUsers.id, u.id));
  }
  return { ...existing, name, imageUrl: u.imageUrl, isAdmin, approved, email };
}

/** Does this user have access to the app (admin or approved via join code)? */
export function hasAccess(u: { isAdmin: boolean; approved: boolean } | null): boolean {
  return !!u && (u.isAdmin || u.approved);
}

/** Lightweight lookup of the current app user (no Clerk profile fetch). */
export async function getDbUser(): Promise<AppUser | null> {
  if (PREVIEW_MODE) return PREVIEW_USER as AppUser;
  const { userId } = await auth();
  if (!userId) return null;
  const row = await db.query.appUsers.findFirst({
    where: eq(appUsers.id, userId),
  });
  return row ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const me = await getDbUser();
  return !!me?.isAdmin;
}

/** Throws if the current user is not an admin. Use at the top of admin actions. */
export async function requireAdmin(): Promise<AppUser> {
  if (PREVIEW_MODE) return PREVIEW_USER as AppUser;
  const me = await getDbUser();
  if (!me?.isAdmin) throw new Error("Not authorized");
  return me;
}

/**
 * Gate for protected pages: ensures the user is signed in AND has access
 * (admin or approved via the join code). Redirects to /sign-in or /join.
 * Returns the current app user. Syncs the Clerk profile on the way.
 */
export async function requireAccess(): Promise<AppUser> {
  if (PREVIEW_MODE) return PREVIEW_USER as AppUser;
  const me = await syncCurrentUser();
  if (!me) redirect("/sign-in");
  if (!hasAccess(me)) redirect("/join");
  return me;
}

/**
 * Gate for member server actions: throws unless the current user is signed in
 * AND has access (admin or approved via the join code). Pages redirect via
 * requireAccess(), but server actions are directly invokable endpoints and
 * need their own check.
 */
export async function requireApproved(): Promise<AppUser> {
  if (PREVIEW_MODE) return PREVIEW_USER as AppUser;
  const me = await getDbUser();
  if (!me) throw new Error("Not signed in");
  if (!hasAccess(me)) throw new Error("Not authorized");
  return me;
}

export async function requireUser(): Promise<{ id: string }> {
  if (PREVIEW_MODE) return { id: PREVIEW_USER.id };
  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in");
  return { id: userId };
}
