// ─────────────── PageCheckout.jsx
// No imports — relies on globals from setup.js (React hooks, tokens, AppCtx, useApp)
// and components.jsx (Icon, Btn, Eyebrow, Headline, WheelSvg)

function CheckoutPage() {
  const { cart, navigate, setLastOrder, clearCart, defaults } = useApp();
  const { locations } = window.HOLBROOK_DATA;
  const [mode, setMode] = useState('install');
  const [store, setStore] = useState(locations[0].id);
  const [contact, setContact] = useState({ name:'', email:'', phone:'' });
  const [addr, setAddr] = useState({ street:'', city:'', state:'MI', zip:'' });
  const [pref, setPref] = useState({ window:'weekday', note:'' });
  const [financing, setFinancing] = useState('deposit');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);

  const subtotal = cart.reduce((s,p) => s + p.price*p.qty, 0);
  const install = cart.reduce((s,p) => s + 160*p.qty, 0);
  const disposal = cart.reduce((s,p) => s + 12*p.qty, 0);
  const ship = cart.reduce((s,p) => s + p.qty*125, 0);
  const tax = Math.round((subtotal + (mode==='install' ? install : ship)) * 0.06);
  const total = mode==='install' ? (subtotal + install + disposal + tax) : (subtotal + ship + tax);
  const depositPct = defaults?.depositPct ?? 25;
  const dueToday = total;
  const dueLater = 0;

  if (cart.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin:'80px auto', textAlign:'center', padding:'0 24px' }}>
        <Headline>Your cart is empty</Headline>
        <Btn variant="primary" size="lg" style={{ marginTop: 24 }} onClick={()=>navigate('/shop')}>Shop Now</Btn>
      </div>
    );
  }

  const placeOrder = async () => {
    setPayError('');
    if (!window.HolbrookCart) { setPayError('Cart unavailable. Please refresh.'); return; }
    if (!stripeRef.current || !elementsRef.current) { setPayError('Payment form is still loading. Try again in a moment.'); return; }
    if (!contact.email) { setPayError('Please enter your email.'); return; }
    if (mode === 'ship' && (!addr.street || !addr.city || !addr.zip)) { setPayError('Please enter your shipping address.'); return; }
    setPaying(true);
    try {
      // Step 0: Rebuild the Medusa cart fresh on every Pay click so it always
      // reflects the current local cart + the current fee breakdown. Tire/wheel
      // line items use the real product price; install/disposal/tax/shipping
      // are added as separate fee line items via the Service Fee variant.
      let medusaCart = await HolbrookCart.getCartData();
      if (medusaCart && (medusaCart.items || []).length > 0) {
        for (const li of medusaCart.items) {
          try { await HolbrookCart.removeItem(li.id); } catch (e) { console.warn('[Checkout] failed to remove stale line item:', e); }
        }
      }
      const totalUnits = cart.reduce((s, it) => s + (it.qty || 0), 0);
      for (const it of cart) {
        await HolbrookCart.addItem({
          id: it.id, type: it.type, name: it.name, brand: it.brand, size: it.size,
          price: Number(it.price || 0), image: it.image, qty: it.qty,
          title: it.name || undefined
        });
      }
      if (mode === 'install') {
        if (install > 0) await HolbrookCart.addFeeItem({ title: 'Installation & Balance', unitPrice: install, quantity: 1, kind: 'install' });
        if (disposal > 0) await HolbrookCart.addFeeItem({ title: 'Tire Disposal', unitPrice: disposal, quantity: 1, kind: 'disposal' });
      } else {
        if (ship > 0) await HolbrookCart.addFeeItem({ title: 'Shipping & Freight', unitPrice: ship, quantity: 1, kind: 'shipping' });
      }
      if (tax > 0) await HolbrookCart.addFeeItem({ title: 'MI Sales Tax', unitPrice: tax, quantity: 1, kind: 'tax' });
      medusaCart = await HolbrookCart.getCartData();
      if (!medusaCart || !(medusaCart.items || []).length) throw new Error('Could not sync cart items to Medusa.');
      const nameParts = (contact.name || 'Customer').trim().split(/\s+/);
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || 'Holbrook';
      const loc = locations.find(l => l.id === store);
      const useAddr = mode === 'ship'
        ? { street: addr.street, city: addr.city, state: addr.state, zip: addr.zip }
        : { street: loc?.addr || '21221 W 7 Mile Rd', city: loc?.city || 'Detroit', state: 'MI', zip: loc?.zip || '48219' };
      const addressObj = {
        first_name: firstName,
        last_name: lastName,
        address_1: useAddr.street,
        city: useAddr.city,
        province: useAddr.state,
        postal_code: useAddr.zip,
        country_code: 'us',
        phone: contact.phone || '',
      };
      await HolbrookCart.updateCart({ email: contact.email, shipping_address: addressObj, billing_address: addressObj });
      const options = await HolbrookCart.getShippingOptions();
      if (!options.length) throw new Error('No shipping options configured for this region.');
      await HolbrookCart.addShippingMethod(options[0].id);
      const { error: submitError } = await elementsRef.current.submit();
      if (submitError) throw new Error(submitError.message || 'Card details invalid.');
      const pc = await HolbrookCart.createPaymentCollection();
      const pcWithSession = await HolbrookCart.initStripeSession(pc.id);
      const session = (pcWithSession.payment_sessions || [])[0];
      const clientSecret = session && session.data && session.data.client_secret;
      if (!clientSecret) throw new Error('Stripe session did not return a client_secret.');
      const { error: confirmError } = await stripeRef.current.confirmPayment({
        elements: elementsRef.current,
        clientSecret,
        confirmParams: { return_url: window.location.origin + '/checkout/?confirmed=1' },
        redirect: 'if_required',
      });
      if (confirmError) throw new Error(confirmError.message || 'Payment was not authorized.');
      const order = await HolbrookCart.completeCart();
      const orderId = order.display_id ? 'HB' + order.display_id : (order.id || ('HB' + Math.floor(Math.random()*900000 + 100000)));
      setLastOrder({ id: orderId, mode, store, contact, addr, pref, total, dueToday, dueLater, items: cart, financing, depositPct });
      clearCart();
      navigate('/checkout/?confirmed=1');
    } catch (err) {
      console.error('[Checkout] Payment failed:', err);
      setPayError(err.message || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div style={{ background: tokens.surface, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1320, margin:'0 auto', padding:'40px 32px 60px' }}>
        <Eyebrow>Checkout · Secure</Eyebrow>
        <Headline size="h1" style={{ fontSize: 48, marginTop: 8 }}>Two ways to finish.</Headline>
        <p style={{ fontSize: 16, color: tokens.taupe, marginTop: 12, maxWidth: 600 }}>Choose how you want your package delivered. Install with us and pay just {depositPct}% today — or pay in full and we'll ship straight to your door.</p>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 400px', gap: 32, marginTop: 40 }}>
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
              <ModeCard
                active={mode==='install'}
                onClick={()=>setMode('install')}
                icon="garage_home"
                eyebrow={`${depositPct}% today · rest at install`}
                title="Install at Holbrook"
                desc="Reserve your package with a deposit. Pay the remainder when your car leaves the bay."
                pill="Most popular"
              />
              <ModeCard
                active={mode==='ship'}
                onClick={()=>setMode('ship')}
                icon="local_shipping"
                eyebrow="Full payment · we ship"
                title="Drop-ship to me"
                desc="Mounted, balanced, and shipped anywhere. Install wherever you like."
              />
            </div>

            <CheckoutSection title="Contact">
              <Grid2>
                <Field label="Full name" val={contact.name} onChange={v=>setContact({...contact, name:v})} placeholder="Alex Miller"/>
                <Field label="Phone" val={contact.phone} onChange={v=>setContact({...contact, phone:v})} placeholder="(313) 555-0101"/>
              </Grid2>
              <Field label="Email" val={contact.email} onChange={v=>setContact({...contact, email:v})} placeholder="you@example.com"/>
            </CheckoutSection>

            {mode==='install' ? (
              <>
                <CheckoutSection title="Pick your Holbrook location">
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12 }}>
                    {locations.map(l => (
                      <button key={l.id} onClick={()=>setStore(l.id)} style={{
                        textAlign:'left', background:'#fff', cursor:'pointer',
                        border: store===l.id ? `2px solid ${tokens.primary}` : `1px solid ${tokens.line}`,
                        padding: 18, borderRadius: 10, position:'relative',
                      }}>
                        {store===l.id && <div style={{ position:'absolute', top: 10, right: 10, background: tokens.primary, color:'#fff', borderRadius: 999, width: 22, height: 22, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="check" size={14}/></div>}
                        <Eyebrow style={{ color: tokens.primary }}>Holbrook</Eyebrow>
                        <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 20, marginTop: 4 }}>{l.city}</div>
                        <div style={{ fontSize: 12, color: tokens.graphite, marginTop: 6, lineHeight: 1.5 }}>{l.addr}<br/>{l.city}, MI {l.zip}</div>
                        <div style={{ fontSize: 12, color: tokens.primary, fontWeight: 700, marginTop: 8 }}>{l.phone}</div>
                      </button>
                    ))}
                  </div>
                </CheckoutSection>

                <CheckoutSection title="Scheduling preference" subtitle="We'll call within 24 hours to lock in your install day.">
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 10 }}>
                    {[['weekday','Weekday daytime','event'],['weekend','Saturday','weekend'],['evening','After 4 PM weekday','nightlight']].map(([k,l,ic]) => (
                      <button key={k} onClick={()=>setPref({...pref, window:k})} style={{
                        background:'#fff', cursor:'pointer', textAlign:'left',
                        border: pref.window===k ? `2px solid ${tokens.primary}` : `1px solid ${tokens.line}`,
                        padding:'14px 16px', borderRadius: 10, display:'flex', alignItems:'center', gap: 12,
                      }}>
                        <Icon name={ic} size={22} style={{ color: tokens.primary }}/>
                        <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 14 }}>{l}</div>
                      </button>
                    ))}
                  </div>
                  <textarea placeholder="Notes for our team (optional) — vehicle details, lowered spring clearance, TPMS type, etc." value={pref.note} onChange={e=>setPref({...pref, note:e.target.value})} style={{ marginTop: 12, width:'100%', padding: 14, border:`1px solid ${tokens.line}`, borderRadius: 8, fontFamily:'Inter', fontSize: 14, minHeight: 80, resize:'vertical' }}/>
                </CheckoutSection>
              </>
            ) : (
              <>
                <CheckoutSection title="Shipping address">
                  <Field label="Street" val={addr.street} onChange={v=>setAddr({...addr, street:v})} placeholder="21221 W 7 Mile Rd"/>
                  <Grid3>
                    <Field label="City" val={addr.city} onChange={v=>setAddr({...addr, city:v})} placeholder="Detroit"/>
                    <Field label="State" val={addr.state} onChange={v=>setAddr({...addr, state:v})} placeholder="MI"/>
                    <Field label="ZIP" val={addr.zip} onChange={v=>setAddr({...addr, zip:v})} placeholder="48219"/>
                  </Grid3>
                  <div style={{ marginTop: 14, padding:'14px 16px', background: tokens.surfLow, borderRadius: 8, display:'flex', gap: 12, alignItems:'center', fontSize: 13 }}>
                    <Icon name="local_shipping" size={20} style={{ color: tokens.primary }}/>
                    <div><strong>Standard freight</strong> — 3–5 business days. Mounted, balanced, crated.</div>
                    <div style={{ marginLeft:'auto', fontWeight: 700 }}>${ship.toLocaleString()}</div>
                  </div>
                </CheckoutSection>
              </>
            )}

            <CheckoutSection title={mode==='install' ? `Pay ${depositPct}% today` : 'Payment'}>
              {mode==='install' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[['deposit',`${depositPct}% deposit`, 'Pay balance at install'],[`${defaults?.financingPartner || 'affirm'}`, (defaults?.financingPartner || 'affirm').toUpperCase(), 'Split balance in 4']].map(([k,l,d]) => (
                    <button key={k} onClick={()=>setFinancing(k)} style={{
                      background:'#fff', cursor:'pointer', textAlign:'left',
                      border: financing===k ? `2px solid ${tokens.primary}` : `1px solid ${tokens.line}`,
                      padding:'14px 16px', borderRadius: 10,
                    }}>
                      <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 15 }}>{l}</div>
                      <div style={{ fontSize: 12, color: tokens.mute, marginTop: 2 }}>{d}</div>
                    </button>
                  ))}
                </div>
              )}
              <StripePaymentSection amount={dueToday} stripeRef={stripeRef} elementsRef={elementsRef}/>
              {payError && (
                <div style={{ marginTop: 14, padding:'12px 14px', background:'#fdecea', border:'1px solid #f5c2c0', borderRadius: 8, color:'#7a1d1a', fontSize: 13, lineHeight: 1.5 }}>
                  {payError}
                </div>
              )}
            </CheckoutSection>
          </div>

          <div style={{ position:'sticky', top: 140, alignSelf:'start' }}>
            <div style={{ background:'#fff', border:`1px solid ${tokens.line}`, padding: 24, borderRadius: 12 }}>
              <Eyebrow>{mode==='install' ? 'Install summary' : 'Ship summary'}</Eyebrow>
              <div style={{ fontFamily:'Space Grotesk', fontSize: 22, fontWeight: 700, marginTop: 4 }}>Your order</div>
              {cart.map(it => (
                <div key={it.id} style={{ display:'flex', gap: 12, marginTop: 14, paddingBottom: 14, borderBottom:`1px solid ${tokens.line}` }}>
                  <div style={{ width: 60, height: 60, background: tokens.surfLow, borderRadius: 6, display:'flex', alignItems:'center', justifyContent:'center' }}><WheelSvg/></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing:'.12em', color: tokens.mute, textTransform:'uppercase' }}>{it.wheelBrand} × {it.tireBrand}</div>
                    <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 14, marginTop: 2 }}>{it.name}</div>
                    <div style={{ fontSize: 11, color: tokens.mute, marginTop: 2 }}>Qty {it.qty} · ${(it.price*it.qty).toLocaleString()}</div>
                  </div>
                </div>
              ))}
              {[
                ['Subtotal', subtotal],
                mode==='install' && ['Install & balance', install],
                mode==='install' && ['Disposal', disposal],
                mode==='ship' && ['Shipping', ship],
                ['MI sales tax', tax],
              ].filter(Boolean).map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', fontSize: 13 }}>
                  <span style={{ color: tokens.graphite }}>{l}</span>
                  <span style={{ fontWeight: 600 }}>${v.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ borderTop:`1px solid ${tokens.line}`, marginTop: 10, paddingTop: 14, display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <span style={{ fontFamily:'Space Grotesk', fontSize: 16, fontWeight: 700 }}>Order total</span>
                <span style={{ fontFamily:'Space Grotesk', fontSize: 26, fontWeight: 700 }}>${total.toLocaleString()}</span>
              </div>

              {mode==='install' ? (
                <div style={{ marginTop: 16, padding: 16, background:'linear-gradient(135deg,#850824,#a62639)', color:'#fff', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing:'.18em' }}>DUE TODAY</div>
                  <div style={{ fontFamily:'Space Grotesk', fontSize: 34, fontWeight: 700, marginTop: 2, letterSpacing:'-.02em' }}>${dueToday.toLocaleString()}</div>
                  <div style={{ fontSize: 12, opacity:.85, marginTop: 6, borderTop:'1px solid rgba(255,255,255,.2)', paddingTop: 10 }}>
                    ${dueLater.toLocaleString()} balance due at install
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 16, padding: 16, background: tokens.slate900, color:'#fff', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing:'.18em', color: tokens.primaryAccent }}>DUE NOW</div>
                  <div style={{ fontFamily:'Space Grotesk', fontSize: 34, fontWeight: 700, marginTop: 2, letterSpacing:'-.02em' }}>${dueToday.toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: tokens.slate400, marginTop: 6 }}>Full payment — ships in 3–5 days</div>
                </div>
              )}

              <Btn variant="primaryGrad" size="lg" full iconRight={paying ? null : "arrow_forward"} disabled={paying} style={{ marginTop: 16 }} onClick={placeOrder}>
                {paying ? 'Processing…' : (mode==='install' ? `Pay $${dueToday.toLocaleString()} & reserve` : `Pay $${dueToday.toLocaleString()} & ship`)}
              </Btn>
              <div style={{ marginTop: 12, display:'flex', flexDirection:'column', gap: 6, fontSize: 11, color: tokens.mute }}>
                <span style={{ display:'inline-flex', gap: 6, alignItems:'center' }}><Icon name="lock" size={12}/> 256-bit encrypted · Stripe</span>
                <span style={{ display:'inline-flex', gap: 6, alignItems:'center' }}><Icon name="verified" size={12}/> Lowest-price guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeCard({ active, onClick, icon, eyebrow, title, desc, pill }) {
  return (
    <button onClick={onClick} style={{
      position:'relative', textAlign:'left', cursor:'pointer', borderRadius: 14, padding: 28,
      background: active ? (title.includes('Install') ? 'linear-gradient(135deg,#850824,#a62639)' : tokens.slate900) : '#fff',
      color: active ? '#fff' : tokens.ink,
      border: active ? '2px solid transparent' : `2px solid ${tokens.line}`,
      boxShadow: active ? '0 12px 28px rgba(133,8,36,.25)' : 'none',
      transition: 'all .18s ease-out',
    }}>
      {pill && <div style={{ position:'absolute', top: 12, right: 12, background: active ? 'rgba(255,255,255,.2)' : tokens.yellow, color: active ? '#fff' : tokens.ink, fontSize: 9, fontWeight: 800, letterSpacing:'.14em', padding:'4px 10px', borderRadius: 999 }}>{pill.toUpperCase()}</div>}
      <Icon name={icon} size={36} style={{ color: active ? '#fff' : tokens.primary }}/>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase', color: active ? 'rgba(255,255,255,.7)' : tokens.primary, marginTop: 14 }}>{eyebrow}</div>
      <div style={{ fontFamily:'Space Grotesk', fontSize: 22, fontWeight: 700, marginTop: 4, letterSpacing:'-.01em' }}>{title}</div>
      <div style={{ fontSize: 13, color: active ? 'rgba(255,255,255,.85)' : tokens.taupe, marginTop: 10, lineHeight: 1.55 }}>{desc}</div>
    </button>
  );
}

