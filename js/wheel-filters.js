/*!
 * Holbrook Wheel Filters
 * ---------------------
 * Left-rail filter sidebar for the wheel landing page (/wheels/brand.html) and
 * every wheel brand product page (/wheels/{brand}/index.html).
 *
 * Filter groups:
 *   - RIM SIZE (single-select at the top)
 *   - PRICE RANGE (per wheel)
 *   - FEATURED (Deals checkbox)
 *   - BRAND
 *   - FINISH (color/material)
 *   - OFFSET
 *   - WIDTH
 *
 * Mirrors tire-filters.js styling: no per-group icons (only the top-level
 * tune icon and vehicle-card car icon remain), and every bit of filter text
 * is rendered UPPERCASE via CSS so API-returned values (brand names, finishes)
 * are uppercased on display without mangling the raw data.
 *
 * Requires holbrook-filters-core.js to be loaded first.
 */
(function () {
  'use strict';

  function onWheelPage() {
    const p = location.pathname;
    return p.indexOf('/wheels/') !== -1;
  }

  if (!onWheelPage()) return;

  // --------------------------------------------------------------------
  // Inject the uppercase styling once. Scoped to the sidebar so it does
  // not affect the rest of the page. Does NOT uppercase the vehicle card
  // so year/make/model read naturally.
  // --------------------------------------------------------------------
  function injectUppercaseStyle() {
    if (document.getElementById('holbrook-wheel-filters-style')) return;
    const style = document.createElement('style');
    style.id = 'holbrook-wheel-filters-style';
    style.textContent = [
      '.holbrook-filters-sidebar .holbrook-filter-header,',
      '.holbrook-filters-sidebar .holbrook-filter-body,',
      '.holbrook-filters-sidebar h2,',
      '.holbrook-filters-sidebar select,',
      '.holbrook-filters-sidebar > * > label { text-transform: uppercase; letter-spacing: 0.04em; }',
      '.holbrook-filters-sidebar .holbrook-vehicle-card,',
      '.holbrook-filters-sidebar .holbrook-vehicle-card * { text-transform: none; letter-spacing: normal; }',
      '.holbrook-filters-sidebar .holbrook-vehicle-card .uppercase { text-transform: uppercase; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  const config = {
    category: 'wheels',

    sortOptions: [
      { value: 'price_asc', label: 'Price: Low to High' },
      { value: 'price_desc', label: 'Price: High to Low' },
      { value: 'popular', label: 'Most Popular' },
      { value: 'newest', label: 'Newest Arrivals' },
      { value: 'rating', label: 'Top Rated' }
    ],

    groups: [
      {
        id: 'rimSize',
        label: 'RIM SIZE',
        dataKey: 'rimSize',
        type: 'select',
        placeholder: 'Any Rim Size',
        options: [
          '15.0"', '16.0"', '17.0"', '18.0"', '19.0"',
          '20.0"', '22.0"', '24.0"', '26.0"', '28.0"'
        ]
      },
      {
        id: 'price',
        label: 'PRICE RANGE',
        dataKey: 'price',
        type: 'range',
        defaultRange: ['', '']
      },
      {
        id: 'deals',
        label: 'FEATURED',
        dataKey: 'deals',
        // single-option checkbox list - the core renders the check UI already
        options: [
          {
            value: 'deal',
            label: 'Deals',
            badge: '💰'
          }
        ],
        strict: false
      },
      {
        id: 'brand',
        label: 'BRAND',
        dataKey: 'brand',
        options: []
      },
      {
        id: 'finish',
        label: 'FINISH',
        dataKey: 'finish',
        options: [
          { value: 'matte-black',    label: 'Matte Black',        swatch: '#1a1a1a' },
          { value: 'gloss-black',    label: 'Gloss Black',        swatch: '#0a0a0a' },
          { value: 'chrome',         label: 'Chrome',             swatch: 'linear-gradient(135deg,#e6e6e6 0%,#a8a8a8 50%,#e6e6e6 100%)' },
          { value: 'machined',       label: 'Machined',           swatch: '#c7c7c7' },
          { value: 'bronze',         label: 'Bronze',             swatch: '#8c6a3c' },
          { value: 'gunmetal',       label: 'Gunmetal',           swatch: '#3a3f45' },
          { value: 'silver',         label: 'Silver',             swatch: '#b8bbbf' },
          { value: 'satin-black',    label: 'Satin Black',        swatch: '#2a2a2a' },
          { value: 'red',            label: 'Red',                swatch: '#b01c2e' },
          { value: 'blue',           label: 'Blue',               swatch: '#1e4a8a' },
          { value: 'gold',           label: 'Gold',               swatch: '#c9a84c' },
          { value: 'white',          label: 'White',              swatch: '#f5f5f5' }
        ]
      },
      {
        id: 'offset',
        label: 'OFFSET',
        dataKey: 'offset',
        type: 'range',
        defaultRange: ['', '']
      },
      {
        id: 'width',
        label: 'WIDTH',
        dataKey: 'width',
        type: 'range',
        defaultRange: ['', '']
      }
    ],

    async fetchFacets(client, vehicle) {
      if (!client || typeof client.getWheelFacets !== 'function') return null;
      try {
        const res = await client.getWheelFacets(vehicle ? vehicle.id : null);
        if (!res) return null;
        return {
          rimSize: res.rimSizes || res.rimSize || [],
          brand: (res.brands || res.brand || []).map((b) =>
            typeof b === 'string' ? b : { value: b.slug || b.value, label: b.name || b.label, count: b.count }
          ),
          finish: res.finishes || res.finish || [],
          offset: res.offsetRanges || res.offset || [],
          width: res.widths || res.width || []
        };
      } catch (e) {
        return null;
      }
    }
  };

  function start() {
    if (!window.HolbrookFilters) {
      console.warn('[HolbrookWheelFilters] core not loaded');
      return;
    }
    injectUppercaseStyle();
    window.HolbrookFilters.mount(config);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
