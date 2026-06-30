import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { claims } from "@/db/schema";

/** Does this user have an APPROVED claim for this kid (= a connected family member)? */
export async function userHasApprovedClaim(kidId: number, userId: string): Promise<boolean> {
  const row = await db.query.claims.findFirst({
    where: and(
      eq(claims.kidId, kidId),
      eq(claims.userId, userId),
      eq(claims.status, "approved")
    ),
  });
  return !!row;
}

/** All user ids with an approved claim for this kid (the child's connected family). */
export async function approvedClaimantIds(kidId: number): Promise<string[]> {
  const rows = await db
    .select({ userId: claims.userId })
    .from(claims)
    .where(and(eq(claims.kidId, kidId), eq(claims.status, "approved")));
  return rows.map((r) => r.userId);
}
