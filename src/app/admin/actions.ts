"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, gt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  appUsers,
  claims,
  comments,
  dailySelections,
  kids,
  parents,
  questionOptions,
  questions,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ensureParentProfile } from "@/lib/parents";
import { setSetting, MIN_DAILY, MAX_DAILY } from "@/lib/settings";
import { today } from "@/lib/dates";
import { SEED_NAMES } from "@/db/seed-names";

async function nextSortOrder(): Promise<number> {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${kids.sortOrder}), 0)` })
    .from(kids);
  return (row?.max ?? 0) + 1;
}

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/kids");
  revalidatePath("/today");
  revalidatePath("/redeemed");
}

/* ---------- Claims ---------- */

export async function approveClaim(claimId: number) {
  const me = await requireAdmin();
  const claim = await db.query.claims.findFirst({ where: eq(claims.id, claimId) });
  if (!claim) return;
  await db
    .update(claims)
    .set({ status: "approved", decidedBy: me.id, decidedAt: new Date() })
    .where(eq(claims.id, claimId));
  await db.update(kids).set({ claimedBy: claim.userId }).where(eq(kids.id, claim.kidId));
  await ensureParentProfile(claim.userId); // give the parent a profile to share requests
  // Deny any other pending claims for the same child.
  await db
    .update(claims)
    .set({ status: "denied", decidedBy: me.id, decidedAt: new Date() })
    .where(and(eq(claims.kidId, claim.kidId), ne(claims.id, claimId), eq(claims.status, "pending")));
  revalidateAll();
}

export async function denyClaim(claimId: number) {
  const me = await requireAdmin();
  await db
    .update(claims)
    .set({ status: "denied", decidedBy: me.id, decidedAt: new Date() })
    .where(eq(claims.id, claimId));
  revalidateAll();
}

/* ---------- Kids ---------- */

/**
 * Auto-number any first name that appears more than once (Jonathan 1, 2, 3…).
 * Only fills blank tags and never overwrites existing numbers, so existing
 * labels stay put and a newly-added duplicate just gets the next number.
 * Runs automatically after every add.
 */
async function fillDuplicateTags() {
  const all = await db
    .select({ id: kids.id, firstName: kids.firstName, lastInitial: kids.lastInitial })
    .from(kids)
    .where(eq(kids.hidden, false))
    .orderBy(asc(kids.sortOrder), asc(kids.id));

  const groups = new Map<string, typeof all>();
  for (const k of all) {
    const key = k.firstName.trim().toLowerCase();
    const arr = groups.get(key) ?? [];
    arr.push(k);
    groups.set(key, arr);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    let n = 1;
    for (const k of group) {
      if (!k.lastInitial || !k.lastInitial.trim()) {
        await db.update(kids).set({ lastInitial: String(n) }).where(eq(kids.id, k.id));
      }
      n++;
    }
  }
}

export async function addKid(formData: FormData) {
  const me = await requireAdmin();
  const firstName = String(formData.get("firstName") || "").trim().slice(0, 80);
  if (!firstName) return;
  await db
    .insert(kids)
    .values({ firstName, sortOrder: await nextSortOrder(), createdBy: me.id });
  await fillDuplicateTags();
  revalidateAll();
}

export async function addKidsBulk(formData: FormData) {
  const me = await requireAdmin();
  const raw = String(formData.get("names") || "");
  const names = raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 1000);
  if (!names.length) return;
  let order = await nextSortOrder();
  await db.insert(kids).values(
    names.map((firstName) => ({
      firstName: firstName.slice(0, 80),
      sortOrder: order++,
      createdBy: me.id,
    }))
  );
  await fillDuplicateTags();
  revalidateAll();
}

export async function seedFromImage() {
  await requireAdmin();
  const [{ value }] = await db.select({ value: sql<number>`count(*)` }).from(kids);
  if (Number(value) > 0) return; // only seed an empty list
  let order = 1;
  await db.insert(kids).values(
    SEED_NAMES.map((firstName) => ({
      firstName,
      sortOrder: order++,
      needsReview: true,
    }))
  );
  revalidateAll();
}

export async function editKid(kidId: number, formData: FormData) {
  await requireAdmin();
  const firstName = String(formData.get("firstName") || "").trim().slice(0, 80);
  const lastInitial = String(formData.get("lastInitial") || "").trim().slice(0, 12) || null;
  const sortOrder = parseInt(String(formData.get("sortOrder") || "0"), 10) || 0;
  if (!firstName) return;
  await db
    .update(kids)
    .set({ firstName, lastInitial, sortOrder, needsReview: false })
    .where(eq(kids.id, kidId));
  revalidateAll();
}

export async function deleteKid(kidId: number) {
  await requireAdmin();
  await db.delete(kids).where(eq(kids.id, kidId));
  revalidateAll();
}

export async function setKidHidden(kidId: number, hidden: boolean) {
  await requireAdmin();
  await db.update(kids).set({ hidden }).where(eq(kids.id, kidId));
  revalidateAll();
}

export async function removeKidPhoto(kidId: number) {
  await requireAdmin();
  await db.update(kids).set({ photoUrl: null }).where(eq(kids.id, kidId));
  revalidateAll();
}

export async function clearNeedsReview(kidId: number) {
  await requireAdmin();
  await db.update(kids).set({ needsReview: false }).where(eq(kids.id, kidId));
  revalidateAll();
}

/* ---------- Redeemed ---------- */

export async function approveRedeemed(kidId: number) {
  await requireAdmin();
  await db
    .update(kids)
    .set({ redeemed: "approved", redeemedAt: new Date() })
    .where(eq(kids.id, kidId));
  revalidateAll();
}

export async function rejectRedeemed(kidId: number) {
  await requireAdmin();
  await db
    .update(kids)
    .set({ redeemed: "none", redeemedAt: null })
    .where(eq(kids.id, kidId));
  revalidateAll();
}

/* ---------- Moderation ---------- */

export async function setCommentHidden(commentId: number, hidden: boolean) {
  await requireAdmin();
  await db.update(comments).set({ hidden }).where(eq(comments.id, commentId));
  revalidateAll();
}

export async function deleteComment(commentId: number) {
  await requireAdmin();
  await db.delete(comments).where(eq(comments.id, commentId));
  revalidateAll();
}

/* ---------- Admins ---------- */

export async function addAdminByEmail(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return;
  const user = await db.query.appUsers.findFirst({ where: eq(appUsers.email, email) });
  if (!user) {
    throw new Error("No member with that email has signed in yet. Ask them to log in once first.");
  }
  await db.update(appUsers).set({ isAdmin: true }).where(eq(appUsers.id, user.id));
  revalidateAll();
}

export async function setUserAdmin(userId: string, isAdmin: boolean) {
  const me = await requireAdmin();
  if (me.id === userId && !isAdmin) {
    throw new Error("You can't remove your own admin access.");
  }
  await db.update(appUsers).set({ isAdmin }).where(eq(appUsers.id, userId));
  revalidateAll();
}

/* ---------- Rotation settings ---------- */

export async function setDailyCount(formData: FormData) {
  await requireAdmin();
  const n = parseInt(String(formData.get("count") || ""), 10);
  if (!Number.isFinite(n) || n < MIN_DAILY || n > MAX_DAILY) {
    throw new Error(`Pick a number between ${MIN_DAILY} and ${MAX_DAILY}.`);
  }
  await setSetting("daily_count", String(n));
  // Clear future days so upcoming cards regenerate with the new count.
  // (Today stays as-is in case people have already prayed.)
  await db.delete(dailySelections).where(gt(dailySelections.day, today()));
  revalidateAll();
  revalidatePath("/cards");
}

/* ---------- Access / membership ---------- */

export async function setAccessCode(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get("code") || "").trim().slice(0, 100);
  await setSetting("access_code", code);
  revalidateAll();
}

export async function setUserApproved(userId: string, approved: boolean) {
  const me = await requireAdmin();
  if (me.id === userId && !approved) {
    throw new Error("You can't remove your own access.");
  }
  await db.update(appUsers).set({ approved }).where(eq(appUsers.id, userId));
  revalidateAll();
}

/* ---------- Parent moderation ---------- */

export async function setParentHidden(userId: string, hidden: boolean) {
  await requireAdmin();
  await db.update(parents).set({ hidden }).where(eq(parents.userId, userId));
  revalidatePath("/parents");
  revalidatePath(`/parents/${userId}`);
}

/* ---------- Insight questions ---------- */

export async function addQuestion(formData: FormData) {
  const me = await requireAdmin();
  const prompt = String(formData.get("prompt") || "").trim().slice(0, 300);
  const optionLines = String(formData.get("options") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
  if (!prompt || optionLines.length < 2) {
    throw new Error("A question needs a prompt and at least two options.");
  }
  const [q] = await db
    .insert(questions)
    .values({ prompt, createdBy: me.id })
    .returning();
  await db.insert(questionOptions).values(
    optionLines.map((label, i) => ({ questionId: q.id, label: label.slice(0, 160), sortOrder: i }))
  );
  revalidatePath("/admin");
  revalidatePath("/insights");
}

export async function setQuestionActive(questionId: number, active: boolean) {
  await requireAdmin();
  await db.update(questions).set({ active }).where(eq(questions.id, questionId));
  revalidatePath("/admin");
  revalidatePath("/insights");
}

export async function deleteQuestion(questionId: number) {
  await requireAdmin();
  await db.delete(questions).where(eq(questions.id, questionId));
  revalidatePath("/admin");
  revalidatePath("/insights");
}
