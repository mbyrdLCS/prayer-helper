import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, sql } from "drizzle-orm";
import * as schema from "./schema";
import { PREVIEW_MODE } from "@/lib/preview";

type DB = ReturnType<typeof drizzleNeon<typeof schema>>;

let db: DB;

if (PREVIEW_MODE) {
  // In-process Postgres — no external database needed.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const { readFileSync, readdirSync } = await import("fs");
  const path = await import("path");
  const { SEED_NAMES } = await import("./seed-names");

  // In-memory: fresh each server start, no filesystem/WASM path issues.
  const client = new PGlite();

  // Apply the generated migration(s).
  const dir = path.join(process.cwd(), "drizzle");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const ddl = readFileSync(path.join(dir, f), "utf8");
    await client.exec(ddl);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db = drizzlePglite(client as any, { schema }) as unknown as DB;

  // Seed sample data the first time.
  const [{ c }] = await db
    .select({ c: sql<number>`count(*)` })
    .from(schema.kids);
  if (Number(c) === 0) {
    await db.insert(schema.kids).values(
      SEED_NAMES.map((firstName, i) => ({
        firstName,
        sortOrder: i + 1,
        needsReview: false,
      }))
    );
    await db.insert(schema.appUsers).values({
      id: "preview-admin",
      email: "preview@local.test",
      name: "Preview Admin",
      isAdmin: true,
    });
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: process.env.APP_TIMEZONE || "America/New_York",
    }).format(new Date());
    await db.insert(schema.prayers).values([
      { userId: "demo-1", day: today },
      { userId: "demo-2", day: today },
      { userId: "demo-3", day: today },
    ]);
    await db.insert(schema.comments).values({
      userId: "demo-1",
      authorName: "A fellow parent",
      day: today,
      body: "Praying for each of these kids by name this morning. 💗",
    });

    // Sample parent profile linked to the first kid.
    const firstKid = await db
      .select({ id: schema.kids.id })
      .from(schema.kids)
      .orderBy(schema.kids.id)
      .limit(1);
    await db.insert(schema.parents).values({
      userId: "demo-parent",
      displayName: "Sarah",
      prayerRequest: "Pray for open, gentle conversations with my daughter — and for my own anxious heart to rest.",
      story: "We're new to this road and trying to lead with love. Some days are hard.",
      openToPrayer: true,
    });
    if (firstKid[0]) {
      await db
        .update(schema.kids)
        .set({ claimedBy: "demo-parent", prayerRequest: "For peace and confidence as she figures out who she is." })
        .where(eq(schema.kids.id, firstKid[0].id));
    }
    await db.insert(schema.prayers).values([
      { userId: "demo-2", day: today, parentId: "demo-parent" },
      { userId: "demo-3", day: today, parentId: "demo-parent" },
    ]);

    // Sample insight questions.
    const [q1] = await db
      .insert(schema.questions)
      .values({ prompt: "Are you currently talking with your child?", sortOrder: 1 })
      .returning();
    const [q2] = await db
      .insert(schema.questions)
      .values({ prompt: "How are you doing this week?", sortOrder: 2 })
      .returning();
    const o1 = await db
      .insert(schema.questionOptions)
      .values([
        { questionId: q1.id, label: "Yes, regularly", sortOrder: 0 },
        { questionId: q1.id, label: "Sometimes / strained", sortOrder: 1 },
        { questionId: q1.id, label: "Not right now", sortOrder: 2 },
      ])
      .returning();
    const o2 = await db
      .insert(schema.questionOptions)
      .values([
        { questionId: q2.id, label: "Hopeful", sortOrder: 0 },
        { questionId: q2.id, label: "Holding on", sortOrder: 1 },
        { questionId: q2.id, label: "Really struggling", sortOrder: 2 },
      ])
      .returning();
    await db.insert(schema.questionResponses).values([
      { questionId: q1.id, userId: "demo-1", optionId: o1[0].id },
      { questionId: q1.id, userId: "demo-2", optionId: o1[1].id },
      { questionId: q1.id, userId: "demo-3", optionId: o1[0].id },
      { questionId: q2.id, userId: "demo-1", optionId: o2[1].id },
      { questionId: q2.id, userId: "demo-2", optionId: o2[0].id },
    ]);
  }
} else {
  // Accept any of the common var names (manual, or Vercel's Neon integration
  // with/without a "DATABASE" prefix).
  const conn =
    process.env.DATABASE_URL ||
    process.env.DATABASE_POSTGRES_URL ||
    process.env.POSTGRES_URL ||
    "postgresql://invalid:invalid@invalid/invalid";
  const sqlClient = neon(conn);
  db = drizzleNeon(sqlClient, { schema });
}

export { db, schema };
