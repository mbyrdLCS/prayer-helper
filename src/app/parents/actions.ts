"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { comments, parents, prayers } from "@/db/schema";
import { getDbUser } from "@/lib/auth";
import { ensureParentProfile } from "@/lib/parents";
import { today } from "@/lib/dates";
import { PREVIEW_MODE } from "@/lib/preview";

async function canManageParent(parentUserId: string) {
  const me = await getDbUser();
  if (!me) return { me: null, allowed: false as const };
  return { me, allowed: me.id === parentUserId || me.isAdmin };
}

export async function updateParentProfile(parentUserId: string, formData: FormData) {
  const { allowed } = await canManageParent(parentUserId);
  if (!allowed) throw new Error("Not authorized");
  await ensureParentProfile(parentUserId);
  const displayName = String(formData.get("displayName") || "").trim().slice(0, 120);
  if (!displayName) {
    throw new Error("Please add a name — a first name is perfect.");
  }
  const prayerRequest = String(formData.get("prayerRequest") || "").trim().slice(0, 4000) || null;
  const story = String(formData.get("story") || "").trim().slice(0, 6000) || null;
  const openToPrayer = formData.get("openToPrayer") != null;
  await db
    .update(parents)
    .set({ displayName, prayerRequest, story, openToPrayer })
    .where(eq(parents.userId, parentUserId));
  revalidatePath(`/parents/${parentUserId}`);
  revalidatePath("/parents");
}

export async function uploadParentPhoto(parentUserId: string, formData: FormData) {
  const { allowed } = await canManageParent(parentUserId);
  if (!allowed) throw new Error("Not authorized");
  await ensureParentProfile(parentUserId);
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return;
  if (file.size > 8 * 1024 * 1024) throw new Error("Image too large (max 8MB)");
  let url: string;
  if (PREVIEW_MODE) {
    const buf = Buffer.from(await file.arrayBuffer());
    url = `data:${file.type || "image/jpeg"};base64,${buf.toString("base64")}`;
  } else {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const blob = await put(`parents/${parentUserId}-${Date.now()}.${ext}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    url = blob.url;
  }
  await db.update(parents).set({ photoUrl: url }).where(eq(parents.userId, parentUserId));
  revalidatePath(`/parents/${parentUserId}`);
}

export async function prayForParent(parentUserId: string) {
  const me = await getDbUser();
  if (!me) throw new Error("Not signed in");
  const day = today();
  const existing = await db.query.prayers.findFirst({
    where: and(
      eq(prayers.userId, me.id),
      eq(prayers.day, day),
      eq(prayers.parentId, parentUserId)
    ),
  });
  if (!existing) {
    await db.insert(prayers).values({ userId: me.id, day, parentId: parentUserId });
  }
  revalidatePath(`/parents/${parentUserId}`);
}

export async function addParentComment(parentUserId: string, formData: FormData) {
  const me = await getDbUser();
  if (!me) throw new Error("Not signed in");
  const body = String(formData.get("body") || "").trim();
  if (!body) return;
  await db.insert(comments).values({
    userId: me.id,
    authorName: me.name,
    parentId: parentUserId,
    body: body.slice(0, 2000),
  });
  revalidatePath(`/parents/${parentUserId}`);
}

/** Create-or-edit the current user's own parent profile (entry point). */
export async function startMyParentProfile() {
  const me = await getDbUser();
  if (!me) throw new Error("Not signed in");
  await ensureParentProfile(me.id);
  revalidatePath(`/parents/${me.id}`);
}
