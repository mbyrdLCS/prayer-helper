import JSZip from "jszip";
import { renderCardImage, CARD_DATE_RE, CARD_STYLES, type CardStyle } from "@/lib/render-card";
import { ensureSelectionsForRange } from "@/lib/rotation";
import { addDays } from "@/lib/dates";
import { getDbUser, hasAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!hasAccess(await getDbUser())) {
    return new Response("Forbidden", { status: 403 });
  }
  const url = new URL(req.url);
  const start = url.searchParams.get("start") || "";
  const days = Math.min(
    92,
    Math.max(1, parseInt(url.searchParams.get("days") || "7", 10) || 7)
  );
  const theme = url.searchParams.get("theme");
  const styleParam = url.searchParams.get("style");
  const style: CardStyle =
    styleParam && (CARD_STYLES as string[]).includes(styleParam)
      ? (styleParam as CardStyle)
      : "soft";
  if (!CARD_DATE_RE.test(start)) {
    return new Response("Bad start date", { status: 400 });
  }

  // Keep the rotation contiguous, then render each day in order.
  await ensureSelectionsForRange(start, days);

  const zip = new JSZip();
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    const img = await renderCardImage(date, theme, style);
    const buf = Buffer.from(await img.arrayBuffer());
    const label = String(i + 1).padStart(2, "0");
    zip.file(`hopeful-${label}-${date}.png`, buf);
  }

  const out = await zip.generateAsync({ type: "uint8array" });
  return new Response(out as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="hopeful-cards-${start}-${days}days.zip"`,
    },
  });
}
