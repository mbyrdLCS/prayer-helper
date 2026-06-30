"use client";

import { useRef, useTransition } from "react";

export default function CommentForm({
  action,
  placeholder = "Leave a word of prayer or encouragement…",
}: {
  action: (formData: FormData) => Promise<void>;
  placeholder?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(fd) =>
        startTransition(async () => {
          await action(fd);
          formRef.current?.reset();
        })
      }
      className="flex flex-col gap-2"
    >
      <textarea
        name="body"
        required
        maxLength={2000}
        rows={3}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition"
        >
          {pending ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
