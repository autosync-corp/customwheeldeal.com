// ─── js/vehicle-preview.js — "Preview on my vehicle" modal using AutoSync VVS Express
//
// The VVSE script auto-discovers `<div class="vvse" data-onload-callback="...">`
// placeholders during its initial DOM scan, so dynamically-inserted placeholders
// (e.g. inside a modal that mounts later) are NOT picked up. To work around that:
//
//   1. On page load, inject a single hidden `.vvse` host into <body>. The VVSE
//      script discovers it, fires our callback, and gives us a vvse instance.
//   2. When the modal opens, MOVE that host into the modal's slot div via
//      appendChild. The vvse instance is the same; we just call load methods on it.
//   3. When the modal closes, move the host back to its hidden parking.
//
// Pages that mount this modal must include the VVSE module script tag at the
// bottom of <body>, AFTER any VVSE-related HTML the page contains:
//   <script type="module" crossorigin src="https://vvs.autosyncstudio.com/express/dist/vvse.js" async></script>

// Auto-inject (a) hidden VVSE placeholder host into <body> and (b) the VVSE
// module script tag. Either pages just need <script src="/js/vehicle-preview.js"></script>.
(function ensureVvseScript() {
  if (typeof document === 'undefined') return;
  if (document.querySelector('script[data-cwd-vvse]')) return;
  var s = document.createElement('script');
  s.setAttribute('type', 'module');
  s.setAttribute('crossorigin', '');
  s.async = true;
  s.src = 'https://vvs.autosyncstudio.com/express/dist/vvse.js';
  s.setAttribute('data-cwd-vvse', '1');
  (document.head || document.documentElement).appendChild(s);
})();
(function ensureVvseHost() {
  if (typeof document === 'undefined') return;
  function inject() {
    if (!document.body) { setTimeout(inject, 50); return; }
    if (document.getElementById('cwd-vvse-host')) return;
    var host = document.createElement('div');
    host.id = 'cwd-vvse-host';
    host.className = 'vvse';
    host.setAttribute('data-onload-callback', 'onCWDVvseReady');
    // Hidden parking spot when the modal is closed.
    host.style.cssText = 'position:fixed;left:-99999px;top:-99999px;width:1px;height:1px;overflow:hidden;visibility:hidden;';
    var msg = document.createElement('div');
    msg.id = 'vvse-msg';
    msg.style.cssText = 'background:#fff;text-align:center;color:#ccc;padding:24px;';
    msg.textContent = 'Loading VVS Express...';
    host.appendChild(msg);
    document.body.appendChild(host);
    window._cwdVvseHostEl = host;
  }
  inject();
})();

// Single global callback the VVSE script invokes once on page load.
window.onCWDVvseReady = function(initVvse) {
  if (window._cwdVvse) return; // already inited
  if (typeof initVvse !== 'function') {
    console.error('[VVSE] callback received non-function');
    return;
  }
  try {
    var vvse = initVvse({
      apiKey: 'customwheeldeal',
      apiUrl: 'https://api.autosyncstudio.com/',
      height: '560px'
    });
    window._cwdVvse = vvse;
    window._cwdVvseReady = true;
    try { window.dispatchEvent(new Event('cwd:vvse-ready')); } catch (_) {}
    console.log('[VVSE] ready');
  } catch (e) {
    console.error('[VVSE] init failed:', e);
    window._cwdVvseError = e;
    try { window.dispatchEvent(new Event('cwd:vvse-error')); } catch (_) {}
  }
};

function _cwdParkVvseHost() {
  // Cache a reference once injected so we can find the host even if the modal
  // already removed it from its slot before our cleanup ran.
  var host = window._cwdVvseHostEl || document.getElementById('cwd-vvse-host');
  if (!host) return;
  if (host.parentElement !== document.body) {
    if (host.parentElement) host.parentElement.removeChild(host);
    document.body.appendChild(host);
  }
  host.style.cssText = 'position:fixed;left:-99999px;top:-99999px;width:1px;height:1px;overflow:hidden;visibility:hidden;';
}

function _cwdMountVvseHost(slot) {
  var host = window._cwdVvseHostEl || document.getElementById('cwd-vvse-host');
  if (!host || !slot) return false;
  // If the host was orphaned (no parent), just append to slot.
  if (host.parentElement !== slot) slot.appendChild(host);
  host.style.cssText = 'position:relative;left:auto;top:auto;width:100%;height:100%;min-height:560px;visibility:visible;display:block;';
  return true;
}

