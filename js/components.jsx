// ─────────────── Shared Primitive / Utility Components
// No imports — relies on globals from setup.js (React hooks, tokens, AppCtx, useApp)

function Icon({ name, size = 20, style, fill }) {
  return <span className="material-symbols-outlined" style={{ fontSize: size, fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0", ...style }}>{name}</span>;
}

function Btn({ children, variant='primary', onClick, href, size='md', style, icon, iconRight, type, disabled, full }) {
  const pads = { sm:'8px 14px', md:'12px 22px', lg:'16px 28px' }[size];
  const fs = { sm:12, md:13, lg:14 }[size];
  const base = {
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
    padding: pads, fontSize: fs, fontWeight: 700, letterSpacing:'.12em',
    textTransform:'uppercase', border:'none', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? .45 : 1,
    fontFamily:'Inter, system-ui, sans-serif', borderRadius: 6, textDecoration:'none',
    transition:'all .15s ease-out',
    width: full ? '100%' : 'auto',
  };
  const variants = {
    primary: { background: tokens.primary, color:'#fff' },
    primaryGrad: { background: 'linear-gradient(135deg,#850824 0%,#a62639 100%)', color:'#fff' },
    dark:    { background: tokens.slate900, color:'#fff' },
    outline: { background:'transparent', color: tokens.ink, boxShadow:`inset 0 0 0 1.5px ${tokens.ink}` },
    outlineLight: { background:'transparent', color:'#fff', boxShadow:'inset 0 0 0 1.5px rgba(255,255,255,.5)' },
    ghost:   { background:'transparent', color: tokens.ink },
    light:   { background:'#fff', color: tokens.ink, boxShadow:`inset 0 0 0 1px ${tokens.line}` },
    accent:  { background: tokens.primaryAccent, color:'#fff' },
  };
  const Tag = href ? 'a' : 'button';
  return (
    <Tag type={type} href={href} onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseOver={e => !disabled && (e.currentTarget.style.transform = 'translateY(-1px)', e.currentTarget.style.filter = 'brightness(1.05)')}
      onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.filter = 'none')}>
      {icon && <Icon name={icon} size={fs + 4} />}
      {children}
      {iconRight && <Icon name={iconRight} size={fs + 4} />}
    </Tag>
  );
}

function Stars({ rating, size = 14, showNum }) {
  const full = Math.floor(rating), half = rating - full >= .5;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
      <span style={{ display:'inline-flex', color: tokens.gold }}>
        {[0,1,2,3,4].map(i => (
          <Icon key={i} size={size} fill
            name={i < full ? 'star' : (i === full && half ? 'star_half' : 'star')}
            style={{ color: i < full || (i === full && half) ? tokens.gold : '#e5e7eb' }} />
        ))}
      </span>
      {showNum && <span style={{ fontSize: 12, color: tokens.mute, fontWeight: 600 }}>{rating.toFixed(1)}</span>}
    </span>
  );
}

function Eyebrow({ children, color, style }) {
  return <div style={{ fontFamily:'Inter', fontSize: 11, fontWeight: 700, letterSpacing:'.18em', textTransform:'uppercase', color: color || tokens.primary, ...style }}>{children}</div>;
}

function Headline({ children, size = 'h2', style, as }) {
  const fs = { display: 72, h1: 56, h2: 40, h3: 28, h4: 22 }[size] || 40;
  const Tag = as || 'h2';
  return <Tag style={{ fontFamily:'Space Grotesk, sans-serif', fontWeight: 700, fontSize: fs, letterSpacing:'-0.02em', lineHeight: 1.05, margin: 0, textWrap:'balance', ...style }}>{children}</Tag>;
}

function FilterGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontFamily:'Space Grotesk', fontSize: 11, fontWeight: 700, letterSpacing:'.16em', textTransform:'uppercase', color: tokens.ink, paddingBottom: 10, marginBottom: 12, borderBottom:`1px solid ${tokens.line}` }}>{label}</div>
      {children}
    </div>
  );
}

function FilterCheck({ checked, onChange, label }) {
  return (
    <label style={{ display:'flex', alignItems:'center', gap: 8, padding:'6px 0', fontSize: 13, color: tokens.graphite, cursor:'pointer' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ accentColor: tokens.primary }} />
      {label}
    </label>
  );
}

