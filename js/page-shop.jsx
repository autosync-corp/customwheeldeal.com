// ─────────────── PageShop.jsx
// No imports — relies on globals from setup.js (React hooks, tokens, AppCtx, useApp)
// and components.jsx (Icon)

function ShopPage() {
  const { vehicle, navigate } = useApp();

  const tiles = [
    {
      id: 'tires',
      kicker: 'Start with rubber',
      title: 'Shop Tires',
      sub: vehicle ? `Guaranteed fit · ${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'All-season, performance, winter, all-terrain',
      img: 'assets/holbrook-tires-stack.jpg',
      accent: tokens.primary,
    },
    {
      id: 'wheels',
      kicker: 'Start with style',
      title: 'Shop Wheels',
      sub: 'Forged, flow-formed, cast · 17" – 24"',
      img: 'assets/holbrook-garage.jpg',
      accent: '#fff',
    },
    {
      id: 'packages',
      kicker: 'Build a package',
      title: 'Shop Packages',
      sub: 'Pre-mounted · Road-force balanced · Ship ready to install',
      img: 'assets/holbrook-lobby.jpg',
      accent: tokens.yellow,
      featured: true,
    },
  ];

  return (
    <div style={{ background: tokens.surfLow, minHeight: '60vh' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '64px 32px 96px' }}>
        <div style={{ textAlign:'center', marginBottom: 48 }}>
          <div style={{ fontFamily:'Inter', fontSize: 11, fontWeight: 800, letterSpacing:'.22em', textTransform:'uppercase', color: tokens.primary, marginBottom: 10 }}>
            {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model} · Guaranteed fit` : 'Shop Now'}
          </div>
          <h1 style={{ fontFamily:'Space Grotesk', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, letterSpacing:'-.02em', lineHeight: 1, margin: 0, color: tokens.ink }}>
            What are you building?
          </h1>
          <p style={{ fontFamily:'Inter', fontSize: 15, color: tokens.mute, marginTop: 14, maxWidth: 560, margin: '14px auto 0', lineHeight: 1.5 }}>
            Pick a starting point. You can always add the other side — tires become a package when you add wheels, and vice versa.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 20, maxWidth: 1080, margin:'0 auto' }}>
          {tiles.map(t => (
            <button
              key={t.id}
              onClick={() => navigate(`/${t.id === 'packages' ? 'packages' : t.id}`)}
              style={{
                position:'relative', aspectRatio:'16 / 10', border:'none', borderRadius: 12,
                overflow:'hidden', cursor:'pointer', padding: 0, background:'#000', textAlign:'left',
                boxShadow: t.featured ? `0 0 0 3px ${t.accent}, 0 16px 32px -18px rgba(0,0,0,.35)` : '0 12px 28px -18px rgba(0,0,0,.3)',
                transition:'transform .2s ease, box-shadow .2s ease', fontFamily:'inherit',
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <img src={t.img} alt="" style={{ position:'absolute', inset: 0, width:'100%', height:'100%', objectFit:'cover', opacity:.7 }} />
              <div style={{ position:'absolute', inset: 0, background: `linear-gradient(180deg, rgba(0,0,0,.2) 0%, rgba(0,0,0,.88) 100%)` }} />
              {t.featured && (
                <div style={{ position:'absolute', top: 12, right: 12, padding:'4px 9px', background: t.accent, color: tokens.ink, fontSize: 9, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase', borderRadius: 3 }}>
                  Best value
                </div>
              )}
              <div style={{ position:'absolute', inset: 0, padding: 22, display:'flex', flexDirection:'column', justifyContent:'flex-end', color:'#fff' }}>
                <div style={{ fontFamily:'Inter', fontSize: 9, fontWeight: 800, letterSpacing:'.2em', textTransform:'uppercase', color: 'rgba(255,255,255,.7)', marginBottom: 5 }}>
                  {t.kicker}
                </div>
                <div style={{ fontFamily:'Space Grotesk', fontSize: 26, fontWeight: 700, letterSpacing:'-.015em', lineHeight: 1, marginBottom: 8 }}>
                  {t.title}
                </div>
                <div style={{ fontFamily:'Inter', fontSize: 12, color:'rgba(255,255,255,.75)', lineHeight: 1.45, marginBottom: 12 }}>
                  {t.sub}
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap: 6, fontSize: 10, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase', color:'#fff' }}>
                  Browse <Icon name="arrow_forward" size={12} />
                </div>
              </div>
            </button>
          ))}
        </div>

        {!vehicle && (
          <div style={{ marginTop: 40, padding: 20, background:'#fff', border: `1px solid ${tokens.line}`, borderRadius: 10, display:'flex', alignItems:'center', gap: 16, maxWidth: 720, margin:'40px auto 0' }}>
            <Icon name="info" size={22} style={{ color: tokens.primary }} />
            <div style={{ flex: 1, fontSize: 13, color: tokens.ink, lineHeight: 1.5 }}>
              <strong>Tip:</strong> Add your vehicle in the bar above so we only show you sizes and styles that are guaranteed to fit.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ShopPage });
