import { ImageResponse } from "next/og";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { loadGoogleFont } from "@/lib/card-font";

// Social preview card (Facebook, iMessage, etc.)
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = APP_NAME;

export default async function OpengraphImage() {
  const script = await loadGoogleFont("Dancing Script", 700, APP_NAME);
  const serif = await loadGoogleFont("Playfair Display", 500, `${APP_TAGLINE} A private prayer community 🙏`);
  const fonts: { name: string; data: ArrayBuffer; weight: 500 | 700; style: "normal" }[] = [];
  if (script) fonts.push({ name: "Script", data: script, weight: 700, style: "normal" });
  if (serif) fonts.push({ name: "Serif", data: serif, weight: 500, style: "normal" });
  const scriptFamily = script ? "Script" : "serif";
  const serifFamily = serif ? "Serif" : "serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #fbf3ee 0%, #f3ead9 100%)",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "16px", background: "#7c8c6f", display: "flex" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "16px", background: "#7c8c6f", display: "flex" }} />
        <div style={{ display: "flex", fontFamily: scriptFamily, fontWeight: 700, fontSize: "150px", color: "#b23a48", lineHeight: 1 }}>
          {APP_NAME}
        </div>
        <div style={{ display: "flex", width: "160px", height: "3px", background: "#d8a7ac", margin: "24px 0 28px" }} />
        <div style={{ display: "flex", fontFamily: serifFamily, fontSize: "38px", color: "#3a2e2a", maxWidth: "860px", textAlign: "center" }}>
          {APP_TAGLINE}
        </div>
        <div style={{ display: "flex", fontFamily: serifFamily, fontSize: "24px", color: "#8a7a72", marginTop: "26px", letterSpacing: "2px" }}>
          A private prayer community
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  );
}
