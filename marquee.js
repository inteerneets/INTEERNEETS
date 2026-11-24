/* Scrolling ("marquee") text. Put data-marquee="left" or "right" (and optionally data-marquee-speed="80", pixels per
   second) on any text box: the text scrolls sideways inside the box, which keeps its size. The line repeats itself,
   so as soon as the text leaves one edge it enters on the other: a clean, endless loop with no gaps.
   Used by the live site and the editor. */
(function (g) {
  var GAP = '\u2003\u2003\u2003';
  var CSS =
    '@keyframes mq-l{from{text-indent:0}to{text-indent:calc(-1 * var(--mq-p,300px))}}' +
    '@keyframes mq-r{from{text-indent:calc(-1 * var(--mq-p,300px))}to{text-indent:0}}' +
    '[data-marquee]{overflow:hidden!important;white-space:nowrap!important;text-overflow:clip!important;text-align:left!important;}' +
    '[data-marquee]::after{content:attr(data-mq-rep);white-space:pre;}' +
    '[data-marquee="left"]{animation:mq-l var(--mq-d,10s) linear infinite;}' +
    '[data-marquee="right"]{animation:mq-r var(--mq-d,10s) linear infinite;}';

  function ensureCss(doc) {
    if (!doc || doc.getElementById('mq-css')) return;
    var s = doc.createElement('style'); s.id = 'mq-css'; s.textContent = CSS;
    (doc.head || doc.documentElement).appendChild(s);
  }
  function clear(el) {
    el.removeAttribute('data-mq-rep');
    el.style.removeProperty('--mq-p'); el.style.removeProperty('--mq-d');
    el.style.removeProperty('--mq-a'); el.style.removeProperty('--mq-b');
    el.style.removeProperty('text-indent');
    el.__mq = null;
  }
  // measure each scrolling box and one repeat of its text (again whenever either changes)
  function apply(doc) {
    doc = doc || document;
    var list = doc.querySelectorAll('[data-marquee]');
    if (!list.length) return;
    ensureCss(doc);
    var win = doc.defaultView;
    Array.prototype.forEach.call(list, function (el) {
      var dir = el.getAttribute('data-marquee');
      if (dir !== 'left' && dir !== 'right') return;
      var cs = win.getComputedStyle(el);
      var w = el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!(w > 0) || !text) return;
      var sp = Math.max(10, parseFloat(el.getAttribute('data-marquee-speed')) || 80);
      // width of one repeat = the text + the gap, in the page's own pixels (the page may be scaled)
      var probe = doc.createElement('span');
      probe.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:pre;text-indent:0;pointer-events:none;';
      probe.textContent = text + GAP;
      el.appendChild(probe);
      var sc = (el.getBoundingClientRect().width / (el.offsetWidth || 1)) || 1;
      var P = probe.getBoundingClientRect().width / sc;
      el.removeChild(probe);
      if (!(P > 4)) return;
      var key = Math.round(w) + '|' + P.toFixed(1) + '|' + sp + '|' + text;
      if (el.__mq === key && el.getAttribute('data-mq-rep')) return;
      el.__mq = key;
      var n = Math.ceil(w / P) + 2, rep = '';
      for (var i = 0; i < n; i++) rep += GAP + text;
      el.setAttribute('data-mq-rep', rep);
      el.style.setProperty('--mq-p', P.toFixed(2) + 'px');
      el.style.setProperty('--mq-d', Math.max(1, P / sp).toFixed(2) + 's');
    });
  }
  g.InteerMarquee = {
    css: CSS, ensureCss: ensureCss, apply: apply, clear: clear,
    start: function (doc) {
      doc = doc || document;
      apply(doc);
      setInterval(function () { apply(doc); }, 1200);
      g.addEventListener('resize', function () { apply(doc); });
    }
  };
})(window);
