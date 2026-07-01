"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appUsers } from "@/db/schema";
import { syncCurrentUser } from "@/lib/auth";
import { getAccessCode } from "@/lib/settings";

export type JoinState = { error?: string } | null;

export async function submitJoinCode(
  _prev: JoinState,
  formData: FormData
): Promise<JoinState> {
  const me = await syncCurrentUser();
  if (!me) redirect("/sign-in");
  if (me.isAdmin || me.approved) redirect("/today");

  const entered = String(formData.get("code") || "").trim();
  const code = await getAccessCode();
  if (!code) {
    return { error: "No access code is set up yet. Please ask the group admin." };
  }
  if (entered.toLowerCase() !== code.toLowerCase()) {
    return { error: "That code isn't right. Double-check it with the group and try again." };
  }

  await db.update(appUsers).set({ approved: true }).where(eq(appUsers.id, me.id));
  // The nav menu lives in the root layout and hides until the user has access —
  // purge the layout cache or it stays menu-less until some other action
  // happens to revalidate.
  revalidatePath("/", "layout");
  redirect("/today");
}
