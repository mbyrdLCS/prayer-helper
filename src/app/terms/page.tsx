import Link from "next/link";
import { APP_NAME, GROUP_NAME, CONTACT_EMAIL } from "@/lib/config";

export const metadata = { title: `Terms of Use — ${APP_NAME}` };

export default function TermsPage() {
  const group = GROUP_NAME || "our group";
  return (
    <div className="max-w-2xl mx-auto prose-sm flex flex-col gap-4 py-6">
      <h1 className="text-3xl font-bold">Terms of Use</h1>
      <p className="text-muted text-sm">Last updated: 2026</p>

      <p>
        {APP_NAME} is a private prayer space for members of {group}. By signing in
        and using it, you agree to these simple terms.
      </p>

      <h2 className="text-xl font-semibold">Be kind and keep it private</h2>
      <ul className="list-disc pl-5 flex flex-col gap-1">
        <li>This is a place for prayer, encouragement, and support. Please treat
          every family here with love and respect.</li>
        <li>What&apos;s shared here is personal and sensitive. Don&apos;t copy, screenshot,
          or share names, photos, requests, or comments outside this group.</li>
        <li>Only add information about a child if you are that child&apos;s parent or an
          admin, and only what is appropriate to share.</li>
      </ul>

      <h2 className="text-xl font-semibold">Accounts &amp; access</h2>
      <ul className="list-disc pl-5 flex flex-col gap-1">
        <li>Access is for members of {group}. Don&apos;t share the join code outside the
          group.</li>
        <li>Admins may approve, edit, hide, or remove any content or member to keep
          the space safe.</li>
      </ul>

      <h2 className="text-xl font-semibold">No warranty</h2>
      <p>
        This is a free, volunteer-run tool provided “as is,” without warranties. We
        do our best to keep it running and safe, but we can&apos;t guarantee it will
        always be available or error-free.
      </p>

      <h2 className="text-xl font-semibold">Contact</h2>
      <p>
        Questions? Reach the group&apos;s administrators
        {CONTACT_EMAIL ? <> at <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></> : null}, or message an admin inside {group}.
      </p>

      <p className="text-sm text-muted">
        See also our <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}
