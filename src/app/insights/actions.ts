"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { questionResponses } from "@/db/schema";
import { getDbUser } from "@/lib/auth";

export async function answerQuestion(questionId: number, optionId: number) {
  const me = await getDbUser();
  if (!me) throw new Error("Not signed in");
  await db
    .insert(questionResponses)
    .values({ questionId, userId: me.id, optionId, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [questionResponses.questionId, questionResponses.userId],
      set: { optionId, updatedAt: new Date() },
    });
  revalidatePath("/insights");
}
