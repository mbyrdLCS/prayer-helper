import { and, asc, desc, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import {
  dailySelectionKids,
  dailySelections,
  kids,
  type Kid,
} from "@/db/schema";
import { addDays } from "@/lib/dates";
import { getDailyCount } from "@/lib/settings";

/** Ordered list of active (non-hidden) kid ids — the rotation ring. */
async function activeKidIds(): Promise<number[]> {
  const rows = await db
    .select({ id: kids.id })
    .from(kids)
    .where(eq(kids.hidden, false))
    .orderBy(asc(kids.sortOrder), asc(kids.id));
  return rows.map((r) => r.id);
}

/** The most recent selection strictly before `day` (to chain the rotation). */
async function priorSelection(day: string) {
  return db.query.dailySelections.findFirst({
    where: lt(dailySelections.day, day),
    orderBy: [desc(dailySelections.day)],
  });
}

/**
 * Make sure a selection exists for `day`, chaining the rotation from the most
 * recent earlier day so the whole list cycles and everyone gets prayed for.
 * Idempotent and safe under concurrent calls (day is unique).
 */
export async function ensureSelectionForDate(day: string) {
  const existing = await db.query.dailySelections.findFirst({
    where: eq(dailySelections.day, day),
  });
  if (existing) return existing;

  const ids = await activeKidIds();
  const prior = await priorSelection(day);
  const startIndex = ids.length ? (prior?.nextIndex ?? 0) % ids.length : 0;

  const count = Math.min(await getDailyCount(), ids.length);
  const chosen: number[] = [];
  for (let i = 0; i < count; i++) {
    chosen.push(ids[(startIndex + i) % ids.length]);
  }
  const nextIndex = ids.length ? (startIndex + count) % ids.length : 0;

  // Insert the selection; if another request beat us to it, fall back to theirs.
  const inserted = await db
    .insert(dailySelections)
    .values({ day, startIndex, nextIndex })
    .onConflictDoNothing({ target: dailySelections.day })
    .returning();

  if (inserted.length === 0) {
    return (await db.query.dailySelections.findFirst({
      where: eq(dailySelections.day, day),
    }))!;
  }

  const selection = inserted[0];
  if (chosen.length) {
    await db.insert(dailySelectionKids).values(
      chosen.map((kidId, position) => ({
        selectionId: selection.id,
        kidId,
        position,
      }))
    );
  }
  return selection;
}

/** Generate selections for a contiguous range starting at `start` (inclusive). */
export async function ensureSelectionsForRange(start: string, days: number) {
  for (let i = 0; i < days; i++) {
    await ensureSelectionForDate(addDays(start, i));
  }
}

export type DayPrayer = { selection: typeof dailySelections.$inferSelect; kids: Kid[] };

/** Ensure + fetch a day's selection with its kids in order. */
export async function getDayPrayer(day: string): Promise<DayPrayer> {
  const selection = await ensureSelectionForDate(day);
  const rows = await db
    .select({ kid: kids })
    .from(dailySelectionKids)
    .innerJoin(kids, eq(dailySelectionKids.kidId, kids.id))
    .where(eq(dailySelectionKids.selectionId, selection.id))
    .orderBy(asc(dailySelectionKids.position));
  return { selection, kids: rows.map((r) => r.kid).filter((k) => !k.hidden) };
}
