# hypervisual.io

Landing page for [HyperVisual](https://github.com/hypervisual-io/hypervisual). Plain HTML, CSS and JavaScript, no build step, no external requests.

## Deploy

GitHub Pages serves the repository root from `main`. `CNAME` sets the custom domain `hypervisual.io`, and `.nojekyll` turns off Jekyll processing.

## Files

- `index.html`, `styles.css`: the page. Light and dark themes follow `prefers-color-scheme`.
- `app.js`: optional copy buttons on code blocks.
- `editor.js`: the live editor in the example section. Edits redraw the diagram in the browser, syntax errors are underlined, and boxes can be dragged. Without JavaScript the section shows the example source and the pre-rendered SVG.
- `engine/`: the HyperVisual engine compiled to WebAssembly (`hvis_core.js`, `hvis_core_bg.wasm`), used by `editor.js`. Refresh it from the `cli` repo:

  ```bash
  cd ../cli && ./scripts/build-wasm.sh
  cp crates/hvis-core/pkg/hvis_core.js crates/hvis-core/pkg/hvis_core_bg.wasm ../landing-site/engine/
  ```

- `favicon.svg`: site icon.
- `assets/checkout-sequence.hvis`: example shown on the page, copied from `skills/hypervis-sequence/references/examples/` in the product repo.
- `assets/checkout-sequence.svg`: its render, shown until the live editor loads. After changing the example, re-render it and update the source in the editor's `<textarea>` in `index.html`:

  ```bash
  hypervis render assets/checkout-sequence.hvis --format svg -o assets/checkout-sequence.svg
  ```

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
