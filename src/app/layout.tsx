import type { Metadata } from "next";
import { Nunito_Sans, Dancing_Script, Poppins } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { PREVIEW_MODE } from "@/lib/preview";

const sans = Nunito_Sans({
  variable: "--font-sans-app",
  subsets: ["latin"],
});

const script = Dancing_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const display = Poppins({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const tree = (
    <html
      lang="en"
      className={`${sans.variable} ${script.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteNav />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 sm:py-10">
          {children}
        </main>
        <footer className="border-t border-border py-6 text-center text-sm text-muted flex flex-col gap-1">
          <p>
            <span className="script text-lg text-primary">{APP_NAME}</span> · a
            private prayer space · made with love
          </p>
          <p className="text-xs">
            <a href="/privacy" className="hover:text-primary">Privacy</a>
            {" · "}
            <a href="/terms" className="hover:text-primary">Terms</a>
          </p>
        </footer>
      </body>
    </html>
  );

  // In preview mode there are no Clerk keys, so skip the provider.
  return PREVIEW_MODE ? tree : <ClerkProvider>{tree}</ClerkProvider>;
}
