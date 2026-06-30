import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { appUsers, claims, comments, kids, questionOptions, questions } from "@/db/schema";
import { getDbUser } from "@/lib/auth";
import { getDailyCount, getAccessCode, MIN_DAILY, MAX_DAILY } from "@/lib/settings";
import DailyCountSettings from "@/components/DailyCountSettings";
import {
  addAdminByEmail,
  addKid,
  addKidsBulk,
  addQuestion,
  autoNumberDuplicates,
  approveClaim,
  approveRedeemed,
  clearNeedsReview,
  deleteComment,
  deleteKid,
  deleteQuestion,
  denyClaim,
  editKid,
  rejectRedeemed,
  removeKidPhoto,
  seedFromImage,
  setAccessCode,
  setCommentHidden,
  setKidHidden,
  setQuestionActive,
  setUserAdmin,
  setUserApproved,
} from "./actions";

export const dynamic = "force-dynamic";

function Section({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section className="card p-5 sm:p-6 flex flex-col gap-4">
      <div>
        <h2 className="font-semibold text-lg">{title}</h2>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const me = await getDbUser();
  if (!me?.isAdmin) redirect("/today");
  const { q } = await searchParams;

  const [{ value: kidCount }] = await db.select({ value: sql<number>`count(*)` }).from(kids);
  const [{ value: reviewCount }] = await db
    .select({ value: sql<number>`count(*)` })
    .from(kids)
    .where(eq(kids.needsReview, true));
  const [{ value: activeKidCount }] = await db
    .select({ value: sql<number>`count(*)` })
    .from(kids)
    .where(eq(kids.hidden, false));
  const dailyCount = await getDailyCount();
  const accessCode = await getAccessCode();

  const pendingClaims = await db
    .select({ claim: claims, kidName: kids.firstName, userName: appUsers.name, userEmail: appUsers.email })
    .from(claims)
    .innerJoin(kids, eq(claims.kidId, kids.id))
    .leftJoin(appUsers, eq(claims.userId, appUsers.id))
    .where(eq(claims.status, "pending"))
    .orderBy(asc(claims.createdAt));

  const pendingRedeemed = await db
    .select()
    .from(kids)
    .where(eq(kids.redeemed, "pending"))
    .orderBy(asc(kids.firstName));

  const kidWhere = q
    ? ilike(kids.firstName, `%${q}%`)
    : eq(kids.needsReview, true);
  const kidList = await db
    .select()
    .from(kids)
    .where(kidWhere)
    .orderBy(asc(kids.sortOrder), asc(kids.id))
    .limit(300);

  const recentComments = await db
    .select({ comment: comments, kidName: kids.firstName })
    .from(comments)
    .leftJoin(kids, eq(comments.kidId, kids.id))
    .orderBy(desc(comments.createdAt))
    .limit(40);

  const questionList = await db
    .select()
    .from(questions)
    .orderBy(asc(questions.sortOrder), asc(questions.id));
  const allOptions = await db.select().from(questionOptions);

  const members = await db
    .select()
    .from(appUsers)
    .orderBy(asc(appUsers.name))
    .limit(500);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-muted">
          {Number(kidCount)} kids · {Number(reviewCount)} need review ·{" "}
          {pendingClaims.length} pending claims · {pendingRedeemed.length} redeemed to confirm
        </p>
      </header>

      {/* Pending claims */}
      <Section title={`Claim requests (${pendingClaims.length})`} hint="A parent asked to be the contact for a child. Approve to let them edit that profile.">
        {pendingClaims.length === 0 ? (
          <p className="text-muted text-sm">No pending claims.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {pendingClaims.map((c) => (
              <li key={c.claim.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link href={`/kids/${c.claim.kidId}`} className="font-semibold text-primary">
                    {c.kidName}
                  </Link>
                  <span className="text-muted text-sm">
                    {" "}— {c.userName || "Member"} ({c.userEmail || "no email"})
                  </span>
                  {c.claim.message && <p className="text-sm text-foreground/80">“{c.claim.message}”</p>}
                </div>
                <div className="flex gap-2">
                  <form action={approveClaim.bind(null, c.claim.id)}>
                    <button className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-semibold">Approve</button>
                  </form>
                  <form action={denyClaim.bind(null, c.claim.id)}>
                    <button className="px-3 py-1.5 rounded-lg border border-border text-sm">Deny</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Pending redeemed */}
      <Section title={`Redeemed to confirm (${pendingRedeemed.length})`} hint="A parent marked their child redeemed. Confirm to add them to the Redeemed wall.">
        {pendingRedeemed.length === 0 ? (
          <p className="text-muted text-sm">Nothing waiting.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {pendingRedeemed.map((k) => (
              <li key={k.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link href={`/kids/${k.id}`} className="font-semibold text-primary">{k.firstName}</Link>
                  {k.redeemedNote && <p className="text-sm text-foreground/80">“{k.redeemedNote}”</p>}
                </div>
                <div className="flex gap-2">
                  <form action={approveRedeemed.bind(null, k.id)}>
                    <button className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-semibold">Confirm ✦</button>
                  </form>
                  <form action={rejectRedeemed.bind(null, k.id)}>
                    <button className="px-3 py-1.5 rounded-lg border border-border text-sm">Not yet</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Daily rotation */}
      <Section title="Daily rotation" hint="Choose how many kids we pray for each day. The math updates live so you can find the right balance.">
        <DailyCountSettings
          current={dailyCount}
          totalKids={Number(activeKidCount)}
          min={MIN_DAILY}
          max={MAX_DAILY}
        />
      </Section>

      {/* Add kids */}
      <Section title="Add kids" hint="Add one name, or paste many at once (one per line or comma-separated). Real names are entered here at runtime — they are never stored in the public code.">
        <div className="grid sm:grid-cols-2 gap-4">
          <form action={addKid} className="flex gap-2">
            <input name="firstName" placeholder="First name" required className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
            <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">Add</button>
          </form>
          {Number(kidCount) === 0 && (
            <form action={seedFromImage}>
              <button className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-semibold">
                Load example starter names (to try it out)
              </button>
            </form>
          )}
        </div>
        <form action={addKidsBulk} className="flex flex-col gap-2">
          <textarea name="names" rows={4} placeholder={"Paste many names…\nOne per line or comma-separated"} className="rounded-lg border border-border bg-surface p-3 text-sm" />
          <button className="self-start px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">Add all</button>
        </form>
      </Section>

      {/* Manage kids */}
      <Section
        title="Manage kids"
        hint={q ? `Search results for “${q}”.` : "Showing kids that still need review. Search to find anyone."}
      >
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <form className="flex gap-2">
            <input name="q" defaultValue={q} placeholder="Search a name…" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
            <button className="px-4 py-2 rounded-lg border border-border text-sm font-semibold">Search</button>
            {q && <Link href="/admin" className="px-4 py-2 rounded-lg text-sm text-muted self-center">Clear</Link>}
          </form>
          <form action={autoNumberDuplicates}>
            <button className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-semibold" title="Add 1, 2, 3… to any repeated first name. Safe to run anytime.">
              🔢 Auto-number duplicates
            </button>
          </form>
        </div>
        {kidList.length === 0 ? (
          <p className="text-muted text-sm">{q ? "No matches." : "Nothing needs review. 🎉"}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {kidList.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center gap-2 border border-border rounded-lg p-2">
                <form action={editKid.bind(null, k.id)} className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <input name="firstName" defaultValue={k.firstName} className="rounded border border-border bg-surface px-2 py-1 text-sm w-36" />
                  <input name="lastInitial" defaultValue={k.lastInitial ?? ""} placeholder="#" title="Tag to tell duplicates apart (e.g. 1)" className="rounded border border-border bg-surface px-2 py-1 text-sm w-14" />
                  <input name="sortOrder" type="number" defaultValue={k.sortOrder} title="Order in rotation" className="rounded border border-border bg-surface px-2 py-1 text-sm w-20" />
                  <button className="px-3 py-1 rounded bg-primary text-white text-xs font-semibold">Save</button>
                </form>
                <div className="flex items-center gap-1">
                  {k.needsReview && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">review</span>}
                  {k.hidden && <span className="text-[10px] bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full">hidden</span>}
                  {k.redeemed === "approved" && <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full">✦</span>}
                  <Link href={`/kids/${k.id}`} className="text-xs text-muted underline px-1">view</Link>
                  {k.photoUrl && (
                    <form action={removeKidPhoto.bind(null, k.id)}>
                      <button className="text-xs text-muted px-1">rm photo</button>
                    </form>
                  )}
                  {k.needsReview && (
                    <form action={clearNeedsReview.bind(null, k.id)}>
                      <button className="text-xs text-accent px-1">✓ reviewed</button>
                    </form>
                  )}
                  <form action={setKidHidden.bind(null, k.id, !k.hidden)}>
                    <button className="text-xs px-1">{k.hidden ? "unhide" : "hide"}</button>
                  </form>
                  <form action={deleteKid.bind(null, k.id)}>
                    <button className="text-xs text-red-600 px-1">delete</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Moderation: comments */}
      <Section title="Recent comments" hint="Hide or delete anything inappropriate.">
        {recentComments.length === 0 ? (
          <p className="text-muted text-sm">No comments yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {recentComments.map((row) => (
              <li key={row.comment.id} className="py-2 flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1 min-w-[220px]">
                  <p className="text-sm">
                    <span className="font-semibold">{row.comment.authorName || "Member"}</span>{" "}
                    <span className="text-muted text-xs">
                      {row.kidName ? `on ${row.kidName}` : "on Today"}
                      {row.comment.hidden ? " · hidden" : ""}
                    </span>
                  </p>
                  <p className={`text-sm whitespace-pre-wrap ${row.comment.hidden ? "text-muted line-through" : ""}`}>
                    {row.comment.body}
                  </p>
                </div>
                <div className="flex gap-1">
                  <form action={setCommentHidden.bind(null, row.comment.id, !row.comment.hidden)}>
                    <button className="text-xs px-2 py-1 rounded border border-border">{row.comment.hidden ? "show" : "hide"}</button>
                  </form>
                  <form action={deleteComment.bind(null, row.comment.id)}>
                    <button className="text-xs px-2 py-1 rounded text-red-600">delete</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Insight questions */}
      <Section title={`Parent insight questions (${questionList.length})`} hint="Anonymous polls shown on the Parents → Insights page. Add a question with one option per line.">
        <form action={addQuestion} className="flex flex-col gap-2">
          <input name="prompt" placeholder="Question (e.g. Are you currently talking with your child?)" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          <textarea name="options" rows={3} placeholder={"One option per line, e.g.:\nYes, regularly\nSometimes\nNot right now"} className="rounded-lg border border-border bg-surface p-3 text-sm" />
          <button className="self-start px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">Add question</button>
        </form>
        {questionList.length > 0 && (
          <ul className="flex flex-col gap-2">
            {questionList.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 border border-border rounded-lg p-2">
                <div className="flex-1 min-w-[220px]">
                  <p className="text-sm font-semibold">{q.prompt}</p>
                  <p className="text-xs text-muted">
                    {allOptions.filter((o) => o.questionId === q.id).map((o) => o.label).join(" · ")}
                    {!q.active && " · hidden"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <form action={setQuestionActive.bind(null, q.id, !q.active)}>
                    <button className="text-xs px-2 py-1 rounded border border-border">{q.active ? "hide" : "show"}</button>
                  </form>
                  <form action={deleteQuestion.bind(null, q.id)}>
                    <button className="text-xs px-2 py-1 rounded text-red-600">delete</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Access code */}
      <Section title="Access code" hint="New members enter this code to get in. Share it inside your private Facebook group. Change it anytime to rotate access.">
        <form action={setAccessCode} className="flex gap-2 items-center flex-wrap">
          <input name="code" defaultValue={accessCode} placeholder="e.g. hopeful2026" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm w-56" />
          <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">Save code</button>
          {!accessCode && (
            <span className="text-xs text-primary">⚠ No code set yet — set one so members can join.</span>
          )}
        </form>
      </Section>

      {/* Members */}
      <Section title={`Members (${members.length})`} hint="Everyone who has signed in. Approve or remove access, and manage admins. Add an admin by email (they must have signed in once).">
        <form action={addAdminByEmail} className="flex gap-2">
          <input name="email" type="email" placeholder="member@email.com" className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">Make admin</button>
        </form>
        <ul className="flex flex-col gap-1">
          {members.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-2 text-sm border-b border-border py-1.5 flex-wrap">
              <span>
                {u.name || "Member"} <span className="text-muted text-xs">{u.email}</span>
                {u.isAdmin ? (
                  <span className="ml-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">admin</span>
                ) : u.approved ? (
                  <span className="ml-2 text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full">approved</span>
                ) : (
                  <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">pending</span>
                )}
              </span>
              <div className="flex gap-1">
                {!u.isAdmin && (
                  <form action={setUserApproved.bind(null, u.id, !u.approved)}>
                    <button className="text-xs px-2 py-1 rounded border border-border">
                      {u.approved ? "remove access" : "approve"}
                    </button>
                  </form>
                )}
                <form action={setUserAdmin.bind(null, u.id, !u.isAdmin)}>
                  <button className="text-xs px-2 py-1 rounded border border-border">
                    {u.isAdmin ? "remove admin" : "make admin"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