function VehiclePreviewModal(props) {
  var vehicle = props.vehicle;
  var wheel   = props.wheel;
  var tire    = props.tire;
  var tireFullData = props.tireFullData; // optional: full AutoSync response for loadTireData
  var onCloseProp = props.onClose;

  var slotRef = useRef(null);

  // Wrap close so we ALWAYS park the host back to <body> before React unmounts
  // the modal — useEffect cleanup runs after the DOM is already torn down, so it
  // can't see the host anymore (that's what caused "host could not be mounted"
  // on second open).
  function onClose() {
    _cwdParkVvseHost();
    if (typeof onCloseProp === 'function') onCloseProp();
  }

  var _l = useState(true);   var loading = _l[0];     var setLoading = _l[1];
  var _e = useState(null);   var error = _e[0];       var setError = _e[1];

  function loadProducts(vvse) {
    var alive = true;
    // INVESTIGATE: log everything we receive so we can see what the modal is
    // actually working with vs what we think is happening.
    console.log('[VVSE-debug] === modal open ===');
    console.log('[VVSE-debug] vehicle prop:', vehicle);
    console.log('[VVSE-debug] vehicleData keys:', vehicle && vehicle.vehicleData ? Object.keys(vehicle.vehicleData) : '(no vehicleData)');
    console.log('[VVSE-debug] wheel prop:', wheel);
    console.log('[VVSE-debug] tire prop:', tire);

    var vehicleAsId = vehicle && vehicle.vehicleData && (vehicle.vehicleData.Id || vehicle.vehicleData.VehicleId);
    var vehicleDesc = ((vehicle.year || '') + ' ' + (vehicle.make || '') + ' ' + (vehicle.model || '')).trim();
    console.log('[VVSE-debug] vehicle lookup keys → id:', vehicleAsId, '· desc:', vehicleDesc);

    function loadVehicleStep() {
      // Try loadVehicleData first if we have the full AutoSync fitments
      // response. VVSE expects the wrapped response shape { Vehicles: [...] },
      // not a raw vehicle object — our earlier attempt failed with "Missing
      // Vehicles property in data" because we passed the inner vehicle.
      if (vehicle && vehicle.vehicleData && typeof vvse.loadVehicleData === 'function') {
        try {
          var wrapped = { Vehicles: [vehicle.vehicleData] };
          console.log('[VVSE-debug] trying loadVehicleData with wrapped { Vehicles: [...] }');
          var res = vvse.loadVehicleData(wrapped);
          return Promise.resolve(res).catch(function(e) {
            console.warn('[VVSE-debug] loadVehicleData failed:', e && e.message);
            return vehicleAsId
              ? Promise.resolve(vvse.loadVehicleById(vehicleAsId, { suspension: true })).catch(function() { return vvse.loadVehicleByDescription(vehicleDesc, { suspension: true }); })
              : Promise.resolve(vvse.loadVehicleByDescription(vehicleDesc, { suspension: true }));
          });
        } catch (e) {
          console.warn('[VVSE-debug] loadVehicleData threw:', e && e.message);
        }
      }
      // CRITICAL: pass { suspension: true }. Per AutoSync docs:
      // "tires can be loaded only on vehicles with suspensions enabled."
      // Without this flag, tire VOV imagery silently falls back to a default.
      return vehicleAsId
        ? Promise.resolve(vvse.loadVehicleById(vehicleAsId, { suspension: true })).catch(function() { return vvse.loadVehicleByDescription(vehicleDesc, { suspension: true }); })
        : Promise.resolve(vvse.loadVehicleByDescription(vehicleDesc, { suspension: true }));
    }

    function hasAnyAngle() {
      try {
        var ang = vvse.getVehicleAnglesAvailability && vvse.getVehicleAnglesAvailability();
        if (!ang) return true; // unknown — assume yes
        for (var k in ang) { if (ang[k]) return true; }
        return false;
      } catch (e) { return true; }
    }

    function isVehicleLoaded() {
      try {
        var vd = vvse.getVehicleData && vvse.getVehicleData();
        return !!vd;
      } catch (e) { return false; }
    }

    function nudgeRepaint() {
      // Some VVSE state transitions leave the canvas empty until an angle
      // change. Force one to trigger a repaint.
      try {
        if (typeof vvse.goToNextVehicleAngle === 'function') {
          vvse.goToNextVehicleAngle();
          if (typeof vvse.goToPreviousVehicleAngle === 'function') {
            setTimeout(function() { try { vvse.goToPreviousVehicleAngle(); } catch (_) {} }, 60);
          }
        }
      } catch (_) {}
    }

    loadVehicleStep().then(function() {
      if (!alive) return null;
      console.log('[VVSE] vehicle loaded:', vehicleAsId || vehicleDesc);
      // Per Example 12: with suspension enabled, snap to default height (0)
      // so the vehicle is in a renderable state before tires are loaded.
      try {
        if (typeof vvse.getVehicleSuspensionHeights === 'function') {
          var heights = vvse.getVehicleSuspensionHeights();
          console.log('[VVSE-debug] available suspension heights:', heights);
          if (heights && heights.length && typeof vvse.setVehicleSuspensionHeight === 'function') {
            var defaultHeight = heights.indexOf(0) !== -1 ? 0 : heights[0];
            vvse.setVehicleSuspensionHeight(defaultHeight);
            console.log('[VVSE-debug] suspension set to', defaultHeight);
          }
        }
      } catch (e) { console.warn('[VVSE-debug] suspension setup failed:', e && e.message); }
      // Skip byId — AutoSync's product REST API IDs are NOT VVSE catalog IDs,
      // so loadWheelById/loadTireById quietly "succeeds" without actually
      // loading anything and the canvas goes blank. partNumber and description
      // are the reliable lookup paths for VVSE's catalog.
      function loadProduct(p, byPn, byDesc, label) {
        if (!p) return Promise.resolve(true);
        var desc = ((p.brand || '') + ' ' + (p.model || '')).trim();
        function tryByPn() { return p.partNumber ? Promise.resolve(byPn(p.partNumber)) : Promise.reject(new Error('no pn')); }
        function tryByDesc() { return desc ? Promise.resolve(byDesc(desc)) : Promise.reject(new Error('no desc')); }
        return tryByPn()
          .catch(function(e) { console.warn('[VVSE]', label, 'byPn failed:', e && e.message); return tryByDesc(); })
          .then(function() { console.log('[VVSE]', label, 'loaded'); return true; })
          .catch(function(e) { console.warn('[VVSE]', label, 'all attempts failed:', e && e.message); return false; });
      }
      // Tire MUST load before wheel: with { suspension: true } VVSE rejects
      // setWheelDiameter (called internally by loadWheel*) with "The tire is
      // not initialized" if no tire is loaded yet. Parallel Promise.all caused
      // a race where the wheel sometimes won and the package failed silently.
      var tireLoad;
      if (tire && tireFullData && typeof vvse.loadTireData === 'function') {
        console.log('[VVSE] tire trying loadTireData with full response');
        tireLoad = Promise.resolve(vvse.loadTireData(tireFullData))
          .then(function() { console.log('[VVSE] tire loaded via loadTireData'); return true; })
          .catch(function(e) {
            console.warn('[VVSE] loadTireData failed, falling back to byPn:', e && e.message);
            return loadProduct(tire,
              vvse.loadTireByPn.bind(vvse),
              vvse.loadTireByDescription.bind(vvse), 'tire');
          });
      } else {
        tireLoad = loadProduct(tire,
          vvse.loadTireByPn.bind(vvse),
          vvse.loadTireByDescription.bind(vvse), 'tire');
      }
      return tireLoad.then(function(tireOk) {
        return loadProduct(wheel,
          vvse.loadWheelByPn.bind(vvse),
          vvse.loadWheelByDescription.bind(vvse), 'wheel')
          .then(function(wheelOk) { return [wheelOk, tireOk]; });
      });
    }).then(function(results) {
      if (!alive) return;
      var wheelOk = !wheel || (results && results[0]);
      var tireOk  = !tire  || (results && results[1]);
      // === Post-load diagnostics: what does VVSE *think* it has now? ===
      try {
        var vd = vvse.getVehicleData && vvse.getVehicleData();
        console.log('[VVSE-debug] post-load getVehicleData:', vd);
      } catch (e) { console.warn('[VVSE-debug] getVehicleData threw:', e && e.message); }
      try {
        var wd = vvse.getWheelData && vvse.getWheelData();
        console.log('[VVSE-debug] post-load getWheelData:', wd);
      } catch (e) { console.warn('[VVSE-debug] getWheelData threw:', e && e.message); }
      try {
        var td = vvse.getTireData && vvse.getTireData();
        console.log('[VVSE-debug] post-load getTireData:', td);
      } catch (e) { console.warn('[VVSE-debug] getTireData threw:', e && e.message); }
      try {
        var ang = vvse.getVehicleAnglesAvailability && vvse.getVehicleAnglesAvailability();
        console.log('[VVSE-debug] vehicle angle availability:', ang);
      } catch (e) {}
      // Inspect the iframe inside the host — gives us a hint whether VVSE
      // actually mounted any rendering surface.
      try {
        var host = window._cwdVvseHostEl;
        var ifr = host && host.querySelector('iframe');
        console.log('[VVSE-debug] iframe in host:', ifr, ifr && {
          width: ifr.offsetWidth,
          height: ifr.offsetHeight,
          src: ifr.src
        });
        var canvas = host && host.querySelector('canvas');
        console.log('[VVSE-debug] canvas in host:', canvas, canvas && {
          width: canvas.width,
          height: canvas.height
        });
      } catch (e) {}

      // Intentionally NOT calling setWheelDiameter — VVSE enforces a per-vehicle
      // minimum that's smaller than some packages, and calling it with an
      // unsupported value silently wipes the canvas.
      if (!isVehicleLoaded()) {
        console.warn('[VVSE] vehicle data missing after product load — retrying vehicle');
        return loadVehicleStep().then(function() { nudgeRepaint(); });
      }
      // VVSE has no render artwork (angle map all false) for some vehicles —
      // surface a clear message instead of a confusing blank canvas.
      if (!hasAnyAngle()) {
        console.warn('[VVSE] no angles available for this vehicle — visualization not supported');
        if (alive) {
          setError('VVS Express doesn\'t have visualization artwork for your ' + ((vehicle && (vehicle.year + ' ' + vehicle.make + ' ' + vehicle.model)) || 'vehicle') + ' yet. The package details and prices above are still accurate — installation runs at any Custom Wheel Deal location.');
          setLoading(false);
        }
        return;
      }
      nudgeRepaint();
      if (!wheelOk && !tireOk && (wheel || tire)) {
        console.warn('[VVSE] neither wheel nor tire could be resolved');
      }
      // Log what VVSE actually loaded vs what we asked for — pure diagnostic,
      // no user-facing UI. Helps spot PN mismatch vs default-substitution.
      try {
        var loadedTireData = vvse.getTireData && vvse.getTireData();
        var loadedTirePn = loadedTireData && loadedTireData.Tires && loadedTireData.Tires[0] && (loadedTireData.Tires[0].PartNumber || loadedTireData.Tires[0].Pn);
        console.log('[VVSE-debug] tire requested PN:', tire && tire.partNumber, '· VVSE loaded PN:', loadedTirePn);
      } catch (_) {}
      try {
        var loadedWheelData = vvse.getWheelData && vvse.getWheelData();
        var loadedWheelPn = loadedWheelData && loadedWheelData.Wheels && loadedWheelData.Wheels[0] && (loadedWheelData.Wheels[0].PartNumber || loadedWheelData.Wheels[0].Pn);
        console.log('[VVSE-debug] wheel requested PN:', wheel && wheel.partNumber, '· VVSE loaded PN:', loadedWheelPn);
      } catch (_) {}
    }).then(function() {
      if (alive) setLoading(false);
    }).catch(function(e) {
      console.error('[VVSE] load pipeline failed:', e);
      if (alive) {
        setError('We could not render this combination on your vehicle.');
        setLoading(false);
      }
    });
    return function cancel() { alive = false; };
  }

  // Safety net: useLayoutEffect cleanup runs SYNCHRONOUSLY before React tears
  // down the DOM, guaranteeing we move the host back to <body> in time even if
  // the user closes via something other than our wrapped onClose handler.
  React.useLayoutEffect(function() {
    return function() { _cwdParkVvseHost(); };
  }, []);

  useEffect(function() {
    var cancel = null;

    function start() {
      if (!_cwdMountVvseHost(slotRef.current)) {
        setError('Visualizer host could not be mounted.');
        setLoading(false);
        return;
      }
      var vvse = window._cwdVvse;
      if (!vvse) {
        setError('Visualizer not ready yet.');
        setLoading(false);
        return;
      }
      cancel = loadProducts(vvse);
    }

    function onErr() { setError('Visualizer failed to load.'); setLoading(false); }

    if (window._cwdVvseReady) {
      start();
    } else if (window._cwdVvseError) {
      onErr();
    } else {
      var onReady = function() { start(); };
      window.addEventListener('cwd:vvse-ready', onReady);
      window.addEventListener('cwd:vvse-error', onErr);
      var timeout = setTimeout(function() {
        if (!window._cwdVvseReady) {
          setError('Visualizer did not start in time. Refresh the page and try again.');
          setLoading(false);
        }
      }, 10000);
      return function() {
        clearTimeout(timeout);
        window.removeEventListener('cwd:vvse-ready', onReady);
        window.removeEventListener('cwd:vvse-error', onErr);
        if (cancel) cancel();
        _cwdParkVvseHost();
      };
    }

    return function() {
      if (cancel) cancel();
      _cwdParkVvseHost();
    };
  }, []);

  function handleAngle(dir) {
    var vvse = window._cwdVvse;
    if (!vvse) return;
    try {
      if (dir === 'next' && typeof vvse.goToNextVehicleAngle === 'function') vvse.goToNextVehicleAngle();
      else if (dir === 'prev' && typeof vvse.goToPreviousVehicleAngle === 'function') vvse.goToPreviousVehicleAngle();
    } catch (_) {}
  }

  var titleParts = [];
  if (wheel) titleParts.push(((wheel.brand || '') + ' ' + (wheel.model || '')).trim());
  if (tire)  titleParts.push(((tire.brand  || '') + ' ' + (tire.model  || '')).trim());
  var title = titleParts.filter(Boolean).join(' + ') || 'Visualization';
  var vLabel = (vehicle && [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')) || 'your vehicle';

  // ─── Sub-pieces of the polished modal render ─────────────────────────────
  function chip(p, kind) {
    if (!p) return null;
    var icBg = kind === 'tire' ? '#1a1c1e' : '#222';
    var label = ((p.brand || '') + ' ' + (p.model || '')).trim();
    var size = (p.size || (p.diameter ? (p.diameter + '"') : '')) || '';
    return /*#__PURE__*/React.createElement("div", {
      key: kind,
      style: { display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.14)', padding: '8px 14px 8px 8px', borderRadius: 999, minWidth: 0 }
    },
      /*#__PURE__*/React.createElement("div", {
        style: { width: 36, height: 36, background: icBg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }
      }, p.imgUrl
        ? /*#__PURE__*/React.createElement("img", { src: p.imgUrl, alt: label, style: { maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' } })
        : /*#__PURE__*/React.createElement(Icon, { name: kind === 'tire' ? 'donut_large' : 'tire_repair', size: 18, style: { color: '#fff' } })
      ),
      /*#__PURE__*/React.createElement("div", { style: { minWidth: 0 } },
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 9, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' } }, kind === 'tire' ? 'Tire' : 'Wheel'),
        /*#__PURE__*/React.createElement("div", { style: { fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 } }, label),
        size && /*#__PURE__*/React.createElement("div", { style: { fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(255,255,255,.6)' } }, size)
      )
    );
  }

  var iconBtn = function(handler, name, label, ariaLabel) {
    return /*#__PURE__*/React.createElement("button", {
      onClick: handler,
      'aria-label': ariaLabel || label,
      title: ariaLabel || label,
      style: {
        width: 44, height: 44, borderRadius: '50%',
        background: '#fff', border: '1px solid ' + tokens.line,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: tokens.ink, transition: 'all .15s', boxShadow: '0 1px 2px rgba(0,0,0,.05)'
      },
      onMouseOver: function(e) { e.currentTarget.style.borderColor = tokens.primary; e.currentTarget.style.color = tokens.primary; },
      onMouseOut:  function(e) { e.currentTarget.style.borderColor = tokens.line;     e.currentTarget.style.color = tokens.ink; }
    }, /*#__PURE__*/React.createElement(Icon, { name: name, size: 22 }));
  };

  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: { position: 'fixed', inset: 0, background: 'rgba(10,12,14,.82)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }
  },
    /*#__PURE__*/React.createElement("div", {
      onClick: function(e) { e.stopPropagation(); },
      style: { background: '#fff', borderRadius: 16, maxWidth: 1180, width: '100%', maxHeight: '94vh', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 80px rgba(0,0,0,.45)' }
    },
      // ─── Hero header (dark gradient) ──────────────────────────────────
      /*#__PURE__*/React.createElement("div", {
        style: {
          position: 'relative', overflow: 'hidden',
          background: tokens.slate900, color: '#fff',
          padding: '22px 28px 24px'
        }
      },
        /*#__PURE__*/React.createElement("div", {
          style: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 12% 50%, rgba(234,88,12,.45), transparent 55%), radial-gradient(circle at 88% 50%, rgba(234,88,12,.22), transparent 60%)', pointerEvents: 'none' }
        }),
        /*#__PURE__*/React.createElement("button", {
          onClick: onClose,
          'aria-label': 'Close visualization',
          style: { position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.18)', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' },
          onMouseOver: function(e) { e.currentTarget.style.background = 'rgba(255,255,255,.22)'; },
          onMouseOut:  function(e) { e.currentTarget.style.background = 'rgba(255,255,255,.12)'; }
        }, /*#__PURE__*/React.createElement(Icon, { name: 'close', size: 20 })),
        /*#__PURE__*/React.createElement("div", { style: { position: 'relative' } },
          /*#__PURE__*/React.createElement("div", {
            style: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(234,88,12,.16)', border: '1px solid rgba(234,88,12,.4)', borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: '#fb923c' }
          },
            /*#__PURE__*/React.createElement(Icon, { name: 'visibility', size: 13 }),
            'Preview on your vehicle'
          ),
          /*#__PURE__*/React.createElement("div", {
            style: { fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, lineHeight: 1.2, marginTop: 10, letterSpacing: '-.01em' }
          }, vLabel),
          (wheel || tire) && /*#__PURE__*/React.createElement("div", {
            style: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }
          }, [chip(wheel, 'wheel'), chip(tire, 'tire')].filter(Boolean))
        )
      ),

      // ─── Stage (canvas + loading + error) ─────────────────────────────
      /*#__PURE__*/React.createElement("div", {
        style: { position: 'relative', minHeight: 560, background: 'linear-gradient(180deg, #f7f7fa 0%, #ececf1 100%)', flex: 1 }
      },
        /*#__PURE__*/React.createElement("div", {
          ref: slotRef,
          style: { width: '100%', minHeight: 560, position: 'relative' }
        }),
        loading && /*#__PURE__*/React.createElement("div", {
          style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, color: tokens.taupe, fontSize: 13, pointerEvents: 'none', background: 'rgba(247,247,250,.92)' }
        },
          /*#__PURE__*/React.createElement("div", { style: { width: 36, height: 36, border: '3px solid rgba(234,88,12,.15)', borderTopColor: tokens.primary, borderRadius: '50%', animation: 'htmSpin 0.8s linear infinite' } }),
          /*#__PURE__*/React.createElement("style", null, '@keyframes htmSpin { to { transform: rotate(360deg); } }'),
          /*#__PURE__*/React.createElement("div", { style: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: tokens.ink } }, 'Rendering your build'),
          /*#__PURE__*/React.createElement("div", { style: { fontSize: 12, color: tokens.taupe } }, 'Placing the wheels and tires on your ' + ((vehicle && (vehicle.make + ' ' + vehicle.model)) || 'vehicle') + '…')
        ),
        error && /*#__PURE__*/React.createElement("div", {
          style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: tokens.taupe, fontSize: 14, padding: 32, textAlign: 'center', background: 'rgba(255,255,255,.96)' }
        },
          /*#__PURE__*/React.createElement(Icon, { name: 'image_not_supported', size: 40, style: { color: tokens.mute } }),
          /*#__PURE__*/React.createElement("div", { style: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: tokens.ink } }, "Couldn't render this build"),
          /*#__PURE__*/React.createElement("div", { style: { maxWidth: 420 } }, error)
        )
      ),

      // ─── Footer / controls bar ────────────────────────────────────────
      !loading && !error && /*#__PURE__*/React.createElement("div", {
        style: { padding: '16px 28px', borderTop: '1px solid ' + tokens.line, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: '#fff' }
      },
        /*#__PURE__*/React.createElement("div", {
          style: { display: 'inline-flex', alignItems: 'center', gap: 10 }
        },
          iconBtn(function() { handleAngle('prev'); }, 'rotate_left',  'Previous angle', 'Previous angle'),
          iconBtn(function() { handleAngle('next'); }, 'rotate_right', 'Next angle',     'Next angle'),
          /*#__PURE__*/React.createElement("span", { style: { fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: tokens.taupe, marginLeft: 6 } }, 'Rotate')
        )
      ),

      // Brand attribution strip
      /*#__PURE__*/React.createElement("div", {
        style: { padding: '8px 28px', background: tokens.slate900, color: 'rgba(255,255,255,.45)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', textAlign: 'center', fontWeight: 700 }
      }, 'Powered by AutoSync VVS Express')
    )
  );
}

Object.assign(window, { VehiclePreviewModal: VehiclePreviewModal });
