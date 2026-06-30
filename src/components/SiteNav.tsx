import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { getDbUser, hasAccess } from "@/lib/auth";
import { APP_NAME } from "@/lib/config";
import { PREVIEW_MODE } from "@/lib/preview";

export default async function SiteNav() {
  const userId = PREVIEW_MODE ? "preview-admin" : (await auth()).userId;
  const signedIn = !!userId;
  const me = signedIn ? await getDbUser() : null;
  const isAdmin = !!me?.isAdmin;
  const access = hasAccess(me);

  const links: { href: string; label: string }[] = [
    { href: "/today", label: "Today" },
    { href: "/kids", label: "Our Kids" },
    { href: "/parents", label: "Parents" },
    { href: "/redeemed", label: "Redeemed" },
    { href: "/cards", label: "Daily Cards" },
  ];

  return (
    <header className="border-b border-border bg-surface/70 backdrop-blur sticky top-0 z-20">
      <nav className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/today" className="flex items-baseline gap-2 shrink-0">
          <span className="script text-3xl text-primary leading-none">{APP_NAME}</span>
        </Link>

        {signedIn ? (
          <>
            {access && (
            <div className="hidden sm:flex items-center gap-1 text-sm">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-3 py-2 rounded-lg text-foreground/80 hover:bg-background hover:text-primary transition"
                >
                  {l.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-3 py-2 rounded-lg text-primary font-semibold hover:bg-background transition"
                >
                  Admin
                </Link>
              )}
            </div>
            )}
            {PREVIEW_MODE ? (
              <span className="text-xs rounded-full bg-amber-100 text-amber-700 px-3 py-1 font-semibold">
                Preview
              </span>
            ) : (
              <UserButton />
            )}
          </>
        ) : (
          <Link
            href="/sign-in"
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition"
          >
            Sign in
          </Link>
        )}
      </nav>

      {/* Mobile nav */}
      {signedIn && access && (
        <div className="sm:hidden border-t border-border overflow-x-auto">
          <div className="flex items-center gap-1 px-2 py-1 text-sm whitespace-nowrap">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-2 rounded-lg text-foreground/80 hover:bg-background"
              >
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" className="px-3 py-2 rounded-lg text-primary font-semibold">
                Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
