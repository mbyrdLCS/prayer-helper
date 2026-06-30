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
        // Ask for a TTF (no woff2) so ImageResponse can parse it.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/537.36",
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
