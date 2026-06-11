/*!
 * Holbrook Filters Core
 * --------------------
 * Shared engine for left-side filter sidebars across tire and wheel pages.
 *
 * Responsibilities:
 *   1. Discover the product grid on any tire/wheel landing or brand page.
 *   2. Inject a left-rail filter sidebar (accordion style) into a two-column layout.
 *   3. Show the currently selected vehicle (from the Garage) as a breadcrumb card
 *      at the top of the sidebar, reinforcing that products are filtered to fit it.
 *   4. Fetch available filter facets from the AutoSync API (falling back to the
 *      values already present in the product cards on the page).
 *   5. Apply filters client-side against the product-grid DOM, honoring URL state.
 *   6. Dispatch a `holbrook:filtersChanged` CustomEvent when selections change so
 *      other scripts can respond (analytics, product cards, etc.).
 *
 * Designed to be consumed by js/tire-filters.js and js/wheel-filters.js which
 * supply a category-specific configuration object.
 *
 * Dependencies: Tailwind (already loaded site-wide via CDN) and Material Symbols.
 * No module system required - exposed on window as `HolbrookFilters`.
 */
(function (global) {
  'use strict';

  // ------------------------------------------------------------------
  // Utility helpers
  // ------------------------------------------------------------------
  const SELECTED_VEHICLE_KEY = 'holbrook.selectedVehicle';
  const GARAGE_KEY = 'holbrook.garage';

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'dataset') Object.assign(node.dataset, attrs[k]);
        else if (k.startsWith('on') && typeof attrs[k] === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (attrs[k] != null) {
          node.setAttribute(k, attrs[k]);
        }
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach((c) => {
        if (c == null) return;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  function readSelectedVehicle() {
    try {
      const raw = localStorage.getItem(SELECTED_VEHICLE_KEY);
      if (raw) return JSON.parse(raw);
      // fall back to the first vehicle in the garage
      const garage = JSON.parse(localStorage.getItem(GARAGE_KEY) || '[]');
      return garage[0] || null;
    } catch (e) {
      return null;
    }
  }

  function getUrlParams() {
    const params = new URLSearchParams(location.search);
    const out = {};
    params.forEach((value, key) => {
      const existing = out[key];
      if (existing) {
        out[key] = Array.isArray(existing) ? existing.concat(value) : [existing, value];
      } else {
        out[key] = value;
      }
    });
    return out;
  }

  function writeUrlParams(state) {
    const params = new URLSearchParams();
    Object.keys(state).forEach((key) => {
      const vals = state[key];
      if (!vals || vals.length === 0) return;
      (Array.isArray(vals) ? vals : [vals]).forEach((v) => params.append(key, v));
    });
    const qs = params.toString();
    const newUrl = location.pathname + (qs ? '?' + qs : '') + location.hash;
    history.replaceState(null, '', newUrl);
  }

  // ------------------------------------------------------------------
  // Product grid discovery
  // Tries a list of common selectors used on Holbrook pages.
  // If nothing matches, falls back to the first <main> grandchild with >= 2
  // elements that look like product cards.
  // ------------------------------------------------------------------
  function findProductGrid() {
    const candidates = [
      '[data-product-grid]',
      '#productGrid',
      '#products',
      '.product-grid',
      'main .grid',
      'main [data-products]'
    ];
    for (const sel of candidates) {
      const found = document.querySelector(sel);
      if (found && found.children.length >= 1) return found;
    }
    // heuristic: biggest grid inside main
    const main = document.querySelector('main');
    if (!main) return null;
    let best = null;
    main.querySelectorAll('.grid, [class*="grid-cols"]').forEach((g) => {
      if (!best || g.children.length > best.children.length) best = g;
    });
    return best;
  }

  // ------------------------------------------------------------------
  // Native sidebar detection
  //
  // The Holbrook site ships brand.html / model.html pages with their own
  // left-rail filter UI (Rim Diameter, Speed Rating, Featured Filters,
  // Finish, Bolt Pattern, etc). We want OUR sidebar to be the single
  // visible filter rail, so when we detect one of these native sidebars
  // we take it over instead of injecting a second column next to it.
  //
  // Indicators are IDs known to appear inside the native <aside>. We walk
  // up from the first match to find the <aside> ancestor.
  // ------------------------------------------------------------------
  const NATIVE_SIDEBAR_INDICATORS = [
    '#featuredFilters',
    '#filterRimDiameter',
    '#filterSpeedRating',
    '#filterLoadIndex',
    '#filterSidewall',
    '#filterRunFlat',
    '#filterSnowRated',
    '#filterCategory',
    '#filterWarranty',
    '#widthFilter',
    '#finishFilter',
    '#boltPatternFilter',
    '#resetAllFilters',
    '#resetFilters'
  ];

  function findNativeSidebar() {
    for (const sel of NATIVE_SIDEBAR_INDICATORS) {
      const found = document.querySelector(sel);
      if (!found) continue;
      const aside = found.closest('aside');
      if (aside) return aside;
    }
    return null;
  }

  // Hide the native sidebar contents but leave them in the DOM so the
  // native page script can still populate elements by id without errors.
  function absorbNativeSidebar(native) {
    if (!native) return null;
    // Only absorb once - check for our hidden wrapper as the sentinel.
    if (!native.querySelector(':scope > .holbrook-native-filters-hidden')) {
      const hidden = document.createElement('div');
      hidden.className = 'holbrook-native-filters-hidden';
      hidden.style.display = 'none';
      hidden.setAttribute('aria-hidden', 'true');
      while (native.firstChild) hidden.appendChild(native.firstChild);
      native.appendChild(hidden);
    }
    native.id = 'holbrookFiltersSidebar';
    native.classList.add('holbrook-filters-sidebar');
    native.setAttribute('aria-label', 'Product filters');
    return native;
  }

  // ------------------------------------------------------------------
  // Layout injection
  // Wraps the discovered product grid in a two-column flex layout and
  // returns the sidebar container the filter UI should render into.
  // Only used when no native sidebar exists to absorb.
  // ------------------------------------------------------------------
  function injectSidebarLayout(productGrid) {
    // Already injected? Re-use.
    const existing = document.getElementById('holbrookFiltersSidebar');
    if (existing) return existing;

    const parent = productGrid.parentElement;
    if (!parent) return null;

    const wrapper = el('div', {
      class: 'holbrook-filters-shell flex flex-col lg:flex-row gap-8 items-start w-full'
    });

    const sidebar = el('aside', {
      id: 'holbrookFiltersSidebar',
      class: 'holbrook-filters-sidebar w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-28 self-start',
      role: 'complementary',
      'aria-label': 'Product filters'
    });

    const gridWrap = el('div', {
      class: 'holbrook-filters-results flex-1 min-w-0 w-full'
    });

    // Rebuild DOM: wrapper replaces grid, grid goes into gridWrap.
    parent.insertBefore(wrapper, productGrid);
    gridWrap.appendChild(productGrid);
    wrapper.appendChild(sidebar);
    wrapper.appendChild(gridWrap);

    return sidebar;
  }

  // ------------------------------------------------------------------
  // Facet inference from the rendered product cards (fallback)
  // Expects product cards to have data-* attributes, e.g.:
  //   <article data-product data-brand="michelin" data-size="225/45R17">
  // ------------------------------------------------------------------
  function inferFacetsFromGrid(grid, facetKeys) {
    const out = {};
    facetKeys.forEach((k) => (out[k] = new Set()));
    grid.querySelectorAll('[data-product]').forEach((card) => {
      facetKeys.forEach((k) => {
        const v = card.dataset[k];
        if (v) {
          v.split('|').forEach((vv) => out[k].add(vv.trim()));
        }
      });
    });
    const result = {};
    Object.keys(out).forEach((k) => {
      result[k] = Array.from(out[k]).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    });
    return result;
  }

  // ------------------------------------------------------------------
  // Sidebar renderers
  // ------------------------------------------------------------------
  function renderVehicleCard(vehicle) {
    if (!vehicle) {
      return el('a', {
        href: '/vehicles/',
        class: 'holbrook-vehicle-card block rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 hover:border-primary/40 transition-colors'
      }, [
        el('div', { class: 'flex items-center gap-3' }, [
          el('span', { class: 'material-symbols-outlined text-primary text-2xl' }, 'directions_car'),
          el('div', {}, [
            el('div', { class: 'font-bold text-sm text-on-surface' }, 'Select Your Vehicle'),
            el('div', { class: 'text-xs text-on-surface-variant mt-0.5' }, 'See parts that fit your ride')
          ])
        ])
      ]);
    }
    const title = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');
    const sub = [vehicle.trim, vehicle.submodel].filter(Boolean).join(' · ');
    return el('div', { class: 'holbrook-vehicle-card rounded-xl border border-primary/30 bg-primary/5 p-3' }, [
      el('div', { class: 'flex items-start gap-3' }, [
        vehicle.thumbnail
          ? el('img', { src: vehicle.thumbnail, alt: title, class: 'w-16 h-12 object-cover rounded-md bg-surface-container-low flex-shrink-0' })
          : el('div', { class: 'w-16 h-12 rounded-md bg-surface-container-low flex items-center justify-center flex-shrink-0' }, [
              el('span', { class: 'material-symbols-outlined text-on-surface-variant text-xl' }, 'directions_car')
            ]),
        el('div', { class: 'min-w-0 flex-1' }, [
          el('div', { class: 'text-[10px] font-bold tracking-widest uppercase text-primary' }, 'Showing Fits'),
          el('div', { class: 'font-bold text-sm text-on-surface truncate' }, title || 'Selected Vehicle'),
          sub ? el('div', { class: 'text-xs text-on-surface-variant truncate' }, sub) : null,
          el('a', {
            href: '/vehicles/',
            class: 'text-[10px] font-bold tracking-wider uppercase text-primary hover:text-primary-container mt-1 inline-flex items-center gap-0.5'
          }, [
            'Change Vehicle',
            el('span', { class: 'material-symbols-outlined text-xs' }, 'chevron_right')
          ])
        ])
      ])
    ]);
  }

  function renderAccordionGroup(group, state, onToggle, onChange) {
    const expanded = !!state.expanded[group.id];
    const selected = state.active[group.id] || [];

    const header = el('button', {
      type: 'button',
      class: 'holbrook-filter-header w-full flex items-center justify-between py-4 text-left',
      'aria-expanded': expanded ? 'true' : 'false',
      onclick: () => onToggle(group.id)
    }, [
      el('span', { class: 'flex items-center gap-2' }, [
        group.icon ? el('span', { class: 'material-symbols-outlined text-on-surface-variant text-[20px]' }, group.icon) : null,
        el('span', { class: 'font-bold text-sm text-on-surface tracking-wide' }, group.label),
        selected.length > 0
          ? el('span', {
              class: 'ml-1 bg-primary text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center'
            }, String(selected.length))
          : null
      ]),
      el('span', {
        class: 'material-symbols-outlined text-on-surface-variant transition-transform duration-200 ' + (expanded ? 'rotate-180' : '')
      }, 'keyboard_arrow_down')
    ]);

    const body = el('div', {
      class: 'holbrook-filter-body pb-4 space-y-2 ' + (expanded ? '' : 'hidden')
    });

    if (group.type === 'range') {
      // price range, offset, etc.
      const [lo, hi] = selected.length === 2 ? selected : (group.defaultRange || ['', '']);
      body.appendChild(el('div', { class: 'flex items-center gap-2' }, [
        el('input', {
          type: 'number',
          placeholder: 'Min',
          value: lo,
          class: 'w-full bg-surface-container-low rounded-md px-3 py-2 text-sm border-none focus:ring-2 focus:ring-primary/30',
          oninput: (e) => onChange(group.id, [e.target.value, hi])
        }),
        el('span', { class: 'text-on-surface-variant text-xs' }, 'to'),
        el('input', {
          type: 'number',
          placeholder: 'Max',
          value: hi,
          class: 'w-full bg-surface-container-low rounded-md px-3 py-2 text-sm border-none focus:ring-2 focus:ring-primary/30',
          oninput: (e) => onChange(group.id, [lo, e.target.value])
        })
      ]));
    } else if (group.type === 'select') {
      const selectEl = el('select', {
        class: 'w-full bg-surface-container-lowest border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary',
        onchange: (e) => onChange(group.id, e.target.value ? [e.target.value] : [])
      }, [
        el('option', { value: '' }, group.placeholder || 'Any')
      ]);
      (group.options || []).forEach((opt) => {
        const o = el('option', { value: opt.value || opt }, opt.label || opt);
        if (selected[0] === (opt.value || opt)) o.selected = true;
        selectEl.appendChild(o);
      });
      body.appendChild(selectEl);
    } else {
      // default: checkbox list
      const options = group.options || [];
      if (options.length === 0) {
        body.appendChild(el('p', { class: 'text-xs text-on-surface-variant italic' }, 'No options available'));
      }
      options.forEach((opt) => {
        const value = opt.value || opt;
        const label = opt.label || opt;
        const count = opt.count;
        const checked = selected.indexOf(value) !== -1;
        const row = el('label', {
          class: 'flex items-center gap-2 cursor-pointer hover:bg-surface-container-low rounded-md px-2 py-1.5 -mx-2'
        }, [
          el('input', {
            type: 'checkbox',
            class: 'w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30',
            checked: checked ? 'checked' : null,
            onchange: (e) => {
              const next = e.target.checked
                ? selected.concat([value])
                : selected.filter((v) => v !== value);
              onChange(group.id, next);
            }
          }),
          opt.swatch ? el('span', {
            class: 'w-4 h-4 rounded-full border border-outline-variant/40 flex-shrink-0',
            style: 'background:' + opt.swatch
          }) : null,
          opt.badge ? el('span', {}, opt.badge) : null,
          el('span', { class: 'text-sm text-on-surface flex-1 truncate' }, label),
          count != null ? el('span', { class: 'text-xs text-on-surface-variant' }, '(' + count + ')') : null
        ]);
        body.appendChild(row);
      });
    }

    const wrap = el('div', { class: 'holbrook-filter-group border-b border-outline-variant/30 last:border-b-0' });
    wrap.appendChild(header);
    wrap.appendChild(body);
    return wrap;
  }

  function renderSidebar(sidebar, config, state, handlers) {
    // Preserve the hidden native-filters wrapper (if present) across
    // re-renders so native page scripts can still query their own DOM.
    const preserved = sidebar.querySelector(':scope > .holbrook-native-filters-hidden');
    sidebar.innerHTML = '';
    if (preserved) sidebar.appendChild(preserved);

    // Header
    const titleRow = el('div', { class: 'flex items-center justify-between mb-3' }, [
      el('h2', { class: 'flex items-center gap-2 font-bold text-base text-on-surface' }, [
        el('span', { class: 'material-symbols-outlined text-primary' }, 'tune'),
        'Filter & Sort'
      ]),
      Object.keys(state.active).some((k) => (state.active[k] || []).length)
        ? el('button', {
            type: 'button',
            class: 'text-[10px] font-bold tracking-wider uppercase text-primary hover:text-primary-container',
            onclick: handlers.clearAll
          }, 'Clear All')
        : null
    ]);

    // Vehicle card (always at top - breadcrumb consistency)
    const vehicleBlock = renderVehicleCard(state.vehicle);

    // Sort selector
    const sortBlock = el('div', { class: 'mb-4' }, [
      el('label', { class: 'block font-bold text-sm text-on-surface mb-2' }, 'Sort By'),
      (function () {
        const sel = el('select', {
          class: 'w-full bg-surface-container-lowest border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/30',
          onchange: (e) => handlers.setSort(e.target.value)
        }, (config.sortOptions || [
          { value: 'price_asc', label: 'Price: Low to High' },
          { value: 'price_desc', label: 'Price: High to Low' },
          { value: 'popular', label: 'Most Popular' },
          { value: 'rating', label: 'Top Rated' }
        ]).map((o) => el('option', { value: o.value }, o.label)));
        sel.value = state.sort || (config.sortOptions && config.sortOptions[0] && config.sortOptions[0].value) || 'price_asc';
        return sel;
      })()
    ]);

    const card = el('div', {
      class: 'bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 space-y-3'
    }, [titleRow, vehicleBlock, sortBlock]);

    const groupsWrap = el('div', {});
    (config.groups || []).forEach((group) => {
      // merge in resolved facet options (from API or grid inference)
      const resolvedGroup = Object.assign({}, group, {
        options: (state.facets[group.id] || group.options || []).map((v) => {
          if (typeof v === 'string' || typeof v === 'number') return { value: String(v), label: String(v) };
          return v;
        })
      });
      groupsWrap.appendChild(
        renderAccordionGroup(resolvedGroup, state, handlers.toggleGroup, handlers.setSelection)
      );
    });
    card.appendChild(groupsWrap);

    // Result count footer
    if (state.resultCount != null) {
      card.appendChild(el('div', {
        class: 'pt-3 mt-2 border-t border-outline-variant/30 text-xs font-bold tracking-wider uppercase text-on-surface-variant text-center'
      }, state.resultCount + ' ' + (state.resultCount === 1 ? 'Result' : 'Results')));
    }

    sidebar.appendChild(card);
  }

  // ------------------------------------------------------------------
  // Filter predicates (client-side)
  // Each group is matched against a product card's data-* attributes.
  // For range groups, card value is parsed as Number and tested against min/max.
  // ------------------------------------------------------------------
  function cardMatchesFilters(card, state, groups) {
    for (const g of groups) {
      const sel = state.active[g.id];
      if (!sel || sel.length === 0) continue;
      const cardVal = card.dataset[g.dataKey || g.id];
      if (cardVal == null) {
        // If the card doesn't advertise this facet, treat as non-match for
        // checkbox filters so we don't show irrelevant products.
        if (g.type !== 'range' && g.strict !== false) return false;
        continue;
      }
      if (g.type === 'range') {
        const n = parseFloat(cardVal);
        if (sel[0] !== '' && !isNaN(parseFloat(sel[0])) && n < parseFloat(sel[0])) return false;
        if (sel[1] !== '' && !isNaN(parseFloat(sel[1])) && n > parseFloat(sel[1])) return false;
      } else {
        const cardVals = cardVal.split('|').map((v) => v.trim().toLowerCase());
        const wantVals = sel.map((v) => String(v).trim().toLowerCase());
        const hit = wantVals.some((w) => cardVals.indexOf(w) !== -1);
        if (!hit) return false;
      }
    }
    return true;
  }

  function applyFiltersToGrid(grid, state, groups) {
    let visible = 0;
    grid.querySelectorAll('[data-product]').forEach((card) => {
      const ok = cardMatchesFilters(card, state, groups);
      card.style.display = ok ? '' : 'none';
      if (ok) visible += 1;
    });
    return visible;
  }

  function sortGrid(grid, sort) {
    if (!sort) return;
    const cards = Array.from(grid.querySelectorAll('[data-product]'));
    const cmp = (() => {
      switch (sort) {
        case 'price_asc':
          return (a, b) => parseFloat(a.dataset.price || 0) - parseFloat(b.dataset.price || 0);
        case 'price_desc':
          return (a, b) => parseFloat(b.dataset.price || 0) - parseFloat(a.dataset.price || 0);
        case 'rating':
          return (a, b) => parseFloat(b.dataset.rating || 0) - parseFloat(a.dataset.rating || 0);
        case 'popular':
          return (a, b) => parseFloat(b.dataset.popularity || 0) - parseFloat(a.dataset.popularity || 0);
        default:
          return null;
      }
    })();
    if (!cmp) return;
    cards.sort(cmp).forEach((c) => grid.appendChild(c));
  }

  // ------------------------------------------------------------------
  // AutoSync API client
  // Uses window.AutoSyncAPI if present, otherwise falls back to HolbrookAPI,
  // otherwise skips (grid-inferred facets will be used).
  // ------------------------------------------------------------------
  function apiClient() {
    const api = global.AutoSyncAPI || global.HolbrookAPI || null;
    if (!api) return null;
    return {
      async getTireFacets(vehicleId) {
        if (typeof api.getTireFacets === 'function') return api.getTireFacets(vehicleId);
        if (typeof api.getFilters === 'function') return api.getFilters('tires', vehicleId);
        return null;
      },
      async getWheelFacets(vehicleId) {
        if (typeof api.getWheelFacets === 'function') return api.getWheelFacets(vehicleId);
        if (typeof api.getFilters === 'function') return api.getFilters('wheels', vehicleId);
        return null;
      }
    };
  }

  // ------------------------------------------------------------------
  // Main mount function
  // ------------------------------------------------------------------
  async function mount(config) {
    const grid = findProductGrid();
    if (!grid) {
      console.warn('[HolbrookFilters] Could not locate a product grid; filters not rendered.');
      return null;
    }

    // Prefer absorbing a pre-existing native filter <aside> so we keep
    // the page's 4-column layout intact. Fall back to wrapping the
    // product grid in our own two-col layout when no native sidebar
    // exists (e.g. on /tires/{brand}/index.html landing pages).
    let sidebar = absorbNativeSidebar(findNativeSidebar());
    if (!sidebar) sidebar = injectSidebarLayout(grid);
    if (!sidebar) return null;

    const state = {
      active: {},
      expanded: {},
      facets: {},
      sort: null,
      vehicle: readSelectedVehicle(),
      resultCount: null
    };

    // Seed state from URL
    const urlState = getUrlParams();
    (config.groups || []).forEach((g) => {
      if (urlState[g.id] != null) {
        state.active[g.id] = Array.isArray(urlState[g.id]) ? urlState[g.id] : [urlState[g.id]];
      }
    });
    if (urlState.sort) state.sort = urlState.sort;

    // Resolve facets: try API, fall back to inferred grid values
    try {
      const client = apiClient();
      if (client && typeof config.fetchFacets === 'function') {
        const facets = await config.fetchFacets(client, state.vehicle);
        if (facets) state.facets = Object.assign({}, state.facets, facets);
      }
    } catch (e) {
      console.warn('[HolbrookFilters] Facet API call failed, falling back to grid inference:', e);
    }
    // Fill any gaps from the grid
    const facetKeys = (config.groups || []).filter((g) => g.type !== 'range').map((g) => g.dataKey || g.id);
    const inferred = inferFacetsFromGrid(grid, facetKeys);
    (config.groups || []).forEach((g) => {
      const key = g.dataKey || g.id;
      if ((!state.facets[g.id] || state.facets[g.id].length === 0) && inferred[key] && inferred[key].length) {
        state.facets[g.id] = inferred[key];
      }
    });

    const handlers = {
      toggleGroup(id) {
        state.expanded[id] = !state.expanded[id];
        rerender();
      },
      setSelection(id, values) {
        state.active[id] = values.filter((v) => v !== '' && v != null);
        if (state.active[id].length === 0) delete state.active[id];
        persistAndApply();
      },
      setSort(value) {
        state.sort = value;
        persistAndApply();
      },
      clearAll() {
        state.active = {};
        persistAndApply();
      }
    };

    function persistAndApply() {
      const urlOut = Object.assign({}, state.active);
      if (state.sort) urlOut.sort = state.sort;
      writeUrlParams(urlOut);
      sortGrid(grid, state.sort);
      state.resultCount = applyFiltersToGrid(grid, state, config.groups || []);
      rerender();
      document.dispatchEvent(new CustomEvent('holbrook:filtersChanged', {
        detail: { category: config.category, active: state.active, sort: state.sort, resultCount: state.resultCount }
      }));
    }

    function rerender() {
      renderSidebar(sidebar, config, state, handlers);
    }

    // React to vehicle changes from the Garage
    window.addEventListener('storage', (e) => {
      if (e.key === SELECTED_VEHICLE_KEY || e.key === GARAGE_KEY) {
        state.vehicle = readSelectedVehicle();
        rerender();
      }
    });
    document.addEventListener('holbrook:vehicleChanged', (e) => {
      state.vehicle = (e && e.detail) || readSelectedVehicle();
      rerender();
    });

    // Initial render + apply
    persistAndApply();

    return { state, rerender };
  }

  global.HolbrookFilters = { mount };
})(window);
