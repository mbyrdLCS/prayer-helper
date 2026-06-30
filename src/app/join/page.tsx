import { redirect } from "next/navigation";
import { getDbUser, hasAccess } from "@/lib/auth";
import { APP_NAME } from "@/lib/config";
import JoinForm from "@/components/JoinForm";

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const me = await getDbUser();
  if (hasAccess(me)) redirect("/today");

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5 text-center">
      <div>
        <h1 className="script text-5xl text-primary">{APP_NAME}</h1>
        <p className="text-foreground/80 mt-2 max-w-md">
          Welcome! This is a private space for our group. To join, enter the
          <strong> group code</strong> shared inside our Facebook group.
        </p>
      </div>
      <JoinForm />
      <p className="text-xs text-muted max-w-sm">
        Don&apos;t have the code? Ask in the group, or message an admin. You&apos;re
        signed in — use the menu in the top-right to switch accounts or sign out.
      </p>
    </div>
  );
}
