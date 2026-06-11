// ─────────────── PageRebates.jsx
// No imports — relies on globals from setup.js (React hooks, tokens, AppCtx, useApp)
// and components.jsx (Icon, Btn, Eyebrow, Headline, SectionHead)

function RebatesPage() {
  const { navigate } = useApp();
  const rebates = window.REBATES || [];
  const [selectedBrand, setSelectedBrand] = useState('All');

  const brands = useMemo(() => ['All', ...new Set(rebates.map(r => r.brand))], [rebates]);
  const filtered = selectedBrand === 'All' ? rebates : rebates.filter(r => r.brand === selectedBrand);

  const totalValue = rebates.reduce((s, r) => s + r.amount + r.amountTwo, 0);

  return (
    <>
      <section style={{ background: tokens.slate900, color: '#fff', padding: '72px 32px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 15% 30%, rgba(133,8,36,.45), transparent 55%), radial-gradient(circle at 85% 70%, rgba(227,24,55,.25), transparent 60%)` }} />
        <div style={{ maxWidth: 1320, margin: '0 auto', position: 'relative', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 14px', background: 'rgba(227,24,55,.15)', border: '1px solid rgba(227,24,55,.4)', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: '#ff5970' }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: '#ff5970' }} />
              {rebates.length} active manufacturer rebates
            </div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 64, lineHeight: 1, letterSpacing: '-.025em', margin: '20px 0 0' }}>
              Save up to <span style={{ color: tokens.yellow }}>${Math.max(...rebates.map(r => r.amount + r.amountTwo))}</span> on your next set.
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: '#cbd5e1', maxWidth: 620, marginTop: 20 }}>
              We honor every current manufacturer rebate at all three Holbrook locations. Buy a qualifying set, we'll handle the paperwork.
              Rebates paid by prepaid card or virtual card — usually within 6–8 weeks of install.
            </p>
            <div style={{ display: 'flex', gap: 32, marginTop: 32 }}>
              <RebateStat label="Active rebates" value={rebates.length} />
              <RebateStat label="Brands" value={brands.length - 1} />
              <RebateStat label="Max combined value" value={`$${Math.max(...rebates.map(r => r.amount + r.amountTwo))}`} />
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <RebateStack rebates={rebates.slice(0, 4)} />
          </div>
        </div>
      </section>

      <section style={{ borderBottom: `1px solid ${tokens.line}`, background: '#fff', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '16px 32px', display: 'flex', gap: 8, overflowX: 'auto', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: tokens.mute, paddingRight: 12, flexShrink: 0 }}>Filter by brand</span>
          {brands.map(b => (
            <button key={b} onClick={() => setSelectedBrand(b)} style={{
              padding: '8px 16px',
              background: selectedBrand === b ? tokens.ink : 'transparent',
              color: selectedBrand === b ? '#fff' : tokens.graphite,
              border: `1px solid ${selectedBrand === b ? tokens.ink : tokens.line}`,
              borderRadius: 999,
              fontFamily: 'Inter',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '.04em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              {b}
            </button>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1320, margin: '40px auto 96px', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {filtered.map((r, i) => {
            const origIdx = rebates.indexOf(r);
            return <RebateCard key={origIdx} rebate={r} onOpen={() => navigate(`/rebates/?rebate=${origIdx}`)} />;
          })}
        </div>
      </section>
    </>
  );
}

function RebateStat({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 36, color: '#fff', lineHeight: 1, letterSpacing: '-.02em' }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#94a3b8', marginTop: 6 }}>{label}</div>
    </div>
  );
}

function RebateStack({ rebates }) {
  return (
    <div style={{ position: 'relative', height: 340 }}>
      {rebates.map((r, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: i * 18, left: i * 22,
          width: 260, height: 260,
          background: '#fff',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: `0 ${20 + i * 4}px ${40 + i * 8}px rgba(0,0,0,.${4 - i})`,
          transform: `rotate(${(i - 1.5) * 3}deg)`,
          border: '1px solid rgba(255,255,255,.2)',
        }}>
          <img src={r.bannerImage || r.previewImage} alt={r.brand} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ))}
    </div>
  );
}

function RebateCard({ rebate, onOpen }) {
  const total = rebate.amount + rebate.amountTwo;
  const isStackable = rebate.amountTwo > 0;
  return (
    <article onClick={onOpen} style={{
      background: '#fff',
      border: `1px solid ${tokens.line}`,
      borderRadius: 12,
      overflow: 'hidden',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform .2s, box-shadow .2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 14px 30px rgba(0,0,0,.08)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ position: 'relative', aspectRatio: '2 / 1', background: tokens.surfLow, overflow: 'hidden' }}>
        <img src={rebate.horizontalImage || rebate.bannerImage || rebate.previewImage}
          alt={`${rebate.brand} rebate`}
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        {isStackable && (
          <div style={{ position: 'absolute', top: 12, right: 12, background: tokens.yellow, color: tokens.ink, padding: '5px 10px', borderRadius: 4, fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Stackable bonus
          </div>
        )}
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: tokens.mute }}>{rebate.brand}</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 32, color: tokens.ink, lineHeight: 1, letterSpacing: '-.02em', marginTop: 6 }}>
              Up to ${total}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: tokens.mute, lineHeight: 1.4 }}>
            <div style={{ fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: tokens.graphite }}>Ends</div>
            <div style={{ marginTop: 2 }}>{formatDate(rebate.endDate)}</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: tokens.graphite, lineHeight: 1.55, margin: 0, flex: 1,
          display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' }}>
          {rebate.description}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: `1px solid ${tokens.lineSoft}` }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: tokens.mute }}>
            Buy {rebate.qtyRequired} qualifying tires
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: tokens.primary, display: 'flex', alignItems: 'center', gap: 4 }}>
            Details <Icon name="arrow_forward" size={14} />
          </span>
        </div>
      </div>
    </article>
  );
}

