/* Scrolling ("marquee") text. Put data-marquee="left" or "right" (and optionally data-marquee-speed="80", pixels per
   second) on any text box: the text scrolls sideways inside the box, which keeps its size. The line repeats itself
   with a single space between the repeats, so it chases its own tail: as soon as the text leaves one edge it enters on
   the other. The moving copy is a ::after layer animated with transform, so it is smooth (GPU), and the real text of
   the box stays in place (invisible) to keep the box's size. Used by the live site and the editor. */
(function (g) {
  var GAP = ' ';
  var CSS =
    '@keyframes mq-l{from{transform:translate3d(0,0,0)}to{transform:translate3d(calc(-1 * var(--mq-p,300px)),0,0)}}' +
    '@keyframes mq-r{from{transform:translate3d(calc(-1 * var(--mq-p,300px)),0,0)}to{transform:translate3d(0,0,0)}}' +
    '[data-marquee]{overflow:hidden!important;white-space:nowrap!important;text-overflow:clip!important;text-align:left!important;color:transparent!important;text-shadow:none!important;}' +
    '[data-marquee]::after{content:attr(data-mq-rep);position:absolute;left:var(--mq-pl,0px);top:var(--mq-pt,0px);white-space:pre;color:var(--mq-c,#fff);will-change:transform;backface-visibility:hidden;}' +
    '[data-marquee="left"]::after{animation:mq-l var(--mq-d,10s) linear infinite;}' +
    '[data-marquee="right"]::after{animation:mq-r var(--mq-d,10s) linear infinite;}';

  function ensureCss(doc) {
    if (!doc || doc.getElementById('mq-css')) return;
    var s = doc.createElement('style'); s.id = 'mq-css'; s.textContent = CSS;
    (doc.head || doc.documentElement).appendChild(s);
  }
  function clear(el) {
    el.removeAttribute('data-mq-rep');
    ['--mq-p', '--mq-d', '--mq-c', '--mq-pl', '--mq-pt', '--mq-a', '--mq-b', 'text-indent'].forEach(function (k) { el.style.removeProperty(k); });
    if (el.__mqPos) { el.style.position = ''; el.__mqPos = false; }
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
      var pl = parseFloat(cs.paddingLeft) || 0, pt = parseFloat(cs.paddingTop) || 0;
      var w = el.clientWidth - pl - (parseFloat(cs.paddingRight) || 0);
      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!(w > 0) || !text) return;
      var sp = Math.max(10, parseFloat(el.getAttribute('data-marquee-speed')) || 80);
      // width of one repeat = the text + the gap, in the page's own pixels (the page may be scaled)
      var probe = doc.createElement('span');
      probe.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:pre;pointer-events:none;';
      probe.textContent = text + GAP;
      el.appendChild(probe);
      var sc = (el.getBoundingClientRect().width / (el.offsetWidth || 1)) || 1;
      var P = probe.getBoundingClientRect().width / sc;
      el.removeChild(probe);
      if (!(P > 4)) return;
      var key = Math.round(w) + '|' + P.toFixed(1) + '|' + sp + '|' + text;
      if (el.__mq === key && el.getAttribute('data-mq-rep')) return;
      el.__mq = key;
      // the real colour (the box's own text is made invisible while scrolling)
      el.removeAttribute('data-marquee');
      var colour = win.getComputedStyle(el).color;
      el.setAttribute('data-marquee', dir);
      var pos = win.getComputedStyle(el).position;
      if (pos === 'static') { el.style.position = 'relative'; el.__mqPos = true; }   // the moving layer is positioned inside the box
      var n = Math.ceil(w / P) + 2, rep = text;
      for (var i = 0; i < n; i++) rep += GAP + text;
      el.setAttribute('data-mq-rep', rep);
      el.style.setProperty('--mq-p', P.toFixed(3) + 'px');
      el.style.setProperty('--mq-d', Math.max(1, P / sp).toFixed(3) + 's');
      el.style.setProperty('--mq-c', colour);
      el.style.setProperty('--mq-pl', pl + 'px');
      el.style.setProperty('--mq-pt', pt + 'px');
    });
  }
  g.InteerMarquee = {
    css: CSS, ensureCss: ensureCss, apply: apply, clear: clear,
    start: function (doc) {
      doc = doc || document;
      apply(doc);
      setInterval(function () { apply(doc); }, 1500);
      g.addEventListener('resize', function () { apply(doc); });
    }
  };
})(window);
