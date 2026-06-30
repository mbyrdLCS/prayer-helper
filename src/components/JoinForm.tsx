"use client";

import { useActionState } from "react";
import { submitJoinCode, type JoinState } from "@/app/join/actions";

export default function JoinForm() {
  const [state, action, pending] = useActionState<JoinState, FormData>(
    submitJoinCode,
    null
  );

  return (
    <form action={action} className="flex flex-col gap-3 w-full max-w-sm">
      <input
        name="code"
        required
        autoFocus
        placeholder="Enter your group code"
        className="rounded-lg border border-border bg-surface px-4 py-3 text-center text-lg tracking-wide focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />
      {state?.error && (
        <p className="text-sm text-primary text-center">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="px-5 py-3 rounded-lg bg-primary text-white font-semibold hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Checking…" : "Join"}
      </button>
    </form>
  );
}
