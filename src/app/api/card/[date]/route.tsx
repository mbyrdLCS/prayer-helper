import { renderCardImage, CARD_DATE_RE, CARD_STYLES, type CardStyle } from "@/lib/render-card";
import { getDbUser, hasAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

function parseStyle(v: string | null): CardStyle {
  return v && (CARD_STYLES as string[]).includes(v) ? (v as CardStyle) : "soft";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  if (!hasAccess(await getDbUser())) {
    return new Response("Forbidden", { status: 403 });
  }
  const { date } = await params;
  if (!CARD_DATE_RE.test(date)) {
    return new Response("Bad date", { status: 400 });
  }
  const url = new URL(req.url);
  const theme = url.searchParams.get("theme");
  const style = parseStyle(url.searchParams.get("style"));
  const img = await renderCardImage(date, theme, style);
  return new Response(img.body, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="hopeful-${date}.png"`,
    },
  });
}
