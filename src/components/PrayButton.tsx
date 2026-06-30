"use client";

import { useTransition } from "react";
import { prayToday } from "@/app/today/actions";

export default function PrayButton({
  hasPrayed,
  count,
}: {
  hasPrayed: boolean;
  count: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        disabled={hasPrayed || pending}
        onClick={() => startTransition(() => prayToday())}
        className={`px-8 py-4 rounded-full text-lg font-semibold shadow-sm transition ${
          hasPrayed
            ? "bg-accent/15 text-accent cursor-default"
            : "bg-primary text-white hover:opacity-90 active:scale-[0.98]"
        }`}
      >
        {hasPrayed ? "🙏 You prayed today — thank you" : pending ? "…" : "🙏 I Prayed"}
      </button>
      <p className="text-muted text-sm">
        <span className="font-semibold text-foreground">{count}</span>{" "}
        {count === 1 ? "person has" : "people have"} prayed today
      </p>
    </div>
  );
}
