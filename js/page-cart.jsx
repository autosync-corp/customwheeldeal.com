// ─────────────── PageCart.jsx
// No imports — relies on globals from setup.js (React hooks, tokens, AppCtx, useApp)
// and components.jsx (Icon, Btn, Eyebrow, Headline, TireSvg, WheelSvg)

function CartPage() {
  const { cart, updateQty, removeItem, clearCart, navigate } = useApp();
  const subtotal = cart.reduce((s,p) => s + p.price*p.qty, 0);
  const install = cart.reduce((s,p) => s + 160*p.qty, 0);
  const disposal = cart.reduce((s,p) => s + 12*p.qty, 0);
  const tax = Math.round((subtotal + install) * 0.06);
  const total = subtotal + install + disposal + tax;

  if (cart.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin:'80px auto', textAlign:'center', padding:'0 24px' }}>
        <Icon name="shopping_bag" size={64} style={{ color: tokens.mute }}/>
        <Headline size="h2" style={{ marginTop: 16 }}>Your cart is empty</Headline>
        <p style={{ color: tokens.mute, marginTop: 8 }}>Start by shopping tires, wheels, or a package.</p>
        <div style={{ display:'flex', gap: 10, justifyContent:'center', marginTop: 24 }}>
          <Btn variant="primary" size="lg" onClick={()=>navigate('/tires')} icon="trip">Shop Tires</Btn>
          <Btn variant="dark" size="lg" onClick={()=>navigate('/wheels')} icon="album">Shop Wheels</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1320, margin:'32px auto', padding:'0 32px' }}>
      <Headline size="h1" style={{ fontSize: 48 }}>Your cart</Headline>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 400px', gap: 32, marginTop: 24 }}>
        <div>
          {cart.map(item => {
            const label = item.type === 'tire' ? 'TIRE' : item.type === 'wheel' ? 'WHEEL' : 'PACKAGE';
            const eyebrowText = item.type ? `${label} · ${item.rawBrand || item.wheelBrand || ''}` : `${item.wheelBrand||''} × ${item.tireBrand||''}`;
            return (
            <div key={item.id} style={{ display:'grid', gridTemplateColumns:'120px 1fr auto', gap: 20, padding: 20, background:'#fff', border:`1px solid ${tokens.line}`, marginBottom: 12, alignItems:'center', borderRadius: 10 }}>
              <div style={{ aspectRatio:'1/1', background: tokens.surfLow, display:'flex', alignItems:'center', justifyContent:'center', borderRadius: 8 }}>
                {item.type === 'tire' ? <TireSvg/> : <WheelSvg/>}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing:'.14em', textTransform:'uppercase', color: tokens.mute }}>{eyebrowText}</div>
                <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 18, marginTop: 2 }}>{item.name}</div>
                <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize: 12, color: tokens.graphite, marginTop: 4 }}>{item.subtitle || item.size}</div>
                <div style={{ display:'flex', alignItems:'center', gap: 14, marginTop: 10 }}>
                  <div style={{ display:'flex', alignItems:'center', border:`1px solid ${tokens.line}`, borderRadius: 6 }}>
                    <button onClick={()=>updateQty(item.id, Math.max(1, item.qty-1))} style={{ border:'none', background:'transparent', padding:'6px 10px', cursor:'pointer' }}>&#8722;</button>
                    <span style={{ padding:'6px 12px', fontWeight: 700, fontSize: 13 }}>{item.qty}</span>
                    <button onClick={()=>updateQty(item.id, item.qty+1)} style={{ border:'none', background:'transparent', padding:'6px 10px', cursor:'pointer' }}>+</button>
                  </div>
                  <button onClick={()=>removeItem(item.id)} style={{ border:'none', background:'transparent', color: tokens.mute, fontSize: 12, cursor:'pointer', textDecoration:'underline' }}>Remove</button>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'Space Grotesk', fontWeight: 700, fontSize: 24 }}>${(item.price*item.qty).toLocaleString()}</div>
                <div style={{ fontSize: 12, color: tokens.mute, marginTop: 2 }}>${item.price.toLocaleString()}{item.type==='tire'||item.type==='wheel'?' each':' / set'}</div>
              </div>
            </div>
          );})}
          <button onClick={clearCart} style={{ border:'none', background:'transparent', color: tokens.mute, fontSize: 13, cursor:'pointer', padding: 12, textDecoration:'underline' }}>Clear cart</button>
        </div>

        <div style={{ background:'#fff', border:`1px solid ${tokens.line}`, padding: 28, alignSelf:'start', position:'sticky', top: 140, borderRadius: 12 }}>
          <div style={{ fontFamily:'Space Grotesk', fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Order summary</div>
          {[['Subtotal', subtotal],['Install & balance', install],['Disposal', disposal],['MI sales tax (est.)', tax]].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', fontSize: 14 }}>
              <span style={{ color: tokens.graphite }}>{l}</span>
              <span style={{ fontWeight: 600 }}>${v.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ borderTop:`1px solid ${tokens.line}`, marginTop: 10, paddingTop: 14, display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontFamily:'Space Grotesk', fontSize: 18, fontWeight: 700 }}>Total</span>
            <span style={{ fontFamily:'Space Grotesk', fontSize: 28, fontWeight: 700, color: tokens.primary }}>${total.toLocaleString()}</span>
          </div>

          <div style={{ marginTop: 18, padding: 16, background: 'linear-gradient(135deg,#850824,#a62639)', color:'#fff', borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing:'.18em' }}>25% DEPOSIT PLAN</div>
            <div style={{ fontFamily:'Space Grotesk', fontSize: 26, fontWeight: 700, marginTop: 4 }}>${Math.round(total*0.25).toLocaleString()} today</div>
            <div style={{ fontSize: 12, opacity:.85, marginTop: 2 }}>Balance of ${Math.round(total*0.75).toLocaleString()} due at install</div>
          </div>

          <Btn variant="dark" size="lg" full iconRight="arrow_forward" style={{ marginTop: 16 }} onClick={()=>navigate('/checkout')}>Proceed to checkout</Btn>
          <div style={{ marginTop: 14, display:'flex', flexDirection:'column', gap: 8, fontSize: 12, color: tokens.graphite }}>
            <span style={{ display:'inline-flex', gap: 6, alignItems:'center' }}><Icon name="lock" size={14}/> Secure checkout · Stripe</span>
            <span style={{ display:'inline-flex', gap: 6, alignItems:'center' }}><Icon name="schedule" size={14}/> Install scheduled by phone within 24h</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CartPage });
