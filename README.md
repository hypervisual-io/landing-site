# CoDi Landing Site

Static, hand-crafted landing page for [`codi.dev`](https://codi.dev). Single page, no build step.

## Targeted release

This page describes CoDi at its **1.0 launch** state — the milestone the 2:30 north-star demo was made for. Specifically that means the page assumes:

- CLI is shipped and renders all 7 diagram types (Phase 1 ✓)
- `codi mcp` subcommand exposes CoDi to Cursor / Claude / Zed (ADR-016, Phase 1 / M4)
- VS Code / Cursor / JetBrains extensions are live (ADR-018, Phase 2 / M7 / Phase 3 / M10)
- Web app supports interactive editing, real-time collab, sharing (Phase 2 / M5–6)
- Image-to-diagram + branded themes work (Phase 3 / M9)
- Code-to-diagram with `source:` links works (Phase 2 / M6)
- Overlays + finding triage work (Phase 2 / M6 + Phase 3 / M8)
- Grafana metrics endpoint + thumbnails + deep links work (Phase 3 / M10)
- Pricing tiers Free / Pro ($12) / Team ($20) are in market

Phase 4 features (enterprise SSO, sovereignty controls, audit, FedRAMP, consulting practice tooling) are mentioned in a single "Coming next" panel — explicit so honest readers can see what's not yet there.

## What is *not* live in this version

The "Try in browser" CTA on the playground card and the "Star on GitHub" counter both link to placeholders (`#playground`, `https://github.com/codi-dev/codi`) that 404 today. They're wired up so the design doesn't need a second pass once those URLs are real.

The pricing tier "Get Started" buttons all link to `#pricing` for now; will redirect to the actual signup flow once the Stripe integration ships.

## Tech stack

- One `index.html`
- One `styles.css` for the bits Tailwind doesn't cover (gradient mesh, the animated terminal, the diagram-grid hover states)
- One `app.js` for the small interactions (theme toggle, terminal cycling, the FAQ accordion)
- **Tailwind via CDN** for fast iteration. Before public launch, swap to a built `tailwind.css` (Tailwind CLI: `npx tailwindcss -i ./styles.css -o ./dist/styles.css --minify`) so the page works offline and loads in <300 ms.

No framework. No build step. Deployable to Vercel / Netlify / Cloudflare Pages / GitHub Pages by dragging the folder.

## Local preview

```bash
cd landing_site
python3 -m http.server 8000
# open http://localhost:8000
```

Or any other static server (`npx serve .`, `caddy file-server`, etc.).

## Future cleanup before public launch

| Task | Why |
|---|---|
| Replace Tailwind CDN with a built CSS file | Performance + offline |
| Swap inline SVG illustrations for an `assets/` folder | Maintainability |
| Add Open Graph + Twitter Card meta tags with a real OG image | Social sharing |
| Wire pricing CTAs to the Stripe checkout once it exists | Conversion |
| Wire the "Try in browser" CTA to the actual WASM playground at `/playground` | The playground is built in Phase 2 / M7 |
| Add proper analytics (Plausible / PostHog / Fathom — opt-in) | Measure conversion funnel |
| Real `robots.txt` + `sitemap.xml` | SEO |
| Proper 404 page | Polish |