function RebateDetailPage({ rebateId }) {
  const { navigate } = useApp();
  const rebates = window.REBATES || [];
  const idx = rebateId != null ? parseInt(rebateId, 10) : parseInt(new URLSearchParams(window.location.search).get('rebate') || '0', 10);
  const rebate = rebates[idx];
  if (!rebate) {
    return (
      <div style={{ maxWidth: 1320, margin: '80px auto', padding: '0 32px', textAlign: 'center' }}>
        <h2 style={{ fontFamily:'Space Grotesk' }}>Rebate not found</h2>
        <button onClick={() => navigate('/rebates')} style={{ marginTop: 20, padding:'12px 24px', background: tokens.primary, color:'#fff', border:'none', borderRadius: 6, cursor:'pointer', fontWeight: 700 }}>Back to all rebates</button>
      </div>
    );
  }
  const total = rebate.amount + rebate.amountTwo;
  return (
    <>
      <div style={{ borderBottom: `1px solid ${tokens.line}`, background:'#fff' }}>
        <div style={{ maxWidth: 1320, margin:'0 auto', padding:'14px 32px', fontSize: 12, color: tokens.mute, display:'flex', gap: 8, alignItems:'center' }}>
          <a href="/" onClick={e=>{e.preventDefault();navigate('/')}} style={{ color: tokens.mute, textDecoration:'none' }}>Home</a>
          <Icon name="chevron_right" size={14} />
          <a href="/rebates/" onClick={e=>{e.preventDefault();navigate('/rebates')}} style={{ color: tokens.mute, textDecoration:'none' }}>Rebates</a>
          <Icon name="chevron_right" size={14} />
          <span style={{ color: tokens.ink, fontWeight: 600 }}>{rebate.brand} — up to ${total} back</span>
        </div>
      </div>

      <div style={{ maxWidth: 1320, margin:'48px auto 96px', padding:'0 32px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap: 56, alignItems:'start' }}>
          <div>
            <div style={{ background: tokens.surfLow, borderRadius: 12, overflow:'hidden', border:`1px solid ${tokens.line}` }}>
              <img src={rebate.bannerImage || rebate.previewImage}
                alt={`${rebate.brand} rebate`}
                style={{ width:'100%', height:'auto', display:'block' }} />
            </div>
            {rebate.horizontalImage && (
              <div style={{ marginTop: 20, background: tokens.surfLow, borderRadius: 12, overflow:'hidden', border:`1px solid ${tokens.line}` }}>
                <img src={rebate.horizontalImage} alt="" style={{ width:'100%', height:'auto', display:'block' }} />
              </div>
            )}
          </div>

          <div style={{ position:'sticky', top: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing:'.18em', textTransform:'uppercase', color: tokens.mute }}>{rebate.brand} manufacturer rebate</div>
            <h1 style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 56, lineHeight: 1, letterSpacing:'-.025em', margin:'12px 0 8px' }}>
              Up to <span style={{ color: tokens.primary }}>${total}</span> back
            </h1>
            <div style={{ fontSize: 14, color: tokens.graphite, fontWeight: 600 }}>on a set of {rebate.qtyRequired} qualifying tires</div>

            <div style={{ display:'grid', gridTemplateColumns: rebate.amountTwo > 0 ? '1fr 1fr' : '1fr', gap: 10, marginTop: 24 }}>
              <div style={{ background: tokens.surfLow, padding: 16, borderRadius: 8 }}>
                <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 28, color: tokens.primary, lineHeight: 1 }}>${rebate.amount}</div>
                <div style={{ fontSize: 12, color: tokens.graphite, marginTop: 8, lineHeight: 1.5 }}>{rebate.amountReason}</div>
              </div>
              {rebate.amountTwo > 0 && (
                <div style={{ background: tokens.ink, color:'#fff', padding: 16, borderRadius: 8 }}>
                  <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 28, color: tokens.yellow, lineHeight: 1 }}>+${rebate.amountTwo}</div>
                  <div style={{ fontSize: 12, color:'#cbd5e1', marginTop: 8, lineHeight: 1.5 }}>{rebate.amountTwoReason}</div>
                </div>
              )}
            </div>

            <p style={{ fontSize: 14, lineHeight: 1.7, color: tokens.graphite, margin:'24px 0' }}>{rebate.description}</p>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16, padding:'16px 0', borderTop:`1px solid ${tokens.line}`, borderBottom:`1px solid ${tokens.line}`, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase', color: tokens.mute }}>Promotion period</div>
                <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, marginTop: 4 }}>{formatDate(rebate.startDate)} — {formatDate(rebate.endDate)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase', color: tokens.mute }}>Quantity required</div>
                <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, marginTop: 4 }}>Set of {rebate.qtyRequired} tires</div>
              </div>
            </div>

            <a href={rebate.pdfUrl} target="_blank" rel="noreferrer" style={{
              display:'flex', alignItems:'center', justifyContent:'space-between', gap: 12,
              padding:'18px 22px', background: tokens.primary, color:'#fff', borderRadius: 10, textDecoration:'none',
              marginBottom: 10,
            }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase', opacity: .8 }}>Step 1 — Get the form</div>
                <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 18, marginTop: 2 }}>Open official rebate form (PDF)</div>
              </div>
              <Icon name="picture_as_pdf" size={28} />
            </a>

            <button onClick={() => navigate('/tires')} style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', gap: 12,
              padding:'18px 22px', background:'transparent', color: tokens.ink, border:`1px solid ${tokens.line}`, borderRadius: 10,
              fontFamily:'inherit', cursor:'pointer', textAlign:'left',
            }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase', color: tokens.mute }}>Step 2 — Qualify</div>
                <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 18, marginTop: 2 }}>Shop qualifying {rebate.brand} tires</div>
              </div>
              <Icon name="arrow_forward" size={22} />
            </button>

            <p style={{ fontSize: 12, color: tokens.mute, lineHeight: 1.6, marginTop: 20, paddingTop: 16, borderTop:`1px solid ${tokens.lineSoft}` }}>
              Rebates paid by prepaid card or virtual card, typically within 6–8 weeks of install. Holbrook Tire will supply your installation receipt and help you submit the rebate form at checkout — just ask at any of our three Michigan locations.
            </p>
          </div>
        </div>
      </div>
    </>
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
                onClick={() => navigate(`/rebates/?rebate=${origIdx}`)}
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

function formatDate(s) {
  if (!s) return '';
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})/);
  if (!m) return s;
  const [, mo, d, y] = m;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[+mo - 1]} ${+d}, 20${y}`;
}

Object.assign(window, { RebatesPage, RebateDetailPage, RebatesBanner, RebateCard, RebateStat, RebateStack, formatDate });
