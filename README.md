# hypervisual.io

Landing page for [HyperVisual](https://github.com/hypervisual-io/hypervisual). Plain HTML and CSS, no build step, no external requests.

## Deploy

GitHub Pages serves the repository root from `main`. `CNAME` sets the custom domain `hypervisual.io`, and `.nojekyll` turns off Jekyll processing.

## Files

- `index.html`, `styles.css`: the page. Light and dark themes follow `prefers-color-scheme`.
- `app.js`: optional copy buttons on code blocks.
- `favicon.svg`: site icon.
- `assets/checkout-sequence.hvis`: example shown on the page, copied from `skills/hypervis-sequence/references/examples/` in the product repo.
- `assets/checkout-sequence.svg`: its render. After changing the example, re-render it and update the source shown in `index.html`:

  ```bash
  hypervis render assets/checkout-sequence.hvis --format svg -o assets/checkout-sequence.svg
  ```

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