function CheckoutSection({ title, subtitle, children }) {
  return (
    <div style={{ marginTop: 32, background:'#fff', border:`1px solid ${tokens.line}`, borderRadius: 12, padding: 28 }}>
      <div style={{ fontFamily:'Space Grotesk', fontSize: 20, fontWeight: 700, letterSpacing:'-.01em' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: tokens.mute, marginTop: 4 }}>{subtitle}</div>}
      <div style={{ marginTop: 18 }}>{children}</div>
    </div>
  );
}

function Field({ label, val, onChange, placeholder }) {
  return (
    <label style={{ display:'block', marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing:'.12em', textTransform:'uppercase', color: tokens.mute, marginBottom: 6 }}>{label}</div>
      <input value={val} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ width:'100%', padding:'12px 14px', border:`1px solid ${tokens.line}`, borderRadius: 8, fontFamily:'Inter', fontSize: 14 }}/>
    </label>
  );
}

function Grid2({ children }) { return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>{children}</div>; }
function Grid3({ children }) { return <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap: 12 }}>{children}</div>; }

function StripePaymentSection({ amount, stripeRef, elementsRef }) {
  const mountRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState('');
  useEffect(() => {
    if (!window.Stripe) { setInitError('Stripe.js failed to load. Check your network or ad blocker.'); return; }
    const pk = window.HolbrookCart && window.HolbrookCart.config && window.HolbrookCart.config.stripePk;
    if (!pk) { setInitError('Stripe publishable key missing.'); return; }
    const stripe = window.Stripe(pk);
    const elements = stripe.elements({
      mode: 'payment',
      amount: Math.max(50, Math.round((amount || 1) * 100)),
      currency: 'usd',
      appearance: { theme: 'stripe' }
    });
    const paymentElement = elements.create('payment', { layout: 'tabs' });
    paymentElement.mount(mountRef.current);
    paymentElement.on('ready', () => setReady(true));
    stripeRef.current = stripe;
    elementsRef.current = elements;
    return () => { try { paymentElement.unmount(); } catch (e) {} };
  }, []);
  useEffect(() => {
    if (elementsRef.current && amount) {
      try { elementsRef.current.update({ amount: Math.max(50, Math.round(amount * 100)) }); } catch (e) {}
    }
  }, [amount]);
  return (
    <div>
      <div ref={mountRef} style={{ minHeight: 60 }}/>
      {!ready && !initError && (
        <div style={{ padding:'12px 0', color: tokens.mute, fontSize: 13 }}>Loading secure payment form…</div>
      )}
      {initError && (
        <div style={{ padding: 12, background:'#fdecea', border:'1px solid #f5c2c0', borderRadius: 8, color:'#7a1d1a', fontSize: 13 }}>{initError}</div>
      )}
    </div>
  );
}

