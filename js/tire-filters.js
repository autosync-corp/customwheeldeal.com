/*!
 * Holbrook Tire Filters
 * --------------------
 * Left-rail filter sidebar for the tire landing page (/tires/brand.html) and
 * every tire brand product page (/tires/{brand}/index.html).
 *
 * Filter groups (per Dave's spec):
 *   - SIZE
 *   - BRAND
 *   - CATEGORY
 *   - STYLE
 *   - SEASON
 *   - WARRANTY
 *
 * No per-group icons. The only icons in the filter rail are the top-level
 * "tune" icon (Filter & Sort header) and the vehicle card icon. All text
 * inside the sidebar is rendered UPPERCASE via CSS (text-transform) so
 * option values from the API (brand names, sizes) are also uppercased
 * without mangling the source data.
 *
 * Additionally renders a vehicle-fitment card at the top so the user always
 * sees the vehicle these products are limited to (breadcrumb consistency).
 *
 * Requires holbrook-filters-core.js to be loaded first.
 */
(function () {
  'use strict';

  function onTirePage() {
    const p = location.pathname;
    // Exclude wheel pages and obvious non-product pages
    if (p.indexOf('/tires/') === -1) return false;
    if (p.indexOf('/wheels/') !== -1) return false;
    return true;
  }

  if (!onTirePage()) return;

  // --------------------------------------------------------------------
  // Inject the uppercase styling once. Scoped to the sidebar so it does
  // not affect the rest of the page. Does NOT uppercase the vehicle card
  // so year/make/model read naturally.
  // --------------------------------------------------------------------
  function injectUppercaseStyle() {
    if (document.getElementById('holbrook-tire-filters-style')) return;
    const style = document.createElement('style');
    style.id = 'holbrook-tire-filters-style';
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
    category: 'tires',

    sortOptions: [
      { value: 'price_asc', label: 'Price: Low to High' },
      { value: 'price_desc', label: 'Price: High to Low' },
      { value: 'popular', label: 'Most Popular' },
      { value: 'rating', label: 'Top Rated' },
      { value: 'mileage', label: 'Longest Warranty' }
    ],

    groups: [
      {
        id: 'size',
        label: 'SIZE',
        dataKey: 'size',
        options: []
      },
      {
        id: 'rimDiameter',
        label: 'RIM DIAMETER',
        dataKey: 'rimDiameter',
        options: []
      },
      {
        id: 'speedRating',
        label: 'SPEED RATING',
        dataKey: 'speedRating',
        options: []
      },
      {
        id: 'loadIndex',
        label: 'LOAD INDEX',
        dataKey: 'loadIndex',
        options: []
      },
      {
        id: 'brand',
        label: 'BRAND',
        dataKey: 'brand',
        options: []
      },
      {
        id: 'category',
        label: 'CATEGORY',
        dataKey: 'category',
        options: [
          'Passenger',
          'Performance',
          'Light Truck / SUV',
          'All-Terrain',
          'Mud-Terrain',
          'Highway',
          'Commercial',
          'Winter'
        ]
      },
      {
        id: 'style',
        label: 'STYLE',
        dataKey: 'style',
        options: []
      },
      {
        id: 'season',
        label: 'SEASON',
        dataKey: 'season',
        options: [
          'All-Season',
          'Summer',
          'Winter / Snow',
          'All-Weather'
        ]
      },
      {
        id: 'mileage',
        label: 'WARRANTY',
        dataKey: 'mileage',
        options: [
          { value: '40000', label: '40,000+ miles' },
          { value: '50000', label: '50,000+ miles' },
          { value: '60000', label: '60,000+ miles' },
          { value: '70000', label: '70,000+ miles' },
          { value: '80000', label: '80,000+ miles' }
        ]
      }
    ],

    // Called by the core once we know which vehicle (if any) is selected.
    // Returns an object keyed by filter group id, each mapping to an array of
    // available option values (strings or {value,label,count} objects).
    async fetchFacets(client, vehicle) {
      if (!client || typeof client.getTireFacets !== 'function') return null;
      try {
        const res = await client.getTireFacets(vehicle ? vehicle.id : null);
        if (!res) return null;
        // Map API shape to our group ids
        return {
          size: res.sizes || res.size || [],
          rimDiameter: res.rimDiameters || res.rimDiameter || res.rimSizes || [],
          speedRating: res.speedRatings || res.speedRating || [],
          loadIndex: res.loadIndexes || res.loadIndex || [],
          brand: (res.brands || res.brand || []).map((b) =>
            typeof b === 'string' ? b : { value: b.slug || b.value, label: b.name || b.label, count: b.count }
          ),
          category: res.categories || res.category || [],
          style: res.styles || res.style || [],
          season: res.seasons || res.season || [],
          mileage: res.mileageTiers || res.mileage || []
        };
      } catch (e) {
        return null;
      }
    }
  };

  function start() {
    if (!window.HolbrookFilters) {
      console.warn('[HolbrookTireFilters] core not loaded');
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
