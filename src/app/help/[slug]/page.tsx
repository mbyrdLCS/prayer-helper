import { notFound } from "next/navigation";
import { APP_NAME } from "@/lib/config";

export const dynamic = "force-dynamic";

// Unlisted pages — reachable only by the secret link, never indexed.
export const metadata = { robots: { index: false, follow: false } };

type Guide = { title: string; subtitle: string; video: string; steps: string[] };

function guides(): Record<string, Guide> {
  const g: Record<string, Guide> = {};
  if (process.env.HELP_MEMBER_SLUG && process.env.HELP_MEMBER_VIDEO) {
    g[process.env.HELP_MEMBER_SLUG] = {
      title: `Using ${APP_NAME}`,
      subtitle: "A quick guide for members",
      video: process.env.HELP_MEMBER_VIDEO,
      steps: [
        "Sign in with your email, then enter the group code once — after that you're always in.",
        "The Today page shows the kids we're praying for today, by name.",
        "Tap “I Prayed” when you've prayed — it keeps a simple daily count.",
        "Leave a word of prayer or encouragement in the comments.",
        "Tap “Our Kids” to browse everyone, and search for a name.",
        "Open a child's profile to see their prayer requests and pray just for them.",
        "If a child is yours, set up your own parent profile, then request to claim them (an admin approves).",
        "Share how the group can pray for you on your own parent profile — a first name is all you need.",
        "Use the Parents page to pray for the moms and dads by name.",
        "Answer the gentle, anonymous questions under Parent Insights (only totals are shown).",
        "Celebrate answered prayers on the Redeemed page.",
      ],
    };
  }
  if (process.env.HELP_ADMIN_SLUG && process.env.HELP_ADMIN_VIDEO) {
    g[process.env.HELP_ADMIN_SLUG] = {
      title: `Running ${APP_NAME}`,
      subtitle: "A guide for admins",
      video: process.env.HELP_ADMIN_VIDEO,
      steps: [
        "Everything lives on the Admin page (only admins see the Admin link).",
        "Set an Access Code and share it in your Facebook group — members enter it once to join.",
        "Approve or remove members in the Members list; use “Look up on Facebook” to verify people.",
        "Approve claim requests (more than one family member can claim a child).",
        "Add kids one at a time or paste a whole list — repeats get numbered automatically.",
        "Manage kids: edit names, tag duplicates, hide, or remove.",
        "Choose how many kids to pray for each day — the coverage math updates live.",
        "Confirm “Redeemed” to add a child to the Redeemed wall.",
        "Add anonymous insight questions for parents.",
        "Moderate comments and photos to keep the space safe.",
        "Download the Daily Cards — today, a week, or a whole month — themed and ready to post.",
      ],
    };
  }
  return g;
}

export default async function HelpPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guides()[slug];
  if (!guide) notFound();

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 py-4">
      <header className="text-center">
        <h1 className="script text-5xl text-primary">{APP_NAME}</h1>
        <p className="text-2xl font-bold mt-2">{guide.title}</p>
        <p className="text-muted">{guide.subtitle}</p>
      </header>

      <div className="rounded-2xl overflow-hidden border border-border shadow-sm bg-black">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <video controls playsInline preload="metadata" className="w-full h-auto" src={guide.video}>
          Your browser can&apos;t play this video.{" "}
          <a href={guide.video} className="underline">Download it here</a>.
        </video>
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-lg mb-3">What&apos;s covered</h2>
        <ol className="flex flex-col gap-2 list-decimal pl-5 text-sm">
          {guide.steps.map((s, i) => (
            <li key={i} className="text-foreground/90">{s}</li>
          ))}
        </ol>
      </section>

      <p className="text-center text-xs text-muted">
        This is a private guide for the {APP_NAME} community. Please don&apos;t share
        this link outside the group.
      </p>
    </div>
  );
}
