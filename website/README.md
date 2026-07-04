# GateKeeper — Landing Page

A single-page marketing site for GateKeeper, matching the app's "Midnight Void"
theme (navy→black) with the Fire (orange) and Electric (purple) accents.

Pure static site — `index.html` + two images. No build step, no dependencies.

## Files
- `index.html` — the whole page (HTML + CSS + a few lines of JS, all inline)
- `logo.png`, `favicon.png` — copied from the app's assets

## Deploy to Vercel

**Option A — Vercel CLI (fastest)**
```bash
cd website
npx vercel          # preview deploy; follow the prompts
npx vercel --prod   # promote to production
```
When asked for settings, accept the defaults — there's no framework and no build
command (it's a static site, output is the current directory).

**Option B — GitHub import**
1. Push the repo to GitHub (already done).
2. In Vercel → *Add New… → Project* → import the `gateKeeper` repo.
3. Set **Root Directory** to `website`.
4. Framework preset: **Other**. Build command: *(none)*. Output directory: `./`.
5. Deploy.

Either way you'll get a `*.vercel.app` URL you can give Paystack — and you can add
a custom domain later in the Vercel dashboard.

## Before you submit to Paystack — quick edits
Open `index.html` and update:
- **Contact email** — search for `hello@gatekeeper.events` and set your real address.
- **Privacy / Terms links** — currently `#` placeholders. Paystack looks more
  favourably on a site that has at least a basic Privacy Policy and Terms page.
- **App Store / Google Play badges** — say "Coming soon"; swap for real store links
  once the app is published.
- **Business name / location** — the footer says "Cape Town, South Africa"; adjust
  if needed.

## Customising
Colours and theme live in the `:root { … }` block at the top of `index.html`
(`--fire-*`, `--electric-*`, `--bg`). Change them there and everything updates.
