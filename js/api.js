// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ api.js â€” Full API client
const API_BASE = 'https://api.autosyncstudio.com';
const API_KEY = 'customwheeldeal';

// Helper: extract items array from any API response shape
function extractItems(data) {
  if (!data) return null;
  // AutoSync API uses descriptive keys: Tires, Brands, Makes, Models, Wheels, etc.
  if (Array.isArray(data.Tires) && data.Tires.length > 0) return data.Tires;
  if (Array.isArray(data.Brands) && data.Brands.length > 0) return data.Brands;
  if (Array.isArray(data.Makes) && data.Makes.length > 0) return data.Makes;
  if (Array.isArray(data.Models) && data.Models.length > 0) return data.Models;
  if (Array.isArray(data.Submodels) && data.Submodels.length > 0) return data.Submodels;
  if (Array.isArray(data.Wheels) && data.Wheels.length > 0) return data.Wheels;
  if (Array.isArray(data.WheelStyles) && data.WheelStyles.length > 0) return data.WheelStyles;
  if (Array.isArray(data.TireModels) && data.TireModels.length > 0) return data.TireModels;
  if (Array.isArray(data.Vehicles) && data.Vehicles.length > 0) return data.Vehicles;
  // Fallback: try generic keys
  if (Array.isArray(data.Items) && data.Items.length > 0) return data.Items;
  if (Array.isArray(data.items) && data.items.length > 0) return data.items;
  if (Array.isArray(data.data)  && data.data.length > 0)  return data.data;
  if (Array.isArray(data) && data.length > 0) return data;
  return null;
}

// Helper: extract name from an item (handles various API field names)
// AutoSync API uses: Brand, Make, Model, Submodel (capitalized, no "Name" field)
function extractName(item) {
  if (typeof item === 'string') return item;
  return item.Brand || item.Make || item.Model || item.Submodel || item.DisplayName || item.Name || item.name || item.label || item.Label || item.value || '';
}

