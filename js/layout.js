// ─── js/layout.js — global Header + Footer + AppProvider (canonical, from wheels page)
// Loaded after setup.js; depends on: useApp, useState, useEffect, useRef, useContext,
// tokens, AppCtx, useIsMobile (all from setup.js).
// Self-contained primitive components (Icon, Eyebrow, Headline) are defined below so
// pages that don't redeclare them inline (e.g. /about/) still get a working Header/Footer.

function Icon({ name, size = 20, style, fill }) {
  return /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-outlined",
    style: {
      fontSize: size,
      fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0",
      ...style
    }
  }, name);
}
function Eyebrow({ children, color, style }) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: color || tokens.primary,
      ...style
    }
  }, children);
}
function Headline({ children, size = 'h2', style, as }) {
  const fs = { display: 72, h1: 56, h2: 40, h3: 28, h4: 22 }[size] || 40;
  const Tag = as || 'h2';
  return /*#__PURE__*/React.createElement(Tag, {
    style: {
      fontFamily: 'Space Grotesk, sans-serif',
      fontWeight: 700,
      fontSize: fs,
      letterSpacing: '-0.02em',
      lineHeight: 1.05,
      margin: 0,
      textWrap: 'balance',
      ...style
    }
  }, children);
}

function Header() {
  const {
    cart,
    vehicle,
    setVehicle,
    garage,
    removeFromGarage,
    savedPackages,
    removeSavedPackage,
    addToCart,
    navigate,
    route
  } = useApp();
  const count = cart.reduce((s, p) => s + p.qty, 0);
  const [scrolled, setScrolled] = useState(false);
  const [garageOpen, setGarageOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const garageRef = useRef(null);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const onClick = e => {
      if (garageRef.current && !garageRef.current.contains(e.target)) setGarageOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  var _vNavSlug = (vehicle && vehicle.year && vehicle.make && vehicle.model) ? (vehicle.year + '-' + vehicle.make.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '') + '-' + vehicle.model.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '') + (vehicle.submodel ? '-' + vehicle.submodel.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '') : '')) : '';
  const navItems = [['Wheels', '/wheels/'], ['Brands', '/brands/'], ['Packages', '/packages/'], ['Visualizer', '/visualizer/'], ['Rebates', '/rebates/']];
  const iconBtn = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 8,
    background: 'transparent',
    border: 'none',
    color: tokens.ink,
    cursor: 'pointer',
    textDecoration: 'none',
    fontFamily: 'inherit'
  };
  return /*#__PURE__*/React.createElement("header", {
    style: {
      background: scrolled ? 'rgba(17,17,17,.97)' : 'rgba(17,17,17,.92)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.04)'}`,
      position: 'sticky',
      top: 0,
      zIndex: 50
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "resp-header-inner",
    style: { maxWidth: 1320, margin: '0 auto', padding: '8px 32px', display: 'flex', gap: 32, alignItems: 'center' }
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }
  }, /*#__PURE__*/React.createElement("img", {
    src: "/assets/logo-light-bg.png",
    alt: "Custom Wheel Deal",
    style: { height: 44, display: 'block' }
  })), /*#__PURE__*/React.createElement("nav", {
    className: "resp-nav",
    style: { display: 'flex', gap: 26, fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' }
  }, navItems.map(([l, p]) => /*#__PURE__*/React.createElement("a", {
    key: p, href: (_vNavSlug && p === '/wheels/') ? p + '?v=' + _vNavSlug : p,
    style: { color: 'rgba(255,255,255,.82)', textDecoration: 'none', paddingBottom: 2, borderBottom: route.startsWith(p) ? `2px solid ${tokens.primary}` : '2px solid transparent' }
  }, l))), /*#__PURE__*/React.createElement("div", { className: "resp-spacer", style: { flex: 1 } }), /*#__PURE__*/React.createElement("div", {
    ref: garageRef,
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setGarageOpen(o => !o),
    title: "My Garage",
    style: iconBtn
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "garage",
    size: 22,
    style: {
      color: 'rgba(255,255,255,.82)'
    }
  }), garage.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -2,
      right: -4,
      background: tokens.primary,
      color: '#fff',
      borderRadius: 999,
      padding: '1px 5px',
      fontSize: 9,
      fontWeight: 800
    }
  }, garage.length)), garageOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 0,
      top: 'calc(100% + 8px)',
      background: '#fff',
      border: `1px solid ${tokens.line}`,
      borderRadius: 10,
      boxShadow: '0 20px 50px rgba(0,0,0,.18)',
      width: 340,
      zIndex: 60,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: `1px solid ${tokens.lineSoft}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "My Garage"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: tokens.mute,
      fontWeight: 600
    }
  }, garage.length, "/8 vehicles")), garage.length === 0 && savedPackages.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '28px 18px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "no_crash",
    size: 28,
    style: {
      color: tokens.mute
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: tokens.graphite,
      marginTop: 8,
      lineHeight: 1.5
    }
  }, "No vehicles or saved builds yet.")) : /*#__PURE__*/React.createElement(React.Fragment, null, garage.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 260,
      overflowY: 'auto'
    }
  }, garage.map(v => {
    const active = vehicle && vehicle.year === v.year && vehicle.make === v.make && vehicle.model === v.model;
    return /*#__PURE__*/React.createElement("div", {
      key: v.id,
      style: {
        padding: '12px 18px',
        borderBottom: `1px solid ${tokens.lineSoft}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: active ? 'rgba(234,88,12,.04)' : '#fff'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 36,
        height: 36,
        background: active ? tokens.primary : tokens.slate900,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "directions_car",
      size: 18,
      style: {
        color: '#fff'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        cursor: 'pointer',
        minWidth: 0
      },
      onClick: () => {
        setVehicle({
          year: v.year,
          make: v.make,
          model: v.model
        });
        setGarageOpen(false);
        navigate('/shop');
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'Space Grotesk',
        fontWeight: 700,
        fontSize: 14,
        color: tokens.ink,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, v.year, " ", v.make, " ", v.model), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: active ? tokens.primary : tokens.mute,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '.1em',
        marginTop: 2
      }
    }, active ? 'Active · Shop packages' : 'Shop packages')), /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        removeFromGarage(v.id);
      },
      style: {
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: 4,
        color: tokens.mute,
        display: 'flex'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "close",
      size: 16
    })));
  })), savedPackages.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 18px 6px',
      borderTop: `1px solid ${tokens.line}`,
      background: tokens.surfLow
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Saved builds")), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 220,
      overflowY: 'auto'
    }
  }, savedPackages.map(sp => {
    const it = sp.item;
    const payload = sp.type === 'tire' ? {
      id: it.id,
      type: 'tire',
      qty: 4,
      name: `${it.brand} ${it.model}`,
      subtitle: `${it.size} · ${it.season}`,
      price: it.priceEach,
      rawBrand: it.brand,
      rawModel: it.model,
      size: it.size
    } : {
      id: it.id,
      type: 'wheel',
      qty: 4,
      name: `${it.brand} ${it.model}`,
      subtitle: `${it.size} · ${it.finish}`,
      price: it.priceEach,
      rawBrand: it.brand,
      rawModel: it.model,
      size: it.size
    };
    return /*#__PURE__*/React.createElement("div", {
      key: sp.id,
      style: {
        padding: '10px 18px',
        borderBottom: `1px solid ${tokens.lineSoft}`,
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 30,
        height: 30,
        borderRadius: 6,
        background: tokens.ink,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: sp.type === 'tire' ? 'trip' : 'album',
      size: 14,
      style: {
        color: '#fff'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        cursor: 'pointer',
        minWidth: 0
      },
      onClick: () => {
        addToCart(payload, 4);
        setGarageOpen(false);
        navigate('/cart');
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'Space Grotesk',
        fontWeight: 700,
        fontSize: 13,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, sp.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: tokens.mute,
        fontWeight: 600,
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        marginTop: 2
      }
    }, sp.type, " \xB7 Add to cart")), /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        removeSavedPackage(sp.id);
      },
      style: {
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: 4,
        color: tokens.mute,
        display: 'flex'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "close",
      size: 14
    })));
  })))))), /*#__PURE__*/React.createElement("a", {
    href: "/cart/",
    title: "Cart",
    style: iconBtn
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shopping_bag",
    size: 22,
    style: {
      color: 'rgba(255,255,255,.82)'
    }
  }), count > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -2,
      right: -4,
      background: tokens.primary,
      color: '#fff',
      borderRadius: 999,
      padding: '1px 5px',
      fontSize: 9,
      fontWeight: 800
    }
  }, count)),
  isMobile && /*#__PURE__*/React.createElement("button", {
    onClick: function() { setMenuOpen(function(v) { return !v; }); },
    style: { background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,.82)' }
  }, /*#__PURE__*/React.createElement(Icon, { name: menuOpen ? 'close' : 'menu', size: 26 }))),
  isMobile && menuOpen && /*#__PURE__*/React.createElement("div", {
    style: { position: 'fixed', inset: 0, background: '#fff', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '24px 24px 40px' }
  },
    /*#__PURE__*/React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 } },
      /*#__PURE__*/React.createElement("img", { src: "/assets/logo-light-bg.png", alt: "Custom Wheel Deal", style: { height: 40 } }),
      /*#__PURE__*/React.createElement("button", { onClick: function() { setMenuOpen(false); }, style: { background: 'none', border: 'none', cursor: 'pointer', padding: 4 } },
        /*#__PURE__*/React.createElement(Icon, { name: 'close', size: 26 }))
    ),
    navItems.map(function(item) {
      var l = item[0], p = item[1];
      return /*#__PURE__*/React.createElement("a", {
        key: p, href: p, onClick: function() { setMenuOpen(false); },
        style: { display: 'block', fontSize: 24, fontWeight: 700, fontFamily: 'Space Grotesk', padding: '18px 0', borderBottom: '1px solid ' + tokens.line, color: tokens.ink, textDecoration: 'none', letterSpacing: '-.01em' }
      }, l);
    })
  ));
}

// ─────────────── VVS Banner

function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: tokens.slate900,
      color: '#cbd5e1'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1320,
      margin: '0 auto',
      padding: '64px 32px 32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "resp-footer-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      background: tokens.slate900,
      display: 'inline-block',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "/assets/logo-dark-bg.png",
    alt: "Custom Wheel Deal",
    style: {
      height: 52
    }
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      lineHeight: 1.65,
      maxWidth: 320,
      color: '#94a3b8'
    }
  }, "Michigan-owned since 1978. Precision wheel + tire packages for Detroit-area enthusiasts \u2014 installed at one of our three locations, or drop-shipped to your door.")), [
    ['Shop', [
      { label: 'All Packages', href: '/packages/' },
      { label: 'By Vehicle', href: '/shop/' },
      { label: 'By Wheel Brand', href: '/wheels/' },
      { label: 'By Wheel Brand', href: '/wheels/' },
      { label: 'Winter Packages', href: '/packages/' },
      { label: 'Clearance', href: '/deals/' }
    ]],
    ['Services', [
      { label: 'Mounting & Balancing', href: '/services/mounting-balancing/' },
      { label: 'Alignment', href: '/services/alignment/' },
      { label: 'TPMS Reset', href: '/services/tpms/' },
      { label: 'Wheel Repair', href: '/services/wheel-repair/' }
    ]],
    ['Checkout', [
      { label: '25% Deposit Plan', href: '/deposit/' },
      { label: 'Drop-Ship to Home', href: '/drop-ship/' },
      { label: 'Financing', href: '/financing/' }
    ]],
    ['Company', [
      { label: 'About Us', href: '/about/' },
      { label: 'Visual Vehicle Studio', href: '/visualizer/' },
      { label: 'Locations', href: '/locations/' },
      { label: 'Contact', href: '/locations/' }
    ]]
  ].map(([h, links]) => /*#__PURE__*/React.createElement("div", {
    key: h
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    color: "#fff",
    style: {
      marginBottom: 14
    }
  }, h), links.map(l => /*#__PURE__*/React.createElement(l.href ? "a" : "div", {
    key: l.label,
    href: l.href || undefined,
    style: {
      display: 'block',
      fontSize: 13,
      marginBottom: 8,
      color: '#94a3b8',
      cursor: 'pointer',
      textDecoration: 'none'
    }
  }, l.label)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid rgba(255,255,255,.08)',
      padding: '18px 32px',
      fontSize: 11,
      color: '#64748b',
      textAlign: 'center',
      letterSpacing: '.14em',
      textTransform: 'uppercase'
    }
  }, "\xA9 2026 Custom Wheel Deal \xB7 Michigan \xB7 Powered by AutoSync"));
}

// ─── AppProvider (shared app state container — vehicle, cart, garage, etc.)
function AppProvider({
  children,
  defaults
}) {
  const [vehicle, setVehicleRaw] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('htm_vehicle') || 'null');
    } catch {
      return null;
    }
  });
  const [garage, setGarage] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('htm_garage') || '[]');
    } catch {
      return [];
    }
  });
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('htm_cart') || '[]');
    } catch {
      return [];
    }
  });
  const [savedPackages, setSavedPackages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('htm_saved_packages') || '[]');
    } catch {
      return [];
    }
  });
  const [route, setRoute] = useState(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    return path + search;
  });
  const [lastOrder, setLastOrder] = useState(null);
  const [tireBrands, setTireBrands] = useState(window.CWD_DATA.brands);
  const [wheelBrandsList, setWheelBrandsList] = useState(window.CWD_DATA.wheelBrandList);
  const [apiReady, setApiReady] = useState(false);
  useEffect(() => {
    const BRAND_CDN = 'https://storage.googleapis.com/autosync-brand-logos/logos/';
    Promise.allSettled([api.fetchTireBrands(), api.fetchWheelBrands()]).then(([tRes, wRes]) => {
      if (tRes.status === 'fulfilled') {
        const items = extractItems(tRes.value);
        if (items) {
          const apiBrands = items.map(function (b) {
            const name = b.Name || b.name || b.Brand || b.brand || '';
            const logo = b.BrandLogosUrlBase && b.Logo ? b.BrandLogosUrlBase + b.Logo : BRAND_CDN + name.replace(/\s+/g, '_') + '.webp';
            return {
              name: name,
              slug: name,
              logo: logo
            };
          }).filter(function (b) {
            return b.name;
          });
          if (apiBrands.length > 0) {
            console.log('[CWD] Loaded', apiBrands.length, 'tire brands from API');
            setTireBrands(apiBrands);
            window.CWD_DATA.brands = apiBrands;
          }
        } else {
          console.warn('[CWD] Tire brands: no items found. Keys:', tRes.value ? Object.keys(tRes.value) : 'null');
        }
      } else {
        console.warn('[CWD] Tire brands API failed:', tRes.reason);
      }
      if (wRes.status === 'fulfilled') {
        const items = extractItems(wRes.value);
        if (items) {
          const apiWheelBrands = items.map(function (b) {
            const name = b.Name || b.name || b.Brand || b.brand || '';
            return {
              name: name,
              logo: b.BrandLogosUrlBase && b.Logo ? b.BrandLogosUrlBase + b.Logo : BRAND_CDN + name.replace(/\s+/g, '_') + '.webp'
            };
          }).filter(function (b) {
            return b.name;
          });
          if (apiWheelBrands.length > 0) {
            console.log('[CWD] Loaded', apiWheelBrands.length, 'wheel brands from API');
            setWheelBrandsList(apiWheelBrands);
            window.CWD_DATA.wheelBrandList = apiWheelBrands;
            window.CWD_DATA.wheelBrands = apiWheelBrands.map(function (b) {
              return b.name;
            });
          }
        } else {
          console.warn('[CWD] Wheel brands: no items found. Keys:', wRes.value ? Object.keys(wRes.value) : 'null');
        }
      } else {
        console.warn('[CWD] Wheel brands API failed:', wRes.reason);
      }
      setApiReady(true);
    });
  }, []);
  const setVehicle = v => {
    setVehicleRaw(v);
    if (v && v.year && v.make && v.model) {
      setGarage(prev => {
        const key = `${v.year}|${v.make}|${v.model}`;
        const filtered = prev.filter(p => `${p.year}|${p.make}|${p.model}` !== key);
        return [{
          ...v,
          id: key,
          addedAt: Date.now()
        }, ...filtered].slice(0, 8);
      });
    }
  };
  const removeFromGarage = id => setGarage(prev => prev.filter(p => p.id !== id));
  useEffect(() => {
    localStorage.setItem('htm_vehicle', JSON.stringify(vehicle));
  }, [vehicle]);
  useEffect(() => {
    if (!vehicle || !vehicle.year || !vehicle.make || !vehicle.model) return;
    var _mS = vehicle.make.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    var _mdS = vehicle.model.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    var _smS = vehicle.submodel ? vehicle.submodel.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '') : '';
    var _slug = vehicle.year + '-' + _mS + '-' + _mdS + (_smS ? '-' + _smS : '');
    var _cur = new URLSearchParams(window.location.search).get('v');
    if (_cur !== _slug) { try { history.replaceState(null, '', window.location.pathname + '?v=' + _slug); } catch(e) {} }
  }, [vehicle]);
  useEffect(() => {
    localStorage.setItem('htm_garage', JSON.stringify(garage));
  }, [garage]);
  useEffect(() => {
    localStorage.setItem('htm_cart', JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    localStorage.setItem('htm_saved_packages', JSON.stringify(savedPackages));
  }, [savedPackages]);
  useEffect(() => {
    const h = () => {
      try {
        setSavedPackages(JSON.parse(localStorage.getItem('htm_saved_packages') || '[]'));
      } catch {}
    };
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, []);
  const removeSavedPackage = id => setSavedPackages(prev => prev.filter(p => p.id !== id));
  const refreshSavedPackages = () => {
    try {
      setSavedPackages(JSON.parse(localStorage.getItem('htm_saved_packages') || '[]'));
    } catch {}
  };
  // Sync Medusa lineItemIds on mount so remove/update can reference them
  useEffect(function() {
    if (!window.CWDCart) return;
    CWDCart.getItems().then(function(medusaItems) {
      if (!medusaItems || !medusaItems.length) return;
      setCart(function(prev) {
        if (!prev.length) return medusaItems;
        return prev.map(function(p) {
          var mi = medusaItems.find(function(m) { return m.id === p.id; });
          return mi ? Object.assign({}, p, { lineItemId: mi.lineItemId }) : p;
        });
      });
    }).catch(function() {});
  }, []);

  const addToCart = async (pkg, qty = 1) => {
    setCart(prev => {
      const hit = prev.find(p => p.id === pkg.id);
      if (hit) return prev.map(p => p.id === pkg.id ? { ...p, qty: p.qty + qty } : p);
      return [...prev, { ...pkg, qty }];
    });
    if (window.CWDCart) {
      try {
        await CWDCart.addItem({ ...pkg, qty });
        const medusaItems = await CWDCart.getItems();
        if (medusaItems) {
          setCart(prev => prev.map(p => {
            const mi = medusaItems.find(m => m.id === p.id);
            return mi ? { ...p, lineItemId: mi.lineItemId } : p;
          }));
        }
      } catch(e) { console.warn('[Cart] Medusa sync failed:', e); }
    }
  };
  const updateQty = async (id, qty) => {
    const item = cart.find(p => p.id === id);
    if (qty <= 0) {
      setCart(prev => prev.filter(p => p.id !== id));
      if (window.CWDCart && item && item.lineItemId) {
        CWDCart.removeItem(item.lineItemId).catch(function() {});
      }
      return;
    }
    setCart(prev => prev.map(p => p.id === id ? { ...p, qty } : p));
    if (window.CWDCart && item && item.lineItemId) {
      try { await CWDCart.updateQty(item.lineItemId, qty); } catch(e) { console.warn('[Cart] Medusa update failed:', e); }
    }
  };
  const removeItem = id => {
    const item = cart.find(p => p.id === id);
    setCart(prev => prev.filter(p => p.id !== id));
    if (window.CWDCart && item && item.lineItemId) {
      CWDCart.removeItem(item.lineItemId).catch(function(e) { console.warn('[Cart] Medusa remove failed:', e); });
    }
  };
  const clearCart = () => {
    setCart([]);
    if (window.CWDCart) CWDCart.clear().catch(function() {});
  };
  const navigate = r => {
    const routeMap = {
      '/': '/index.html',
      '/shop': '/shop/',
      '/tires': '/tires/',
      '/wheels': '/wheels/',
      '/packages': '/packages/',
      '/rebates': '/rebates/',
      '/cart': '/cart/',
      '/checkout': '/checkout/'
    };
    if (r.startsWith('/tire/')) {
      window.location.href = '/tires/' + '?product=' + r.split('/')[2];
      return;
    }
    if (r.startsWith('/wheel/')) {
      window.location.href = '/wheels/';
      return;
    }
    if (r.startsWith('/package/')) {
      window.location.href = '/packages/' + '?product=' + r.split('/')[2];
      return;
    }
    if (r.startsWith('/rebate/')) {
      window.location.href = '/rebates/' + '?rebate=' + r.split('/')[2];
      return;
    }
    if (r === '/vvs') {
      window.location.href = '/shop/?vvs=1';
      return;
    }
    const dest = routeMap[r] || r;
    window.location.href = dest;
  };
  return /*#__PURE__*/React.createElement(AppCtx.Provider, {
    value: {
      vehicle,
      setVehicle,
      garage,
      removeFromGarage,
      savedPackages,
      removeSavedPackage,
      refreshSavedPackages,
      cart,
      addToCart,
      updateQty,
      removeItem,
      clearCart,
      route,
      navigate,
      lastOrder,
      setLastOrder,
      defaults,
      tireBrands,
      wheelBrandsList,
      apiReady
    }
  }, children);
}

Object.assign(window, {
  Header: Header,
  Footer: Footer,
  AppProvider: AppProvider,
  Icon: Icon,
  Eyebrow: Eyebrow,
  Headline: Headline
});
