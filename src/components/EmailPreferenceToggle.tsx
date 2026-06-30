"use client";

import { useState, useTransition } from "react";
import { setEmailDailyCard } from "@/app/today/actions";

export default function EmailPreferenceToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !on;
    setOn(next);
    startTransition(() => setEmailDailyCard(next));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="flex items-center gap-3 text-sm text-muted hover:text-foreground transition"
      aria-pressed={on}
    >
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          on ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            on ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
      <span>
        ✉️ {on ? "You'll get today's card emailed each morning" : "Email me today's card each morning"}
      </span>
    </button>
  );
}
