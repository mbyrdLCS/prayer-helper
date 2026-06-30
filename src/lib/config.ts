/**
 * Branding is configurable so this public repo stays generic. Set these in your
 * environment (e.g. APP_NAME="Hopeful") — they are NOT hardcoded in the code.
 */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Prayer Helper";

/** The community/group name shown on cards and the footer. Hidden when empty. */
export const GROUP_NAME = process.env.NEXT_PUBLIC_GROUP_NAME || "";

export const APP_TAGLINE =
  process.env.NEXT_PUBLIC_APP_TAGLINE ||
  "A private space to pray for our kids — by name, every day.";

/** Contact email shown on the privacy/terms pages. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";

/** Facebook people-search link by name — to help admins confirm group membership. */
export function facebookSearchUrl(name: string): string {
  return `https://www.facebook.com/search/people/?q=${encodeURIComponent((name || "").trim())}`;
}
