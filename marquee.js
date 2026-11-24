/* Scrolling ("marquee") text. Put data-marquee="left" or "right" (and optionally data-marquee-speed="80", pixels per
   second) on any text box: the text scrolls sideways inside the box, which keeps its size. Used by the live site and the editor. */
(function (g) {
  var CSS =
    '@keyframes mq-l{from{text-indent:var(--mq-a,100%)}to{text-indent:var(--mq-b,-100%)}}' +
    '@keyframes mq-r{from{text-indent:var(--mq-b,-100%)}to{text-indent:var(--mq-a,100%)}}' +
    '[data-marquee]{overflow:hidden!important;white-space:nowrap!important;text-overflow:clip!important;text-align:left!important;}' +
    '[data-marquee="left"]{animation:mq-l var(--mq-d,10s) linear infinite;}' +
    '[data-marquee="right"]{animation:mq-r var(--mq-d,10s) linear infinite;}';

  function ensureCss(doc) {
    if (!doc || doc.getElementById('mq-css')) return;
    var s = doc.createElement('style'); s.id = 'mq-css'; s.textContent = CSS;
    (doc.head || doc.documentElement).appendChild(s);
  }
  // measure each scrolling box and its text once (and again whenever either changes)
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
      var r = doc.createRange(); r.selectNodeContents(el);
      var br = el.getBoundingClientRect(), sc = (br.width / (el.offsetWidth || 1)) || 1;   // the page may be scaled
      var t = r.getBoundingClientRect().width / sc;
      var sp = Math.max(10, parseFloat(el.getAttribute('data-marquee-speed')) || 80);
      var key = Math.round(w) + '|' + Math.round(t) + '|' + sp;
      if ((el.__mq === key && el.style.getPropertyValue('--mq-a')) || !(w > 0)) return;   // re-apply if the editor re-drew the element and dropped our values
      el.__mq = key;
      el.style.setProperty('--mq-a', Math.round(w) + 'px');
      el.style.setProperty('--mq-b', (-Math.ceil(t) - 4) + 'px');
      el.style.setProperty('--mq-d', Math.max(2, (w + t) / sp).toFixed(2) + 's');
    });
  }
  g.InteerMarquee = {
    css: CSS, ensureCss: ensureCss, apply: apply,
    start: function (doc) {
      doc = doc || document;
      apply(doc);
      setInterval(function () { apply(doc); }, 1200);
      g.addEventListener('resize', function () { apply(doc); });
    }
  };
})(window);
