"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { claims, comments, kids, prayers } from "@/db/schema";
import { getDbUser } from "@/lib/auth";
import { getParent } from "@/lib/parents";
import { userHasApprovedClaim } from "@/lib/claims";
import { today } from "@/lib/dates";
import { PREVIEW_MODE } from "@/lib/preview";

async function canManageKid(kidId: number) {
  const me = await getDbUser();
  if (!me) return { me: null, allowed: false as const };
  if (me.isAdmin) return { me, allowed: true as const };
  // Any approved family member can manage the child's profile.
  return { me, allowed: await userHasApprovedClaim(kidId, me.id) };
}

export async function requestClaim(kidId: number, formData: FormData) {
  const me = await getDbUser();
  if (!me) throw new Error("Not signed in");

  // Must have a parent profile (with a name) before claiming a child.
  const myParent = await getParent(me.id);
  if (!myParent?.displayName?.trim()) {
    redirect(`/parents/${me.id}`);
  }

  const message = String(formData.get("message") || "").trim().slice(0, 1000);

  const mine = await db
    .select()
    .from(claims)
    .where(and(eq(claims.kidId, kidId), eq(claims.userId, me.id)));
  // Already pending or approved → nothing to do.
  if (mine.some((c) => c.status === "pending" || c.status === "approved")) return;
  // Locked after 3 denials.
  if (mine.filter((c) => c.status === "denied").length >= 3) return;

  await db.insert(claims).values({ kidId, userId: me.id, message, status: "pending" });
  revalidatePath(`/kids/${kidId}`);
}

export async function updateKidProfile(kidId: number, formData: FormData) {
  const { allowed } = await canManageKid(kidId);
  if (!allowed) throw new Error("Not authorized");
  const blurb = String(formData.get("blurb") || "").trim().slice(0, 4000) || null;
  const prayerRequest =
    String(formData.get("prayerRequest") || "").trim().slice(0, 2000) || null;
  await db
    .update(kids)
    .set({ blurb, prayerRequest, needsReview: false })
    .where(eq(kids.id, kidId));
  revalidatePath(`/kids/${kidId}`);
}

export async function uploadKidPhoto(kidId: number, formData: FormData) {
  const { allowed } = await canManageKid(kidId);
  if (!allowed) throw new Error("Not authorized");
  if (formData.get("consent") !== "yes") {
    throw new Error("Please confirm you have permission to share this photo.");
  }
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return;
  if (file.size > 8 * 1024 * 1024) throw new Error("Image too large (max 8MB)");
  if (PREVIEW_MODE) {
    // No blob storage in preview — store the image inline so it still shows.
    const buf = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type || "image/jpeg"};base64,${buf.toString("base64")}`;
    await db.update(kids).set({ photoUrl: dataUrl }).where(eq(kids.id, kidId));
    revalidatePath(`/kids/${kidId}`);
    return;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Photo storage isn't set up yet. (Admin: add Vercel Blob to enable photos.)");
  }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const blob = await put(`kids/${kidId}-${Date.now()}.${ext}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  await db.update(kids).set({ photoUrl: blob.url }).where(eq(kids.id, kidId));
  revalidatePath(`/kids/${kidId}`);
}

export async function requestRedeemed(kidId: number, formData: FormData) {
  const { me, allowed } = await canManageKid(kidId);
  if (!allowed || !me) throw new Error("Not authorized");
  const note = String(formData.get("note") || "").trim().slice(0, 2000) || null;
  // Admins confirm; a claiming parent's request goes to "pending".
  const status = me.isAdmin ? "approved" : "pending";
  await db
    .update(kids)
    .set({
      redeemed: status,
      redeemedNote: note,
      redeemedAt: status === "approved" ? new Date() : null,
    })
    .where(eq(kids.id, kidId));
  revalidatePath(`/kids/${kidId}`);
  revalidatePath("/redeemed");
}

export async function prayForKid(kidId: number) {
  const me = await getDbUser();
  if (!me) throw new Error("Not signed in");
  const day = today();
  const existing = await db.query.prayers.findFirst({
    where: and(
      eq(prayers.userId, me.id),
      eq(prayers.day, day),
      eq(prayers.kidId, kidId)
    ),
  });
  if (!existing) {
    await db.insert(prayers).values({ userId: me.id, day, kidId });
  }
  revalidatePath(`/kids/${kidId}`);
}

export async function addKidComment(kidId: number, formData: FormData) {
  const me = await getDbUser();
  if (!me) throw new Error("Not signed in");
  const body = String(formData.get("body") || "").trim();
  if (!body) return;
  await db.insert(comments).values({
    userId: me.id,
    authorName: me.name,
    kidId,
    body: body.slice(0, 2000),
  });
  revalidatePath(`/kids/${kidId}`);
}