const api = {
  async _fetch(path, params) {
    const url = API_BASE + path + '?' + params;
    console.log('[Holbrook API]', url);
    const res = await fetch(url);
    if (!res.ok) throw new Error('API ' + res.status + ': ' + res.statusText);
    const data = await res.json();
    console.log('[Holbrook API] Response:', path, data);
    return data;
  },
  async fetchTires(filters = {}) {
    const params = new URLSearchParams({ key: API_KEY, 'p-size': 400, 'i-img': true, 'i-price': true, 'i-specs': true, 'i-tags': true, ...filters });
    return this._fetch('/tires', params);
  },
  async fetchTireBrands() {
    const params = new URLSearchParams({ key: API_KEY, 'p-size': 200, 'i-logos': true });
    return this._fetch('/tires/brands', params);
  },
  async fetchWheels(filters = {}) {
    const params = new URLSearchParams({ key: API_KEY, 'p-size': 400, 'i-img0001': true, 'i-img0002': true, 'i-img0003': true, 'i-price': true, 'i-specs': true, 'i-tags': true, 'f-imgFormat': 'webp', ...filters });
    return this._fetch('/wheels', params);
  },
  async fetchWheelBrands() {
    const params = new URLSearchParams({ key: API_KEY, 'p-size': 200, 'i-logos': true });
    return this._fetch('/wheels/brands', params);
  },
  async fetchTireModels(filters = {}) {
    const params = new URLSearchParams({ key: API_KEY, 'p-size': 400, 'i-displayNames': true, 'i-img': true, 'i-minMaxPrice': true, 'i-tags': true, 'i-tireCount': true, ...filters });
    return this._fetch('/tires/models', params);
  },
  async fetchTireModelsByFitment(vehicleData, selectedSize, brand, pageNumber) {
    var allSizes = typeof getAllTireSizes === 'function' ? getAllTireSizes(vehicleData).map(function(s) { return s.size; }) : [];
    var params = new URLSearchParams({
      key: API_KEY, 'p-size': 400, 'p-number': pageNumber || 1,
      'i-displayNames': true, 'i-img': true, 'i-minMaxPrice': true, 'i-tags': true, 'i-tireCount': true,
      'f-orSegmentTags': 'All Season,All Terrain,All Weather,Extreme Terrain,Highway Terrain,Mud Terrain,Spare,Summer,Touring,Winter'
    });
    if (allSizes.length) params.set('f-sizes', allSizes.join(','));
    if (selectedSize && !/,/.test(selectedSize)) {
      var parsed = typeof normalizeTireSize === 'function' ? normalizeTireSize(selectedSize) : null;
      if (parsed) {
        params.set('f-sizesWithMargin', selectedSize);
        params.set('f-rimDiameter', String(parsed.rim));
        if (parsed.type === 'standard') {
          params.set('f-sectionWidth', String(parsed.width));
          params.set('f-aspectRatio', String(parsed.aspect));
        }
      }
    }
    if (vehicleData.LoadRating)         params.set('f-minLoadRating',      vehicleData.LoadRating);
    var minSpeed = typeof getMinSpeedRating === 'function' ? getMinSpeedRating(vehicleData) : null;
    if (minSpeed)                        params.set('f-minSpeedRating',     minSpeed);
    if (vehicleData.TireVehicleTypeTag) params.set('f-andVehicleTypeTags', vehicleData.TireVehicleTypeTag);
    if (vehicleData.NicheTag)           params.set('f-nicheTag',           vehicleData.NicheTag);
    if (brand)                          params.set('f-brand',              brand);
    return this._fetch('/tires/models', params);
  },
  async fetchWheelsByVehicle(vehicleData, diameter, brand, options) {
    var allRows = (vehicleData.Fitments || []).concat(vehicleData.OptionalFitments || []);
    var isStaggered = vehicleData.Staggered === true;
    var base = { key: API_KEY, 'p-size': 400, 'i-img0001': true, 'i-img0002': true, 'i-img0003': true, 'i-price': true, 'i-specs': true, 'i-tags': true, 'f-imgFormat': 'webp' };
    if (options && options.hasVovImg) base['f-hasVovImg'] = true;
    var self = this;
    function buildBase() {
      var p = new URLSearchParams(base);
      if (vehicleData.LugCount)   p.set('f-lugCount',           vehicleData.LugCount);
      if (vehicleData.BoltCircle) p.set('f-boltCircle',         vehicleData.BoltCircle);
      if (vehicleData.Bore)       p.set('f-minBore',            vehicleData.Bore);
      if (vehicleData.Type)       p.set('f-andVehicleTypeTags', vehicleData.Type);
      if (brand)                  p.set('f-brand',              brand);
      return p;
    }
    if (isStaggered) {
      // Staggered: two API calls (one per axle) using f-sizes for precise targeting.
      // f-sizes lists exact diameterÃ—width combos (Â±0.5" per OE/plus size) so the result
      // set is small enough that E5 and similar niche fitments are never buried past page 1.
      function fetchAllPages(params, maxPages) {
        var allWheels = [];
        var imgUrlBase = '';
        function fetchPage(pageNum) {
          var p = new URLSearchParams(params);
          p.set('p-number', pageNum);
          return self._fetch('/wheels', p).then(function(data) {
            var wheels = data.Wheels || [];
            allWheels = allWheels.concat(wheels);
            if (!imgUrlBase && data.ImgUrlBase) imgUrlBase = data.ImgUrlBase;
            if (data.MoreItems && pageNum < maxPages && wheels.length > 0) {
              return fetchPage(pageNum + 1);
            }
            return { Wheels: allWheels, ImgUrlBase: imgUrlBase, MoreItems: false };
          });
        }
        return fetchPage(1);
      }
      // Front call â€” bolt circle removed; dual-drill wheels (e.g. E5 5Ã—120.65/120) have a
      // secondary bolt circle that the API won't match. Client-side check handles both circles.
      var fp = buildBase();
      fp.delete('f-boltCircle');
      var frontSizes = buildStaggeredSizes(vehicleData, 'front');
      if (frontSizes) fp.set('f-sizes', frontSizes);
      // Rear call â€” same
      var rp = buildBase();
      rp.delete('f-boltCircle');
      var rearSizes = buildStaggeredSizes(vehicleData, 'rear');
      if (rearSizes) rp.set('f-sizes', rearSizes);
      return Promise.all([fetchAllPages(fp, 5), fetchAllPages(rp, 5)])
        .then(function(results) {
          var combined = results[0].Wheels.concat(results[1].Wheels);
          return { Wheels: combined, ImgUrlBase: results[0].ImgUrlBase || results[1].ImgUrlBase, MoreItems: false };
        });
    } else {
      // Non-staggered: single call with selected diameter and scoped offset range
      var p = buildBase();
      var diamRows = diameter ? allRows.filter(function(f) { return String(f.RimDiameter) === String(diameter); }) : allRows;
      var rows = diamRows.length > 0 ? diamRows : allRows;
      var mins = rows.map(function(f) { return f.MinOffset; }).filter(function(v) { return v != null; });
      var maxs = rows.map(function(f) { return f.MaxOffset; }).filter(function(v) { return v != null; });
      if (mins.length) p.set('f-minOffset', Math.min.apply(null, mins));
      if (maxs.length) p.set('f-maxOffset', Math.max.apply(null, maxs));
      if (diameter)    p.set('f-diameters', String(diameter));
      return self._fetch('/wheels', p);
    }
  },
  // Step 3: VVSE-matched wheel styles fetch using f-sizes from fitment data
  async fetchWheelStylesByFitment(vehicleData, diameter, brand, pageNumber) {
    var sizes = typeof buildWheelFitmentSizes === 'function' ? buildWheelFitmentSizes(vehicleData) : [];
    var params = new URLSearchParams({
      key: API_KEY, 'p-size': 30, 'p-number': pageNumber || 1,
      'f-positions': 'N/A,Front,Front Dually',
      'f-orSegmentTags': 'Luxury,Off-Road,Replica',
      'i-img0001': true, 'i-img0002': true, 'i-img0003': true,
      'i-description': true, 'i-features': true,
      'i-diameters': true, 'i-sizes': true, 'i-offsets': true,
      'i-shortColors': true, 'i-shortFinishes': true,
      'i-minMaxPrice': true, 'i-prices': true, 'i-specs': true, 'i-tags': true,
      'i-imgDetails': true, 'i-inStock': true, 'f-imgFormat': 'webp',
      'f-inStock': true, 'f-hasPrice': true
    });
    if (vehicleData.LugCount)     params.set('f-lugCount',           vehicleData.LugCount);
    if (vehicleData.BoltCircle)   params.set('f-boltCircle',         vehicleData.BoltCircle);
    if (vehicleData.Bore)         params.set('f-minBore',            vehicleData.Bore);
    if (vehicleData.MaxWheelLoad) params.set('f-minLoadRating',      vehicleData.MaxWheelLoad);
    if (vehicleData.Type)         params.set('f-andVehicleTypeTags', vehicleData.Type);
    if (vehicleData.NicheTag)     params.set('f-nicheTag',           vehicleData.NicheTag);
    if (sizes.length)             params.set('f-sizes',              sizes.join(','));
    if (diameter)                 params.set('f-diameters',          String(diameter));
    // Offset range from all fitment rows (OE + Optional + Plus)
    var allFitRows = (vehicleData.Fitments || []).concat(vehicleData.OptionalFitments || []).concat(vehicleData.PlusSizes || []);
    var mins = allFitRows.map(function(f) { return f.MinOffset; }).filter(function(v) { return v != null; });
    var maxs = allFitRows.map(function(f) { return f.MaxOffset; }).filter(function(v) { return v != null; });
    if (mins.length) params.set('f-minOffset', Math.min.apply(null, mins));
    if (maxs.length) params.set('f-maxOffset', Math.max.apply(null, maxs));
    if (brand)                    params.set('f-brand',              brand);
    return this._fetch('/wheels/styles', params);
  },

  // Step 4: VVSE-matched wheel filters fetch â€” populates sidebar correctly
  async fetchWheelFiltersByFitment(vehicleData, diameter, brand) {
    var sizes = typeof buildWheelFitmentSizes === 'function' ? buildWheelFitmentSizes(vehicleData) : [];
    var params = new URLSearchParams({
      key: API_KEY,
      'f-positions': 'N/A,Front,Front Dually',
      'f-orSegmentTags': 'Luxury,Off-Road,Replica',
      'i-boltCircles': true, 'i-brands': true, 'i-brandLogos': true,
      'i-diameters': true, 'i-lugCounts': true, 'i-offsets': true,
      'i-shortColors': true, 'i-shortFinishes': true,
      'i-tags': true, 'i-widths': true, 'i-prices': true, 'i-sizes': true
    });
    if (vehicleData.LugCount)     params.set('f-lugCount',           vehicleData.LugCount);
    if (vehicleData.BoltCircle)   params.set('f-boltCircle',         vehicleData.BoltCircle);
    if (vehicleData.Bore)         params.set('f-minBore',            vehicleData.Bore);
    if (vehicleData.MaxWheelLoad) params.set('f-minLoadRating',      vehicleData.MaxWheelLoad);
    if (vehicleData.Type)         params.set('f-andVehicleTypeTags', vehicleData.Type);
    if (vehicleData.NicheTag)     params.set('f-nicheTag',           vehicleData.NicheTag);
    if (sizes.length)             params.set('f-sizes',              sizes.join(','));
    if (diameter)                 params.set('f-diameters',          String(diameter));
    if (brand)                    params.set('f-brand',              brand);
    return this._fetch('/wheels/filters', params);
  },

  async fetchVehicleMakes(year) {
    const params = new URLSearchParams({ key: API_KEY, 'p-size': 200, 'i-logos': true });
    if (year) params.set('f-year', year);
    return this._fetch('/vehicles/makes', params);
  },
  async fetchVehicleModels(year, make) {
    const params = new URLSearchParams({ key: API_KEY, 'p-size': 200 });
    if (year) params.set('f-year', year);
    if (make) params.set('f-make', make);
    return this._fetch('/vehicles/models', params);
  },
  async fetchVehicleSubmodels(year, make, model) {
    const params = new URLSearchParams({ key: API_KEY, 'p-size': 200 });
    if (year) params.set('f-year', year);
    if (make) params.set('f-make', make);
    if (model) params.set('f-model', model);
    return this._fetch('/vehicles/submodels', params);
  },
  async fetchVehicleFitments(year, make, model, submodel) {
    const params = new URLSearchParams({ key: API_KEY, 'i-fitments': true, 'i-optionalFitments': true, 'i-plusSizes': true, 'i-tags': true });
    if (year) params.set('f-year', year);
    if (make) params.set('f-make', make);
    if (model) params.set('f-model', model);
    if (submodel) params.set('f-submodel', submodel);
    return this._fetch('/vehicles', params);
  },

  // Fetch all unique active rebate campaigns.
  // Results are cached in localStorage for 1 hour â€” instant on return visits.
  // On first visit (or expired cache): fetches all brands in 4 parallel batches, no delays.
  async fetchRebates() {
    const CACHE_KEY = 'holbrook_rebates_v3';
    const CACHE_TTL  = 60 * 60 * 1000; // 1 hour â€” serve from cache
    const STALE_TTL  = 30 * 60 * 1000; // 30 min â€” background-refresh if older

    try {
      var cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && cached.ts && Array.isArray(cached.data) && cached.data.length > 0) {
        var age = Date.now() - cached.ts;
        if (age < CACHE_TTL) {
          console.log('[Rebates] cache hit (' + Math.round(age / 1000) + 's old),', cached.data.length, 'campaigns');
          if (age > STALE_TTL) {
            // Silently refresh in background so next visit is fast too
            this._fetchRebatesFromAPI().then(function(fresh) {
              if (fresh && fresh.length > 0)
                localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: fresh }));
            }).catch(function() {});
          }
          return cached.data;
        }
      }
    } catch(e) {}

    var result = await this._fetchRebatesFromAPI();
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: result })); } catch(e) {}
    return result;
  },

  async _fetchRebatesFromAPI() {
    const brandsData = await fetch(
      API_BASE + '/tires/brands?' + new URLSearchParams({ key: API_KEY, 'p-size': '200' })
    ).then(function(r) { return r.ok ? r.json() : {}; }).catch(function() { return {}; });

    const allBrands = (brandsData.Brands || []).map(function(b) {
      return typeof b === 'string' ? b : (b.Brand || b.Name || b.name || '');
    }).filter(Boolean);

    if (allBrands.length === 0) return [];

    const seen = new Set();
    const result = [];
    // 25 per batch â†’ 4 batches for ~91 brands, no delay between them
    const batchSize = 25;

    function normalizeRebate(tire, rebate) {
      var info = rebate.Info || [];
      return {
        brand:           (tire.Brand || '').toUpperCase(),
        brandRaw:        tire.Brand || '',
        brandId:         tire.BrandId || 0,
        amount:          (info[0] || {}).Amount || 0,
        amountReason:    (info[0] || {}).Description || '',
        amountTwo:       (info[1] || {}).Amount || 0,
        amountTwoReason: (info[1] || {}).Description || '',
        qtyRequired:     rebate.QtyRequired || 4,
        startDate:       rebate.StartDate || '',
        endDate:         rebate.EndDate || '',
        description:     rebate.DescriptionPreview || '',
        pdfUrl:          rebate.Url || '',
        previewImage:    rebate.PreviewImgUrl || '',
        bannerImage:     rebate.BannerImgUrl || '',
        horizontalImage: rebate.HorizontalImgUrl || '',
      };
    }

    for (var i = 0; i < allBrands.length; i += batchSize) {
      var batch = allBrands.slice(i, i + batchSize);
      var responses = await Promise.all(batch.map(function(brand) {
        var p = new URLSearchParams({
          key: API_KEY, 'f-hasRebates': 'true', 'i-rebates': 'True',
          'f-brand': brand, 'p-size': '5' // 5 tires is enough to capture all campaigns per brand
        });
        return fetch(API_BASE + '/tires?' + p)
          .then(function(r) { return r.ok ? r.json() : null; })
          .catch(function() { return null; });
      }));

      for (var d = 0; d < responses.length; d++) {
        var data = responses[d];
        if (!data) continue;
        for (var t = 0; t < (data.Tires || []).length; t++) {
          var tire = data.Tires[t];
          for (var rb = 0; rb < (tire.Rebates || []).length; rb++) {
            var rebate = tire.Rebates[rb];
            var key = rebate.BannerImgUrl || rebate.PreviewImgUrl || (rebate.Url + '|' + tire.Brand);
            if (!key || seen.has(key)) continue;
            seen.add(key);
            result.push(normalizeRebate(tire, rebate));
          }
        }
      }
    }

    console.log('[Rebates] fetched', result.length, 'campaigns across', allBrands.length, 'brands');
    return result;
  }
};