// ─────────────── Confirmation
function ConfirmationPage() {
  const { lastOrder, navigate } = useApp();
  const { locations } = window.HOLBROOK_DATA;
  if (!lastOrder) { useEffect(()=>navigate('/'), []); return null; }
  const loc = locations.find(l => l.id === lastOrder.store);

  return (
    <div style={{ maxWidth: 900, margin:'40px auto 0', padding:'0 32px' }}>
      <div style={{ background: lastOrder.mode==='install' ? 'linear-gradient(135deg,#850824,#a62639)' : tokens.slate900, color:'#fff', padding:'56px 48px', borderRadius: 16, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, opacity:.15, background:'radial-gradient(circle at 90% 10%, rgba(255,255,255,.3), transparent 50%)' }}/>
        <div style={{ position:'relative' }}>
          <Icon name="check_circle" size={56} fill style={{ color:'#fff' }}/>
          <Eyebrow color="rgba(255,255,255,.7)" style={{ marginTop: 18 }}>Order #{lastOrder.id}</Eyebrow>
          <Headline size="h1" style={{ color:'#fff', marginTop: 8 }}>
            {lastOrder.mode==='install' ? 'Reserved.\nSee you at the shop.' : 'Paid in full.\nOn its way to you.'}
          </Headline>
          <p style={{ fontSize: 16, marginTop: 16, opacity:.85, maxWidth: 580, lineHeight: 1.6 }}>
            {lastOrder.mode==='install'
              ? `Thanks, ${lastOrder.contact.name || 'friend'}. A Holbrook team member will call ${lastOrder.contact.phone || 'you'} within 24 hours to confirm your install at ${loc?.city}.`
              : `Your package is being mounted and balanced in Eastpointe. We'll email tracking within 24 hours.`
            }
          </p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 20, marginTop: 24 }}>
        <div style={{ background:'#fff', border:`1px solid ${tokens.line}`, padding: 24, borderRadius: 12 }}>
          <Eyebrow>{lastOrder.mode==='install' ? 'Paid today' : 'Total charged'}</Eyebrow>
          <div style={{ fontFamily:'Space Grotesk', fontSize: 40, fontWeight: 700, marginTop: 6, letterSpacing:'-.02em' }}>${lastOrder.dueToday.toLocaleString()}</div>
          {lastOrder.mode==='install' && (
            <>
              <div style={{ borderTop:`1px solid ${tokens.line}`, marginTop: 14, paddingTop: 14 }}>
                <Eyebrow color={tokens.mute}>Due at install</Eyebrow>
                <div style={{ fontFamily:'Space Grotesk', fontSize: 22, fontWeight: 700, marginTop: 4 }}>${lastOrder.dueLater.toLocaleString()}</div>
              </div>
            </>
          )}
        </div>
        <div style={{ background:'#fff', border:`1px solid ${tokens.line}`, padding: 24, borderRadius: 12 }}>
          <Eyebrow>{lastOrder.mode==='install' ? 'Install location' : 'Ship to'}</Eyebrow>
          {lastOrder.mode==='install' ? (
            <>
              <div style={{ fontFamily:'Space Grotesk', fontSize: 20, fontWeight: 700, marginTop: 6 }}>Holbrook · {loc?.city}</div>
              <div style={{ fontSize: 13, color: tokens.graphite, marginTop: 6 }}>{loc?.addr}<br/>{loc?.city}, MI {loc?.zip}</div>
              <div style={{ fontSize: 13, color: tokens.primary, fontWeight: 700, marginTop: 8 }}>{loc?.phone}</div>
            </>
          ) : (
            <>
              <div style={{ fontFamily:'Space Grotesk', fontSize: 18, fontWeight: 700, marginTop: 6 }}>{lastOrder.contact.name || 'Customer'}</div>
              <div style={{ fontSize: 13, color: tokens.graphite, marginTop: 6 }}>{lastOrder.addr.street}<br/>{lastOrder.addr.city}, {lastOrder.addr.state} {lastOrder.addr.zip}</div>
              <div style={{ fontSize: 13, color: tokens.primary, fontWeight: 700, marginTop: 8 }}>ETA: 3–5 business days</div>
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24, background:'#fff', border:`1px solid ${tokens.line}`, padding: 24, borderRadius: 12 }}>
        <Eyebrow>What's next</Eyebrow>
        <div style={{ marginTop: 16, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 20 }}>
          {(lastOrder.mode==='install' ? [
            ['phone_in_talk','Phone call','Within 24h to set your install day'],
            ['build','Install day','Pay remaining ${X} in the bay'],
            ['celebration','Drive away','New wheels + free rotations for life'],
          ] : [
            ['inventory_2','Mount & balance','48h at our Eastpointe shop'],
            ['local_shipping','Ships','3–5 business day freight'],
            ['celebration','Bolt up','Install wherever you like'],
          ]).map(([ic, t, d]) => (
            <div key={t}>
              <Icon name={ic} size={28} style={{ color: tokens.primary }}/>
              <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 16, marginTop: 10 }}>{t}</div>
              <div style={{ fontSize: 13, color: tokens.mute, marginTop: 4 }}>{d.replace('${X}', lastOrder.dueLater.toLocaleString())}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'center', marginTop: 32 }}>
        <Btn variant="outline" size="md" onClick={()=>navigate('/')}>Back to home</Btn>
      </div>
    </div>
  );
}

