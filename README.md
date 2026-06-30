# Hopeful 🙏

A private, login-gated prayer web app for a support group of parents. Every day the
app features a rotating handful of kids **by first name**, lets members tap **"I
Prayed"** and leave encouragement, auto-generates a downloadable **"Hopeful" card**
(day / week / month) to share, and keeps a directory of kids that parents can
**claim** (with admin approval) to add a photo, prayer requests, and — when prayers
are answered — a place on the **Redeemed** wall.

Built to be **self-hostable**: anyone can clone this and spin up their own private
prayer space. **No real names or secrets are in this repo** — you add your own at
runtime through the admin dashboard.

## Stack

- **Next.js (App Router)** — UI, server actions, image generation, cron
- **Neon** — free serverless Postgres
- **Drizzle ORM** — schema + migrations
- **Clerk** — auth (email + Facebook login), sessions, roles
- **Vercel Blob** — profile photo storage
- **Vercel** — hosting + cron

All four services have free tiers that comfortably cover a group of a few hundred.

## Quick start (local)

```bash
git clone <your-fork-url> hopeful && cd hopeful
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run db:push              # create the tables in your Neon database
npm run dev                  # http://localhost:3000
```

### Environment variables

See `.env.example`. You need:

| Variable | Where to get it |
| --- | --- |
| `DATABASE_URL` | [neon.tech](https://neon.tech) → create project → pooled connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | [clerk.com](https://clerk.com) → create app → API keys |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob (auto-added when you connect the integration) |
| `ADMIN_EMAILS` | Comma-separated emails that become admins on first login (set this to **your** email) |
| `APP_TIMEZONE` | e.g. `America/New_York` — decides when "today" rolls over |
| `DAILY_COUNT` | how many kids featured per day (default 7) |
| `CRON_SECRET` | long random string; protects the daily generation endpoint |

### Enable Facebook login (optional)

In the Clerk dashboard → **User & Authentication → Social Connections → Facebook**,
add your Facebook app's ID/secret. Email/password works out of the box without this.

## Deploy (Vercel)

1. Push your fork to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the **Neon**, **Clerk**, and **Blob** integrations (they inject most env vars),
   then add `ADMIN_EMAILS`, `APP_TIMEZONE`, `DAILY_COUNT`, and `CRON_SECRET`.
4. Deploy. Run the migration once with `npm run db:push` (locally, against the prod
   `DATABASE_URL`) or via Neon's SQL editor using `drizzle/0000_*.sql`.
5. The daily card generator runs automatically (`vercel.json` cron, 10:00 UTC).

## First-run setup

1. Sign in with the email you put in `ADMIN_EMAILS` → you're an admin.
2. Go to **Admin → Add kids** and paste your list of first names (one per line).
3. Add other admins by email (they must sign in once first).
4. Share the site with your group. Members sign in, pray, and can request to claim
   their own child.

## How the rotation works

Kids are ordered (`sortOrder`). Each day the app takes the next `DAILY_COUNT` kids,
wrapping around so **everyone gets prayed for**, then repeats. Selections are stored
per day so cards are stable and reproducible. New kids join the end of the cycle.

## Privacy & safety

This app handles sensitive data (kids' names in a private group). It's designed so:

- Everything is **behind login**; first-name-only by default.
- **No real names live in the code** — admins enter them at runtime.
- All data access is **server-side**; every mutating action re-checks role/ownership.
- Admins can **edit or remove** any profile, photo, or comment.

See `SECURITY.md` for the full checklist.

## License

MIT — see `LICENSE`.
