"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { appUsers, comments, prayers } from "@/db/schema";
import { getDbUser, requireUser } from "@/lib/auth";
import { ensureSelectionForDate } from "@/lib/rotation";
import { today } from "@/lib/dates";

export async function prayToday() {
  const { id } = await requireUser();
  const day = today();
  await ensureSelectionForDate(day);

  const existing = await db.query.prayers.findFirst({
    where: and(
      eq(prayers.userId, id),
      eq(prayers.day, day),
      isNull(prayers.kidId)
    ),
  });
  if (!existing) {
    await db.insert(prayers).values({ userId: id, day, kidId: null });
  }
  revalidatePath("/today");
}

export async function setEmailDailyCard(on: boolean) {
  const me = await getDbUser();
  if (!me) throw new Error("Not signed in");
  await db.update(appUsers).set({ emailDailyCard: on }).where(eq(appUsers.id, me.id));
  revalidatePath("/today");
}

export async function addDayComment(formData: FormData) {
  const me = await getDbUser();
  if (!me) throw new Error("Not signed in");
  const body = String(formData.get("body") || "").trim();
  if (!body) return;
  const day = today();
  await db.insert(comments).values({
    userId: me.id,
    authorName: me.name,
    day,
    body: body.slice(0, 2000),
  });
  revalidatePath("/today");
}
