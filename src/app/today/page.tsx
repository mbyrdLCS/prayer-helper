import Link from "next/link";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { comments, prayers } from "@/db/schema";
import { getDayPrayer } from "@/lib/rotation";
import { today, prettyDate } from "@/lib/dates";
import { requireAccess } from "@/lib/auth";
import { APP_NAME } from "@/lib/config";
import KidAvatar from "@/components/KidAvatar";
import PrayButton from "@/components/PrayButton";
import CommentForm from "@/components/CommentForm";
import EmailPreferenceToggle from "@/components/EmailPreferenceToggle";
import { addDayComment } from "./actions";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  // Gate: signed in + has access (admin or approved via join code).
  const me = await requireAccess();
  const day = today();
  const { kids } = await getDayPrayer(day);

  const [{ value: prayerCount }] = await db
    .select({ value: count() })
    .from(prayers)
    .where(and(eq(prayers.day, day), isNull(prayers.kidId)));

  const mine = me
    ? await db.query.prayers.findFirst({
        where: and(
          eq(prayers.userId, me.id),
          eq(prayers.day, day),
          isNull(prayers.kidId)
        ),
      })
    : null;

  const dayComments = await db
    .select()
    .from(comments)
    .where(and(eq(comments.day, day), eq(comments.hidden, false)))
    .orderBy(desc(comments.createdAt))
    .limit(100);

  return (
    <div className="flex flex-col gap-8">
      <header className="text-center">
        <p className="text-muted uppercase tracking-wide text-xs font-semibold">
          {prettyDate(day)}
        </p>
        <h1 className="script text-5xl sm:text-6xl text-primary mt-1">{APP_NAME}</h1>
        <p className="text-foreground/70 mt-1">Today we pray for…</p>
      </header>

      {kids.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          No kids on the list yet. An admin can add names from the{" "}
          <Link href="/admin" className="text-primary underline">
            admin dashboard
          </Link>
          .
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {kids.map((kid) => (
            <li key={kid.id}>
              <Link
                href={`/kids/${kid.id}`}
                className="card p-4 flex flex-col items-center gap-2 text-center hover:-translate-y-0.5 transition h-full"
              >
                <KidAvatar kid={kid} size="lg" />
                <span className="display font-semibold text-xl">{kid.firstName}</span>
                {kid.prayerRequest && (
                  <span className="text-xs text-muted line-clamp-3">
                    {kid.prayerRequest}
                  </span>
                )}
                {kid.redeemed === "approved" && (
                  <span className="text-[11px] font-semibold text-accent">
                    ✦ Redeemed
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col items-center gap-4 py-2">
        <PrayButton hasPrayed={!!mine} count={prayerCount} />
        <EmailPreferenceToggle initial={!!me?.emailDailyCard} />
      </div>

      <section className="card p-5 sm:p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-lg">
          Prayers &amp; encouragement{" "}
          <span className="text-muted font-normal">({dayComments.length})</span>
        </h2>
        <CommentForm action={addDayComment} />
        <ul className="flex flex-col divide-y divide-border">
          {dayComments.length === 0 && (
            <li className="text-muted text-sm py-2">
              Be the first to leave a word today.
            </li>
          )}
          {dayComments.map((c) => (
            <li key={c.id} className="py-3">
              <p className="text-sm">
                <span className="font-semibold">{c.authorName || "Member"}</span>
              </p>
              <p className="text-foreground/90 whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