// Rate-limit-safe helper: fetch a few brands at a time with delays
api._fetchBrands = async function(endpoint, itemKey, brands, perBrand, extras) {
  var allItems = [];
  var imgUrlBase = null;
  var batchSize = 3;   // only 3 concurrent requests
  var delay = 400;     // 400ms pause between batches
  for (var i = 0; i < brands.length; i += batchSize) {
    if (i > 0) await new Promise(function(r) { setTimeout(r, delay); });
    var batch = brands.slice(i, i + batchSize);
    var results = await Promise.all(batch.map(function(brand) {
      var params = new URLSearchParams(Object.assign({
        key: API_KEY, 'p-size': perBrand, 'i-img0001': true, 'i-price': true, 'f-brand': brand
      }, extras || {}));
      return fetch(API_BASE + endpoint + '?' + params)
        .then(function(r) { return r.ok ? r.json() : { }; })
        .catch(function() { return { }; });
    }));
    results.forEach(function(data) {
      if (!imgUrlBase && data.ImgUrlBase) imgUrlBase = data.ImgUrlBase;
      var items = data[itemKey] || [];
      allItems = allItems.concat(items);
    });
  }
  return { items: allItems, imgUrlBase: imgUrlBase };
};

// Fetch tires across key brands (not all 76 â€” just top ~20 to avoid rate limits)
api.fetchAllBrandTires = async function(perBrand) {
  perBrand = perBrand || 10;
  var keyBrands = [
    'Michelin','Bridgestone','Goodyear','Continental','Pirelli','Cooper',
    'Firestone','Hankook','Yokohama','Toyo','Nitto','Falken',
    'Bfgoodrich','General','Kumho','Nexen','Dunlop','Nokian',
    'Mickey Thompson','Uniroyal'
  ];
  console.log('[Holbrook API] Fetching tires for', keyBrands.length, 'key brands @', perBrand, 'each');
  var result = await this._fetchBrands('/tires', 'Tires', keyBrands, perBrand, { 'i-specs': true, 'i-tags': true });
  console.log('[Holbrook API] Total tires loaded:', result.items.length);
  return { Tires: result.items, ImgUrlBase: result.imgUrlBase, MoreItems: false };
};

