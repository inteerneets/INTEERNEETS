/* Glass scrollbar: the browser's bar is hidden and replaced by a see-through, blurred "glass" pill
   that fades in while you scroll (or hover) and fades back out when idle.
   glassScroll()                           -> the whole page
   glassScroll({ el: node })               -> a full-screen scrolling box (e.g. the product overlay)
   glassScroll({ el: node, inner: true })  -> a scrolling box that lives *inside* the page
                                              (widgets, playlists, panels). The pill is anchored to
                                              the element's own right edge instead of the viewport.
   glassScrollAll(root)                    -> attach the inner glass bar to every [data-glass-scroll]
                                              element found under root (defaults to document). Runs
                                              automatically on load and watches for new ones, so any
                                              widget that needs the glass bar just adds that attribute. */
(function (g) {
  if (!document.getElementById('glass-scroll-css')) {
    var st = document.createElement('style');
    st.id = 'glass-scroll-css';
    st.textContent =
      '@media (pointer: fine) {' +
      '  html { scrollbar-width: none; -ms-overflow-style: none; }' +
      '  html::-webkit-scrollbar { display: none; width: 0; height: 0; }' +
      '  .gs-box { scrollbar-width: none; -ms-overflow-style: none; }' +
      '  .gs-box::-webkit-scrollbar { display: none; width: 0; height: 0; }' +
      '}' +
      '.gscroll { position: fixed; top: 0; right: 0; bottom: 0; width: 26px; z-index: 9000; pointer-events: none; }' +
      '.gscroll.gscroll-inner { position: absolute; bottom: auto; }' +
      '.gscroll .gs-thumb { position: absolute; right: 6px; width: 8px; top: 0; height: 60px; border-radius: 999px;' +
      '  background: linear-gradient(180deg, rgba(255,255,255,.34), rgba(255,255,255,.12)); border: 1px solid rgba(255,255,255,.42);' +
      '  -webkit-backdrop-filter: blur(10px) saturate(1.7); backdrop-filter: blur(10px) saturate(1.7);' +
      '  box-shadow: inset 0 1px 1px rgba(255,255,255,.55), inset 0 0 8px rgba(255,255,255,.18), 0 4px 18px rgba(0,0,0,.28);' +
      '  opacity: 0; pointer-events: auto; cursor: grab !important; touch-action: none;' +
      '  transition: opacity .5s ease, width .2s ease, right .2s ease, background .2s ease; }' +
      '.gscroll.active .gs-thumb, .gscroll .gs-thumb:hover, .gscroll.drag .gs-thumb { opacity: 1; }' +
      '.gscroll .gs-thumb:hover, .gscroll.drag .gs-thumb { width: 12px; right: 4px; }' +
      '.gscroll.drag .gs-thumb { cursor: grabbing !important; }' +
      '.gscroll.off { display: none; }';
    document.head.appendChild(st);
  }

  g.glassScroll = function (opts) {
    opts = opts || {};
    if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return { destroy: function () {}, redraw: function () {} };
    var el = opts.el || null;
    var inner = !!opts.inner && !!el;
    var wrap = document.createElement('div');
    wrap.className = 'gscroll' + (inner ? ' gscroll-inner' : '');
    wrap.innerHTML = '<div class="gs-thumb"></div>';
    // Where the pill lives in the DOM. For an inner bar it must be a positioned ancestor of the
    // scrolling element so we can place the pill over the element's own right edge.
    var host = opts.host || (inner ? (el.offsetParent || el.parentNode || document.body) : (el ? (el.parentNode || document.body) : document.body));
    if (inner && host && host.nodeType === 1) {
      var hp = (host.ownerDocument.defaultView || window).getComputedStyle(host).position;
      if (hp === 'static') host.style.position = 'relative';
    }
    host.appendChild(wrap);
    if (el) el.classList.add('gs-box');
    var thumb = wrap.firstChild, idle, ticking = false, dragging = false, dead = false;

    function pos() { return el ? el.scrollTop : window.scrollY; }
    function viewH() { return el ? el.clientHeight : window.innerHeight; }
    function totalH() {
      if (el) return el.scrollHeight;
      var d = document.documentElement;
      return Math.max(d.scrollHeight, document.body.scrollHeight);
    }
    function scrollTo(y) { if (el) el.scrollTop = y; else window.scrollTo(0, y); }
    function metrics() {
      var vh = viewH(), h = totalH();
      var th = Math.max(54, Math.round(vh * vh / h));
      return { vh: vh, h: h, th: th, range: Math.max(1, vh - th - 12), max: Math.max(1, h - vh) };
    }
    // Anchor the pill over the inner element's right edge and match its height.
    function placeInner() {
      if (!inner || !el) return;
      wrap.style.top = el.offsetTop + 'px';
      wrap.style.left = (el.offsetLeft + el.clientLeft + el.clientWidth - wrap.offsetWidth) + 'px';
      wrap.style.height = el.clientHeight + 'px';
    }
    function draw() {
      ticking = false;
      if (dead) return;
      placeInner();
      var m = metrics();
      wrap.classList.toggle('off', m.h <= m.vh + 2);
      thumb.style.height = m.th + 'px';
      thumb.style.top = (6 + (pos() / m.max) * m.range) + 'px';
    }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }
    function pulse() {
      wrap.classList.add('active');
      clearTimeout(idle);
      idle = setTimeout(function () { if (!dragging) wrap.classList.remove('active'); }, 900);
    }
    var target = el || window;
    var onScroll = function () { request(); pulse(); };
    // Reveal the pill: near the viewport's right edge for the page/overlay bar, or on hover for an inner bar.
    var hoverNode = inner ? el : document;
    var onMove = inner
      ? function () { pulse(); }
      : function (e) { if (e.clientX > window.innerWidth - 40) pulse(); };
    target.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', request);
    hoverNode.addEventListener('mousemove', onMove, { passive: true });
    var mo = new MutationObserver(request);
    mo.observe(el || document.body, { childList: true, subtree: true });
    window.addEventListener('load', request);
    if (window.ResizeObserver && el) new ResizeObserver(request).observe(el);

    thumb.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      var m = metrics(), startY = e.clientY, startScroll = pos();
      dragging = true; wrap.classList.add('drag', 'active');
      document.documentElement.style.scrollBehavior = 'auto';
      if (el) el.style.scrollBehavior = 'auto';
      thumb.setPointerCapture(e.pointerId);
      function move(ev) { scrollTo(startScroll + (ev.clientY - startY) * (m.max / m.range)); }
      function up() {
        dragging = false; wrap.classList.remove('drag'); pulse();
        document.documentElement.style.scrollBehavior = '';
        if (el) el.style.scrollBehavior = '';
        thumb.removeEventListener('pointermove', move); thumb.removeEventListener('pointerup', up); thumb.removeEventListener('pointercancel', up);
      }
      thumb.addEventListener('pointermove', move); thumb.addEventListener('pointerup', up); thumb.addEventListener('pointercancel', up);
    });
    draw();
    return {
      destroy: function () {
        dead = true;
        target.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', request);
        hoverNode.removeEventListener('mousemove', onMove);
        mo.disconnect();
        wrap.remove();
        if (el) el.classList.remove('gs-box');
      },
      redraw: request
    };
  };

  // Attach the inner glass bar to every [data-glass-scroll] element that doesn't have one yet.
  g.glassScrollAll = function (root) {
    root = root || document;
    var nodes = root.querySelectorAll ? root.querySelectorAll('[data-glass-scroll]') : [];
    Array.prototype.forEach.call(nodes, function (n) {
      if (n.__glass) return;
      n.__glass = g.glassScroll({ el: n, host: n.offsetParent || n.parentNode, inner: true });
    });
  };

  // Auto-wire on the live site: run once the page is laid out, then watch for widgets added later.
  function autoWire() {
    g.glassScrollAll(document);
    try {
      new MutationObserver(function () { g.glassScrollAll(document); })
        .observe(document.body, { childList: true, subtree: true });
    } catch (e) { /* no body yet is fine; load handler covers it */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoWire);
  else autoWire();
})(window);
