import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { appUsers } from "@/db/schema";
import { renderCardImage } from "@/lib/render-card";
import { getDayPrayer } from "@/lib/rotation";
import { today, prettyDate } from "@/lib/dates";
import { APP_NAME } from "@/lib/config";
import { PREVIEW_MODE } from "@/lib/preview";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || `${APP_NAME} <onboarding@resend.dev>`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

/**
 * Emails today's prayer card to every member who opted in. Uses Resend (a simple
 * HTTP API — no mail server). No-ops safely if RESEND_API_KEY isn't set or in
 * preview mode, so it never breaks the app.
 */
export async function sendDailyCardEmails(): Promise<{ sent: number; note?: string }> {
  if (PREVIEW_MODE) return { sent: 0, note: "preview mode" };
  if (!RESEND_API_KEY) return { sent: 0, note: "no RESEND_API_KEY" };

  const recipients = await db
    .select({ email: appUsers.email, name: appUsers.name })
    .from(appUsers)
    .where(and(eq(appUsers.emailDailyCard, true), isNotNull(appUsers.email)));
  if (!recipients.length) return { sent: 0, note: "no opt-ins" };

  const day = today();
  const { kids } = await getDayPrayer(day);
  const names = kids.map((k) => k.firstName);

  // Render the card once and reuse it for everyone.
  const img = await renderCardImage(day, null, "soft");
  const content = Buffer.from(await img.arrayBuffer()).toString("base64");

  const subject = `🙏 ${APP_NAME} — today we pray for ${names.slice(0, 3).join(", ")}${names.length > 3 ? "…" : ""}`;
  const namesHtml = names
    .map((n) => `<span style="display:inline-block;margin:2px 8px;font-size:18px;color:#3a2e2a">${n}</span>`)
    .join("");
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#3a2e2a">
      <h1 style="color:#b23a48;text-align:center;font-size:30px;margin:8px 0">${APP_NAME}</h1>
      <p style="text-align:center;color:#8a7a72;margin:0 0 14px">${prettyDate(day)} — today we pray for:</p>
      <img src="cid:card" alt="Today's prayer card" style="width:100%;border-radius:10px;border:1px solid #ece2d8" />
      <p style="text-align:center;margin:16px 0">${namesHtml}</p>
      ${SITE_URL ? `<p style="text-align:center"><a href="${SITE_URL}/today" style="background:#b23a48;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Open ${APP_NAME} to pray &amp; comment</a></p>` : ""}
      <p style="text-align:center;color:#b0a59d;font-size:12px;margin-top:18px">You're getting this because you turned on the daily card email. You can turn it off anytime on the Today page.</p>
    </div>`;

  let sent = 0;
  for (const r of recipients) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: r.email,
          subject,
          html,
          attachments: [{ filename: `hopeful-${day}.png`, content, content_id: "card" }],
        }),
      });
      if (res.ok) sent++;
    } catch {
      // Skip a failed recipient; keep going.
    }
  }
  return { sent };
}
