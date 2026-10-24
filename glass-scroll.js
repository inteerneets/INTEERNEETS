/* Glass scrollbar: the browser's bar is hidden and replaced by a see-through, blurred "glass" pill.
   glassScroll()              -> the whole page
   glassScroll({ el: node })  -> a scrolling box (e.g. the product page) */
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
    var wrap = document.createElement('div');
    wrap.className = 'gscroll';
    wrap.innerHTML = '<div class="gs-thumb"></div>';
    (el ? (opts.host || el.parentNode || document.body) : document.body).appendChild(wrap);
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
    function draw() {
      ticking = false;
      if (dead) return;
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
    var onMove = function (e) { if (e.clientX > window.innerWidth - 40) pulse(); };
    target.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', request);
    document.addEventListener('mousemove', onMove, { passive: true });
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
        document.removeEventListener('mousemove', onMove);
        mo.disconnect();
        wrap.remove();
      },
      redraw: request
    };
  };
})(window);
