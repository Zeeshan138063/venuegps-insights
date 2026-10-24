# VenueGPS · Venue Insights proposal

A static site with the proposal deck and two clickable dashboard demos.

| Path | What it is |
|---|---|
| `/` | Landing page with links to everything |
| `/deck` | The 18-slide presentation (arrow keys, swipe, `F` for full screen) |
| `/deck/VenueGPS-Insights.pdf` | PDF copy of the deck |
| `/demo` | Venue admin: Venue Insights for a sample venue |
| `/demo/admin` | VenueGPS admin: the internal team dashboard |

There is no build step on Vercel. The site is plain HTML, CSS and JavaScript. All dashboard numbers are generated sample data. Every page sends `noindex`, so search engines don't list it.

## Deploy on Vercel

1. Vercel → **Add New → Project** → import this GitHub repo.
2. Framework preset: **Other**. Leave the build command and output directory empty.
3. Deploy. Add a custom domain under **Settings → Domains** if you want one (for example `venuegps.zeeshare.com`).

## Editing the deck

Slides live in `src/slides/*.html` (one `<section>` per file, 1920 × 1080). The order is in `src/deck.json`.

```bash
python3 scripts/build_deck.py          # rebuilds deck/index.html
python3 -m http.server 8080 &          # serve locally
node scripts/export.mjs                # rebuilds deck/VenueGPS-Insights.pdf (needs Playwright)
```

Commit the rebuilt `deck/index.html` and PDF. Vercel serves them as they are.