// ─────────────── VVS Page
function VVSPage() {
  const { navigate } = useApp();
  return (
    <div style={{ maxWidth: 1320, margin:'40px auto 0', padding:'0 32px' }}>
      <Eyebrow>Powered by AutoSync</Eyebrow>
      <Headline size="h1" style={{ fontSize: 56, marginTop: 8 }}>Visual Vehicle Studio</Headline>
      <p style={{ fontSize: 17, color: tokens.taupe, marginTop: 12, maxWidth: 680, lineHeight: 1.55 }}>
        Preview every wheel and tire in our catalog on your exact year, make, and model. Select a configuration and get an instant quote — or send it straight to your cart.
      </p>

      <div style={{ marginTop: 32, background: tokens.slate900, borderRadius: 16, overflow:'hidden', border:`1px solid ${tokens.line}` }}>
        <div style={{ padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', background: tokens.slate800, borderBottom:'1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display:'flex', gap: 8, alignItems:'center', color:'#fff', fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 14 }}>
            <Icon name="auto_awesome" size={18} style={{ color: tokens.primaryAccent }}/>
            vvs.autosyncstudio.com/holbrooktire
          </div>
          <div style={{ display:'flex', gap: 6 }}>
            {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: 999, background: c }}/>)}
          </div>
        </div>
        <iframe src="https://vvs.autosyncstudio.com/holbrooktire" title="Visual Vehicle Studio" style={{ width:'100%', height: 720, border: 0, background: tokens.slate900 }}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 16, marginTop: 24 }}>
        {[
          ['directions_car','Real Vehicle Photos','Thousands of year/make/model combos'],
          ['pin_drop','Accurate Fitment','Only shows products that fit your vehicle'],
          ['payments','Live Pricing','Real-time inventory and competitive pricing'],
          ['request_quote','Instant Quotes','Request a quote directly from the studio'],
        ].map(([ic,t,d]) => (
          <div key={t} style={{ background:'#fff', border:`1px solid ${tokens.line}`, padding: 22, borderRadius: 10 }}>
            <Icon name={ic} size={24} style={{ color: tokens.primary }}/>
            <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 15, marginTop: 10 }}>{t}</div>
            <div style={{ fontSize: 12, color: tokens.mute, marginTop: 4 }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { CheckoutPage, ConfirmationPage, VVSPage });
