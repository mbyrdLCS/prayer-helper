import Link from "next/link";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { questionOptions, questionResponses, questions } from "@/db/schema";
import { requireAccess } from "@/lib/auth";
import { answerQuestion } from "./actions";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const me = await requireAccess();
  const qs = await db
    .select()
    .from(questions)
    .where(eq(questions.active, true))
    .orderBy(asc(questions.sortOrder), asc(questions.id));

  const qIds = qs.map((q) => q.id);
  const opts = qIds.length
    ? await db
        .select()
        .from(questionOptions)
        .where(inArray(questionOptions.questionId, qIds))
        .orderBy(asc(questionOptions.sortOrder), asc(questionOptions.id))
    : [];

  const counts = qIds.length
    ? await db
        .select({
          optionId: questionResponses.optionId,
          n: sql<number>`count(*)`,
        })
        .from(questionResponses)
        .where(inArray(questionResponses.questionId, qIds))
        .groupBy(questionResponses.optionId)
    : [];
  const countByOption = new Map(counts.map((c) => [c.optionId, Number(c.n)]));

  const mine = me && qIds.length
    ? await db
        .select()
        .from(questionResponses)
        .where(eq(questionResponses.userId, me.id))
    : [];
  const myAnswer = new Map(mine.map((r) => [r.questionId, r.optionId]));

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold">How are we all doing?</h1>
        <p className="text-muted max-w-2xl mx-auto">
          A gentle, <strong>anonymous</strong> snapshot of where our families are.
          Your answers are private — only the totals are shown. Update them anytime
          as things change. 💗
        </p>
        <Link href="/parents" className="text-sm text-primary hover:underline">
          ← Back to Parents
        </Link>
      </header>

      {qs.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          No questions yet. An admin can add some from the dashboard.
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {qs.map((q) => {
            const qOpts = opts.filter((o) => o.questionId === q.id);
            const total = qOpts.reduce((s, o) => s + (countByOption.get(o.id) ?? 0), 0);
            return (
              <li key={q.id} className="card p-5 sm:p-6 flex flex-col gap-3">
                <h2 className="font-semibold text-lg">{q.prompt}</h2>
                <div className="flex flex-col gap-2">
                  {qOpts.map((o) => {
                    const n = countByOption.get(o.id) ?? 0;
                    const pct = total ? Math.round((n / total) * 100) : 0;
                    const isMine = myAnswer.get(q.id) === o.id;
                    return (
                      <form key={o.id} action={answerQuestion.bind(null, q.id, o.id)}>
                        <button
                          className={`w-full text-left rounded-lg border p-3 relative overflow-hidden transition ${
                            isMine ? "border-primary" : "border-border hover:bg-background"
                          }`}
                        >
                          <span
                            className="absolute inset-y-0 left-0 bg-primary/10"
                            style={{ width: `${pct}%` }}
                          />
                          <span className="relative flex justify-between items-center text-sm">
                            <span className={isMine ? "font-semibold text-primary" : ""}>
                              {isMine ? "✓ " : ""}
                              {o.label}
                            </span>
                            <span className="text-muted">{pct}%</span>
                          </span>
                        </button>
                      </form>
                    );
                  })}
                </div>
                <p className="text-xs text-muted">
                  {total} {total === 1 ? "parent" : "parents"} answered
                  {myAnswer.has(q.id) ? " · tap another option to change yours" : " · tap an option to add yours"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
