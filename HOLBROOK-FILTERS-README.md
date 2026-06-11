# Holbrook Left-Rail Filter System

Adds a left-side filter sidebar (matching your tire + wheel screenshots) to
every tire and wheel landing page and brand product page without hand-editing
250+ HTML files.

Inspired by tireagent.com. Honors the breadcrumb-consistency rule: the
currently selected Garage vehicle is pinned at the top of the sidebar with
thumbnail + Year/Make/Model so the shopper always sees what these products
are limited to fit.

## Quick Start

Four files land in your `holbrook-complete-deploy` folder:

```
holbrook-complete-deploy/
├── js/holbrook-filters-core.js      ← shared engine
├── js/tire-filters.js               ← tire sidebar config
├── js/wheel-filters.js              ← wheel sidebar config
├── scripts/install-filters.py       ← one-time injector
├── filters-smoke-test.html          ← open this to preview the UI
└── HOLBROOK-FILTERS-README.md       ← you are here
```

### Step 1 — preview the UI

Open `filters-smoke-test.html` in your browser. Switch the page dropdown
between `/tires/…` and `/wheels/…` to see both sidebars. Click "Set Test
Vehicle" to see the Garage fitment card at the top of the sidebar.

### Step 2 — install the filters on every tire + wheel page

From your terminal, run:

```bash
# Preview first (no files modified):
python3 scripts/install-filters.py --root . --dry-run

# When the dry-run looks right, install for real:
python3 scripts/install-filters.py --root .
```

The script processes every `.html` file under `tires/` and `wheels/` and
inserts two `<script>` tags before the closing `</body>`. It's idempotent
(safe to re-run) and you can undo any time with `--uninstall`.

### Step 3 — (optional) wire up the AutoSync API

The sidebar already works immediately by reading facet values off the product
cards on the page. When you're ready to drive the options dynamically from
AutoSync, expose one of these methods on `window.AutoSyncAPI`:

```js
window.AutoSyncAPI.getTireFacets(vehicleId);   // returns { sizes, brands, categories, seasons, mileageTiers, ... }
window.AutoSyncAPI.getWheelFacets(vehicleId);  // returns { rimSizes, brands, finishes, ... }
// or a generic:
window.AutoSyncAPI.getFilters('tires', vehicleId);
```

No changes to the filter components are needed — they auto-detect which
method exists and call it with the vehicle id from the Garage.

---

## File-by-file

| File | Purpose |
|---|---|
| **js/holbrook-filters-core.js** | The engine. Discovers the product grid, injects a 2-column layout, renders the accordion sidebar, tracks selection state in the URL, calls AutoSync for facets, filters the product DOM client-side, reacts to vehicle changes from the Garage, and fires a `holbrook:filtersChanged` event. |
| **js/tire-filters.js** | Config for tire pages: `Tire Size`, `Tire Brand`, `Category`, `Tire Style`, `Season`, `Mileage Warranty`. Auto-activates only when `location.pathname` contains `/tires/`. |
| **js/wheel-filters.js** | Config for wheel pages: `Rim Size`, `Sort By`, `Price Range`, `Deals` (featured), `Brand`, `Finish` (with color swatches), `Offset`, `Width`. Auto-activates only on `/wheels/` paths. |
| **scripts/install-filters.py** | One-time script that adds the two `<script>` tags to every tire + wheel HTML. Idempotent, supports `--dry-run`, `--uninstall`, and `--only tires`/`--only wheels`. Has retry logic to tolerate flaky network mounts. |
| **filters-smoke-test.html** | Self-contained preview of both sidebars against fake products. Open it directly in a browser — no server required. |

---

## Install script usage

```
python3 scripts/install-filters.py --root <path-to-holbrook-complete-deploy>
                                  [--dry-run]
                                  [--uninstall]
                                  [--only tires|wheels|both]
```

The injected block is marked with HTML comments so it's always findable:

```html
<!-- holbrook-filters: installed -->
<script src="/js/holbrook-filters-core.js" defer></script>
<script src="/js/tire-filters.js" defer></script>
<!-- /holbrook-filters -->
```

Re-running `install-filters.py` is a no-op on files that already have the
marker. `--uninstall` strips the marked block out.

### Manual fallback

If you'd rather not run the script, you can paste those four lines by hand
immediately before `</body>` in:

- `tires/brand.html` + every `tires/{brand}/index.html` (use `tire-filters.js`)
- `wheels/brand.html` + every `wheels/{brand}/index.html` (use `wheel-filters.js`)

---

## How it finds your product grid

The component tries these selectors in order, then falls back to the biggest
CSS grid inside `<main>`:

1. `[data-product-grid]`
2. `#productGrid`
3. `#products`
4. `.product-grid`
5. `main .grid`
6. `main [data-products]`

**Best practice:** add `data-product-grid` to the grid container on each
brand page. If you also tag each product card with the relevant
`data-*` attributes, client-side filtering and sorting work instantly
(even before the AutoSync API is wired up):

```html
<section class="grid grid-cols-1 md:grid-cols-3 gap-6" data-product-grid>
  <article data-product
           data-brand="michelin"
           data-size="225/45R17"
           data-category="Passenger"
           data-season="All-Season"
           data-mileage="60000"
           data-price="189.99"
           data-rating="4.7"
           data-popularity="92">
    ...
  </article>
</section>
```

For wheels, the cards should use: `data-brand`, `data-rim-size`,
`data-finish`, `data-offset`, `data-width`, `data-price`, and optionally
`data-deals="deal"` when the item is on sale.

---

## Garage integration

The sidebar reads the selected vehicle from `localStorage['holbrook.selectedVehicle']`
(falling back to the first vehicle in `localStorage['holbrook.garage']`).
It shows a thumbnail, Year/Make/Model, trim, and a "Change Vehicle" link
that points to `/vehicles/` — reinforcing the breadcrumb consistency rule
that everything on screen is limited to this specific fitment.

When the user picks a different vehicle in the Garage dropdown, fire:

```js
document.dispatchEvent(new CustomEvent('holbrook:vehicleChanged', {
  detail: { id, year, make, model, trim, submodel, thumbnail }
}));
```

The sidebar re-renders immediately with the new vehicle badge and re-fetches
facets from AutoSync if configured.

---

## Responding to filter changes

Any other script can listen for filter selections:

```js
document.addEventListener('holbrook:filtersChanged', (e) => {
  console.log(e.detail);
  // { category: 'tires'|'wheels', active: { size: [...], brand: [...] }, sort, resultCount }
});
```

Useful for analytics, abandoned-cart recovery signals, or server-side filter
hand-offs as the site grows.

---

## Styling

The components use the existing Holbrook Tailwind palette defined in your
`index.html` (primary `#850824`, `surface-container-lowest`, `outline-variant`,
etc.) plus Material Symbols icons. No new CSS file is required.

The sidebar is `lg:sticky top-28 w-72` on desktop and stacks above the
results on mobile.
