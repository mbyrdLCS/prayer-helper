import Link from "next/link";
import { and, asc, eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { kids } from "@/db/schema";
import { requireAccess } from "@/lib/auth";
import { kidName } from "@/lib/kids";
import KidAvatar from "@/components/KidAvatar";

export const dynamic = "force-dynamic";

export default async function KidsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAccess();
  const { q } = await searchParams;
  const where = q
    ? and(eq(kids.hidden, false), ilike(kids.firstName, `%${q}%`))
    : eq(kids.hidden, false);

  const list = await db
    .select()
    .from(kids)
    .where(where)
    .orderBy(asc(kids.firstName), asc(kids.id));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Our Kids</h1>
          <p className="text-muted">
            {list.length} {list.length === 1 ? "child" : "children"} we&apos;re
            praying for. Tap a name to see their profile or claim your child.
          </p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search a name…"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">
            Search
          </button>
        </form>
      </header>

      {list.length === 0 ? (
        <div className="card p-8 text-center text-muted">No kids found.</div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {list.map((kid) => (
            <li key={kid.id}>
              <Link
                href={`/kids/${kid.id}`}
                className="card p-4 flex flex-col items-center gap-2 text-center hover:-translate-y-0.5 transition h-full"
              >
                <KidAvatar kid={kid} size="lg" />
                <span className="display font-semibold text-xl">{kidName(kid)}</span>
                <div className="flex flex-wrap gap-1 justify-center">
                  {kid.claimedBy && (
                    <span className="text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                      claimed
                    </span>
                  )}
                  {kid.redeemed === "approved" && (
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      ✦ redeemed
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
