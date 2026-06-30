import { ensureSelectionsForRange } from "@/lib/rotation";
import { today } from "@/lib/dates";
import { sendDailyCardEmails } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily cron: pre-generate today's selection (and the next 6 days so a week of
 * cards is always ready), then email today's card to members who opted in.
 * Protected by CRON_SECRET — Vercel sends it as `Authorization: Bearer <secret>`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (secret && authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const start = today();
  await ensureSelectionsForRange(start, 7);
  const email = await sendDailyCardEmails();

  return Response.json({ ok: true, generatedFrom: start, days: 7, email });
}
