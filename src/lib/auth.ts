import { auth, currentUser } from "@clerk/nextjs/server";
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
    };
    await db.insert(appUsers).values(row).onConflictDoNothing();
    return { ...row, createdAt: new Date() } as AppUser;
  }

  const isAdmin = existing.isAdmin || isSeedAdmin;
  if (
    existing.name !== name ||
    existing.imageUrl !== u.imageUrl ||
    existing.isAdmin !== isAdmin ||
    existing.email !== email
  ) {
    await db
      .update(appUsers)
      .set({ name, imageUrl: u.imageUrl, isAdmin, email })
      .where(eq(appUsers.id, u.id));
  }
  return { ...existing, name, imageUrl: u.imageUrl, isAdmin, email };
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

export async function requireUser(): Promise<{ id: string }> {
  if (PREVIEW_MODE) return { id: PREVIEW_USER.id };
  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in");
  return { id: userId };
}
