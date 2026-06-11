// ─────────────── PageWheels.jsx
// No imports — relies on globals from setup.js (React hooks, tokens, AppCtx, useApp)
// and components.jsx (Icon, Btn, Eyebrow, Headline, Stars, FilterGroup, FilterCheck, WheelSvg, TireSvg, SpecItem)

function WheelsPLP() {
  const { route, vehicle, navigate, wheelBrandsList } = useApp();
  const [wheels, setWheels] = useState(window.HOLBROOK_DATA.wheels);
  const [loading, setLoading] = useState(true);
  const wheelBrands = useMemo(() => wheelBrandsList.map(function(b) { return b.name; }), [wheelBrandsList]);

  useEffect(() => {
    setLoading(true);
    api.fetchWheels().then(data => {
      const items = extractItems(data);
      if (items) {
        const normalized = items.map(function(w) {
          return {
            id: w.Id || w.PartNumber || ('w-' + (w.Brand||'') + '-' + (w.Model||w.SubModel||'Unknown')).replace(/\s/g,'-').toLowerCase(),
            brand: w.Brand || w.brand || '',
            model: w.Model || w.model || w.SubModel || 'Unknown',
            size: w.Size || w.size || ((w.Diameter||'') + 'x' + (w.Width||'')),
            offset: w.Offset ? ('+' + w.Offset) : '',
            bolt: w.BoltPattern || w.boltPattern || '',
            finish: w.Finish || w.ShortFinish || w.finish || '',
            type: w.Construction || w.construction || 'Cast',
            priceEach: w.Price || w.price || 0,
            rating: w.Rating || (4.5 + Math.random() * 0.4),
            reviews: w.Reviews || Math.floor(100 + Math.random() * 400),
            imgUrl: w.ImgUrlBase && w.ImgThumb ? w.ImgUrlBase + w.ImgThumb : (w.imgUrl || null),
          };
        });
        console.log('[Holbrook] Loaded', normalized.length, 'wheels from API');
        setWheels(normalized);
        window.HOLBROOK_DATA.wheels = normalized;
      } else {
        console.warn('[Holbrook] Wheels: no items found. Keys:', data ? Object.keys(data) : 'null');
      }
    }).catch(function(err) {
      console.warn('[Holbrook] Wheels API failed, using static fallback:', err.message || err);
    }).finally(function() { setLoading(false); });
  }, []);

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const initType = params.get('type') || '';

  const [typeF, setTypeF]   = useState(initType ? [initType] : []);
  const [brandF, setBrandF] = useState([]);
  const [finishF, setFinishF] = useState([]);
  const [diaF, setDiaF]     = useState('');
  const [sort, setSort]     = useState('featured');

  const types    = ['Forged','Flow-Formed','Cast','Replica'];
  const finishes = [...new Set(wheels.map(w => w.finish))].sort();
  const diameters= [...new Set(wheels.map(w => parseInt(w.size)))].sort((a,b)=>a-b);

  const filtered = useMemo(() => {
    let L = wheels;
    if (typeF.length)   L = L.filter(w => typeF.includes(w.type));
    if (brandF.length)  L = L.filter(w => brandF.includes(w.brand));
    if (finishF.length) L = L.filter(w => finishF.includes(w.finish));
    if (diaF)           L = L.filter(w => w.size.startsWith(String(diaF)));
    if (sort === 'price-low')  L = [...L].sort((a,b) => a.priceEach - b.priceEach);
    if (sort === 'price-high') L = [...L].sort((a,b) => b.priceEach - a.priceEach);
    if (sort === 'rating')     L = [...L].sort((a,b) => b.rating - a.rating);
    return L;
  }, [wheels, typeF, brandF, finishF, diaF, sort]);

  const toggle = (arr, setArr, v) => setArr(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  return (
    <div style={{ maxWidth: 1320, margin:'0 auto', padding:'40px 32px' }}>
      <div style={{ borderBottom:`1px solid ${tokens.line}`, paddingBottom: 24, marginBottom: 28 }}>
        <Eyebrow>Shop wheels</Eyebrow>
        <Headline size="h1" style={{ fontSize: 56, marginTop: 6 }}>
          {vehicle ? `Wheels that fit your ${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Aftermarket, replica & winter wheels'}
        </Headline>
        <p style={{ fontSize: 15, color: tokens.taupe, marginTop: 10, maxWidth: 720 }}>
          Vossen, HRE, BBS, Enkei, Method, and more. Sold as singles or sets of four — pair with tires to save on mount &amp; balance.
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap: 40 }}>
        <aside>
          <FilterGroup label="Type">
            {types.map(t => (
              <FilterCheck key={t} checked={typeF.includes(t)} onChange={()=>toggle(typeF,setTypeF,t)} label={t} />
            ))}
          </FilterGroup>
          <FilterGroup label="Brand">
            {wheelBrands.map(b => (
              <FilterCheck key={b} checked={brandF.includes(b)} onChange={()=>toggle(brandF,setBrandF,b)} label={b} />
            ))}
          </FilterGroup>
          <FilterGroup label="Finish">
            {finishes.map(f => (
              <FilterCheck key={f} checked={finishF.includes(f)} onChange={()=>toggle(finishF,setFinishF,f)} label={f} />
            ))}
          </FilterGroup>
          <FilterGroup label="Diameter">
            <select value={diaF} onChange={e=>setDiaF(e.target.value)} style={{ width:'100%', padding:'10px 12px', fontSize: 13, fontWeight: 600, border:`1px solid ${tokens.line}`, borderRadius: 6, background:'#fff' }}>
              <option value="">All diameters</option>
              {diameters.map(d => <option key={d} value={d}>{d}"</option>)}
            </select>
          </FilterGroup>
          {(typeF.length || brandF.length || finishF.length || diaF) ? (
            <button onClick={()=>{ setTypeF([]); setBrandF([]); setFinishF([]); setDiaF(''); }} style={{
              marginTop: 8, background:'none', border:`1px solid ${tokens.line}`, padding:'10px 14px',
              fontSize: 11, fontWeight: 700, letterSpacing:'.14em', textTransform:'uppercase', cursor:'pointer',
              width:'100%', borderRadius: 6,
            }}>Clear filters</button>
          ) : null}
        </aside>

        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: tokens.taupe, fontWeight: 600 }}>{filtered.length} wheels</div>
            <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: tokens.mute, fontWeight: 700, letterSpacing:'.14em', textTransform:'uppercase' }}>Sort</span>
              <select value={sort} onChange={e=>setSort(e.target.value)} style={{ padding:'8px 12px', fontSize: 13, fontWeight: 600, border:`1px solid ${tokens.line}`, borderRadius: 6, background:'#fff' }}>
                <option value="featured">Featured</option>
                <option value="price-low">Price, low to high</option>
                <option value="price-high">Price, high to low</option>
                <option value="rating">Top-rated</option>
              </select>
            </div>
          </div>
          {loading && (
            <div style={{ padding: 60, textAlign:'center' }}>
              <div style={{ display:'inline-block', width: 36, height: 36, border: '3px solid ' + tokens.line, borderTopColor: tokens.primary, borderRadius: '50%', animation: 'htmSpin 0.8s linear infinite' }} />
              <div style={{ marginTop: 14, fontSize: 13, color: tokens.mute, fontWeight: 600 }}>Loading wheels from inventory...</div>
              <style>{`@keyframes htmSpin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          {!loading && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
              {filtered.map(w => <WheelCard key={w.id} wheel={w} />)}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 40, textAlign:'center', color: tokens.taupe }}>
              No wheels match those filters. <button onClick={()=>{ setTypeF([]); setBrandF([]); setFinishF([]); setDiaF(''); }} style={{ background:'none', border:'none', color: tokens.primary, fontWeight: 700, cursor:'pointer', textDecoration:'underline' }}>Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WheelCard({ wheel }) {
  const { navigate } = useApp();
  return (
    <a href={`/wheels/?product=${wheel.id}`} onClick={e=>{e.preventDefault(); navigate(`/wheel/${wheel.id}`);}} style={{
      display:'block', background:'#fff', border:`1px solid ${tokens.line}`, padding: 18, textDecoration:'none', color:'inherit',
      borderRadius: 6, transition:'all .15s',
    }}
    onMouseOver={e => { e.currentTarget.style.borderColor = tokens.primary; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseOut={e => { e.currentTarget.style.borderColor = tokens.line; e.currentTarget.style.transform = 'none'; }}>
      <div style={{ aspectRatio:'1/1', background: tokens.surfLow, borderRadius: 4, display:'flex', alignItems:'center', justifyContent:'center', marginBottom: 14 }}>
        {wheel.imgUrl ? (
          <img src={wheel.imgUrl} alt={wheel.brand + ' ' + wheel.model} style={{ maxWidth:'85%', maxHeight:'85%', objectFit:'contain' }} />
        ) : (
          <WheelSvg />
        )}
      </div>
      <div style={{ fontSize: 11, color: tokens.mute, fontWeight: 700, letterSpacing:'.14em', textTransform:'uppercase' }}>{wheel.brand} · {wheel.type}</div>
      <div style={{ fontFamily:'Space Grotesk', fontSize: 17, fontWeight: 700, marginTop: 4 }}>{wheel.model}</div>
      <div style={{ fontFamily:'JetBrains Mono', fontSize: 12, color: tokens.graphite, marginTop: 4 }}>{wheel.size} · {wheel.finish}</div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop: 12, paddingTop: 12, borderTop:`1px solid ${tokens.lineSoft}` }}>
        <div>
          <div style={{ fontSize: 10, color: tokens.mute, fontWeight: 700, letterSpacing:'.14em', textTransform:'uppercase' }}>Per wheel</div>
          <div style={{ fontFamily:'Space Grotesk', fontSize: 22, fontWeight: 800, color: tokens.primary, marginTop: 2 }}>${wheel.priceEach}</div>
          <div style={{ fontSize: 11, color: tokens.taupe, marginTop: 2 }}>${wheel.priceEach*4} · set of 4</div>
        </div>
        <Stars rating={wheel.rating} reviews={wheel.reviews} />
      </div>
    </a>
  );
}

function WheelPDP({ productId }) {
  const { wheels } = window.HOLBROOK_DATA;
  const { route, navigate, addToCart } = useApp();
  const id = productId || new URLSearchParams(window.location.search).get('product');
  const wheel = wheels.find(w => w.id === id) || wheels[0];
  const [qty, setQty] = useState(4);
  const [showPkgPrompt, setShowPkgPrompt] = useState(false);

  const handleAdd = () => {
    const item = {
      id: wheel.id, type: 'wheel', qty,
      name: `${wheel.brand} ${wheel.model}`,
      subtitle: `${wheel.size} · ${wheel.finish}`,
      price: wheel.priceEach,
      rawBrand: wheel.brand, rawModel: wheel.model, size: wheel.size,
    };
    addToCart(item, qty);
    setShowPkgPrompt(true);
  };

  return (
    <div style={{ maxWidth: 1320, margin:'0 auto', padding:'40px 32px' }}>
      <button onClick={()=>navigate('/wheels')} style={{ background:'none', border:'none', color: tokens.taupe, fontSize: 12, fontWeight: 700, letterSpacing:'.14em', textTransform:'uppercase', cursor:'pointer', padding: 0, marginBottom: 20 }}>
        &#8592; Back to wheels
      </button>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 48 }}>
        <div style={{ background: tokens.surfLow, borderRadius: 8, aspectRatio:'1/1', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {wheel.imgUrl ? (
            <img src={wheel.imgUrl} alt={wheel.brand + ' ' + wheel.model} style={{ maxWidth:'85%', maxHeight:'85%', objectFit:'contain' }} />
          ) : (
            <div style={{ width:'70%' }}><WheelSvg /></div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 11, color: tokens.mute, fontWeight: 700, letterSpacing:'.18em', textTransform:'uppercase' }}>{wheel.brand} · {wheel.type}</div>
          <Headline size="h1" style={{ fontSize: 44, marginTop: 6 }}>{wheel.model}</Headline>
          <div style={{ fontFamily:'JetBrains Mono', fontSize: 16, color: tokens.graphite, marginTop: 8 }}>{wheel.size} · {wheel.offset} · {wheel.bolt}</div>
          <div style={{ fontSize: 14, color: tokens.taupe, marginTop: 6 }}>{wheel.finish}</div>
          <div style={{ marginTop: 14 }}><Stars rating={wheel.rating} reviews={wheel.reviews} /></div>

          <div style={{ display:'flex', gap: 24, marginTop: 24, padding:'18px 0', borderTop:`1px solid ${tokens.line}`, borderBottom:`1px solid ${tokens.line}` }}>
            <SpecItem label="Per wheel" value={`$${wheel.priceEach}`} big />
            <SpecItem label="Set of 4" value={`$${wheel.priceEach*4}`} big />
            <SpecItem label="Construction" value={wheel.type} />
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ fontFamily:'Space Grotesk', fontSize: 12, fontWeight: 700, letterSpacing:'.14em', textTransform:'uppercase', color: tokens.ink, marginBottom: 10 }}>Quantity</div>
            <div style={{ display:'flex', gap: 8 }}>
              {[1,2,4,5].map(n => (
                <button key={n} onClick={()=>setQty(n)} style={{
                  padding:'12px 20px', fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 14,
                  background: qty===n ? tokens.ink : '#fff', color: qty===n ? '#fff' : tokens.ink,
                  border: `1px solid ${qty===n ? tokens.ink : tokens.line}`, borderRadius: 6, cursor:'pointer',
                }}>{n === 4 ? '4 (set)' : n === 5 ? '5 (+spare)' : n}</button>
              ))}
            </div>
          </div>

          <Btn variant="primary" size="lg" icon="shopping_bag" onClick={handleAdd} style={{ width:'100%', marginTop: 24 }}>
            Add to cart · ${(wheel.priceEach * qty).toLocaleString()}
          </Btn>

          <div style={{ marginTop: 20, padding: 18, background: tokens.surfLow, borderRadius: 6, display:'flex', gap: 12, alignItems:'flex-start' }}>
            <Icon name="percent" size={22} style={{ color: tokens.primary }} />
            <div>
              <div style={{ fontFamily:'Space Grotesk', fontSize: 14, fontWeight: 700, color: tokens.ink }}>Pay 25% today, rest at pickup</div>
              <div style={{ fontSize: 13, color: tokens.taupe, marginTop: 2, lineHeight: 1.45 }}>Schedule mount &amp; balance at any Holbrook location — or drop-ship wheels to your door.</div>
            </div>
          </div>
        </div>
      </div>

      {showPkgPrompt && <BuildPackagePrompt type="wheel" item={wheel} onClose={()=>{ setShowPkgPrompt(false); navigate('/cart'); }} />}
    </div>
  );
}

// ─────────────── Build-a-Package prompt modal
function BuildPackagePrompt({ type, item, onClose }) {
  const { tires, wheels } = window.HOLBROOK_DATA;
  const { addToCart, vehicle } = useApp();
  const [saveName, setSaveName] = useState('');
  const [phase, setPhase] = useState('offer');

  const companions = useMemo(() => {
    if (type === 'tire') {
      const dia = item.size.match(/R(\d+)/)?.[1];
      return wheels.filter(w => w.size.startsWith(dia + 'x')).slice(0, 3);
    } else {
      const dia = item.size.split('x')[0];
      return tires.filter(t => t.size.includes(`R${dia}`)).slice(0, 3);
    }
  }, [type, item, tires, wheels]);

  const saveToGarage = () => {
    const saved = JSON.parse(localStorage.getItem('htm_saved_packages') || '[]');
    const entry = {
      id: `sp-${Date.now()}`,
      name: saveName || `${item.brand} ${item.model} build`,
      type, item: { ...item }, vehicle: vehicle || null,
      created: new Date().toISOString(),
    };
    saved.unshift(entry);
    localStorage.setItem('htm_saved_packages', JSON.stringify(saved.slice(0, 20)));
    setPhase('saved');
  };

  const addCompanion = (comp) => {
    const isTire = 'season' in comp;
    const cItem = isTire ? {
      id: comp.id, type: 'tire', qty: 4,
      name: `${comp.brand} ${comp.model}`,
      subtitle: `${comp.size} · ${comp.season}`,
      price: comp.priceEach,
      rawBrand: comp.brand, rawModel: comp.model, size: comp.size,
    } : {
      id: comp.id, type: 'wheel', qty: 4,
      name: `${comp.brand} ${comp.model}`,
      subtitle: `${comp.size} · ${comp.finish}`,
      price: comp.priceEach,
      rawBrand: comp.brand, rawModel: comp.model, size: comp.size,
    };
    addToCart(cItem, 4);
    setPhase('pair-added');
  };

  const otherNoun = type === 'tire' ? 'wheels' : 'tires';
  const bundleSave = 120;

  return (
    <div style={{ position:'fixed', inset: 0, background:'rgba(10,12,14,.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 100, padding: 24 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius: 10, maxWidth: 680, width:'100%', padding: 0, boxShadow:'0 30px 80px rgba(0,0,0,.3)', overflow:'hidden', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #850824 0%, #5e0519 100%)', padding:'28px 32px', color:'#fff' }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            <Icon name="check_circle" size={22} />
            <span style={{ fontFamily:'Space Grotesk', fontSize: 12, fontWeight: 700, letterSpacing:'.16em', textTransform:'uppercase' }}>Added to cart</span>
          </div>
          <div style={{ fontFamily:'Space Grotesk', fontSize: 26, fontWeight: 700, marginTop: 8, lineHeight: 1.2 }}>
            {item.brand} {item.model}
          </div>
          <div style={{ fontSize: 13, opacity: .85, marginTop: 4 }}>{item.size}{type==='tire' && ` · ${item.season}`}{type==='wheel' && ` · ${item.finish}`}</div>
        </div>

        <div style={{ padding: 32 }}>
          {phase === 'offer' && (
            <>
              <Headline size="h2" style={{ fontSize: 26, lineHeight: 1.2 }}>
                Build a package — save ${bundleSave} on {type === 'tire' ? 'mount & balance' : 'mounting'}
              </Headline>
              <p style={{ fontSize: 14, color: tokens.taupe, marginTop: 10, lineHeight: 1.5 }}>
                Pair your {item.brand} {item.model} with {otherNoun} and we'll mount, balance, and torque them as a single package — no extra fitting fee.
              </p>

              <div style={{ marginTop: 20 }}>
                <div style={{ fontFamily:'Space Grotesk', fontSize: 11, fontWeight: 700, letterSpacing:'.16em', textTransform:'uppercase', color: tokens.ink, marginBottom: 12 }}>
                  Suggested {otherNoun} {vehicle ? `for your ${vehicle.year} ${vehicle.make} ${vehicle.model}` : `(matching ${item.size})`}
                </div>

                {companions.length === 0 ? (
                  <div style={{ padding: 24, background: tokens.surfLow, borderRadius: 6, textAlign:'center', color: tokens.taupe, fontSize: 13 }}>
                    No matching {otherNoun} in stock for this size — browse the full catalog instead.
                  </div>
                ) : (
                  <div style={{ display:'grid', gap: 10 }}>
                    {companions.map(c => (
                      <div key={c.id} style={{ display:'flex', gap: 14, padding: 14, border:`1px solid ${tokens.line}`, borderRadius: 6, alignItems:'center' }}>
                        <div style={{ width: 52, height: 52, background: tokens.surfLow, borderRadius: 4, display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0 }}>
                          {type === 'tire' ? <WheelSvg/> : <TireSvg/>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 14 }}>{c.brand} {c.model}</div>
                          <div style={{ fontSize: 12, color: tokens.taupe, fontFamily:'JetBrains Mono' }}>{c.size}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontFamily:'Space Grotesk', fontSize: 16, fontWeight: 800, color: tokens.primary }}>${c.priceEach*4}</div>
                          <div style={{ fontSize: 10, color: tokens.mute, textTransform:'uppercase', letterSpacing:'.1em' }}>set of 4</div>
                        </div>
                        <button onClick={()=>addCompanion(c)} style={{
                          padding:'8px 14px', background: tokens.ink, color:'#fff', border:'none', borderRadius: 6,
                          fontSize: 11, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase', cursor:'pointer',
                        }}>Add set</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10, marginTop: 24 }}>
                <button onClick={()=>setPhase('save')} style={{
                  padding:'14px', background:'#fff', color: tokens.ink, border:`1px solid ${tokens.line}`, borderRadius: 6,
                  fontFamily:'Space Grotesk', fontSize: 12, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase', cursor:'pointer',
                  display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 6,
                }}>
                  <Icon name="bookmark" size={16} /> Save build
                </button>
                <button onClick={onClose} style={{
                  padding:'14px', background: tokens.ink, color:'#fff', border:'none', borderRadius: 6,
                  fontFamily:'Space Grotesk', fontSize: 12, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase', cursor:'pointer',
                }}>
                  Go to cart &#8594;
                </button>
              </div>
            </>
          )}

          {phase === 'save' && (
            <>
              <Headline size="h2" style={{ fontSize: 24 }}>Save this build to your garage</Headline>
              <p style={{ fontSize: 14, color: tokens.taupe, marginTop: 8, lineHeight: 1.5 }}>
                Come back anytime and add it to cart in one click.
              </p>
              <div style={{ marginTop: 18 }}>
                <label style={{ fontFamily:'Space Grotesk', fontSize: 11, fontWeight: 700, letterSpacing:'.14em', textTransform:'uppercase', color: tokens.ink }}>Build name</label>
                <input type="text" value={saveName} onChange={e=>setSaveName(e.target.value)}
                  placeholder={`${item.brand} ${item.model} — ${vehicle ? `${vehicle.year} ${vehicle.model}` : 'my build'}`}
                  style={{ width:'100%', padding:'12px 14px', marginTop: 8, fontSize: 14, border:`1px solid ${tokens.line}`, borderRadius: 6 }}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10, marginTop: 24 }}>
                <button onClick={()=>setPhase('offer')} style={{
                  padding:'14px', background:'#fff', color: tokens.ink, border:`1px solid ${tokens.line}`, borderRadius: 6,
                  fontFamily:'Space Grotesk', fontSize: 12, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase', cursor:'pointer',
                }}>&#8592; Back</button>
                <button onClick={saveToGarage} style={{
                  padding:'14px', background: tokens.primary, color:'#fff', border:'none', borderRadius: 6,
                  fontFamily:'Space Grotesk', fontSize: 12, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase', cursor:'pointer',
                }}>Save build</button>
              </div>
            </>
          )}

          {phase === 'saved' && (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <Icon name="check_circle" size={48} style={{ color:'#2e7d32' }} />
              <Headline size="h2" style={{ fontSize: 24, marginTop: 14 }}>Saved to your garage</Headline>
              <p style={{ fontSize: 14, color: tokens.taupe, marginTop: 8 }}>Find it under Garage &#8594; Saved builds.</p>
              <button onClick={onClose} style={{
                marginTop: 24, padding:'14px 32px', background: tokens.ink, color:'#fff', border:'none', borderRadius: 6,
                fontFamily:'Space Grotesk', fontSize: 12, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase', cursor:'pointer',
              }}>Go to cart &#8594;</button>
            </div>
          )}

          {phase === 'pair-added' && (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <Icon name="check_circle" size={48} style={{ color:'#2e7d32' }} />
              <Headline size="h2" style={{ fontSize: 24, marginTop: 14 }}>Package built!</Headline>
              <p style={{ fontSize: 14, color: tokens.taupe, marginTop: 8, maxWidth: 360, margin:'8px auto 0' }}>
                Your tires and wheels will ship mounted &amp; balanced — ready to install.
              </p>
              <button onClick={onClose} style={{
                marginTop: 24, padding:'14px 32px', background: tokens.primary, color:'#fff', border:'none', borderRadius: 6,
                fontFamily:'Space Grotesk', fontSize: 12, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase', cursor:'pointer',
              }}>Go to cart &#8594;</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { WheelsPLP, WheelCard, WheelPDP, BuildPackagePrompt });
