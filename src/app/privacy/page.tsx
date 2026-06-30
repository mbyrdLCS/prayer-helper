import Link from "next/link";
import { APP_NAME, GROUP_NAME, CONTACT_EMAIL } from "@/lib/config";

export const metadata = { title: `Privacy Policy — ${APP_NAME}` };

export default function PrivacyPage() {
  const group = GROUP_NAME || "our group";
  return (
    <div className="max-w-2xl mx-auto prose-sm flex flex-col gap-4 py-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-muted text-sm">Last updated: 2026</p>

      <p>
        {APP_NAME} is a small, private prayer website made for the members of{" "}
        {group}. It is not a public service and is not intended for the general
        public. This page explains what information we collect and how we use it.
      </p>

      <h2 className="text-xl font-semibold">What we collect</h2>
      <ul className="list-disc pl-5 flex flex-col gap-1">
        <li>
          <strong>Your account:</strong> your name and email address (and profile
          photo) from how you sign in — by email or, if you choose, with Facebook.
        </li>
        <li>
          <strong>What you add:</strong> prayer requests, comments, notes, an
          optional photo, and any details you choose to share about yourself or
          your child.
        </li>
        <li>
          <strong>Children on the list:</strong> first names only (and any prayer
          request, short note, or photo a parent or admin chooses to add).
        </li>
        <li>
          <strong>Activity:</strong> when you tap “prayed,” your answers to the
          optional, anonymous insight questions, and which days you’re emailed a card
          (if you opt in).
        </li>
      </ul>

      <h2 className="text-xl font-semibold">How we use it</h2>
      <p>
        Only to run the prayer space — showing the daily list, letting members pray
        and encourage one another, and (if you opt in) emailing you the daily card.
        Everything is visible <strong>only to signed-in, approved members</strong> of{" "}
        {group}. We do <strong>not</strong> sell your data, show ads, or share it for
        marketing.
      </p>

      <h2 className="text-xl font-semibold">Children&apos;s information</h2>
      <p>
        Children are listed by <strong>first name only</strong>. Photos or extra
        details are added only by a child&apos;s own parent (or an admin) and shown only
        inside this private, login-protected space. Parents and admins can edit or
        remove a child&apos;s information at any time.
      </p>

      <h2 className="text-xl font-semibold">Service providers</h2>
      <p>
        We use trusted services to run the app: <strong>Clerk</strong> (login),{" "}
        <strong>Neon</strong> (database), <strong>Vercel</strong> (hosting),{" "}
        <strong>Resend</strong> (the optional daily email), and{" "}
        <strong>Facebook</strong> (only if you choose to sign in with it). They
        process data on our behalf to provide these features.
      </p>

      <h2 className="text-xl font-semibold">Your choices</h2>
      <ul className="list-disc pl-5 flex flex-col gap-1">
        <li>You can edit or delete your own profile, requests, and comments.</li>
        <li>You can turn the daily email on or off anytime on the Today page.</li>
        <li>
          You can ask an admin to remove your account, your child&apos;s listing, or any
          content — and we&apos;ll take care of it.
        </li>
      </ul>

      <h2 className="text-xl font-semibold">Contact</h2>
      <p>
        Questions or removal requests? Reach the group&apos;s administrators
        {CONTACT_EMAIL ? <> at <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></> : null}, or message an admin inside {group}.
      </p>

      <p className="text-sm text-muted">
        See also our <Link href="/terms" className="text-primary underline">Terms of Use</Link>.
      </p>
    </div>
  );
}
