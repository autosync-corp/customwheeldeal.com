// ─────────────── page-home.jsx — Homepage components
const { useState, useEffect, useMemo, useRef } = React;

function HomePage() {
  const { packages, categories, locations } = window.HOLBROOK_DATA;
  const { navigate, tireBrands: brands } = useApp();

  return (
    <>
      {/* HERO */}
      <section style={{ position:'relative', width:'100%', aspectRatio:'2560 / 1516', overflow:'hidden', background: tokens.slate900 }}>
        <img src="assets/hero-service-bay.webp" alt="Holbrook Tire Center service bay"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', display:'block' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(100deg, rgba(10,15,26,.85) 0%, rgba(10,15,26,.55) 45%, rgba(10,15,26,.18) 75%, rgba(10,15,26,.05) 100%)' }} />
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at bottom right, rgba(133,8,36,.32) 0%, transparent 60%)' }} />
        <div style={{ position:'relative', maxWidth: 1320, margin:'0 auto', padding:'6.5% 32px 5.5%', color:'#fff', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <Eyebrow color={tokens.primaryAccent} style={{ marginBottom: '1.1%' }}>Precision Performance · Michigan</Eyebrow>
          <Headline size="display" style={{ color:'#fff', maxWidth: '55%', fontSize:'clamp(36px, 4.6vw, 68px)', lineHeight: 1.02, textShadow:'0 4px 20px rgba(0,0,0,.8), 0 2px 6px rgba(0,0,0,.6)' }}>
            Michigan's go-to<br/>for <span style={{ color: tokens.primaryAccent }}>Tires and Wheels</span>.
          </Headline>
          <p style={{ maxWidth: '42%', fontSize:'clamp(13px, 1.15vw, 17px)', lineHeight: 1.55, color:'#cbd5e1', marginTop:'1.6%', textShadow:'0 2px 12px rgba(0,0,0,.7)' }}>
            Hand-matched to your vehicle. Installed at Eastpointe, Highland Park, or Detroit — or drop-shipped to your door. Pay 25% today, the rest when the car rolls off the rack.
          </p>
          <div style={{ display:'flex', gap: 12, marginTop:'2.3%' }}>
            <Btn variant="primary" size="lg" iconRight="arrow_forward" onClick={()=>navigate('/shop')}>Shop Now</Btn>
            <Btn variant="outlineLight" size="lg" icon="view_in_ar" onClick={()=>navigate('/vvs')}>Launch Visual Studio</Btn>
          </div>
          <div style={{ display:'flex', gap: 36, marginTop:'3.6%', fontSize:'clamp(10px, .82vw, 12px)', color:'#94a3b8', letterSpacing:'.1em', textTransform:'uppercase', fontWeight: 600 }}>
            <span style={{ display:'inline-flex', gap:8, alignItems:'center' }}><Icon name="verified" size={18} style={{ color: tokens.primaryAccent }} /> Family owned · 1978</span>
            <span style={{ display:'inline-flex', gap:8, alignItems:'center' }}><Icon name="local_shipping" size={18} style={{ color: tokens.primaryAccent }} /> Ships across Michigan</span>
            <span style={{ display:'inline-flex', gap:8, alignItems:'center' }}><Icon name="handyman" size={18} style={{ color: tokens.primaryAccent }} /> ASE-certified install</span>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ maxWidth: 1320, margin:'96px auto 0', padding:'0 32px' }}>
        <SectionHead eyebrow="Shop by category" title="Built for Michigan roads." />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap: 10, marginTop: 32 }}>
          {categories.map(c => (
            <a key={c.id} href={`/packages?cat=${c.id}`} onClick={e=>{e.preventDefault();navigate(`/packages?cat=${c.id}`)}}
              style={{ textDecoration:'none', color: tokens.ink, background:'#fff', border:`1px solid ${tokens.line}`, padding:'32px 18px', textAlign:'center', borderRadius: 12, transition:'all .2s' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(133,8,36,.3)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = tokens.line; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <Icon name={c.icon} size={40} style={{ color: tokens.primary, marginBottom: 10 }} />
              <div style={{ fontFamily:'Space Grotesk', fontSize: 15, fontWeight: 700, letterSpacing:'-.01em' }}>{c.label}</div>
            </a>
          ))}
        </div>
      </section>

      {/* FEATURED PACKAGES */}
      <section style={{ maxWidth: 1320, margin:'96px auto 0', padding:'0 32px' }}>
        <SectionHead eyebrow="Featured packages" title="Complete wheel + tire sets." cta={{ label:'All packages', onClick:()=>navigate('/packages?type=packages') }} />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 20, marginTop: 32 }}>
          {packages.slice(0, 4).map(p => <PackageCard key={p.id} pkg={p} />)}
        </div>
      </section>

      {/* REBATES BANNER */}
      <RebatesBanner />

      {/* VISUAL VEHICLE STUDIO */}
      <VVSCta />

      {/* CHECKOUT FORK TEASE */}
      <section style={{ maxWidth: 1320, margin:'96px auto 0', padding:'0 32px' }}>
        <SectionHead eyebrow="Your choice at checkout" title="Install with us. Or ship to home." />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 20, marginTop: 32 }}>
          <div style={{ background:'#fff', border:`1px solid ${tokens.line}`, borderRadius: 16, padding: 40, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top: 0, right: 0, background: tokens.primary, color:'#fff', padding:'6px 14px', fontSize: 10, fontWeight: 800, letterSpacing:'.18em' }}>MOST POPULAR</div>
            <Icon name="garage_home" size={40} style={{ color: tokens.primary }} />
            <Headline size="h3" style={{ marginTop: 16 }}>25% today. Install at the shop.</Headline>
            <p style={{ fontSize: 15, color: tokens.taupe, marginTop: 12, lineHeight: 1.6 }}>
              Secure your set with a 25% deposit. Pay the balance when you pick up your car from Eastpointe, Highland Park, or Detroit. Free rotations for life on every installed set.
            </p>
            <ul style={{ marginTop: 20, padding: 0, listStyle:'none', display:'flex', flexDirection:'column', gap: 10 }}>
              {['Secure deposit via Stripe','We schedule install by phone within 24h','Remainder due in-bay, card or cash','Free lifetime rotations + balance'].map(x => (
                <li key={x} style={{ display:'flex', gap:10, fontSize: 14, color: tokens.graphite }}><Icon name="check_circle" size={18} fill style={{ color: tokens.green }} />{x}</li>
              ))}
            </ul>
          </div>

          <div style={{ background: tokens.slate900, color:'#fff', borderRadius: 16, padding: 40, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at top right, rgba(133,8,36,.3), transparent 60%)' }} />
            <div style={{ position:'relative' }}>
              <Icon name="local_shipping" size={40} style={{ color: tokens.primaryAccent }} />
              <Headline size="h3" style={{ marginTop: 16, color:'#fff' }}>Pay in full. Drop-ship anywhere.</Headline>
              <p style={{ fontSize: 15, color: tokens.slate400, marginTop: 12, lineHeight: 1.6 }}>
                Prefer to install yourself or use a local shop? We'll ship your complete package mounted, balanced, and ready-to-bolt anywhere in the lower 48. Free freight on orders over $2,000.
              </p>
              <ul style={{ marginTop: 20, padding: 0, listStyle:'none', display:'flex', flexDirection:'column', gap: 10 }}>
                {['Mounted + balanced at our shop','Packaged in reusable fitted crates','3–5 business day delivery','TPMS sensor pre-program add-on'].map(x => (
                  <li key={x} style={{ display:'flex', gap:10, fontSize: 14, color:'#cbd5e1' }}><Icon name="check_circle" size={18} fill style={{ color: tokens.primaryAccent }} />{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND STRIP */}
      <section style={{ maxWidth: 1320, margin:'96px auto 0', padding:'0 32px' }}>
        <SectionHead eyebrow="Every brand that matters" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap: 12, marginTop: 32 }}>
          {brands.slice(0, 12).map(b => (
            <div key={b.slug} style={{ background:'#fff', border:`1px solid ${tokens.line}`, padding:'28px 16px', display:'flex', alignItems:'center', justifyContent:'center', height: 100, borderRadius: 8 }}>
              <img src={b.logo} alt={b.name} style={{ maxWidth:'100%', maxHeight: 44, objectFit:'contain', filter:'grayscale(1) contrast(1.05)', transition:'filter .2s' }}
                onMouseOver={e => e.currentTarget.style.filter = 'grayscale(0)'}
                onMouseOut={e => e.currentTarget.style.filter = 'grayscale(1) contrast(1.05)'} />
            </div>
          ))}
        </div>
      </section>

      {/* FINANCING */}
      <section id="financing" style={{ marginTop: 96, background: tokens.slate900, color:'#fff', padding:'80px 32px' }}>
        <div style={{ maxWidth: 1320, margin:'0 auto', display:'grid', gridTemplateColumns:'1.3fr 1fr', gap: 60, alignItems:'center' }}>
          <div>
            <Eyebrow color={tokens.primaryAccent}>Financing partners</Eyebrow>
            <Headline size="h1" style={{ color:'#fff', marginTop: 12 }}>Drive today.<br/>Pay on your schedule.</Headline>
            <p style={{ fontSize: 16, color: tokens.slate400, marginTop: 20, maxWidth: 520, lineHeight: 1.6 }}>
              On top of our 25%-at-install plan, split the remaining balance with any of our financing partners. 0% APR offers available for well-qualified buyers.
            </p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 14 }}>
            {['AFFIRM','KLARNA','SYNCHRONY'].map(n => (
              <div key={n} style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', padding:'24px 18px', borderRadius: 10, textAlign:'center' }}>
                <div style={{ fontFamily:'Space Grotesk', fontSize: 15, fontWeight: 700, letterSpacing:'.06em' }}>{n}</div>
                <div style={{ fontSize: 11, color: tokens.slate400, marginTop: 6 }}>4 payments · 0% APR</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function FitmentBar() {
  const { setVehicle, navigate } = useApp();
  const YEARS = useMemo(() => { const y = [], c = 2027; for (let i = c; i >= 2000; i--) y.push(i); return y; }, []);
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);

  useEffect(() => {
    if (!year) { setMakes([]); setMake(''); return; }
    api.fetchVehicleMakes(year).then(data => {
      if (data && data.Items) setMakes(data.Items.map(function(m) { return m.Name; }));
      else setMakes(window.HOLBROOK_DATA.vehicleMakes.map(function(m) { return m.name; }));
    }).catch(() => setMakes(window.HOLBROOK_DATA.vehicleMakes.map(function(m) { return m.name; })));
    setMake(''); setModel('');
  }, [year]);

  useEffect(() => {
    if (!make) { setModels([]); setModel(''); return; }
    api.fetchVehicleModels(year, make).then(data => {
      if (data && data.Items) setModels(data.Items.map(function(m) { return m.Name; }));
      else setModels([]);
    }).catch(() => setModels([]));
    setModel('');
  }, [make]);

  const go = () => { if (year && make && model) { setVehicle({ year, make, model }); navigate('/shop'); } };
  const fld = { background: tokens.surfLow, border:'none', padding:'14px 32px 14px 16px', fontFamily:'Inter', fontSize: 14, fontWeight: 600, color: tokens.ink, appearance:'none', borderRadius: 6, flex: 1 };
  return (
    <div style={{ padding: 24, display:'flex', alignItems:'flex-end', gap: 10 }}>
      <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 16, color: tokens.primary, letterSpacing:'-.01em', paddingBottom: 10, paddingRight: 8, borderRight: `1px solid ${tokens.line}`, marginRight: 4 }}>
        FIND YOUR<br/>FITMENT
      </div>
      <select value={year} onChange={e=>setYear(e.target.value)} style={fld}>
        <option value="">Year</option>
        {YEARS.map(y => <option key={y}>{y}</option>)}
      </select>
      <select value={make} onChange={e=>setMake(e.target.value)} disabled={!year} style={fld}>
        <option value="">{!year ? 'Make' : makes.length === 0 ? 'Loading...' : 'Make'}</option>
        {makes.map(m => <option key={m}>{m}</option>)}
      </select>
      <select value={model} onChange={e=>setModel(e.target.value)} disabled={!make} style={fld}>
        <option value="">{!make ? 'Model' : models.length === 0 ? 'Loading...' : 'Model'}</option>
        {models.map(m => <option key={m}>{m}</option>)}
      </select>
      <Btn variant="primary" size="lg" onClick={go} iconRight="arrow_forward" disabled={!year||!make||!model} style={{ height: 48 }}>Find packages</Btn>
    </div>
  );
}

