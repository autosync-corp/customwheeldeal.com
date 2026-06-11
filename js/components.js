/**
 * Custom Wheel Deal — Shared UI Components
 * Renders header (with Garage), footer, breadcrumb, vehicle reinforcement bar,
 * left-side filter panel, and utility functions.
 *
 * GARAGE: Users can save vehicles to their garage (sessionStorage) and quickly
 * switch between them. A vehicle thumbnail + info bar appears on product pages
 * to reinforce that results are filtered to the selected vehicle's fitment.
 */
const CWDUI = (() => {

  // ─── Determine relative root path based on page depth ─────────
  // depth 0 (/ or /index.html)        → '.'
  // depth 1 (/tires/brand.html)       → '..'
  // depth 2 (/tires/cooper/index.html)→ '../..'
  function getRoot() {
    const path = window.location.pathname;
    // Count path segments *before* the filename:
    //   /              → 0
    //   /index.html    → 0
    //   /tires/        → 1
    //   /tires/x.html  → 1
    //   /tires/cooper/ → 2
    const parts = path.split('/').filter(Boolean);
    const hasTrailingSlash = path.endsWith('/');
    const depth = hasTrailingSlash ? parts.length : Math.max(0, parts.length - 1);
    if (depth <= 0) return '.';
    return Array(depth).fill('..').join('/');
  }

  const root = getRoot();

  // ═══════════════════════════════════════════════════════════════
  //  GARAGE SYSTEM — Save/recall vehicles via sessionStorage
  // ═══════════════════════════════════════════════════════════════
  const GARAGE_KEY = 'cwd_garage';
  const ACTIVE_VEHICLE_KEY = 'cwd_active_vehicle';

  function getGarage() {
    try { return JSON.parse(sessionStorage.getItem(GARAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveGarage(vehicles) {
    sessionStorage.setItem(GARAGE_KEY, JSON.stringify(vehicles));
  }

  function getActiveVehicle() {
    try { return JSON.parse(sessionStorage.getItem(ACTIVE_VEHICLE_KEY)); }
    catch { return null; }
  }

  function setActiveVehicle(vehicle) {
    if (vehicle) {
      sessionStorage.setItem(ACTIVE_VEHICLE_KEY, JSON.stringify(vehicle));
    } else {
      sessionStorage.removeItem(ACTIVE_VEHICLE_KEY);
    }
    renderVehicleBar();
    updateGarageCount();
  }

  function addToGarage(vehicle) {
    const garage = getGarage();
    const key = `${vehicle.year}-${vehicle.make}-${vehicle.model}-${vehicle.submodel || ''}`;
    const exists = garage.find(v => `${v.year}-${v.make}-${v.model}-${v.submodel || ''}` === key);
    if (!exists) {
      garage.unshift(vehicle);
      if (garage.length > 10) garage.pop(); // limit to 10
      saveGarage(garage);
    }
    setActiveVehicle(vehicle);
  }

  function removeFromGarage(index) {
    const garage = getGarage();
    const removed = garage.splice(index, 1)[0];
    saveGarage(garage);
    const active = getActiveVehicle();
    if (active && removed && active.year === removed.year && active.make === removed.make && active.model === removed.model) {
      setActiveVehicle(garage[0] || null);
    }
    updateGarageCount();
    renderGarageDropdown();
  }

  function updateGarageCount() {
    document.querySelectorAll('[data-garage-count]').forEach(el => {
      const garage = getGarage();
      const count = garage.length;
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  // ─── Garage Dropdown Rendering ─────────────────────────────────
  function renderGarageDropdown() {
    const dropdown = document.getElementById('garageDropdown');
    if (!dropdown) return;

    const garage = getGarage();
    const active = getActiveVehicle();

    if (garage.length === 0) {
      dropdown.innerHTML = `
        <div class="p-6 text-center">
          <span class="material-symbols-outlined text-3xl text-on-surface-variant/30 block mb-2">garage</span>
          <p class="text-sm text-on-surface-variant mb-3">Your garage is empty</p>
          <p class="text-xs text-on-surface-variant/60">Use the vehicle selector on the homepage<br>to add vehicles to your garage.</p>
        </div>`;
      return;
    }

    dropdown.innerHTML = `
      <div class="px-4 pt-4 pb-2">
        <h4 class="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">My Garage</h4>
      </div>
      <div class="max-h-80 overflow-y-auto">
        ${garage.map((v, i) => {
          const isActive = active && active.year === v.year && active.make === v.make && active.model === v.model;
          return `
          <div class="flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors cursor-pointer ${isActive ? 'bg-primary/5 border-l-2 border-primary' : ''}"
               onclick="CWDUI.setActiveVehicle(JSON.parse(this.dataset.vehicle))" data-vehicle='${JSON.stringify(v).replace(/'/g, "&#39;")}'>
            <div class="w-16 h-10 rounded bg-surface-container-high flex items-center justify-center flex-shrink-0 overflow-hidden">
              ${v.image ? `<img src="${v.image}" alt="${v.year} ${v.make} ${v.model}" class="w-full h-full object-cover">` : `<span class="material-symbols-outlined text-on-surface-variant/40 text-lg">directions_car</span>`}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-bold truncate">${v.year} ${v.make} ${v.model}</div>
              <div class="text-[10px] text-on-surface-variant truncate">${v.submodel || ''}</div>
            </div>
            <button onclick="event.stopPropagation(); CWDUI.removeFromGarage(${i})" class="text-on-surface-variant/40 hover:text-error transition-colors flex-shrink-0" title="Remove from garage">
              <span class="material-symbols-outlined text-base">close</span>
            </button>
          </div>`;
        }).join('')}
      </div>
      <div class="border-t border-outline-variant/20 p-3">
        <a href="${root}/vehicles/index.html" class="block text-center text-xs font-bold tracking-wider text-primary hover:underline uppercase">+ Add Another Vehicle</a>
      </div>`;
  }

  function toggleGarageDropdown() {
    const dropdown = document.getElementById('garageDropdown');
    if (!dropdown) return;
    const isHidden = dropdown.classList.contains('hidden');
    dropdown.classList.toggle('hidden');
    if (isHidden) renderGarageDropdown();
  }

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('garageDropdown');
    const trigger = document.getElementById('garageToggle');
    if (dropdown && trigger && !dropdown.contains(e.target) && !trigger.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });


  // ═══════════════════════════════════════════════════════════════
  //  BREADCRUMB
  // ═══════════════════════════════════════════════════════════════
  function renderBreadcrumb(crumbs) {
    if (!crumbs || crumbs.length === 0) return '';
    const items = crumbs.map((c, i) => {
      const isLast = i === crumbs.length - 1;
      const name = c.label || c.text || '';
      if (isLast) {
        return `<span class="text-on-surface font-semibold text-sm">${name}</span>`;
      }
      return `<a href="${c.href}" class="text-on-surface-variant hover:text-primary transition-colors text-sm">${name}</a>
              <span class="material-symbols-outlined text-on-surface-variant/40 text-base">chevron_right</span>`;
    });
    return `
      <nav aria-label="Breadcrumb" class="flex items-center gap-2 px-12 py-4 max-w-7xl mx-auto flex-wrap">
        <a href="${root}/index.html" class="text-on-surface-variant hover:text-primary transition-colors">
          <span class="material-symbols-outlined text-base">home</span>
        </a>
        <span class="material-symbols-outlined text-on-surface-variant/40 text-base">chevron_right</span>
        ${items.join('\n')}
      </nav>`;
  }


  // ═══════════════════════════════════════════════════════════════
  //  HEADER — with Garage icon
  // ═══════════════════════════════════════════════════════════════
  function renderHeader(activePage) {
    const navItems = [
      { label: 'TIRES', href: `${root}/tires/index.html`, key: 'tires' },
      { label: 'WHEELS', href: `${root}/wheels/index.html`, key: 'wheels' },
      { label: 'VEHICLES', href: `${root}/vehicles/index.html`, key: 'vehicles' },
      { label: 'VISUALIZER', href: `${root}/visualizer/index.html`, key: 'visualizer' },
      { label: 'DEALS', href: `${root}/deals/index.html`, key: 'deals' },
    ];

    const navLinks = navItems.map(n => {
      const active = n.key === activePage;
      const cls = active
        ? 'text-[#ea580c] border-b-2 border-[#ea580c] pb-1'
        : 'text-on-surface-variant hover:text-[#c2410c]';
      return `<a class="${cls} transition-colors duration-200" href="${n.href}">${n.label}</a>`;
    }).join('\n');

    return `
    <header class="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-sm">
      <nav class="flex justify-between items-center px-8 py-4 max-w-full mx-auto">
        <div class="flex items-center gap-8">
          <a href="${root}/index.html" class="bg-slate-900 rounded-lg px-3 py-1 inline-flex items-center"><img src="/assets/logo-dark-bg.png" alt="Custom Wheel Deal" class="h-14 object-contain"></a>
          <div class="hidden md:flex gap-6 items-center font-['Space_Grotesk'] font-bold uppercase tracking-wider text-sm">
            ${navLinks}
          </div>
        </div>
        <div class="flex items-center gap-6">
          <div class="relative hidden lg:block">
            <input class="bg-surface-container-low border-none rounded-md px-4 py-2 text-sm w-80 focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Search Tires, Wheels and Vehicles" type="text" id="globalSearch"/>
            <span class="material-symbols-outlined absolute right-3 top-2 text-on-surface-variant text-lg">search</span>
          </div>
          <div class="flex items-center gap-4 text-on-surface-variant">
            <!-- GARAGE ICON -->
            <div class="relative" id="garageToggle">
              <button onclick="CWDUI.toggleGarageDropdown()" class="relative cursor-pointer hover:text-primary transition-colors" title="My Garage">
                <span class="material-symbols-outlined">garage</span>
                <span data-garage-count class="absolute -top-2 -right-2 bg-tertiary-fixed-dim text-tertiary text-[10px] font-bold w-5 h-5 rounded-full items-center justify-center hidden">0</span>
              </button>
              <!-- Garage Dropdown -->
              <div id="garageDropdown" class="hidden absolute right-0 top-full mt-2 w-80 bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/20 z-50 overflow-hidden">
              </div>
            </div>
            <a href="${root}/cart/index.html" class="relative cursor-pointer hover:text-primary transition-colors">
              <span class="material-symbols-outlined">shopping_cart</span>
              <span data-cart-count class="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full items-center justify-center hidden">0</span>
            </a>
            <a href="${root}/admin/index.html" class="cursor-pointer hover:text-primary transition-colors" title="Admin Panel">
              <span class="material-symbols-outlined">person</span>
            </a>
          </div>
          <button class="signature-gradient text-white px-6 py-2.5 rounded-md text-xs font-bold tracking-widest uppercase hover:opacity-90 transition-all active:scale-95">
            BOOK APPOINTMENT
          </button>
          <!-- Mobile menu button -->
          <button class="md:hidden" onclick="document.getElementById('mobileMenu').classList.toggle('hidden')">
            <span class="material-symbols-outlined text-on-surface">menu</span>
          </button>
        </div>
      </nav>
      <!-- Mobile menu -->
      <div id="mobileMenu" class="hidden md:hidden bg-surface border-t border-outline-variant/10 px-8 py-4 space-y-3">
        ${navItems.map(n => `<a href="${n.href}" class="block font-bold text-sm tracking-wider ${n.key === activePage ? 'text-primary' : 'text-on-surface-variant'}">${n.label}</a>`).join('\n')}
        <a href="${root}/cart/index.html" class="block font-bold text-sm tracking-wider text-on-surface-variant">CART</a>
      </div>
    </header>`;
  }


  // ═══════════════════════════════════════════════════════════════
  //  VEHICLE REINFORCEMENT BAR
  //  Shows active vehicle thumbnail + info on product pages to
  //  reinforce that products shown fit the selected vehicle.
  // ═══════════════════════════════════════════════════════════════
  function renderVehicleBar() {
    const barEl = document.getElementById('vehicleReinforcementBar');
    const vehicle = getActiveVehicle();

    if (!vehicle) {
      if (barEl) barEl.classList.add('hidden');
      return;
    }

    if (barEl) {
      barEl.classList.remove('hidden');
      barEl.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 md:px-12 py-3 flex items-center gap-4">
          <div class="w-20 h-12 rounded-md bg-surface-container-lowest flex items-center justify-center overflow-hidden flex-shrink-0 border border-outline-variant/20">
            ${vehicle.image ? `<img src="${vehicle.image}" alt="${vehicle.year} ${vehicle.make} ${vehicle.model}" class="w-full h-full object-cover">` : `<span class="material-symbols-outlined text-on-surface-variant/40">directions_car</span>`}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold text-on-surface">${vehicle.year} ${vehicle.make} ${vehicle.model}</div>
            <div class="text-[11px] text-on-surface-variant">${vehicle.submodel ? vehicle.submodel + ' · ' : ''}Showing products that fit this vehicle exclusively</div>
          </div>
          <button onclick="CWDUI.setActiveVehicle(null)" class="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors tracking-wider uppercase flex-shrink-0">
            CLEAR
          </button>
          <a href="${root}/vehicles/index.html" class="text-xs font-bold text-primary hover:underline tracking-wider uppercase flex-shrink-0">
            CHANGE
          </a>
        </div>`;
    }
  }

  /**
   * Creates the vehicle reinforcement bar element and inserts it
   * after the breadcrumb. Call this on product pages during init.
   */
  function insertVehicleBar(afterElement) {
    if (document.getElementById('vehicleReinforcementBar')) return;

    const bar = document.createElement('div');
    bar.id = 'vehicleReinforcementBar';
    bar.className = 'bg-surface-container-low border-b border-outline-variant/20 hidden';

    if (afterElement && afterElement.parentNode) {
      afterElement.parentNode.insertBefore(bar, afterElement.nextSibling);
    } else {
      const main = document.querySelector('main');
      if (main) main.parentNode.insertBefore(bar, main);
    }

    renderVehicleBar();
  }


  // ═══════════════════════════════════════════════════════════════
  //  LEFT-SIDE FILTER PANEL (Shared component)
  // ═══════════════════════════════════════════════════════════════
  /**
   * Generates a left-side filter panel for product pages.
   * @param {Object} filterConfig - Configuration for filter groups
   *   Each key is a filter group name, value is { label, type: 'checkbox'|'range', options: [] }
   * @param {Function} onFilterChange - Callback when filters change
   * @returns {string} HTML string for the filter sidebar
   */
  function renderFilterPanel(filterGroups) {
    let html = `
    <aside class="lg:col-span-1">
      <div class="bg-surface-container-lowest rounded-xl p-6 space-y-6 sticky top-28 border border-outline-variant/10">
        <h3 class="font-headline font-bold text-lg tracking-tight flex items-center gap-2">
          <span class="material-symbols-outlined text-primary">tune</span>
          FILTERS
        </h3>`;

    filterGroups.forEach(group => {
      html += `
        <div>
          <h4 class="text-xs font-bold tracking-widest text-on-surface-variant uppercase mb-3">${group.label}</h4>
          <div class="space-y-2 max-h-48 overflow-y-auto" id="filter_${group.id}">`;

      if (group.type === 'checkbox' && group.options) {
        group.options.forEach(opt => {
          html += `
            <label class="flex items-center gap-2 cursor-pointer hover:text-primary group">
              <input type="checkbox" class="filter-cb filter-${group.id} rounded border-outline-variant text-primary focus:ring-primary/20" value="${opt.value}" data-group="${group.id}">
              <span class="text-sm group-hover:text-primary transition-colors">${opt.label}</span>
              ${opt.count !== undefined ? `<span class="text-[10px] text-on-surface-variant/60 ml-auto">(${opt.count})</span>` : ''}
            </label>`;
        });
      } else if (group.type === 'select') {
        html += `
          <select class="filter-select w-full bg-surface-container-low border-none rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20" data-group="${group.id}" id="filterSelect_${group.id}">
            <option value="">All ${group.label}</option>
          </select>`;
      }

      html += `
          </div>
        </div>`;
    });

    html += `
        <div class="pt-2 border-t border-outline-variant/20">
          <button id="resetAllFilters" class="w-full bg-surface-container-high text-on-surface py-2.5 rounded-md text-xs font-bold tracking-widest uppercase hover:bg-surface-container-highest transition-colors">
            RESET FILTERS
          </button>
        </div>
      </div>
    </aside>`;

    return html;
  }


  // ═══════════════════════════════════════════════════════════════
  //  FOOTER
  // ═══════════════════════════════════════════════════════════════
  function renderFooter() {
    return `
    <footer class="bg-slate-900 w-full border-t border-slate-800">
      <div class="max-w-7xl mx-auto px-12 py-16">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <div class="mb-4"><img src="/assets/logo-dark-bg.png" alt="Custom Wheel Deal" class="h-20 object-contain"></div>
            <p class="text-slate-400 text-xs leading-relaxed uppercase tracking-tighter">
              The gold standard in automotive performance tires and wheels. Precision engineered.
            </p>
          </div>
          <div>
            <h4 class="text-xs font-bold tracking-widest text-white/60 uppercase mb-4">Shop</h4>
            <div class="space-y-2">
              <a href="${root}/tires/index.html" class="block text-xs text-slate-400 hover:text-white transition-colors">Tires</a>
              <a href="${root}/wheels/index.html" class="block text-xs text-slate-400 hover:text-white transition-colors">Wheels</a>
              <a href="${root}/vehicles/index.html" class="block text-xs text-slate-400 hover:text-white transition-colors">Shop by Vehicle</a>
              <a href="${root}/deals/index.html" class="block text-xs text-slate-400 hover:text-white transition-colors">Deals</a>
            </div>
          </div>
          <div>
            <h4 class="text-xs font-bold tracking-widest text-white/60 uppercase mb-4">Support</h4>
            <div class="space-y-2">
              <a href="#" class="block text-xs text-slate-400 hover:text-white transition-colors">Installer Network</a>
              <a href="#" class="block text-xs text-slate-400 hover:text-white transition-colors">Shipping & Returns</a>
              <a href="#" class="block text-xs text-slate-400 hover:text-white transition-colors">Contact Support</a>
              <a href="#" class="block text-xs text-slate-400 hover:text-white transition-colors">FAQ</a>
            </div>
          </div>
          <div>
            <h4 class="text-xs font-bold tracking-widest text-white/60 uppercase mb-4">Legal</h4>
            <div class="space-y-2">
              <a href="#" class="block text-xs text-slate-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" class="block text-xs text-slate-400 hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
        <div class="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center">
          <span class="text-[10px] text-slate-500 tracking-widest uppercase">&copy; 2026 Custom Wheel Deal. Precision Engineered.</span>
          <div class="flex gap-4 mt-4 md:mt-0">
            <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-[#c2410c] transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-sm">public</span>
            </div>
            <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-[#c2410c] transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-sm">alternate_email</span>
            </div>
          </div>
        </div>
      </div>
    </footer>`;
  }


  // ═══════════════════════════════════════════════════════════════
  //  PRODUCT CARD
  // ═══════════════════════════════════════════════════════════════
  function renderProductCard(product, type) {
    const tags = (product.tags || []).map(t =>
      `<span class="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">${t}</span>`
    ).join('');

    return `
    <div class="group bg-surface-container-lowest rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-outline-variant/10">
      <div class="aspect-square bg-surface-container-low flex items-center justify-center overflow-hidden">
        <img src="${product.image}" alt="${product.name || product.model || product.style}" class="w-3/4 h-3/4 object-contain group-hover:scale-110 transition-transform duration-500"/>
      </div>
      <div class="p-6 space-y-3">
        <div class="text-[10px] font-bold tracking-widest text-primary uppercase">${product.brand}</div>
        <h3 class="font-bold text-lg tracking-tight">${product.model || product.style}</h3>
        <div class="text-sm text-on-surface-variant">${product.size}${product.finish ? ' &middot; ' + product.finish : ''}</div>
        ${tags ? `<div class="flex flex-wrap gap-1">${tags}</div>` : ''}
        <div class="flex items-end justify-between pt-2">
          <div>
            <span class="text-2xl font-bold">$${product.price}</span>
            <span class="text-xs text-on-surface-variant"> /ea</span>
          </div>
          <button onclick="CWDCart.addItem({id:'${product.id}',type:'${type}',name:'${(product.model || product.style || '').replace(/'/g, "\\'")}',brand:'${product.brand}',size:'${product.size}',price:'${product.price}',image:'${product.image}',qty:4}); showToast('Added to cart!')"
            class="signature-gradient text-white px-4 py-2 rounded-md text-[10px] font-bold tracking-widest uppercase hover:opacity-90 transition-all active:scale-95">
            ADD SET OF 4
          </button>
        </div>
        ${product.inStock ? '<div class="text-[10px] text-green-600 font-bold tracking-wider">IN STOCK</div>' : '<div class="text-[10px] text-on-surface-variant font-bold tracking-wider">CALL FOR AVAILABILITY</div>'}
      </div>
    </div>`;
  }

  // ─── BRAND CARD ────────────────────────────────────────────────
  function renderBrandCard(brand, section) {
    const initial = brand.name.charAt(0).toUpperCase();
    return `
    <a href="${root}/${section}/brand.html?brand=${brand.slug}" class="group block bg-surface-container-lowest rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300 border border-outline-variant/10 hover:border-primary/20">
      <div class="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors overflow-hidden">
        ${brand.logo ? `<img src="${brand.logo}" alt="${brand.name}" class="w-14 h-14 object-contain">` : `<span class="text-2xl font-bold text-primary">${initial}</span>`}
      </div>
      <h3 class="font-bold text-lg tracking-tight mb-1">${brand.name}</h3>
      <span class="text-xs text-on-surface-variant">${brand.count || ''} ${brand.count ? 'products' : ''}</span>
    </a>`;
  }


  // ═══════════════════════════════════════════════════════════════
  //  TOAST NOTIFICATION
  // ═══════════════════════════════════════════════════════════════
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 z-[999] bg-on-surface text-white px-6 py-3 rounded-md shadow-xl text-sm font-bold tracking-wider animate-slide-up';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }
  window.showToast = showToast;


  // ═══════════════════════════════════════════════════════════════
  //  PAGE HEAD (shared styles + scripts)
  // ═══════════════════════════════════════════════════════════════
  function getHead(title) {
    return `
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>${title} | Custom Wheel Deal</title>
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"><\/script>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
    <style>
      .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      .signature-gradient { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); }
      body { font-family: 'Inter', sans-serif; background-color: #f9f9fc; color: #1a1c1e; }
      h1, h2, h3, .font-headline { font-family: 'Space Grotesk', sans-serif; }
      @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      .animate-slide-up { animation: slide-up 0.3s ease-out; }
    </style>`;
  }

  // ─── TAILWIND CONFIG ───────────────────────────────────────────
  function getTailwindConfig() {
    return `
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              "primary": "#ea580c", "primary-container": "#c2410c",
              "secondary": "#5a5b84", "secondary-container": "#cecdfd",
              "tertiary": "#543e00", "tertiary-container": "#715400",
              "tertiary-fixed-dim": "#f9bd14",
              "on-surface": "#1a1c1e", "on-surface-variant": "#584141",
              "on-background": "#1a1c1e", "on-primary": "#ffffff",
              "on-secondary-container": "#55567f", "on-tertiary-container": "#ffc73f",
              "surface": "#f9f9fc", "surface-bright": "#f9f9fc",
              "surface-dim": "#dadadc", "surface-variant": "#e2e2e5",
              "surface-container": "#eeeef0", "surface-container-low": "#f3f3f6",
              "surface-container-high": "#e8e8ea", "surface-container-highest": "#e2e2e5",
              "surface-container-lowest": "#ffffff",
              "outline": "#8c7071", "outline-variant": "#e0bfbf",
              "error": "#ba1a1a", "on-error": "#ffffff",
              "inverse-surface": "#2f3133", "inverse-on-surface": "#f0f0f3",
            },
            fontFamily: { "headline": ["Space Grotesk"], "body": ["Inter"], "label": ["Inter"] },
            borderRadius: { "DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem" },
          },
        },
      }
    <\/script>`;
  }

  // ═══════════════════════════════════════════════════════════════
  //  AUTO-INIT — Update garage count on every page load
  // ═══════════════════════════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', () => {
    updateGarageCount();
  });


  return {
    // Header, Footer, Breadcrumb
    renderHeader, renderFooter, renderBreadcrumb,
    // Product cards
    renderProductCard, renderBrandCard,
    // Garage
    getGarage, addToGarage, removeFromGarage, getActiveVehicle, setActiveVehicle,
    toggleGarageDropdown, updateGarageCount,
    // Vehicle bar
    renderVehicleBar, insertVehicleBar,
    // Filter panel
    renderFilterPanel,
    // Utilities
    showToast, getHead, getTailwindConfig, getRoot: () => root,
  };
})();
