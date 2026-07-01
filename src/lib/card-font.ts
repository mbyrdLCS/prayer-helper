/**
 * Loads a Google Font as an ArrayBuffer for use with next/og ImageResponse.
 * Returns null on any failure so the card can still render with a fallback font.
 */
export async function loadGoogleFont(
  family: string,
  weight: number,
  text: string
): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family
    )}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await fetch(url, {
      headers: {
        // Old User-Agent forces Google to return TrueType (which Satori/next-og
        // can parse). A modern UA returns woff/woff2, which fails.
        "User-Agent": "Mozilla/4.0",
      },
    }).then((r) => r.text());
    const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!match) return null;
    const res = await fetch(match[1]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}
