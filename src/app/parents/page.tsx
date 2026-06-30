import Link from "next/link";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { parents } from "@/db/schema";
import { getDbUser } from "@/lib/auth";
import { parentDisplayName } from "@/lib/parents";
import ParentAvatar from "@/components/ParentAvatar";

export const dynamic = "force-dynamic";

export default async function ParentsPage() {
  const me = await getDbUser();
  const list = await db
    .select()
    .from(parents)
    .where(
      and(
        eq(parents.openToPrayer, true),
        eq(parents.hidden, false),
        isNotNull(parents.displayName)
      )
    )
    .orderBy(desc(parents.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold">For the Parents</h1>
        <p className="text-muted max-w-2xl mx-auto">
          We pray for the kids by name — but the parents are carrying so much too.
          This is a place to lift up the moms and dads who are hurting, hoping, and
          loving fiercely.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-3">
        {me && (
          <Link
            href={`/parents/${me.id}`}
            className="card p-5 flex flex-col gap-1 hover:-translate-y-0.5 transition border-primary/30"
          >
            <span className="font-semibold text-primary">💗 Your profile</span>
            <span className="text-sm text-muted">
              Share how the group can pray for <em>you</em>. A first name is all you need.
            </span>
          </Link>
        )}
        <Link
          href="/insights"
          className="card p-5 flex flex-col gap-1 hover:-translate-y-0.5 transition"
        >
          <span className="font-semibold">📊 Parent insights</span>
          <span className="text-sm text-muted">
            A gentle, anonymous look at how we&apos;re all doing — and a few
            questions you can answer.
          </span>
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          No parents have shared a request yet. Be the first — your honesty makes it
          safe for others.
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {list.map((p) => (
            <li key={p.userId}>
              <Link
                href={`/parents/${p.userId}`}
                className="card p-5 flex items-start gap-3 hover:-translate-y-0.5 transition h-full"
              >
                <ParentAvatar name={parentDisplayName(p)} photoUrl={p.photoUrl} size="md" />
                <div className="flex-1">
                  <p className="display font-semibold text-lg">{parentDisplayName(p)}</p>
                  {p.prayerRequest && (
                    <p className="text-sm text-muted line-clamp-3">{p.prayerRequest}</p>
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