// Fetch wheels across key brands
api.fetchAllBrandWheels = async function(perBrand) {
  perBrand = perBrand || 10;
  var keyBrands = [
    'American Force','American Racing','Black Rhino','Fuel','Hostile','Method',
    'Moto Metal','Niche','Rotiform','TSW','Raceline','Mayhem',
    'Status','Lock Offroad','Fittipaldi Offroad','4PLAY','Asanti Black Label',
    'Anthem Off-Road','ATX','Revenge Luxury'
  ];
  console.log('[Holbrook API] Fetching wheels for', keyBrands.length, 'key brands @', perBrand, 'each');
  var result = await this._fetchBrands('/wheels', 'Wheels', keyBrands, perBrand, { 'i-specs': true, 'f-imgFormat': 'webp' });
  console.log('[Holbrook API] Total wheels loaded:', result.items.length);
  return { Wheels: result.items, ImgUrlBase: result.imgUrlBase, MoreItems: false };
};

// CDN base URLs for product images (from API responses)
window.AUTOSYNC_CDN = {
  tires: 'https://storage.googleapis.com/autosync_tires/',
  tireSpins: 'https://storage.googleapis.com/autosync_tires/_spins/',
  wheels: 'https://wheels.autosyncstudio.com/webp/',
  brandLogos: 'https://storage.googleapis.com/autosync-brand-logos/logos/',
};
