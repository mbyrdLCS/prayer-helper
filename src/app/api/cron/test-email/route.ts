import { APP_NAME } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * Diagnostic: sends a test email to ADMIN_EMAILS and returns Resend's raw
 * response, so email problems (bad key, unverified domain) can be seen
 * directly instead of vanishing into a silent catch. Protected by CRON_SECRET:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/cron/test-email
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || `${APP_NAME} <onboarding@resend.dev>`;
  const to = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!key) return Response.json({ ok: false, error: "RESEND_API_KEY is not set" });
  if (!to.length) return Response.json({ ok: false, error: "ADMIN_EMAILS is not set" });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `${APP_NAME}: test email — delivery works ✅`,
      html: `<p>This is a test email from ${APP_NAME}. If you're reading this, Resend delivery to the admin list works.</p>`,
    }),
  });
  const resend = await res.json().catch(() => null);
  return Response.json({ ok: res.ok, status: res.status, from, to, resend });
}
