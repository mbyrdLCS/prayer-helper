"use client";

import { useState } from "react";

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const STYLES = [
  { value: "soft", label: "Soft — watercolor" },
  { value: "dreamy", label: "Dreamy — photo" },
  { value: "classic", label: "Classic — gradient" },
  { value: "fun", label: "Fun — bright & playful" },
];

export default function CardDownloader({ today }: { today: string }) {
  const [date, setDate] = useState(today);
  const [theme, setTheme] = useState(""); // "" = auto by month
  const [style, setStyle] = useState("soft");

  const params = new URLSearchParams();
  if (theme) params.set("theme", theme);
  if (style) params.set("style", style);
  const qs = params.toString();
  const cardUrl = `/api/card/${date}${qs ? `?${qs}` : ""}`;
  const zip = (days: number) => `/api/cards/zip?${new URLSearchParams({ ...(theme ? { theme } : {}), style, start: date, days: String(days) })}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-5 flex flex-col sm:flex-row gap-5 items-center">
        {/* Live preview */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cardUrl}
          alt={`Hopeful card for ${date}`}
          className="w-72 rounded-lg border border-border shadow-sm"
        />
        <div className="flex-1 flex flex-col gap-4 w-full">
          <div className="flex flex-wrap gap-4">
            <label className="text-sm font-semibold flex flex-col gap-1">
              Style
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm w-fit"
              >
                {STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold flex flex-col gap-1">
              Month look
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm w-fit capitalize"
              >
                <option value="">Auto (by date)</option>
                {MONTHS.map((m) => (
                  <option key={m} value={m} className="capitalize">{m}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold flex flex-col gap-1">
              Starting date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value || today)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm w-fit"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={cardUrl}
              download={`hopeful-${date}.png`}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90"
            >
              ⬇ This day&apos;s card
            </a>
            <a href={zip(7)} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-background">
              ⬇ A week (7, .zip)
            </a>
            <a href={zip(30)} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-background">
              ⬇ A month (30, .zip)
            </a>
          </div>
          <p className="text-xs text-muted">
            <strong>Soft</strong> &amp; <strong>Dreamy</strong> use the month&apos;s
            painted/photo background; <strong>Classic</strong> is the clean gradient;
            <strong> Fun</strong> is bright and playful. Leave Month look on
            <strong> Auto</strong> and each card matches its month.
          </p>
        </div>
      </div>
    </div>
  );
}