function VVSCta() {
  const { navigate } = useApp();
  return (
    <section style={{ maxWidth: 1320, margin:'96px auto 0', padding:'0 32px' }}>
      <div style={{ position:'relative', overflow:'hidden', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #850824 100%)', borderRadius: 16, padding: '64px 64px', color:'#fff' }}>
        <div style={{ position:'absolute', inset:0, opacity:.15, background:`radial-gradient(circle at 80% 20%, ${tokens.primaryAccent}, transparent 60%)` }} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 56, alignItems:'center', position:'relative' }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap: 8, padding:'6px 12px', background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.12)', borderRadius: 6, marginBottom: 24 }}>
              <Icon name="auto_awesome" size={14} style={{ color: tokens.primaryAccent }} />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing:'.18em' }}>POWERED BY AUTOSYNC</span>
            </div>
            <Headline size="h1" style={{ color:'#fff' }}>VISUAL VEHICLE<br/>STUDIO</Headline>
            <p style={{ fontSize: 15, color:'#cbd5e1', marginTop: 20, maxWidth: 440, lineHeight: 1.65 }}>
              See exactly how new tires and wheels look on your vehicle before you buy. Select your year, make, and model to preview in real time.
            </p>
            <div style={{ display:'flex', gap: 10, marginTop: 32 }}>
              <Btn variant="primary" size="lg" icon="view_in_ar" onClick={()=>navigate('/vvs')}>Launch Studio</Btn>
              <Btn variant="outlineLight" size="lg">Learn more</Btn>
            </div>
          </div>
          <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: 32 }}>
            {[
              ['directions_car','Real Vehicle Photos','Thousands of year/make/model combos'],
              ['pin_drop','Accurate Fitment','Only shows products that fit your vehicle'],
              ['payments','Live Pricing','Real-time inventory and competitive pricing'],
              ['request_quote','Instant Quotes','Request a quote directly from the studio'],
            ].map(([ic, t, d]) => (
              <div key={t} style={{ display:'flex', gap: 16, alignItems:'flex-start', padding:'14px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                <div style={{ background:'rgba(133,8,36,.25)', borderRadius: 8, padding: 10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon name={ic} size={20} style={{ color: tokens.primaryAccent }} />
                </div>
                <div>
                  <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 16 }}>{t}</div>
                  <div style={{ fontSize: 13, color: tokens.slate400, marginTop: 2 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PackageCard({ pkg }) {
  const { navigate } = useApp();
  const onSale = pkg.was > pkg.price;
  return (
    <div style={{ background:'#fff', border:`1px solid ${tokens.line}`, borderRadius: 12, overflow:'hidden', display:'flex', flexDirection:'column', cursor:'pointer', transition:'all .2s' }}
      onClick={()=>navigate(`/package/${pkg.id}`)}
      onMouseOver={e => { e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,.12)'; e.currentTarget.style.borderColor = 'rgba(133,8,36,.25)'; }}
      onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = tokens.line; }}>
      <div style={{ position:'relative', aspectRatio:'4/3', background: `radial-gradient(ellipse at center, ${tokens.surfLow}, ${tokens.surfHi})`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {onSale && <span style={{ position:'absolute', top: 12, left: 12, background: tokens.primary, color:'#fff', fontSize: 10, fontWeight: 800, padding:'4px 10px', letterSpacing:'.14em', borderRadius: 999 }}>SAVE ${pkg.was - pkg.price}</span>}
        <WheelSvg />
      </div>
      <div style={{ padding: 20, display:'flex', flexDirection:'column', gap: 8, flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase', color: tokens.mute }}>{pkg.wheelBrand} × {pkg.tireBrand}</div>
        <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 18, color: tokens.ink, letterSpacing:'-.01em' }}>{pkg.name}</div>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize: 11, color: tokens.graphite }}>{pkg.size}</div>
        <div style={{ display:'flex', alignItems:'center', gap: 6 }}>
          <Stars rating={pkg.rating} size={12} />
          <span style={{ fontSize: 11, color: tokens.mute }}>{pkg.rating} ({pkg.reviews})</span>
        </div>
        <div style={{ display:'flex', alignItems:'baseline', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
          <span style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 26, color: tokens.ink }}>${pkg.price.toLocaleString()}</span>
          {onSale && <span style={{ fontSize: 13, color: tokens.mute, textDecoration:'line-through' }}>${pkg.was.toLocaleString()}</span>}
          <span style={{ fontSize: 11, color: tokens.mute, marginLeft:'auto' }}>set of 4</span>
        </div>
        <div style={{ fontSize: 12, color: tokens.primary, fontWeight: 700, marginTop: 4 }}>
          From ${Math.round(pkg.price * 0.25).toLocaleString()} down · install
        </div>
      </div>
    </div>
  );
}

function RebatesBanner() {
  const { navigate } = useApp();
  const rebates = window.REBATES || [];
  const scrollRef = useRef(null);
  const n = rebates.length;
  const TILE = 200;
  const GAP = 16;

  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || n === 0) return;
    const iv = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= max - 4) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: TILE + GAP, behavior: 'smooth' });
      }
    }, 3200);
    return () => clearInterval(iv);
  }, [paused, n]);

  const scrollByStep = (dir) => {
    const el = scrollRef.current; if (!el) return;
    el.scrollBy({ left: dir * (TILE + GAP) * 3, behavior: 'smooth' });
  };

  if (n === 0) return null;

  return (
    <section style={{ maxWidth: 1320, margin: '96px auto 0', padding: '0 32px' }}>
      <SectionHead eyebrow="Active rebates" title="Manufacturer savings, right now." cta={{ label: 'All rebates', onClick: () => navigate('/rebates') }} />

      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{ position: 'relative', marginTop: 32 }}
      >
        <button onClick={() => scrollByStep(-1)} aria-label="Previous" style={filmArrow('left')}>
          <Icon name="chevron_left" size={22} style={{ color: tokens.ink }} />
        </button>
        <div style={filmFade('left')} />

        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: GAP,
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            padding: '8px 56px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          className="rebate-strip"
        >
          {[...rebates, ...rebates].map((r, i) => {
            const origIdx = i % n;
            return (
              <button
                key={i}
                onClick={() => navigate(`/rebate/${origIdx}`)}
                style={{
                  width: TILE, height: TILE,
                  flexShrink: 0,
                  border: `1px solid ${tokens.line}`,
                  borderRadius: 10,
                  overflow: 'hidden',
                  padding: 0,
                  background: '#fff',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'transform .2s, box-shadow .2s, border-color .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 28px rgba(0,0,0,.14)'; e.currentTarget.style.borderColor = tokens.primary; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = tokens.line; }}
              >
                <img src={r.previewImage} alt={`${r.brand} rebate`} loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </button>
            );
          })}
        </div>

        <div style={filmFade('right')} />
        <button onClick={() => scrollByStep(1)} aria-label="Next" style={filmArrow('right')}>
          <Icon name="chevron_right" size={22} style={{ color: tokens.ink }} />
        </button>
      </div>
    </section>
  );
}

function filmArrow(side) {
  return {
    position: 'absolute',
    top: '50%', transform: 'translateY(-50%)',
    [side]: 0,
    width: 44, height: 44,
    borderRadius: 999,
    border: `1px solid ${tokens.line}`,
    background: '#fff',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 3,
    boxShadow: '0 6px 14px rgba(0,0,0,.08)',
  };
}
function filmFade(side) {
  return {
    position: 'absolute',
    top: 0, bottom: 0,
    [side]: 0,
    width: 72,
    background: `linear-gradient(${side === 'left' ? '90deg' : '270deg'}, ${tokens.surface} 0%, ${tokens.surface} 25%, rgba(249,249,252,0) 100%)`,
    pointerEvents: 'none',
    zIndex: 2,
  };
}

Object.assign(window, { HomePage, FitmentBar, VVSCta, PackageCard });
