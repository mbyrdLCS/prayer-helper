import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

export const DEFAULT_DAILY_COUNT = Math.max(
  1,
  parseInt(process.env.DAILY_COUNT || "9", 10) || 9
);

export const MIN_DAILY = 1;
export const MAX_DAILY = 20;

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

/** The join code members enter to get access (admin-editable, falls back to env). */
export async function getAccessCode(): Promise<string> {
  const v = await getSetting("access_code");
  return (v ?? process.env.ACCESS_CODE ?? "").trim();
}

/** How many kids to feature each day (admin-editable, falls back to env/9). */
export async function getDailyCount(): Promise<number> {
  const v = await getSetting("daily_count");
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n >= MIN_DAILY && n <= MAX_DAILY
    ? n
    : DEFAULT_DAILY_COUNT;
}
