// ─────────────── App Shell Components
// No imports — relies on globals from setup.js (React hooks, tokens, AppCtx, useApp)
// and components.jsx (Icon, Btn, Eyebrow, Headline, Stars)

function AppProvider({ children, defaults }) {
  const [vehicle, setVehicleRaw] = useState(() => { try { return JSON.parse(localStorage.getItem('htm_vehicle') || 'null'); } catch { return null; } });
  const [garage, setGarage] = useState(() => { try { return JSON.parse(localStorage.getItem('htm_garage') || '[]'); } catch { return []; } });
  const [cart, setCart] = useState(() => { try { return JSON.parse(localStorage.getItem('htm_cart') || '[]'); } catch { return []; } });
  const [savedPackages, setSavedPackages] = useState(() => { try { return JSON.parse(localStorage.getItem('htm_saved_packages') || '[]'); } catch { return []; } });
  const [route, setRoute] = useState(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    return path + search;
  });
  const [lastOrder, setLastOrder] = useState(null);

  // API-loaded brand lists
  const [tireBrands, setTireBrands] = useState(window.HOLBROOK_DATA.brands);
  const [wheelBrandsList, setWheelBrandsList] = useState(window.HOLBROOK_DATA.wheelBrandList);
  const [apiReady, setApiReady] = useState(false);

  // Load brand data from API on mount
  useEffect(() => {
    const BRAND_CDN = 'https://storage.googleapis.com/autosync-brand-logos/logos/';
    Promise.allSettled([
      api.fetchTireBrands(),
      api.fetchWheelBrands(),
    ]).then(([tRes, wRes]) => {
      if (tRes.status === 'fulfilled') {
        const items = extractItems(tRes.value);
        if (items) {
          const apiBrands = items.map(function(b) {
            const name = b.Name || b.name || b.Brand || b.brand || '';
            const logo = (b.BrandLogosUrlBase && b.Logo) ? b.BrandLogosUrlBase + b.Logo : BRAND_CDN + name + '.webp';
            return { name: name, slug: name, logo: logo };
          }).filter(function(b) { return b.name; });
          if (apiBrands.length > 0) {
            console.log('[Holbrook] Loaded', apiBrands.length, 'tire brands from API');
            setTireBrands(apiBrands);
            window.HOLBROOK_DATA.brands = apiBrands;
          }
        } else {
          console.warn('[Holbrook] Tire brands: no items found. Keys:', tRes.value ? Object.keys(tRes.value) : 'null');
        }
      } else {
        console.warn('[Holbrook] Tire brands API failed:', tRes.reason);
      }
      if (wRes.status === 'fulfilled') {
        const items = extractItems(wRes.value);
        if (items) {
          const apiWheelBrands = items.map(function(b) {
            const name = b.Name || b.name || b.Brand || b.brand || '';
            return { name: name, logo: (b.BrandLogosUrlBase && b.Logo) ? b.BrandLogosUrlBase + b.Logo : BRAND_CDN + name + '.webp' };
          }).filter(function(b) { return b.name; });
          if (apiWheelBrands.length > 0) {
            console.log('[Holbrook] Loaded', apiWheelBrands.length, 'wheel brands from API');
            setWheelBrandsList(apiWheelBrands);
            window.HOLBROOK_DATA.wheelBrandList = apiWheelBrands;
            window.HOLBROOK_DATA.wheelBrands = apiWheelBrands.map(function(b) { return b.name; });
          }
        } else {
          console.warn('[Holbrook] Wheel brands: no items found. Keys:', wRes.value ? Object.keys(wRes.value) : 'null');
        }
      } else {
        console.warn('[Holbrook] Wheel brands API failed:', wRes.reason);
      }
      setApiReady(true);
    });
  }, []);

  const setVehicle = (v) => {
    setVehicleRaw(v);
    if (v && v.year && v.make && v.model) {
      setGarage(prev => {
        const key = `${v.year}|${v.make}|${v.model}`;
        const filtered = prev.filter(p => `${p.year}|${p.make}|${p.model}` !== key);
        return [{ ...v, id: key, addedAt: Date.now() }, ...filtered].slice(0, 8);
      });
    }
  };
  const removeFromGarage = (id) => setGarage(prev => prev.filter(p => p.id !== id));

  useEffect(() => { localStorage.setItem('htm_vehicle', JSON.stringify(vehicle)); }, [vehicle]);
  useEffect(() => { localStorage.setItem('htm_garage', JSON.stringify(garage)); }, [garage]);
  useEffect(() => { localStorage.setItem('htm_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('htm_saved_packages', JSON.stringify(savedPackages)); }, [savedPackages]);

  useEffect(() => {
    const h = () => { try { setSavedPackages(JSON.parse(localStorage.getItem('htm_saved_packages') || '[]')); } catch {} };
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, []);

  const removeSavedPackage = (id) => setSavedPackages(prev => prev.filter(p => p.id !== id));
  const refreshSavedPackages = () => { try { setSavedPackages(JSON.parse(localStorage.getItem('htm_saved_packages') || '[]')); } catch {} };

  const addToCart = (pkg, qty = 1) => setCart(prev => {
    const hit = prev.find(p => p.id === pkg.id);
    if (hit) return prev.map(p => p.id === pkg.id ? { ...p, qty: p.qty + qty } : p);
    return [...prev, { ...pkg, qty }];
  });
  const updateQty = (id, qty) => setCart(prev => prev.map(p => p.id === id ? { ...p, qty } : p).filter(p => p.qty > 0));
  const removeItem = (id) => setCart(prev => prev.filter(p => p.id !== id));
  const clearCart = () => setCart([]);

  const navigate = (r) => {
    // Map routes to real page URLs
    const routeMap = {
      '/': '/index.html',
      '/shop': '/shop/',
      '/tires': '/tires/',
      '/wheels': '/wheels/',
      '/packages': '/packages/',
      '/rebates': '/rebates/',
      '/cart': '/cart/',
      '/checkout': '/checkout/',
    };
    // Check for product detail routes
    if (r.startsWith('/tire/')) {
      window.location.href = '/tires/' + '?product=' + r.split('/')[2];
      return;
    }
    if (r.startsWith('/wheel/')) {
      window.location.href = '/wheels/' + '?product=' + r.split('/')[2];
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

  return (
    <AppCtx.Provider value={{ vehicle, setVehicle, garage, removeFromGarage, savedPackages, removeSavedPackage, refreshSavedPackages, cart, addToCart, updateQty, removeItem, clearCart, route, navigate, lastOrder, setLastOrder, defaults, tireBrands, wheelBrandsList, apiReady }}>
      {children}
    </AppCtx.Provider>
  );
}

// ─────────────── Header
function Header() {
  const { cart, vehicle, setVehicle, garage, removeFromGarage, savedPackages, removeSavedPackage, addToCart, navigate, route } = useApp();
  const count = cart.reduce((s,p) => s + p.qty, 0);
  const [scrolled, setScrolled] = useState(false);
  const [garageOpen, setGarageOpen] = useState(false);
  const garageRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const onClick = (e) => { if (garageRef.current && !garageRef.current.contains(e.target)) setGarageOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const navItems = [
    ['Tires', '/tires/'],
    ['Wheels', '/wheels/'],
    ['Packages', '/packages/'],
    ['Rebates', '/rebates/'],
  ];

  const iconBtn = {
    position:'relative', display:'flex', alignItems:'center', justifyContent:'center',
    width: 36, height: 36, borderRadius: 8, background:'transparent', border:'none',
    color: tokens.ink, cursor:'pointer', textDecoration:'none', fontFamily:'inherit',
  };

  return (
    <header style={{
      background: scrolled ? 'rgba(249,249,252,.96)' : 'rgba(249,249,252,.85)',
      backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
      borderBottom: `1px solid ${scrolled ? 'rgba(0,0,0,.08)' : 'rgba(0,0,0,.04)'}`,
      position:'sticky', top:0, zIndex: 50,
    }}>
      <div style={{ maxWidth: 1320, margin:'0 auto', padding:'8px 32px', display:'flex', gap: 32, alignItems:'center' }}>
        <a href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <img src="assets/logo-light-bg.png" alt="Holbrook Tire Center" style={{ height: 44, display:'block' }} />
        </a>
        <nav style={{ display:'flex', gap: 26, fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform:'uppercase' }}>
          {navItems.map(([l,p]) => (
            <a key={p} href={p} style={{ color: tokens.ink, textDecoration:'none', paddingBottom: 2, borderBottom: route.startsWith(p) ? `2px solid ${tokens.primary}` : '2px solid transparent' }}>{l}</a>
          ))}
        </nav>
        <div style={{ flex: 1 }} />

        {/* Garage icon button */}
        <div ref={garageRef} style={{ position:'relative' }}>
          <button onClick={() => setGarageOpen(o => !o)} title="My Garage" style={iconBtn}>
            <Icon name="garage" size={22} style={{ color: tokens.ink }} />
            {garage.length > 0 && (
              <span style={{ position:'absolute', top:-2, right:-4, background: tokens.primary, color:'#fff', borderRadius: 999, padding:'1px 5px', fontSize: 9, fontWeight: 800 }}>{garage.length}</span>
            )}
          </button>
          {garageOpen && (
            <div style={{ position:'absolute', right: 0, top:'calc(100% + 8px)', background:'#fff', border:`1px solid ${tokens.line}`, borderRadius: 10, boxShadow:'0 20px 50px rgba(0,0,0,.18)', width: 340, zIndex: 60, overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:`1px solid ${tokens.lineSoft}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <Eyebrow>My Garage</Eyebrow>
                <span style={{ fontSize: 11, color: tokens.mute, fontWeight: 600 }}>{garage.length}/8 vehicles</span>
              </div>
              {garage.length === 0 && savedPackages.length === 0 ? (
                <div style={{ padding:'28px 18px', textAlign:'center' }}>
                  <Icon name="no_crash" size={28} style={{ color: tokens.mute }} />
                  <div style={{ fontSize: 13, color: tokens.graphite, marginTop: 8, lineHeight: 1.5 }}>No vehicles or saved builds yet.</div>
                </div>
              ) : (
                <>
                  {garage.length > 0 && <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                    {garage.map(v => {
                      const active = vehicle && vehicle.year===v.year && vehicle.make===v.make && vehicle.model===v.model;
                      return (
                        <div key={v.id} style={{ padding:'12px 18px', borderBottom:`1px solid ${tokens.lineSoft}`, display:'flex', alignItems:'center', gap: 12, background: active ? 'rgba(133,8,36,.04)' : '#fff' }}>
                          <div style={{ width: 36, height: 36, background: active ? tokens.primary : tokens.slate900, borderRadius: 6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0 }}>
                            <Icon name="directions_car" size={18} style={{ color:'#fff' }} />
                          </div>
                          <div style={{ flex: 1, cursor:'pointer', minWidth: 0 }} onClick={()=>{ setVehicle({ year: v.year, make: v.make, model: v.model }); setGarageOpen(false); navigate('/shop'); }}>
                            <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 14, color: tokens.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v.year} {v.make} {v.model}</div>
                            <div style={{ fontSize: 11, color: active ? tokens.primary : tokens.mute, fontWeight: 600, textTransform:'uppercase', letterSpacing:'.1em', marginTop: 2 }}>{active ? 'Active · Shop packages' : 'Shop packages'}</div>
                          </div>
                          <button onClick={(e)=>{ e.stopPropagation(); removeFromGarage(v.id); }} style={{ border:'none', background:'transparent', cursor:'pointer', padding: 4, color: tokens.mute, display:'flex' }}>
                            <Icon name="close" size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>}
                  {savedPackages.length > 0 && (
                    <>
                      <div style={{ padding:'10px 18px 6px', borderTop:`1px solid ${tokens.line}`, background: tokens.surfLow }}>
                        <Eyebrow>Saved builds</Eyebrow>
                      </div>
                      <div style={{ maxHeight: 220, overflowY:'auto' }}>
                        {savedPackages.map(sp => {
                          const it = sp.item;
                          const payload = sp.type === 'tire' ? {
                            id: it.id, type:'tire', qty: 4, name: `${it.brand} ${it.model}`, subtitle: `${it.size} · ${it.season}`, price: it.priceEach, rawBrand: it.brand, rawModel: it.model, size: it.size,
                          } : {
                            id: it.id, type:'wheel', qty: 4, name: `${it.brand} ${it.model}`, subtitle: `${it.size} · ${it.finish}`, price: it.priceEach, rawBrand: it.brand, rawModel: it.model, size: it.size,
                          };
                          return (
                            <div key={sp.id} style={{ padding:'10px 18px', borderBottom:`1px solid ${tokens.lineSoft}`, display:'flex', alignItems:'center', gap: 10 }}>
                              <div style={{ width: 30, height: 30, borderRadius: 6, background: tokens.ink, display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0 }}>
                                <Icon name={sp.type === 'tire' ? 'trip' : 'album'} size={14} style={{ color:'#fff' }}/>
                              </div>
                              <div style={{ flex: 1, cursor:'pointer', minWidth: 0 }} onClick={()=>{ addToCart(payload, 4); setGarageOpen(false); navigate('/cart'); }}>
                                <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{sp.name}</div>
                                <div style={{ fontSize: 10, color: tokens.mute, fontWeight: 600, letterSpacing:'.1em', textTransform:'uppercase', marginTop: 2 }}>{sp.type} · Add to cart</div>
                              </div>
                              <button onClick={(e)=>{ e.stopPropagation(); removeSavedPackage(sp.id); }} style={{ border:'none', background:'transparent', cursor:'pointer', padding: 4, color: tokens.mute, display:'flex' }}>
                                <Icon name="close" size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <a href="/cart/" title="Cart" style={iconBtn}>
          <Icon name="shopping_bag" size={22} style={{ color: tokens.ink }} />
          {count > 0 && (
            <span style={{ position:'absolute', top:-2, right:-4, background: tokens.primary, color:'#fff', borderRadius: 999, padding:'1px 5px', fontSize: 9, fontWeight: 800 }}>{count}</span>
          )}
        </a>
      </div>
    </header>
  );
}

// ─────────────── VVS Banner
function VVSBanner() {
  const { navigate, route } = useApp();
  if (route === '/' || route === '' || route === '/vvs') return null;
  return (
    <div style={{ background:'linear-gradient(90deg, #0f172a 0%, #1e293b 60%, #850824 100%)', color:'#fff' }}>
      <div style={{ maxWidth: 1320, margin:'0 auto', padding:'12px 32px', display:'flex', alignItems:'center', gap: 16, justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 14 }}>
          <span style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 15, letterSpacing:'-.01em' }}>See it on your vehicle first.</span>
          <span style={{ fontSize: 13, color:'#cbd5e1' }}>Preview any wheel + tire combo in the Visual Vehicle Studio.</span>
        </div>
        <button onClick={()=>navigate('/vvs')} style={{
          display:'inline-flex', alignItems:'center', gap: 8, padding:'8px 16px',
          background: tokens.primary, color:'#fff', border:'none', borderRadius: 6,
          fontSize: 11, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase',
          cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
        }}>
          <Icon name="view_in_ar" size={15} />
          Launch Studio
        </button>
      </div>
    </div>
  );
}

// ─────────────── Locations strip
function LocationsStrip() {
  const { locations } = window.HOLBROOK_DATA;
  return (
    <section style={{ background:'#fff', padding:'72px 32px 64px', borderTop: `1px solid ${tokens.lineSoft}` }}>
      <div style={{ maxWidth: 1320, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom: 40 }}>
          <Eyebrow color={tokens.primary} style={{ marginBottom: 8 }}>Three Michigan locations</Eyebrow>
          <Headline size="h2" style={{ fontSize: 32, margin: 0 }}>Installed by people who know your car.</Headline>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 20 }}>
          {locations.map(l => (
            <div key={l.id} style={{
              background: tokens.surfLow,
              borderRadius: 14,
              padding: '28px 28px',
              display:'flex', flexDirection:'column', gap: 14,
            }}>
              <Eyebrow color={tokens.primary}>Holbrook · {l.city}</Eyebrow>
              <div style={{ fontFamily:'Space Grotesk', fontSize: 20, fontWeight: 700, letterSpacing:'-.01em', color: tokens.ink, lineHeight: 1.3 }}>
                {l.addr}
              </div>
              <div style={{ fontSize: 14, color: tokens.taupe, lineHeight: 1.6 }}>
                {l.city}, MI {l.zip}<br/>
                <span style={{ color: tokens.mute }}>{l.hours}</span>
              </div>
              <a href={`tel:${l.phoneTel}`} style={{
                color: tokens.primary, fontSize: 17, fontWeight: 700,
                textDecoration:'none', fontFamily:'Space Grotesk',
                marginTop: 'auto', display:'inline-flex', alignItems:'center', gap: 8,
              }}>
                <Icon name="call" size={16} /> {l.phone}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────── Footer
function Footer() {
  return (
    <footer style={{ background: tokens.slate900, color: '#cbd5e1' }}>
      <div style={{ maxWidth: 1320, margin:'0 auto', padding:'64px 32px 32px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', gap: 40 }}>
          <div>
            <div style={{ background: tokens.slate900, display:'inline-block', marginBottom: 18 }}>
              <img src="assets/logo-dark-bg.png" alt="Holbrook Tires" style={{ height: 52 }} />
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.65, maxWidth: 320, color:'#94a3b8' }}>
              Michigan-owned since 1978. Precision wheel + tire packages for Detroit-area enthusiasts — installed at one of our three locations, or drop-shipped to your door.
            </p>
          </div>
          {[
            ['Shop', ['All Packages','By Vehicle','By Wheel Brand','By Tire Brand','Winter Packages','Clearance']],
            ['Services', ['Install & Balance','Road Force Balance','Alignment','TPMS Reset','Wheel Repair']],
            ['Checkout', ['25% Deposit Plan','Drop-Ship to Home','Affirm Financing','Klarna','Synchrony Car Care']],
            ['Company', ['About Holbrook','Visual Vehicle Studio','Locations','Contact']],
          ].map(([h, links]) => (
            <div key={h}>
              <Eyebrow color="#fff" style={{ marginBottom: 14 }}>{h}</Eyebrow>
              {links.map(l => <div key={l} style={{ fontSize: 13, marginBottom: 8, color:'#94a3b8', cursor:'pointer' }}>{l}</div>)}
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop:'1px solid rgba(255,255,255,.08)', padding:'18px 32px', fontSize: 11, color:'#64748b', textAlign:'center', letterSpacing:'.14em', textTransform:'uppercase' }}>
        &copy; 2026 Holbrook Tire Center &middot; Michigan &middot; Powered by AutoSync
      </div>
    </footer>
  );
}

// ─────────────── Global Fitment Bar
function GlobalFitmentBar() {
  const { vehicle, setVehicle, navigate, route } = useApp();
  const YEARS = useMemo(() => { const y = [], c = 2027; for (let i = c; i >= 2000; i--) y.push(i); return y; }, []);
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [submodel, setSubmodel] = useState('');
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [submodels, setSubmodels] = useState([]);
  const [makesLoading, setMakesLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [submodelsLoading, setSubmodelsLoading] = useState(false);

  // Static fallback makes (always available)
  const staticMakes = window.HOLBROOK_DATA.vehicleMakes.map(function(m) { return m.name; });

  useEffect(() => {
    if (!year) { setMakes([]); setMake(''); return; }
    setMakesLoading(true);
    api.fetchVehicleMakes(year).then(data => {
      const items = extractItems(data);
      if (items) {
        const names = items.map(extractName).filter(Boolean);
        console.log('[Fitment] Makes from API:', names.length, names.slice(0,5));
        setMakes(names.length > 0 ? names : staticMakes);
      } else {
        console.warn('[Fitment] No makes items in response, using static. Response keys:', data ? Object.keys(data) : 'null');
        setMakes(staticMakes);
      }
    }).catch(function(err) {
      console.warn('[Fitment] Makes API failed, using static fallback:', err.message || err);
      setMakes(staticMakes);
    }).finally(() => setMakesLoading(false));
    setMake(''); setModel(''); setSubmodel('');
  }, [year]);

  useEffect(() => {
    if (!make) { setModels([]); setModel(''); return; }
    setModelsLoading(true);
    api.fetchVehicleModels(year, make).then(data => {
      const items = extractItems(data);
      if (items) {
        const names = items.map(extractName).filter(Boolean);
        console.log('[Fitment] Models from API:', names.length, names.slice(0,5));
        setModels(names);
      } else {
        console.warn('[Fitment] No model items in response. Response keys:', data ? Object.keys(data) : 'null');
        setModels([]);
      }
    }).catch(function(err) {
      console.warn('[Fitment] Models API failed:', err.message || err);
      setModels([]);
    }).finally(() => setModelsLoading(false));
    setModel(''); setSubmodel('');
  }, [make]);

  useEffect(() => {
    if (!model) { setSubmodels([]); setSubmodel(''); return; }
    setSubmodelsLoading(true);
    api.fetchVehicleSubmodels(year, make, model).then(data => {
      const items = extractItems(data);
      if (items) {
        const names = items.map(extractName).filter(Boolean);
        console.log('[Fitment] Submodels from API:', names.length, names);
        setSubmodels(names);
      } else {
        console.warn('[Fitment] No submodel items in response. Response keys:', data ? Object.keys(data) : 'null');
        setSubmodels([]);
      }
    }).catch(function(err) {
      console.warn('[Fitment] Submodels API failed:', err.message || err);
      setSubmodels([]);
    }).finally(() => setSubmodelsLoading(false));
    setSubmodel('');
  }, [model]);

  const go = () => { if (year && make && model) { setVehicle({ year, make, model, submodel: submodel || undefined }); navigate('/shop'); } };
  const barBg = 'linear-gradient(90deg, #5e0519 0%, #7a0820 45%, #850824 100%)';
  const barBorder = '1px solid rgba(255,255,255,.08)';
  const barShadow = 'inset 0 -1px 0 rgba(0,0,0,.35), 0 1px 0 rgba(232,52,78,.15)';
  const fld = {
    background: 'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.18)',
    padding:'10px 32px 10px 14px', fontFamily:'Inter', fontSize: 13, fontWeight: 600,
    color: '#fff', appearance:'none', borderRadius: 6, minWidth: 130, cursor:'pointer',
  };

  if (vehicle) {
    return (
      <div style={{ background: barBg, borderBottom: barBorder, boxShadow: barShadow, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 100% 50%, rgba(232,52,78,.25) 0%, transparent 55%)', pointerEvents:'none' }} />
        <div style={{ maxWidth: 1320, margin:'0 auto', padding:'18px 32px', display:'flex', alignItems:'center', gap: 20, flexWrap:'wrap', position:'relative' }}>
          <div style={{ width: 38, height: 38, background:'rgba(255,255,255,.14)', border:'1px solid rgba(255,255,255,.2)', borderRadius: 8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name="directions_car" size={22} style={{ color:'#fff' }} />
          </div>
          <div style={{ flex: 1, lineHeight: 1.2 }}>
            <div style={{ fontFamily:'Inter', fontSize: 11, fontWeight: 700, letterSpacing:'.18em', textTransform:'uppercase', color:'rgba(255,255,255,.7)' }}>Showing packages that fit</div>
            <div style={{ fontFamily:'Space Grotesk', fontSize: 22, fontWeight: 700, letterSpacing:'-.01em', color:'#fff', marginTop: 2 }}>
              {vehicle.year} <span style={{ fontWeight: 500 }}>{vehicle.make}</span> {vehicle.model}
            </div>
          </div>
          <button onClick={()=>navigate('/shop')} style={{
            display:'inline-flex', alignItems:'center', gap: 8, padding:'9px 18px',
            background: tokens.yellow, color: tokens.ink,
            border:'none', borderRadius: 6,
            fontSize: 11, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase',
            cursor:'pointer', fontFamily:'inherit',
          }}>
            <Icon name="storefront" size={14} />
            Shop Now
          </button>
          <button onClick={()=>{ setVehicle(null); }} style={{
            display:'inline-flex', alignItems:'center', gap: 8, padding:'9px 16px',
            background:'rgba(255,255,255,.12)', color:'#fff',
            border:'1px solid rgba(255,255,255,.25)', borderRadius: 6,
            fontSize: 11, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase',
            cursor:'pointer', fontFamily:'inherit',
            transition:'all .15s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,.2)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,.12)'; }}>
            <Icon name="autorenew" size={14} />
            Change vehicle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: barBg, borderBottom: barBorder, boxShadow: barShadow, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 100% 50%, rgba(232,52,78,.22) 0%, transparent 55%)', pointerEvents:'none' }} />
      <div style={{ maxWidth: 1320, margin:'0 auto', padding:'12px 32px', display:'flex', alignItems:'center', gap: 14, flexWrap:'wrap', position:'relative' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap: 10, paddingRight: 14, borderRight: '1px solid rgba(255,255,255,.18)' }}>
          <Icon name="tire_repair" size={20} style={{ color:'#fff' }} />
          <span style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 13, color:'#fff', letterSpacing:'.06em', textTransform:'uppercase' }}>Find your fitment</span>
        </div>
        <div style={{ flex: 1, minWidth: 320, display:'flex', gap: 8, justifyContent:'flex-end', flexWrap:'wrap' }}>
          <select value={year} onChange={e=>setYear(e.target.value)} style={fld}>
            <option value="" style={{ color:'#000' }}>Year</option>
            {YEARS.map(y => <option key={y} style={{ color:'#000' }}>{y}</option>)}
          </select>
          <select value={make} onChange={e=>setMake(e.target.value)} disabled={!year || makesLoading} style={{ ...fld, opacity: year ? 1 : .4 }}>
            <option value="" style={{ color:'#000' }}>{makesLoading ? 'Loading...' : 'Make'}</option>
            {makes.map(m => <option key={m} style={{ color:'#000' }}>{m}</option>)}
          </select>
          <select value={model} onChange={e=>setModel(e.target.value)} disabled={!make || modelsLoading} style={{ ...fld, opacity: make ? 1 : .4 }}>
            <option value="" style={{ color:'#000' }}>{modelsLoading ? 'Loading...' : 'Model'}</option>
            {models.map(m => <option key={m} style={{ color:'#000' }}>{m}</option>)}
          </select>
          {submodels.length > 0 && (
            <select value={submodel} onChange={e=>setSubmodel(e.target.value)} disabled={submodelsLoading} style={{ ...fld }}>
              <option value="" style={{ color:'#000' }}>{submodelsLoading ? 'Loading...' : 'Submodel'}</option>
              {submodels.map(s => <option key={s} style={{ color:'#000' }}>{s}</option>)}
            </select>
          )}
          <button onClick={go} disabled={!year||!make||!model} style={{
            display:'inline-flex', alignItems:'center', gap: 6, padding:'10px 18px',
            background: (!year||!make||!model) ? 'rgba(255,255,255,.12)' : tokens.yellow,
            color: (!year||!make||!model) ? 'rgba(255,255,255,.6)' : tokens.ink,
            border:'none', borderRadius: 6, fontSize: 11, fontWeight: 800, letterSpacing:'.14em',
            textTransform:'uppercase', cursor: (!year||!make||!model) ? 'not-allowed' : 'pointer', fontFamily:'inherit',
          }}>
            Find packages <Icon name="arrow_forward" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AppProvider, Header, VVSBanner, LocationsStrip, Footer, GlobalFitmentBar });