function TireSvg() {
  return (
    <svg viewBox="0 0 120 90" width="80%" height="80%">
      <ellipse cx="60" cy="45" rx="45" ry="36" fill="#1a1c1e" />
      <ellipse cx="60" cy="45" rx="22" ry="17" fill="#2a2c2e" />
      <ellipse cx="60" cy="45" rx="18" ry="14" fill="#3a3c3e" />
      <g stroke="#555" strokeWidth="1" fill="none">
        {Array.from({length:10}).map((_,i) => {
          const a = (i*36) * Math.PI/180;
          const x1 = 60 + Math.cos(a)*26, y1 = 45 + Math.sin(a)*20;
          const x2 = 60 + Math.cos(a)*42, y2 = 45 + Math.sin(a)*33;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
    </svg>
  );
}

function WheelSvg() {
  return (
    <svg viewBox="0 0 240 240" style={{ width:'72%', height:'72%' }}>
      <defs>
        <radialGradient id="wg" cx="50%" cy="40%">
          <stop offset="0" stopColor="#475569"/><stop offset=".5" stopColor="#1e293b"/><stop offset="1" stopColor="#0b1120"/>
        </radialGradient>
        <radialGradient id="wh" cx="50%" cy="40%">
          <stop offset="0" stopColor="#64748b"/><stop offset="1" stopColor="#0f172a"/>
        </radialGradient>
      </defs>
      <circle cx="120" cy="120" r="115" fill="url(#wg)"/>
      <circle cx="120" cy="120" r="92" fill="url(#wh)"/>
      {[0,1,2,3,4].map(i => {
        const a = (i/5) * Math.PI * 2 - Math.PI/2;
        const x1 = 120 + Math.cos(a) * 30, y1 = 120 + Math.sin(a) * 30;
        const x2 = 120 + Math.cos(a) * 82, y2 = 120 + Math.sin(a) * 82;
        const nx = Math.cos(a + Math.PI/2) * 10, ny = Math.sin(a + Math.PI/2) * 10;
        return <polygon key={i} fill="#1a202c" stroke="#334155" strokeWidth="1"
          points={`${x1+nx},${y1+ny} ${x1-nx},${y1-ny} ${x2-nx*.4},${y2-ny*.4} ${x2+nx*.4},${y2+ny*.4}`} />;
      })}
      <circle cx="120" cy="120" r="26" fill="#0b1120" stroke="#334155" strokeWidth="1.5"/>
      <circle cx="120" cy="120" r="8" fill="#1e293b"/>
    </svg>
  );
}

function SpecItem({ label, value, big }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: tokens.mute, fontWeight: 700, letterSpacing:'.14em', textTransform:'uppercase' }}>{label}</div>
      <div style={{ fontFamily:'Space Grotesk', fontSize: big ? 26 : 16, fontWeight: 800, color: big ? tokens.primary : tokens.ink, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function SectionHead({ eyebrow, title, cta }) {
  const { navigate } = useApp();
  return (
    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', borderBottom:`1px solid ${tokens.line}`, paddingBottom: 20 }}>
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        {title && <Headline size="h2" style={{ marginTop: 8 }}>{title}</Headline>}
      </div>
      {cta && <a onClick={cta.onClick} style={{ fontSize: 12, fontWeight: 800, color: tokens.ink, textDecoration:'none', cursor:'pointer', letterSpacing:'.14em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap: 6 }}>{cta.label} <Icon name="arrow_forward" size={16} /></a>}
    </div>
  );
}

function FilterBlock({ title, children }) {
  return (
    <div style={{ background:'#fff', border:`1px solid ${tokens.line}`, padding:'16px 18px', marginBottom: 12, borderRadius: 8 }}>
      <Eyebrow color={tokens.ink} style={{ marginBottom: 10 }}>{title}</Eyebrow>
      {children}
    </div>
  );
}

// Register as globals for cross-file access
Object.assign(window, { Icon, Btn, Stars, Eyebrow, Headline, FilterGroup, FilterCheck, TireSvg, WheelSvg, SpecItem, SectionHead, FilterBlock });
