import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { claims, comments, kids, prayers } from "@/db/schema";
import { requireAccess } from "@/lib/auth";
import { getParent, parentDisplayName } from "@/lib/parents";
import { approvedClaimantIds } from "@/lib/claims";
import { kidName } from "@/lib/kids";
import { today } from "@/lib/dates";
import KidAvatar from "@/components/KidAvatar";
import ParentAvatar from "@/components/ParentAvatar";
import CommentForm from "@/components/CommentForm";
import SubmitButton from "@/components/SubmitButton";
import PhotoUploadForm from "@/components/PhotoUploadForm";
import {
  addKidComment,
  prayForKid,
  requestClaim,
  requestRedeemed,
  updateKidProfile,
  uploadKidPhoto,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function KidProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kidId = Number(id);
  if (!Number.isFinite(kidId)) notFound();

  const me = await requireAccess();
  const kid = await db.query.kids.findFirst({ where: eq(kids.id, kidId) });
  if (!kid || (kid.hidden && !me?.isAdmin)) notFound();

  const myClaims = me
    ? await db
        .select()
        .from(claims)
        .where(and(eq(claims.kidId, kidId), eq(claims.userId, me.id)))
    : [];
  const hasPendingClaim = myClaims.some((c) => c.status === "pending");
  const isClaimer = myClaims.some((c) => c.status === "approved");
  const deniedCount = myClaims.filter((c) => c.status === "denied").length;
  const canManage = !!me && (me.isAdmin || isClaimer);

  const [{ value: prayedToday }] = await db
    .select({ value: count() })
    .from(prayers)
    .where(and(eq(prayers.kidId, kidId), eq(prayers.day, today())));

  const kidComments = await db
    .select()
    .from(comments)
    .where(and(eq(comments.kidId, kidId), eq(comments.hidden, false)))
    .orderBy(desc(comments.createdAt))
    .limit(100);

  // All connected family members (Mom, Dad, Grandma…), so visitors can pray for them too.
  const approvedIds = await approvedClaimantIds(kidId);
  const familyParents = (await Promise.all(approvedIds.map((uid) => getParent(uid)))).filter(
    (p): p is NonNullable<typeof p> => !!p && !p.hidden
  );
  const visibleFamily = familyParents.filter(
    (p) => p.openToPrayer || me?.isAdmin || isClaimer
  );

  // Does the viewer have their own parent profile set up (required to claim)?
  const myParent = me ? await getParent(me.id) : null;
  const hasParentProfile = !!myParent?.displayName?.trim();

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <Link href="/kids" className="text-sm text-muted hover:text-primary">
        ← All kids
      </Link>

      <header className="card p-6 flex items-center gap-4">
        <KidAvatar kid={kid} size="lg" />
        <div className="flex-1">
          <h1 className="display text-4xl font-bold flex items-center gap-2">
            {kidName(kid)}
            {kid.redeemed === "approved" && (
              <span className="text-sm font-semibold text-accent bg-accent/10 px-2 py-1 rounded-full">
                ✦ Redeemed
              </span>
            )}
          </h1>
          {kid.claimedBy ? (
            <p className="text-muted text-sm">Cared for by a parent in the group 💗</p>
          ) : (
            <p className="text-muted text-sm">Not yet claimed</p>
          )}
        </div>
      </header>

      {(kid.prayerRequest || kid.blurb) && (
        <section className="card p-6 flex flex-col gap-3">
          {kid.prayerRequest && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Prayer request
              </h2>
              <p className="whitespace-pre-wrap">{kid.prayerRequest}</p>
            </div>
          )}
          {kid.blurb && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                About {kid.firstName}
              </h2>
              <p className="whitespace-pre-wrap">{kid.blurb}</p>
            </div>
          )}
        </section>
      )}

      {kid.redeemed === "approved" && kid.redeemedNote && (
        <section className="card p-6 border-accent/40">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-accent">
            Praise &amp; testimony
          </h2>
          <p className="whitespace-pre-wrap">{kid.redeemedNote}</p>
        </section>
      )}

      <form action={prayForKid.bind(null, kid.id)} className="flex flex-col items-center gap-2">
        <button className="px-6 py-3 rounded-full bg-primary text-white font-semibold hover:opacity-90">
          🙏 Pray for {kid.firstName}
        </button>
        <p className="text-muted text-sm">{prayedToday} prayed for {kid.firstName} today</p>
      </form>

      {visibleFamily.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted text-center">
            {kid.firstName}&apos;s family — they need strength too 💗
          </h2>
          {visibleFamily.map((p) => (
            <Link
              key={p.userId}
              href={`/parents/${p.userId}`}
              className="card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition"
            >
              <ParentAvatar name={parentDisplayName(p)} photoUrl={p.photoUrl} size="md" />
              <div className="flex-1">
                <p className="font-semibold">{parentDisplayName(p)}</p>
                <p className="text-sm text-muted">Tap to pray for them.</p>
              </div>
              <span className="text-primary text-sm font-semibold">Pray →</span>
            </Link>
          ))}
        </section>
      )}

      {/* Claim area */}
      {!canManage && me && (
        <section className="card p-6">
          {hasPendingClaim ? (
            <p className="text-muted">
              ⏳ Your request to claim {kid.firstName} is pending admin approval.
            </p>
          ) : deniedCount >= 3 ? (
            <p className="text-muted">
              Your requests to claim {kid.firstName} weren&apos;t approved. Please
              contact an admin if this is your child.
            </p>
          ) : !hasParentProfile ? (
            <div className="flex flex-col gap-3">
              <h2 className="font-semibold">Is this your child?</h2>
              <p className="text-sm text-muted">
                First, set up <strong>your own parent profile</strong> so we know who
                you are. Then you can request to claim {kid.firstName}.
              </p>
              <Link
                href={`/parents/${me.id}`}
                className="self-start px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold"
              >
                Create my parent profile
              </Link>
            </div>
          ) : (
            <form action={requestClaim.bind(null, kid.id)} className="flex flex-col gap-3">
              <h2 className="font-semibold">Is this your child?</h2>
              {deniedCount > 0 ? (
                <p className="text-sm text-muted">
                  Your last request wasn&apos;t approved, but you can try again. An admin
                  will review it.
                </p>
              ) : (
                <p className="text-sm text-muted">
                  Request to claim {kid.firstName} (more than one family member can).
                  An admin will approve it, then you can add a photo and prayer requests.
                </p>
              )}
              <input
                name="message"
                placeholder="Optional note to the admins"
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
              <button className="self-start px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold">
                Request to claim
              </button>
            </form>
          )}
        </section>
      )}

      {/* Management panel */}
      {canManage && (
        <section className="card p-6 flex flex-col gap-6">
          <h2 className="font-semibold text-lg">
            {me?.isAdmin && !isClaimer ? "Admin: edit profile" : "Manage your child's profile"}
          </h2>

          <form action={updateKidProfile.bind(null, kid.id)} className="flex flex-col gap-3">
            <label className="text-sm font-semibold">Prayer request</label>
            <textarea
              name="prayerRequest"
              defaultValue={kid.prayerRequest ?? ""}
              rows={3}
              className="rounded-lg border border-border bg-surface p-3 text-sm"
              placeholder="What can the group pray for specifically?"
            />
            <label className="text-sm font-semibold">About {kid.firstName}</label>
            <textarea
              name="blurb"
              defaultValue={kid.blurb ?? ""}
              rows={3}
              className="rounded-lg border border-border bg-surface p-3 text-sm"
              placeholder="A little about them…"
            />
            <SubmitButton className="self-start px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-60">
              Save
            </SubmitButton>
          </form>

          <PhotoUploadForm action={uploadKidPhoto.bind(null, kid.id)}>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              <strong>Please read:</strong> {kid.firstName} is a minor. Only upload a
              photo if you are their parent/guardian and you have permission to share it
              in this private group. It will be visible to logged-in members only.
              <label className="flex items-start gap-2 mt-2">
                <input type="checkbox" name="consent" value="yes" required className="mt-0.5" />
                <span>I have permission to share this photo.</span>
              </label>
            </div>
          </PhotoUploadForm>

          {kid.redeemed !== "approved" ? (
            <form action={requestRedeemed.bind(null, kid.id)} className="flex flex-col gap-2 border-t border-border pt-4">
              <label className="text-sm font-semibold text-accent">
                Mark as Redeemed ✦
              </label>
              <p className="text-xs text-muted">
                {me?.isAdmin
                  ? "As an admin this is confirmed immediately."
                  : "This will be sent to an admin to confirm before it appears on the Redeemed wall."}
              </p>
              <textarea
                name="note"
                rows={2}
                defaultValue={kid.redeemedNote ?? ""}
                placeholder="Optional testimony / praise to share"
                className="rounded-lg border border-border bg-surface p-3 text-sm"
              />
              <button className="self-start px-5 py-2 rounded-lg bg-accent text-white text-sm font-semibold">
                {kid.redeemed === "pending" ? "Update redeemed request" : "Mark Redeemed"}
              </button>
              {kid.redeemed === "pending" && (
                <p className="text-xs text-muted">⏳ Pending admin confirmation.</p>
              )}
            </form>
          ) : (
            <p className="text-sm text-accent border-t border-border pt-4">
              ✦ {kid.firstName} is on the Redeemed wall.
            </p>
          )}
        </section>
      )}

      {/* Comments */}
      <section className="card p-5 sm:p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-lg">
          Notes &amp; prayers{" "}
          <span className="text-muted font-normal">({kidComments.length})</span>
        </h2>
        {me && <CommentForm action={addKidComment.bind(null, kid.id)} />}
        <ul className="flex flex-col divide-y divide-border">
          {kidComments.length === 0 && (
            <li className="text-muted text-sm py-2">No notes yet.</li>
          )}
          {kidComments.map((c) => (
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
