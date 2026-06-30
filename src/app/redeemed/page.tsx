import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { kids } from "@/db/schema";
import KidAvatar from "@/components/KidAvatar";
import { requireAccess } from "@/lib/auth";
import { APP_NAME } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function RedeemedPage() {
  await requireAccess();
  const list = await db
    .select()
    .from(kids)
    .where(eq(kids.redeemed, "approved"))
    .orderBy(desc(kids.redeemedAt));

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-primary">The Redeemed ✦</h1>
        <p className="text-muted max-w-xl mx-auto">
          Answered prayers and homecomings. Every name here was prayed over by
          this group. To God be the glory.
        </p>
      </header>

      {list.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          No names here yet — but we keep praying in hope.{" "}
          <span className="script text-primary text-xl">{APP_NAME}.</span>
        </div>
      ) : (
        <>
          <p className="text-center text-sm text-muted">
            {list.length} {list.length === 1 ? "name" : "names"} and counting
          </p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {list.map((kid) => (
              <li key={kid.id}>
                <Link
                  href={`/kids/${kid.id}`}
                  className="card p-5 flex flex-col items-center gap-3 text-center hover:-translate-y-0.5 transition h-full"
                >
                  <KidAvatar kid={kid} size="lg" />
                  <span className="display font-semibold text-xl">{kid.firstName}</span>
                  {kid.redeemedNote && (
                    <span className="text-xs text-muted line-clamp-4">
                      {kid.redeemedNote}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
