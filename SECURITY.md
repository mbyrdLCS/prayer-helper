# Security & Safety Checklist

This app handles **sensitive data about children in a private group**, and the code
is **public**. This checklist is what we hold the project to. Re-check it before every
launch. (✅ = handled in this codebase, ⬜ = your responsibility when you deploy.)

## The classic 6 (common AI-built-app failures)

1. **Secrets committed to the repo** — ✅ `.env*` is gitignored; only `.env.example`
   (placeholders) is committed. Real keys go in your host's env settings. *If a secret
   ever lands in git history, rotate it immediately.*
2. **Broad/missing data-access rules** — ✅ No public data API. **All** DB access is
   server-side; the browser never holds a DB connection. Every read/write goes through
   server components or server actions.
3. **No rate limiting** — ⬜ Enable Vercel **Firewall/BotID** rate-limit rules,
   especially on `/api/cards/zip`, `/api/card/*` (image generation), and the
   comment/claim/upload actions. Auth brute-force is rate-limited by Clerk.
4. **No error handling past the happy path** — ✅ Input is validated/clamped; uploads
   are size-checked. ⬜ Add user-visible failure states for blob/email/AI calls as you
   extend it.
5. **N+1 / inefficient queries** — ✅ Queries use JOINs and indexed columns
   (`sortOrder`, `day`, `kidId`, `redeemed`). ⬜ Load-test before a big launch.
6. **No authorization beyond login** — ✅ Every mutating action re-checks **role or
   ownership** on the server (`requireAdmin()`, `canManageKid()`), never trusting an ID
   from the request. Treat every server action as a public endpoint.

## Extra items that matter for THIS app

7. **No real personal data in the public repo** — ✅ Seed code ships only obvious
   example names. Real names are entered at runtime via the admin dashboard. The
   community/brand name is an env var, not hardcoded. Keep it that way.
8. **Restrict who can sign up** — ⬜ **Important:** by default Clerk allows open
   sign-ups, which would let strangers in to view kids' names. Lock it down: in Clerk,
   use **invitation-only** or an **allowlist** (or add a manual-approval step) so only
   real group members get access.
9. **Minors & first-name-only** — ✅ Profiles are first-name-only by default; the whole
   site is behind login. ⬜ Get parents' consent before adding a photo or details; honor
   removal requests (admins can delete any profile/photo/comment).
10. **File uploads** — ✅ Limited to 8MB and image inputs. ⬜ Consider stripping EXIF
    and validating real image content; blob URLs are public-but-unguessable.
11. **Dependency vulnerabilities** — ⬜ Run `npm audit` and enable Dependabot.
12. **Secret scanning** — ⬜ Add `gitleaks` (or GitHub secret scanning) so a key can't
    be pushed by accident.
13. **Backups** — ⬜ Neon keeps point-in-time history on paid tiers; on free, take
    periodic SQL dumps if the data matters.
14. **Moderation** — ✅ Admins can hide/delete any comment, photo, or profile, and
    approve/deny claims and "Redeemed" status.
15. **HTTPS & secure sessions** — ✅ Handled by Vercel + Clerk (secure, httpOnly cookies).

## Reporting

Found a vulnerability? Open a private security advisory on the repo or contact the
maintainer directly — please don't file a public issue with exploit details.
