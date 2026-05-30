# Campaign Converter

GM Campaign Asset Toolset — a set of HTML tools to build and validate GM email campaign data.

## Tools

| Tool | Route | Description |
|------|-------|-------------|
| Image Checker | `/checker` | Verify which vehicle image URLs return real images vs 2×2 pixels |
| JSON Generator | `/generator` | Generate email campaign JSON for all event codes |
| Trim Collection Creator | `/trim-collection` | Build trim/MMC combination objects |
| Interior Builder | `/interior` | Create interior code/text pair objects |

## Checker → Generator flow

After verifying images in the checker, a banner appears offering to send the valid pairs directly to the JSON Generator. Data is passed via `localStorage` — no backend needed.

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. No build settings needed — Vercel detects static HTML automatically
4. Click Deploy

## Local development

Open `index.html` directly in your browser. All tools work offline — no server required.
