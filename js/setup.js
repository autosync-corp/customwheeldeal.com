// ─────────────── setup.js — React hooks extraction & design tokens
// This file runs first on every page.

// React hooks extraction
const { useState, useEffect, useMemo, useCallback, useRef, useContext, createContext } = React;
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// Tweakable defaults
const TWEAK_DEFAULTS = {
  "depositPct": 25,
  "financingPartner": "affirm"
};
window.TWEAK_DEFAULTS = TWEAK_DEFAULTS;

// Responsive breakpoint hook
function useIsMobile(bp) {
  bp = bp || 768;
  var pair = useState(typeof window !== 'undefined' ? window.innerWidth <= bp : false);
  var isMobile = pair[0], setIsMobile = pair[1];
  useEffect(function() {
    function check() { setIsMobile(window.innerWidth <= bp); }
    window.addEventListener('resize', check);
    return function() { window.removeEventListener('resize', check); };
  }, []);
  return isMobile;
}

// Design tokens
const tokens = {
  primary: '#850824',
  primaryHover: '#a62639',
  primaryAccent: '#e8344e',
  legacyRed: '#e31837',
  ink: '#1a1c1e',
  taupe: '#584141',
  graphite: '#3a4250',
  mute: '#6b7280',
  line: '#e5e7eb',
  lineSoft: '#eef0f3',
  surface: '#f9f9fc',
  surfLow: '#f3f3f6',
  surfHi: '#e2e2e5',
  white: '#ffffff',
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate400: '#94a3b8',
  yellow: '#ffc220',
  gold: '#f9bd14',
  green: '#2e7d32',
};
