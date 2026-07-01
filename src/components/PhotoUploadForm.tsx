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
      className="flex flex-col gap-2 items-start"
    >
      <label className="text-sm font-semibold">Photo</label>
      {/* Big obvious "choose" button that opens the file picker */}
      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-primary/5">
        📷 {fileName ? "Choose a different photo" : "Choose a photo"}
        <input
          type="file"
          name="photo"
          accept="image/*"
          required
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
          className="hidden"
        />
      </label>
      {fileName && <p className="text-xs text-muted">Selected: {fileName}</p>}
      {children}
      <button
        type="submit"
        disabled={pending || !fileName}
        className="self-start px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40"
      >
        {pending ? "Uploading…" : buttonLabel}
      </button>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-accent" : "text-primary"}`}>{msg.text}</p>
      )}
    </form>
  );
}
