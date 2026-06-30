import { readFileSync, existsSync } from "fs";
import path from "path";

const EXTS = ["png", "jpg", "jpeg", "webp"] as const;
const MIME: Record<string, string> = { png: "png", jpg: "jpeg", jpeg: "jpeg", webp: "webp" };

/**
 * Read a monthly background image from /public/cards as a base64 data URI for
 * use inside next/og. Returns null if no file exists for that month/version.
 * version 1 = "soft" (watercolor), 2 = "dreamy" (photo).
 */
export function monthImageDataUri(monthKey: string, version: 1 | 2): string | null {
  const dir = path.join(process.cwd(), "public", "cards");
  for (const ext of EXTS) {
    const p = path.join(dir, `${monthKey}-${version}.${ext}`);
    if (existsSync(p)) {
      const buf = readFileSync(p);
      return `data:image/${MIME[ext]};base64,${buf.toString("base64")}`;
    }
  }
  return null;
}
