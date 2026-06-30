import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { appUsers, comments, kids, parents, prayers } from "@/db/schema";
import { requireAccess } from "@/lib/auth";
import { getParent, parentDisplayName } from "@/lib/parents";
import { facebookSearchUrl } from "@/lib/config";
import { today } from "@/lib/dates";
import ParentAvatar from "@/components/ParentAvatar";
import CommentForm from "@/components/CommentForm";
import {
  addParentComment,
  prayForParent,
  startMyParentProfile,
  updateParentProfile,
  uploadParentPhoto,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function ParentProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireAccess();
  const parent = await getParent(id);
  const isSelf = !!me && me.id === id;
  const canManage = !!me && (isSelf || me.isAdmin);

  // No profile yet: offer to create it if it's you; otherwise 404.
  if (!parent) {
    if (isSelf) {
      return (
        <div className="max-w-xl mx-auto flex flex-col gap-4 text-center py-10">
          <h1 className="text-2xl font-bold">Share your own prayer requests</h1>
          <p className="text-muted">
            This community is praying for our kids — but you matter too. Create
            your parent profile so others can lift <em>you</em> up by name.
          </p>
          <form action={startMyParentProfile} className="flex justify-center">
            <button className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold">
              Create my profile
            </button>
          </form>
        </div>
      );
    }
    notFound();
  }
  if (parent.hidden && !me?.isAdmin) notFound();

  const display = parentDisplayName(parent);
  const theirKids = await db
    .select({ id: kids.id, firstName: kids.firstName })
    .from(kids)
    .where(and(eq(kids.claimedBy, id), eq(kids.hidden, false)))
    .orderBy(asc(kids.firstName));

  const [{ value: prayedToday }] = await db
    .select({ value: count() })
    .from(prayers)
    .where(and(eq(prayers.parentId, id), eq(prayers.day, today())));

  const list = await db
    .select()
    .from(comments)
    .where(and(eq(comments.parentId, id), eq(comments.hidden, false)))
    .orderBy(desc(comments.createdAt))
    .limit(100);

  // For admins: the parent's real account name/email, to verify on Facebook.
  const account = me?.isAdmin
    ? await db.query.appUsers.findFirst({ where: eq(appUsers.id, id) })
    : null;
  const lookupName = account?.name || parent.displayName || "";

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <Link href="/parents" className="text-sm text-muted hover:text-primary">
        ← Parents
      </Link>

      <header className="card p-6 flex items-center gap-4">
        <ParentAvatar name={display} photoUrl={parent.photoUrl} size="lg" />
        <div className="flex-1">
          <h1 className="display text-3xl font-bold">{display}</h1>
          {theirKids.length > 0 && (
            <p className="text-muted text-sm">
              Parent of{" "}
              {theirKids.map((k, i) => (
                <span key={k.id}>
                  <Link href={`/kids/${k.id}`} className="text-primary hover:underline">
                    {k.firstName}
                  </Link>
                  {i < theirKids.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          )}
          {!parent.openToPrayer && isSelf && (
            <p className="text-xs text-muted mt-1">
              Your profile is private (not shown in the parents list).
            </p>
          )}
          {me?.isAdmin && !isSelf && (
            <p className="text-xs text-muted mt-2 border-t border-border pt-2">
              <span className="font-semibold text-foreground">Admin:</span>{" "}
              {account?.name || "—"}
              {account?.email ? ` · ${account.email}` : ""}
              {lookupName && (
                <>
                  {" · "}
                  <a
                    href={facebookSearchUrl(lookupName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1877F2] font-semibold hover:underline"
                    title="Search Facebook to confirm they're in the group"
                  >
                    🔍 Look up on Facebook
                  </a>
                </>
              )}
            </p>
          )}
        </div>
      </header>

      {(parent.prayerRequest || parent.story) && (
        <section className="card p-6 flex flex-col gap-3">
          {parent.prayerRequest && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                How can we pray for you?
              </h2>
              <p className="whitespace-pre-wrap">{parent.prayerRequest}</p>
            </div>
          )}
          {parent.story && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Their heart
              </h2>
              <p className="whitespace-pre-wrap">{parent.story}</p>
            </div>
          )}
        </section>
      )}

      <form action={prayForParent.bind(null, id)} className="flex flex-col items-center gap-2">
        <button className="px-6 py-3 rounded-full bg-primary text-white font-semibold hover:opacity-90">
          🙏 Pray for {parent.displayName?.trim() || "this parent"}
        </button>
        <p className="text-muted text-sm">{prayedToday} prayed for them today</p>
      </form>

      {canManage && (
        <section className="card p-6 flex flex-col gap-6">
          <h2 className="font-semibold text-lg">
            {me?.isAdmin && !isSelf ? "Admin: edit parent profile" : "Your profile"}
          </h2>
          <form action={updateParentProfile.bind(null, id)} className="flex flex-col gap-3">
            <label className="text-sm font-semibold">
              Your name <span className="text-muted font-normal">(a first name is perfect)</span>
            </label>
            <input
              name="displayName"
              required
              defaultValue={parent.displayName ?? ""}
              placeholder="e.g. Sarah"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
            <label className="text-sm font-semibold">How can we pray for you?</label>
            <textarea name="prayerRequest" defaultValue={parent.prayerRequest ?? ""} rows={3} className="rounded-lg border border-border bg-surface p-3 text-sm" />
            <label className="text-sm font-semibold">Your heart / story (optional)</label>
            <textarea name="story" defaultValue={parent.story ?? ""} rows={4} className="rounded-lg border border-border bg-surface p-3 text-sm" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="openToPrayer" defaultChecked={parent.openToPrayer} />
              Show me in the parents list so people can pray for me
            </label>
            <button className="self-start px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold">Save</button>
          </form>
          <form action={uploadParentPhoto.bind(null, id)} className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Photo (optional)</label>
            <input type="file" name="photo" accept="image/*" className="text-sm" />
            <button className="self-start px-5 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-background">Upload photo</button>
          </form>
        </section>
      )}

      <section className="card p-5 sm:p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-lg">
          Notes &amp; prayers{" "}
          <span className="text-muted font-normal">({list.length})</span>
        </h2>
        {me && <CommentForm action={addParentComment.bind(null, id)} placeholder="Leave a word of encouragement for this parent…" />}
        <ul className="flex flex-col divide-y divide-border">
          {list.length === 0 && <li className="text-muted text-sm py-2">No notes yet.</li>}
          {list.map((c) => (
            <li key={c.id} className="py-3">
              <p className="text-sm font-semibold">{c.authorName || "Member"}</p>
              <p className="text-foreground/90 whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
