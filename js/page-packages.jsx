// ─────────────── PagePackages.jsx
// No imports — relies on globals from setup.js (React hooks, tokens, AppCtx, useApp)
// and components.jsx (Icon, Btn, Eyebrow, Headline, Stars, FilterBlock, WheelSvg, PackageCard)

function PackagesPage() {
  const { packages, categories } = window.HOLBROOK_DATA;
  const { route, vehicle, navigate, tireBrands: brands, wheelBrandsList } = useApp();
  const wheelBrands = useMemo(() => wheelBrandsList.map(function(b) { return b.name; }), [wheelBrandsList]);

  const params = useMemo(() => new URLSearchParams(window.location.search), []);

  const type = params.get('type') || 'packages';
  const typeCopy = {
    tires:    { noun: 'tires',    title: 'Tires',    sub: 'Guaranteed fit · Road-force balanced · Free installation quote' },
    wheels:   { noun: 'wheels',   title: 'Wheels',   sub: 'Forged, flow-formed, cast · 17" – 24"' },
    packages: { noun: 'packages', title: 'Packages', sub: 'Pre-mounted + balanced · Ship ready to install' },
  }[type];

  const [catF, setCatF] = useState(params.get('cat') ? [params.get('cat')] : []);
  const [tBrandF, setTBrandF] = useState([]);
  const [wBrandF, setWBrandF] = useState([]);
  const [priceMax, setPriceMax] = useState(8000);
  const [sort, setSort] = useState('popular');

  const filtered = useMemo(() => {
    let L = packages;
    if (catF.length) L = L.filter(p => catF.some(c => p.cat.toLowerCase().replace(/[\s&/]/g,'-').includes(c)));
    if (tBrandF.length) L = L.filter(p => tBrandF.includes(p.tireBrand));
    if (wBrandF.length) L = L.filter(p => wBrandF.includes(p.wheelBrand));
    L = L.filter(p => p.price <= priceMax);
    if (sort==='price-asc') L = [...L].sort((a,b)=>a.price-b.price);
    if (sort==='price-desc') L = [...L].sort((a,b)=>b.price-a.price);
    if (sort==='rating') L = [...L].sort((a,b)=>b.rating-a.rating);
    return L;
  }, [catF, tBrandF, wBrandF, priceMax, sort]);

  const toggle = (arr, setArr, v) => setArr(arr.includes(v) ? arr.filter(x=>x!==v) : [...arr, v]);

  return (
    <>
      <div style={{ maxWidth: 1320, margin:'32px auto', padding:'0 32px', display:'grid', gridTemplateColumns:'260px 1fr', gap: 32 }}>
        <aside>
          <FilterBlock title="Category">
            {categories.map(c => (
              <label key={c.id} style={{ display:'flex', alignItems:'center', gap: 8, padding:'6px 0', cursor:'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={catF.includes(c.id)} onChange={()=>toggle(catF, setCatF, c.id)} style={{ accentColor: tokens.primary }}/>{c.label}
              </label>
            ))}
          </FilterBlock>
          <FilterBlock title="Wheel brand">
            {wheelBrands.map(b => (
              <label key={b} style={{ display:'flex', alignItems:'center', gap: 8, padding:'6px 0', cursor:'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={wBrandF.includes(b)} onChange={()=>toggle(wBrandF, setWBrandF, b)} style={{ accentColor: tokens.primary }}/>{b}
              </label>
            ))}
          </FilterBlock>
          <FilterBlock title="Tire brand">
            {brands.slice(0,8).map(b => (
              <label key={b.slug} style={{ display:'flex', alignItems:'center', gap: 8, padding:'6px 0', cursor:'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={tBrandF.includes(b.name)} onChange={()=>toggle(tBrandF, setTBrandF, b.name)} style={{ accentColor: tokens.primary }}/>{b.name}
              </label>
            ))}
          </FilterBlock>
          <FilterBlock title={`Max price · $${priceMax.toLocaleString()}`}>
            <input type="range" min="2000" max="8000" step="100" value={priceMax} onChange={e=>setPriceMax(+e.target.value)} style={{ width:'100%', accentColor: tokens.primary }}/>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize: 11, color: tokens.mute, marginTop: 4 }}><span>$2k</span><span>$8k+</span></div>
          </FilterBlock>
        </aside>

        <section>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: tokens.mute }}>
              <span style={{ color: tokens.ink, fontWeight: 700 }}>{filtered.length} {typeCopy.noun}</span> match your filters
            </div>
            <select value={sort} onChange={e=>setSort(e.target.value)} style={{ padding:'10px 14px', border:`1px solid ${tokens.line}`, borderRadius: 6, fontFamily:'Inter', fontSize: 13, fontWeight: 600, background:'#fff' }}>
              <option value="popular">Sort: Most popular</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="rating">Highest rated</option>
            </select>
          </div>

          {type !== 'packages' && (
            <div style={{
              display:'flex', alignItems:'center', gap: 16, padding:'14px 18px',
              background:'linear-gradient(90deg, rgba(133,8,36,.06) 0%, rgba(232,52,78,.04) 100%)',
              border:`1px solid ${tokens.primary}20`,
              borderLeft:`3px solid ${tokens.primary}`,
              borderRadius: 8, marginBottom: 18,
            }}>
              <Icon name="auto_awesome" size={22} style={{ color: tokens.primary }} />
              <div style={{ flex: 1, fontSize: 13, color: tokens.ink, lineHeight: 1.5 }}>
                <strong>Make it a package.</strong>{' '}
                <span style={{ color: tokens.mute }}>
                  {type === 'tires'
                    ? 'Add a set of wheels and we\'ll mount, balance, and ship the complete assembly — ready to install.'
                    : 'Add a set of tires and we\'ll mount, balance, and ship the complete assembly — ready to install.'}
                </span>
              </div>
              <button
                onClick={()=>navigate(type === 'tires' ? '/packages?type=wheels' : '/packages?type=tires')}
                style={{
                  display:'inline-flex', alignItems:'center', gap: 6, padding:'9px 16px',
                  background: tokens.primary, color:'#fff',
                  border:'none', borderRadius: 6,
                  fontSize: 11, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase',
                  cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
                }}
              >
                Add {type === 'tires' ? 'wheels' : 'tires'} <Icon name="arrow_forward" size={14} />
              </button>
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 18 }}>
            {filtered.map(p => <PackageCard key={p.id} pkg={p}/>)}
          </div>
        </section>
      </div>
    </>
  );
}

function PackagePDP({ productId }) {
  const { packages } = window.HOLBROOK_DATA;
  const { route, navigate, addToCart, vehicle } = useApp();
  const id = productId || new URLSearchParams(window.location.search).get('product');
  const pkg = packages.find(p => p.id === id) || packages[0];
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('overview');

  return (
    <div style={{ maxWidth: 1320, margin:'32px auto 0', padding:'0 32px' }}>
      <div style={{ fontSize: 12, color: tokens.mute, marginBottom: 20 }}>
        <a href="/" onClick={e=>{e.preventDefault(); navigate('/');}} style={{ color: tokens.mute, cursor:'pointer' }}>Home</a> ›{' '}
        <a href="/packages/" onClick={e=>{e.preventDefault(); navigate('/packages');}} style={{ color: tokens.mute, cursor:'pointer' }}>Packages</a> ›{' '}
        <span style={{ color: tokens.ink }}>{pkg.name}</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr', gap: 60 }}>
        <div>
          <div style={{ background:`radial-gradient(ellipse at center, ${tokens.surfLow}, ${tokens.surfHi})`, aspectRatio:'1/1', display:'flex', alignItems:'center', justifyContent:'center', borderRadius: 12 }}>
            <WheelSvg/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 10, marginTop: 12 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ aspectRatio:'1/1', background: tokens.surfLow, border: i===0?`2px solid ${tokens.primary}`:`1px solid ${tokens.line}`, display:'flex', alignItems:'center', justifyContent:'center', borderRadius: 6 }}>
                <WheelSvg/>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, background: tokens.slate900, color:'#fff', padding: 24, borderRadius: 12, display:'flex', gap: 16, alignItems:'center' }}>
            <Icon name="view_in_ar" size={40} style={{ color: tokens.primaryAccent }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 17 }}>See it on your vehicle</div>
              <div style={{ fontSize: 12, color: tokens.slate400, marginTop: 2 }}>Launch Visual Vehicle Studio to preview this package on your {vehicle?`${vehicle.year} ${vehicle.make}`:'ride'}.</div>
            </div>
            <Btn variant="accent" size="sm" onClick={()=>navigate('/vvs')}>Launch</Btn>
          </div>
        </div>

        <div>
          <Eyebrow>{pkg.wheelBrand} × {pkg.tireBrand}</Eyebrow>
          <Headline size="h1" as="h1" style={{ fontSize: 40, marginTop: 8 }}>{pkg.name}</Headline>
          <div style={{ display:'flex', alignItems:'center', gap: 10, marginTop: 14 }}>
            <Stars rating={pkg.rating} size={16}/>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{pkg.rating}</span>
            <span style={{ fontSize: 13, color: tokens.mute }}>({pkg.reviews} reviews)</span>
          </div>

          {vehicle && (
            <div style={{ marginTop: 22, padding:'14px 16px', background:'#e7f6ec', border:'1px solid #a9d6b8', borderRadius: 8 }}>
              <div style={{ display:'flex', alignItems:'center', gap: 8, color: tokens.green, fontWeight: 700, fontSize: 13 }}>
                <Icon name="check_circle" size={18} fill/> Confirmed fit for your {vehicle.year} {vehicle.make} {vehicle.model}
              </div>
            </div>
          )}

          <div style={{ marginTop: 24, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 1, background: tokens.line, border:`1px solid ${tokens.line}`, borderRadius: 8, overflow:'hidden' }}>
            {[['Wheel', `${pkg.wheelBrand} ${pkg.wheelModel}`],['Finish', pkg.finish],['Tire', `${pkg.tireBrand} ${pkg.tireModel}`],['Size', pkg.size],['Fitment', pkg.fit],['Includes', 'Mount · balance · new valve stems']].map(([l,v]) => (
              <div key={l} style={{ background:'#fff', padding:'14px 16px' }}>
                <div style={{ fontSize: 10, letterSpacing:'.14em', textTransform:'uppercase', color: tokens.mute, fontWeight: 700 }}>{l}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: tokens.ink, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 28, padding:'28px 28px', background: tokens.slate900, color:'#fff', borderRadius: 12 }}>
            <div style={{ display:'flex', alignItems:'baseline', gap: 14 }}>
              <span style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 52, color:'#fff', letterSpacing:'-.02em' }}>${pkg.price.toLocaleString()}</span>
              {pkg.was > pkg.price && <span style={{ fontSize: 18, color:'#94a3b8', textDecoration:'line-through' }}>${pkg.was.toLocaleString()}</span>}
              <span style={{ fontSize: 13, color:'#94a3b8', marginLeft: 'auto' }}>complete set of 4</span>
            </div>
            <div style={{ marginTop: 18, padding:'14px 16px', background:'rgba(133,8,36,.2)', border:'1px solid rgba(232,52,78,.3)', borderRadius: 8, display:'flex', alignItems:'center', gap: 14 }}>
              <Icon name="payments" size={24} style={{ color: tokens.primaryAccent }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color:'#fff' }}>${Math.round(pkg.price*0.25).toLocaleString()} today · ${Math.round(pkg.price*0.75).toLocaleString()} at install</div>
                <div style={{ fontSize: 11, color:'#cbd5e1', marginTop: 2 }}>Or pay in full and ship to your home</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap: 16, marginTop: 20 }}>
              <div style={{ display:'flex', alignItems:'center', background:'#fff', color: tokens.ink, borderRadius: 6 }}>
                <button onClick={()=>setQty(Math.max(1, qty-1))} style={{ border:'none', background:'transparent', padding:'10px 14px', fontSize: 18, fontWeight: 800, cursor:'pointer' }}>&#8722;</button>
                <span style={{ padding:'10px 16px', fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 17, minWidth: 28, textAlign:'center' }}>{qty}</span>
                <button onClick={()=>setQty(qty+1)} style={{ border:'none', background:'transparent', padding:'10px 14px', fontSize: 18, fontWeight: 800, cursor:'pointer' }}>+</button>
              </div>
              <Btn variant="primaryGrad" size="lg" icon="shopping_bag" onClick={()=>{ addToCart(pkg, qty); navigate('/cart'); }} style={{ flex: 1 }}>
                Add to cart · ${(pkg.price*qty).toLocaleString()}
              </Btn>
            </div>
            <div style={{ fontSize: 12, color:'#94a3b8', marginTop: 14, display:'flex', gap: 18 }}>
              <span style={{ display:'inline-flex', gap: 6, alignItems:'center' }}><Icon name="inventory_2" size={14}/> In stock · ready in 48h</span>
              <span style={{ display:'inline-flex', gap: 6, alignItems:'center' }}><Icon name="lock" size={14}/> Stripe secure deposit</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 60, borderBottom:`1px solid ${tokens.line}`, display:'flex' }}>
        {[['overview','Overview'],['fitment','Fitment & Sizing'],['reviews',`Reviews (${pkg.reviews})`],['warranty','Warranty']].map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k)} style={{
            border:'none', background:'transparent', padding:'14px 24px', cursor:'pointer',
            fontFamily:'Inter', fontSize: 12, fontWeight: 700, letterSpacing:'.14em', textTransform:'uppercase',
            color: tab===k? tokens.ink: tokens.mute,
            borderBottom: tab===k?`3px solid ${tokens.primary}`:'3px solid transparent', marginBottom: -1,
          }}>{l}</button>
        ))}
      </div>
      <div style={{ padding:'30px 0 60px', maxWidth: 900, fontSize: 15, lineHeight: 1.7, color: tokens.graphite }}>
        {tab==='overview' && <p>The <strong>{pkg.name}</strong> package pairs {pkg.wheelBrand}'s {pkg.wheelModel} in {pkg.finish} with {pkg.tireBrand}'s {pkg.tireModel} in {pkg.size.split(' · ')[1]}. Hand-matched for {pkg.fit.toLowerCase()} use, every set is mounted and road-force balanced at our Eastpointe shop before it ships or rolls into the install bay.</p>}
        {tab==='fitment' && <p>Confirmed fitment for your selected vehicle. Includes hub-centric rings, chrome lug nuts, and TPMS sensors pre-programmed to your VIN.</p>}
        {tab==='reviews' && <p>{pkg.reviews} verified buyers. {pkg.rating}/5 average across Michigan installs.</p>}
        {tab==='warranty' && <p>Every installed package is covered by manufacturer warranty plus Holbrook's 12-month road-hazard protection.</p>}
      </div>
    </div>
  );
}

Object.assign(window, { PackagesPage, PackagePDP });
