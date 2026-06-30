/**
 * A distinct card theme for EVERY MONTH so the daily card always feels fresh.
 * The card auto-themes by its own date; you can also force one with
 * ?theme=august (month name) on the card URL.
 */
export type CardTheme = {
  key: string; // lowercase month name
  label: string; // e.g. "August — Beach"
  border: string; // outer frame color
  background: string; // CSS background for the inner panel
  script: string; // "Hopeful" wordmark color
  heading: string; // "Today we pray for :" color
  name: string; // names color
  sub: string; // small footer text color
};

/** Index 0 = January … 11 = December. */
export const MONTH_THEMES: CardTheme[] = [
  {
    key: "january",
    label: "January — Fresh snow",
    border: "#9fb8c9",
    background: "linear-gradient(180deg, #f2f7fb 0%, #e8f1f7 55%, #ffffff 100%)",
    script: "#3f6f9c",
    heading: "#3f6f9c",
    name: "#355a78",
    sub: "#6f8aa0",
  },
  {
    key: "february",
    label: "February — Valentine",
    border: "#d98ca0",
    background: "linear-gradient(180deg, #fbeef1 0%, #f7e4ea 55%, #fff5f7 100%)",
    script: "#c64b6e",
    heading: "#c64b6e",
    name: "#9c3a54",
    sub: "#b07788",
  },
  {
    key: "march",
    label: "March — Spring green",
    border: "#8fbf86",
    background: "linear-gradient(180deg, #e9f4e0 0%, #f1f3e4 55%, #f6f1e8 100%)",
    script: "#4f8c4a",
    heading: "#4f8c4a",
    name: "#3f7a44",
    sub: "#6f9468",
  },
  {
    key: "april",
    label: "April — Showers & lilac",
    border: "#b3a4d6",
    background: "linear-gradient(180deg, #eee9f6 0%, #f0eef2 55%, #f7eef3 100%)",
    script: "#6f5aa0",
    heading: "#6f5aa0",
    name: "#5a4a86",
    sub: "#8a7db0",
  },
  {
    key: "may",
    label: "May — Floral bloom",
    border: "#e3a6c0",
    background: "linear-gradient(180deg, #f7e8f0 0%, #eef3e6 55%, #f6eef2 100%)",
    script: "#c45f8c",
    heading: "#c45f8c",
    name: "#8c4068",
    sub: "#ab7f95",
  },
  {
    key: "june",
    label: "June — Early summer sky",
    border: "#9cc6d6",
    background: "linear-gradient(180deg, #d6eef5 0%, #e3f0f2 55%, #eef3e6 100%)",
    script: "#3f7e94",
    heading: "#3f7e94",
    name: "#356676",
    sub: "#5e8a98",
  },
  {
    key: "july",
    label: "July — Patriotic",
    border: "#c75b5b",
    background: "linear-gradient(180deg, #eef4fb 0%, #f7eef0 55%, #fdf4f4 100%)",
    script: "#b23a48",
    heading: "#2f4f86",
    name: "#2f4f86",
    sub: "#7a6f86",
  },
  {
    key: "august",
    label: "August — Beach",
    border: "#c9a268",
    background:
      "linear-gradient(180deg, #cfe6f0 0%, #d9ecf1 36%, #e8e0c6 58%, #ddc79c 100%)",
    script: "#4f6b80",
    heading: "#4f6b80",
    name: "#3f5666",
    sub: "#5e7585",
  },
  {
    key: "september",
    label: "September — Early autumn",
    border: "#c79a4e",
    background: "linear-gradient(180deg, #f7ecd2 0%, #f1ddb0 55%, #ecca8e 100%)",
    script: "#a85f2a",
    heading: "#a85f2a",
    name: "#855024",
    sub: "#9c7544",
  },
  {
    key: "october",
    label: "October — Pumpkin",
    border: "#c2682b",
    background: "linear-gradient(180deg, #f8e6c8 0%, #f2cf9c 55%, #e9b478 100%)",
    script: "#b1471f",
    heading: "#b1471f",
    name: "#8a3f1e",
    sub: "#9c6a40",
  },
  {
    key: "november",
    label: "November — Thanksgiving",
    border: "#9c5a33",
    background: "linear-gradient(180deg, #f1e3cb 0%, #e7c79c 55%, #d9a86f 100%)",
    script: "#7a3f22",
    heading: "#7a3f22",
    name: "#5f3018",
    sub: "#8a6240",
  },
  {
    key: "december",
    label: "December — Christmas",
    border: "#2f5a43",
    background: "linear-gradient(180deg, #f4f8fb 0%, #eef3f0 55%, #ffffff 100%)",
    script: "#b23a48",
    heading: "#2f5a43",
    name: "#2f5a43",
    sub: "#6c8a79",
  },
];

export function resolveTheme(day: string, override?: string | null): CardTheme {
  if (override) {
    const found = MONTH_THEMES.find((t) => t.key === override.toLowerCase());
    if (found) return found;
  }
  const monthIndex = Math.min(11, Math.max(0, Number(day.split("-")[1]) - 1));
  return MONTH_THEMES[monthIndex];
}
