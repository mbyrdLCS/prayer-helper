"use client";

import { useState } from "react";
import { setDailyCount } from "@/app/admin/actions";

export default function DailyCountSettings({
  current,
  totalKids,
  min,
  max,
}: {
  current: number;
  totalKids: number;
  min: number;
  max: number;
}) {
  const [count, setCount] = useState(current);

  const perDay = count;
  // Only as many names as there are kids can actually show each day.
  const effPerDay = totalKids > 0 ? Math.min(perDay, totalKids) : perDay;
  const perWeek = effPerDay * 7;
  const perMonth = effPerDay * 30;

  const everyDayForAll = totalKids > 0 && perDay >= totalKids;
  // Average days between a given kid's turns = list size / names per day.
  const gapDaysRaw = totalKids > 0 ? totalKids / perDay : 0;
  const gapDisplay = gapDaysRaw >= 3 ? Math.round(gapDaysRaw) : Math.round(gapDaysRaw * 10) / 10;
  // Times each kid is prayed for per year = their share of all the daily slots.
  const timesPerYear = everyDayForAll
    ? 365
    : totalKids > 0
    ? Math.round((perDay * 365) / totalKids)
    : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 flex-wrap">
        <label className="text-sm font-semibold flex items-center gap-3">
          Kids per day
          <input
            type="range"
            min={min}
            max={max}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10))}
            className="w-48"
          />
        </label>
        <input
          type="number"
          min={min}
          max={max}
          value={count}
          onChange={(e) =>
            setCount(Math.max(min, Math.min(max, parseInt(e.target.value, 10) || min)))
          }
          className="w-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-center"
        />
      </div>

      {/* Live math */}
      <div className="rounded-xl bg-background border border-border p-4 text-sm flex flex-col gap-1.5">
        <p>
          We&apos;ll pray for <strong className="text-primary">{effPerDay} kids every day</strong> —
          that&apos;s <strong>{perWeek}</strong> names a week and about <strong>{perMonth}</strong> a month.
        </p>
        {totalKids > 0 ? (
          <>
            {everyDayForAll ? (
              <p>
                You have <strong>{totalKids}</strong> kids and pray for {perDay} a day, so{" "}
                <strong className="text-primary">every child is prayed for every single day</strong>.
              </p>
            ) : (
              <p>
                With <strong>{totalKids}</strong> kids on the list, each child comes back around
                about every <strong className="text-primary">{gapDisplay} days</strong> —
                roughly <strong className="text-primary">{timesPerYear} times a year</strong>.
              </p>
            )}
            <p className="text-muted text-xs">
              Fewer per day = each name gets its own spotlight but comes around less often.
              More per day = everyone is prayed for more often, but the card gets fuller.
            </p>
          </>
        ) : (
          <p className="text-muted">Add kids to the list to see the coverage math.</p>
        )}
      </div>

      <form action={setDailyCount} className="flex items-center gap-3">
        <input type="hidden" name="count" value={count} />
        <button
          className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50"
          disabled={count === current}
        >
          {count === current ? `Saved (${current}/day)` : `Save ${count} per day`}
        </button>
        {count !== current && (
          <button
            type="button"
            onClick={() => setCount(current)}
            className="text-sm text-muted"
          >
            Reset
          </button>
        )}
      </form>
    </div>
  );
}
