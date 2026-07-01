"use client";

import { useRef, useState, useTransition } from "react";

/**
 * Client-side photo upload with clear feedback (Uploading… / Saved ✓ / error).
 * `children` can add extra required fields (e.g. a consent checkbox).
 */
export default function PhotoUploadForm({
  action,
  children,
  buttonLabel = "Upload photo",
}: {
  action: (formData: FormData) => Promise<void>;
  children?: React.ReactNode;
  buttonLabel?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(fd) =>
        startTransition(async () => {
          setMsg(null);
          try {
            await action(fd);
            setMsg({ ok: true, text: "Photo uploaded ✓" });
            setFileName("");
            formRef.current?.reset();
          } catch (e) {
            setMsg({
              ok: false,
              text: e instanceof Error && e.message ? e.message : "Upload failed — please try again.",
            });
          }
        })
      }
      className="flex flex-col gap-2"
    >
      <label className="text-sm font-semibold">Photo</label>
      <input
        type="file"
        name="photo"
        accept="image/*"
        required
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
        className="text-sm"
      />
      {fileName && <p className="text-xs text-muted">Selected: {fileName}</p>}
      {children}
      <button
        type="submit"
        disabled={pending}
        className="self-start px-5 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-background disabled:opacity-60"
      >
        {pending ? "Uploading…" : buttonLabel}
      </button>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-accent" : "text-primary"}`}>{msg.text}</p>
      )}
    </form>
  );
}
