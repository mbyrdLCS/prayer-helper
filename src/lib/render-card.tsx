import { ImageResponse } from "next/og";
import { getDayPrayer } from "@/lib/rotation";
import { prettyDate } from "@/lib/dates";
import { loadGoogleFont } from "@/lib/card-font";
import { APP_NAME, GROUP_NAME } from "@/lib/config";
import { resolveTheme } from "@/lib/card-themes";
import { monthImageDataUri } from "@/lib/card-bg";
import { kidName } from "@/lib/kids";

export const CARD_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type CardStyle = "classic" | "soft" | "dreamy" | "fun";
export const CARD_STYLES: CardStyle[] = ["soft", "dreamy", "classic", "fun"];

// Reference card is 940x788; render at 2x for crisp social posts.
const W = 1880;
const H = 1576;

const FUN_DOTS = [
  { l: "5%", t: "9%", s: 56 }, { l: "91%", t: "7%", s: 40 }, { l: "2%", t: "44%", s: 30 },
  { l: "95%", t: "39%", s: 50 }, { l: "7%", t: "82%", s: 46 }, { l: "89%", t: "85%", s: 58 },
  { l: "49%", t: "3%", s: 24 }, { l: "19%", t: "5%", s: 20 }, { l: "79%", t: "93%", s: 26 },
  { l: "14%", t: "93%", s: 32 }, { l: "96%", t: "69%", s: 22 }, { l: "1%", t: "67%", s: 26 },
  { l: "71%", t: "4%", s: 18 }, { l: "31%", t: "95%", s: 18 }, { l: "85%", t: "21%", s: 22 },
  { l: "11%", t: "25%", s: 22 },
];

// Cheerful confetti palette for the "Fun" style (independent of month).
const FUN_COLORS = ["#e8866f", "#f2b441", "#5bb3a6", "#9a86d4", "#7bc47f", "#ef9bb3", "#6db5d9"];

export async function renderCardImage(
  date: string,
  themeOverride?: string | null,
  style: CardStyle = "classic"
): Promise<ImageResponse> {
  const { kids } = await getDayPrayer(date);
  const names = kids.map((k) => kidName(k).toUpperCase());
  const theme = resolveTheme(date, themeOverride);

  // Resolve background image for image styles (fall back to gradient if missing).
  let bgImage: string | null = null;
  if (style === "soft") bgImage = monthImageDataUri(theme.key, 1);
  if (style === "dreamy") bgImage = monthImageDataUri(theme.key, 2);
  const useImage = !!bgImage;
  const isFun = style === "fun" && !useImage;

  // Two columns like she lays them out: left column gets the larger half.
  // One column up to 5 names; two columns above that to keep them big.
  const useTwoCols = names.length > 5;
  const mid = useTwoCols ? Math.ceil(names.length / 2) : names.length;
  const left = names.slice(0, mid);
  const right = names.slice(mid);
  const perCol = Math.max(left.length, right.length, 1);
  const longest = names.reduce((m, n) => Math.max(m, n.length), 0);

  // Scale the name size to the number of rows so it stays big but always fits
  // as the list grows (handles 10+ names gracefully).
  let nameSize =
    perCol <= 2 ? 128 :
    perCol === 3 ? 118 :
    perCol === 4 ? 106 :
    perCol === 5 ? 94 :
    perCol === 6 ? 80 :
    perCol === 7 ? 68 : 58;
  if (longest >= 11) nameSize -= 8;
  if (longest >= 14) nameSize -= 8;
  const rowGap = perCol >= 7 ? 14 : perCol >= 6 ? 18 : perCol >= 5 ? 24 : 32;
  const colGap = 140;

  const headingText = `Today we pray for : ${GROUP_NAME} ${prettyDate(date)} ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,·`;
  const namesText = `${names.join(" ")} ABCDEFGHIJKLMNOPQRSTUVWXYZ`;
  const script = await loadGoogleFont("Dancing Script", 700, APP_NAME);
  const sans = await loadGoogleFont("Montserrat", 700, headingText);
  const nameFont = await loadGoogleFont("Poppins", 600, namesText);

  const fonts: { name: string; data: ArrayBuffer; weight: 600 | 700; style: "normal" }[] = [];
  if (script) fonts.push({ name: "Script", data: script, weight: 700, style: "normal" });
  if (sans) fonts.push({ name: "Sans", data: sans, weight: 700, style: "normal" });
  if (nameFont) fonts.push({ name: "Names", data: nameFont, weight: 600, style: "normal" });
  const scriptFamily = script ? "Script" : "serif";
  const sansFamily = sans ? "Sans" : "sans-serif";
  const nameFamily = nameFont ? "Names" : sansFamily;

  const Column = ({ items }: { items: string[] }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: `${rowGap}px`, alignItems: "flex-start" }}>
      {items.map((n, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            fontFamily: nameFamily,
            fontWeight: 600,
            fontSize: `${nameSize}px`,
            color: theme.name,
            letterSpacing: "1px",
            lineHeight: 1.05,
          }}
        >
          {n}
        </div>
      ))}
    </div>
  );

  const panelBackground = useImage
    ? undefined
    : isFun
    ? "linear-gradient(160deg, #fffef9 0%, #fdf7ef 100%)"
    : theme.background;

  return new ImageResponse(
    (
      <div
        style={{
          width: `${W}px`,
          height: `${H}px`,
          display: "flex",
          padding: "70px",
          background: theme.border,
        }}
      >
        <div
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            overflow: "hidden",
            alignItems: "stretch",
            ...(useImage
              ? {
                  backgroundImage: `url(${bgImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : { background: panelBackground }),
          }}
        >
          {/* Readability scrim over photos */}
          {useImage && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.34) 28%, rgba(255,255,255,0.34) 72%, rgba(255,255,255,0.6) 100%)",
              }}
            />
          )}

          {/* Fun confetti */}
          {isFun &&
            FUN_DOTS.map((d, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: d.l,
                  top: d.t,
                  width: `${d.s}px`,
                  height: `${d.s}px`,
                  borderRadius: "9999px",
                  background: FUN_COLORS[i % FUN_COLORS.length],
                  opacity: 0.9,
                  display: "flex",
                }}
              />
            ))}

          {/* Content */}
          <div
            style={{
              position: "relative",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "60px 70px",
            }}
          >
            <div style={{ display: "flex", fontFamily: scriptFamily, fontWeight: 700, fontSize: "190px", color: theme.script, lineHeight: 1, marginTop: "6px" }}>
              {APP_NAME}
            </div>

            <div style={{ display: "flex", fontFamily: sansFamily, fontWeight: 700, fontSize: "52px", color: theme.heading, marginTop: "18px" }}>
              Today we pray for :
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                width: "100%",
                marginTop: "30px",
              }}
            >
              {names.length === 0 ? (
                <div style={{ display: "flex", fontFamily: sansFamily, fontSize: "56px", color: theme.sub }}>
                  (no names yet)
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", marginRight: right.length ? `${colGap}px` : "0px" }}>
                    <Column items={left} />
                  </div>
                  {right.length > 0 && <Column items={right} />}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", fontFamily: sansFamily, fontWeight: 700, fontSize: "30px", color: theme.sub, letterSpacing: "1px" }}>
                {prettyDate(date)}
                {GROUP_NAME ? `  ·  ${GROUP_NAME}` : ""}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: fonts.length ? fonts : undefined,
    }
  );
}
