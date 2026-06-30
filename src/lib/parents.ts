import { eq } from "drizzle-orm";
import { db } from "@/db";
import { parents, type Parent } from "@/db/schema";

/** Make sure a parent profile row exists for a user. Idempotent. */
export async function ensureParentProfile(userId: string): Promise<void> {
  await db.insert(parents).values({ userId }).onConflictDoNothing();
}

export async function getParent(userId: string): Promise<Parent | null> {
  return (
    (await db.query.parents.findFirst({ where: eq(parents.userId, userId) })) ??
    null
  );
}

/** How a parent is shown publicly — their chosen name, or anonymous. */
export function parentDisplayName(p: Pick<Parent, "displayName">): string {
  return p.displayName?.trim() || "A parent in the group";
}
