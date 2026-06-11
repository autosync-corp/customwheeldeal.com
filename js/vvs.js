/**
 * Custom Wheel Deal — Visual Vehicle Studio (VVS) Integration
 * Provides "View on Vehicle" modal overlay for product pages.
 *
 * Usage:
 *   CWDVVS.open()             — Open VVS at home
 *   CWDVVS.open('tires')      — Open VVS on tires page
 *   CWDVVS.open('wheels')     — Open VVS on wheels page
 *   CWDVVS.close()            — Close the VVS modal
 *
 * The VVS embed is lazy-loaded: the Autosync.js script is only fetched
 * when the user first clicks "View on Vehicle", keeping page weight low.
 */
const CWDVVS = (() => {

    let modalEl = null;
    let vvsInstance = null;
    let scriptLoaded = false;

    // ─── Create the modal DOM (once) ─────────────────────────────
    function ensureModal() {
        if (modalEl) return modalEl;

        modalEl = document.createElement('div');
        modalEl.id = 'vvs-modal';
        modalEl.style.cssText = 'display:none; position:fixed; inset:0; z-index:9999;';
        modalEl.innerHTML = `
            <div id="vvs-backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);"></div>
            <div style="position:relative;z-index:1;max-width:1200px;width:95%;margin:2vh auto 0;height:92vh;display:flex;flex-direction:column;">
                <!-- Header bar -->
                <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px;background:linear-gradient(135deg,#ea580c,#c2410c);border-radius:12px 12px 0 0;color:#fff;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span class="material-symbols-outlined" style="font-size:24px;">view_in_ar</span>
                        <span style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:18px;">Visual Vehicle Studio</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:16px;">
                        <a href="" id="vvs-fullpage-link" target="_blank" style="color:#fff;opacity:.8;font-size:12px;text-decoration:underline;font-family:Inter,sans-serif;">Open Full Page</a>
                        <button id="vvs-close-btn" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:32px;height:32px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1;" title="Close">✕</button>
                    </div>
                </div>
                <!-- VVS container -->
                <div id="vvs-modal-body" style="flex:1;background:#fff;border-radius:0 0 12px 12px;overflow:hidden;position:relative;">
                    <div id="vvs-modal-loader" style="display:flex;align-items:center;justify-content:center;height:100%;gap:12px;color:#584141;font-family:Inter,sans-serif;">
                        <svg width="24" height="24" viewBox="0 0 24 24" style="animation:spin 1s linear infinite;"><circle cx="12" cy="12" r="10" fill="none" stroke="#ea580c" stroke-width="3" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg>
                        <span>Loading Visual Vehicle Studio...</span>
                    </div>
                    <div id="autosync-visualizer-modal"></div>
                </div>
            </div>
            <style>
                @keyframes spin { to { transform: rotate(360deg); } }
                #vvs-modal-body #autosync-visualizer-modal { width:100%; height:100%; }
                #vvs-modal-body #autosync-visualizer-modal iframe { width:100% !important; height:100% !important; border:none; }
            </style>
        `;
        document.body.appendChild(modalEl);

        // Compute full-page link relative path
        const depth = (window.location.pathname.match(/\//g) || []).length - 1;
        const root = depth <= 1 ? '.' : Array(depth).fill('..').join('/');
        const fpLink = modalEl.querySelector('#vvs-fullpage-link');
        if (fpLink) fpLink.href = root + '/visualizer/';

        // Close handlers
        modalEl.querySelector('#vvs-close-btn').addEventListener('click', close);
        modalEl.querySelector('#vvs-backdrop').addEventListener('click', close);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

        return modalEl;
    }

    // ─── Load Autosync.js script once ────────────────────────────
    function loadScript() {
        return new Promise((resolve, reject) => {
            if (scriptLoaded) { resolve(); return; }
            // Check if already present on page (e.g. visualizer page)
            if (window.Autosync) { scriptLoaded = true; resolve(); return; }
            const s = document.createElement('script');
            s.src = 'https://vvs.autosyncstudio.com/js/Autosync.js';
            s.onload = () => { scriptLoaded = true; resolve(); };
            s.onerror = () => reject(new Error('Failed to load VVS'));
            document.head.appendChild(s);
        });
    }

    // ─── Open the VVS modal ─────────────────────────────────────
    async function open(startPage) {
        const modal = ensureModal();
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Show loader
        const loader = modal.querySelector('#vvs-modal-loader');
        const container = modal.querySelector('#autosync-visualizer-modal');
        if (loader) loader.style.display = 'flex';

        try {
            await loadScript();

            // Only create the instance once; after that just show/hide
            if (!vvsInstance && window.Autosync) {
                vvsInstance = new Autosync({
                    id: 'autosync-visualizer-modal',
                    key: 'customwheeldeal',
                    adaptiveHeight: false,
                    disableQuoteForm: false,
                    homeStyle: 'vehicle_make_selection',
                    productSegment: startPage ? [startPage, 'vehicles'] : ['tires', 'vehicles', 'wheels'],
                    startPage: startPage || 'home',
                    scrollBar: true,
                    widget: false,
                    onEvent: function({event, data}) {
                        if (event === 'quote_submitted') {
                            console.log('[CWD VVS Modal] Quote submitted:', data);
                        }
                    }
                });
            }

            if (loader) loader.style.display = 'none';
        } catch (err) {
            if (loader) loader.innerHTML = '<span style="color:#ba1a1a;">Could not load Visual Vehicle Studio. Please try again.</span>';
            console.error(err);
        }
    }

    // ─── Close the VVS modal ────────────────────────────────────
    function close() {
        if (modalEl) {
            modalEl.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    return { open, close };
})();
