/* INTEERNEETS playlist player (SoundCloud): a see-through "glass" card that plays a SoundCloud playlist shuffled.
   Put <div data-soundcloud-player="https://soundcloud.com/you/sets/your-playlist"> anywhere (the editor's
   "Playlist" button does it for you). It scales with its box: drag the corners in the editor to resize it.
   Playback uses SoundCloud's own player (hidden); this card is only the look + controls. */
(function (g) {
  var CSS_ID = 'scx-css';
  var CSS = [
    '[data-soundcloud-player]{container-type:inline-size;box-sizing:border-box;overflow:hidden;color:#fff;position:relative;',
    'font-family:"Inter 18pt Bold","Inter",sans-serif;font-weight:700;border-radius:22px;padding:4.5cqw;',
    'background:linear-gradient(145deg,rgba(255,255,255,.16),rgba(255,255,255,.05));',
    'border:1px solid rgba(255,255,255,.30);',
    'box-shadow:0 12px 40px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.40);',
    '-webkit-backdrop-filter:blur(14px) saturate(1.5);backdrop-filter:blur(14px) saturate(1.5);',
    'display:flex;flex-direction:column;gap:3cqw;user-select:none;-webkit-user-select:none;}',
    '[data-soundcloud-player] *{box-sizing:border-box;}',
    '.scx-top{display:flex;align-items:center;gap:3cqw;flex:none;}',
    '.scx-cover{width:15cqw;height:15cqw;border-radius:12px;object-fit:cover;flex:none;background:rgba(255,255,255,.12);box-shadow:0 4px 14px rgba(0,0,0,.35);}',
    '.scx-meta{flex:1;min-width:0;}',
    '.scx-brand{font-size:clamp(14px,5.6cqw,26px);letter-spacing:.14em;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.scx-sub{font-size:clamp(9px,3cqw,13px);letter-spacing:.2em;opacity:.65;margin-top:.5cqw;}',
    '.scx-open{flex:none;color:#fff;text-decoration:none;font-size:clamp(9px,2.8cqw,12px);letter-spacing:.16em;padding:1.6cqw 3cqw;border-radius:999px;border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.08);transition:background .2s,color .2s;}',
    '.scx-open:hover{background:#fff;color:#000;}',
    '.scx-now{flex:none;min-height:11cqw;}',
    '.scx-title{font-size:clamp(12px,4.4cqw,20px);line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.scx-artist{font-size:clamp(10px,3.2cqw,14px);opacity:.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:.6cqw;}',
    '.scx-bar{flex:none;height:1.6cqw;min-height:5px;border-radius:99px;background:rgba(255,255,255,.18);cursor:pointer;overflow:hidden;}',
    '.scx-bar i{display:block;height:100%;width:0;border-radius:99px;background:var(--c-highlight,#e53935);box-shadow:0 0 12px var(--c-highlight,#e53935);}',
    '.scx-ctl{flex:none;display:flex;align-items:center;gap:2.4cqw;}',
    '.scx-ctl button{font:inherit;color:#fff;cursor:pointer;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.1);border-radius:999px;',
    'height:9.5cqw;min-height:30px;padding:0 3.2cqw;font-size:clamp(11px,3.6cqw,16px);letter-spacing:.1em;line-height:1;display:flex;align-items:center;justify-content:center;transition:background .2s,color .2s,transform .12s;}',
    '.scx-ctl button:hover{background:#fff;color:#000;}.scx-ctl button:active{transform:scale(.96);}',
    '.scx-ctl .scx-play{width:9.5cqw;min-width:30px;padding:0;}',
    '.scx-ctl .scx-shuf{margin-left:auto;background:var(--c-highlight,#e53935);border-color:var(--c-highlight,#e53935);color:#000;}',
    '.scx-ctl .scx-shuf:hover{background:#fff;border-color:#fff;color:#000;}',
    '.scx-ctl .scx-shuf.on{box-shadow:0 0 16px var(--c-highlight,#e53935);}',
    '.scx-list{flex:1;min-height:0;margin:0;padding:0;list-style:none;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.4) transparent;}',
    '.scx-list li{display:flex;align-items:center;gap:2.4cqw;padding:2cqw 2.4cqw;border-radius:12px;cursor:pointer;transition:background .15s;}',
    '.scx-list li:hover{background:rgba(255,255,255,.12);}',
    '.scx-list li.on{background:rgba(255,255,255,.2);}',
    '.scx-list li.on .scx-t{color:var(--c-highlight,#e53935);}',
    '.scx-n{flex:none;width:6cqw;text-align:right;font-size:clamp(9px,2.8cqw,12px);opacity:.55;}',
    '.scx-tx{min-width:0;flex:1;}',
    '.scx-t{font-size:clamp(11px,3.6cqw,16px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.scx-a{font-size:clamp(9px,2.8cqw,12px);opacity:.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.scx-msg{margin:auto;text-align:center;opacity:.7;font-size:clamp(11px,3.6cqw,16px);letter-spacing:.1em;padding:4cqw;}',
    '.scx-frame{position:absolute;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0;}'
  ].join('');

  function addCss(doc, editor) {
    if (doc.getElementById(CSS_ID)) return;
    var s = doc.createElement('style'); s.id = CSS_ID;
    // in the editor the card must stay draggable: clicks go to the box, not to the buttons inside
    s.textContent = CSS + (editor ? '[data-soundcloud-player] *{pointer-events:none!important;}' : '');
    doc.head.appendChild(s);
  }

  // a clean soundcloud.com link (playlist / "set" or a single track), or ''
  function urlOf(raw) {
    var s = String(raw || '').trim();
    var m = s.match(/^(?:https?:\/\/)?(?:www\.|m\.)?(soundcloud\.com\/[A-Za-z0-9_\-]+(?:\/[A-Za-z0-9_\-%.]+){0,3})(?:[?#].*)?$/i)
         || s.match(/^(?:https?:\/\/)?(on\.soundcloud\.com\/[A-Za-z0-9]+)/i);
    return m ? 'https://' + m[1] : '';
  }
  function mm(ms) { var t = Math.round(ms / 1000); return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2); }
  function el(doc, tag, cls, txt) { var e = doc.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  var apiPromise = null;
  function loadApi() {
    if (g.SC && g.SC.Widget) return Promise.resolve();
    if (apiPromise) return apiPromise;
    apiPromise = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = 'https://w.soundcloud.com/player/api.js';
      s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
    return apiPromise;
  }

  function mount(host, opts) {
    opts = opts || {};
    if (host.__sc) return;
    var doc = host.ownerDocument;
    addCss(doc, opts.editor);
    var url = urlOf(host.getAttribute('data-soundcloud-player'));
    host.__sc = true;
    host.innerHTML = '';
    if (!url) { host.appendChild(el(doc, 'div', 'scx-msg', 'ADD A SOUNDCLOUD PLAYLIST LINK')); return; }

    var top = el(doc, 'div', 'scx-top');
    var cover = el(doc, 'img', 'scx-cover'); cover.alt = ''; cover.style.visibility = 'hidden';
    var meta = el(doc, 'div', 'scx-meta');
    var brand = el(doc, 'div', 'scx-brand', 'INTEERNEETS');
    var sub = el(doc, 'div', 'scx-sub', 'SOUNDCLOUD');
    meta.appendChild(brand); meta.appendChild(sub);
    var open = el(doc, 'a', 'scx-open', 'SOUNDCLOUD \u2197'); open.href = url; open.target = '_blank'; open.rel = 'noopener';
    top.appendChild(cover); top.appendChild(meta); top.appendChild(open);
    var now = el(doc, 'div', 'scx-now'); var nt = el(doc, 'div', 'scx-title', 'Press shuffle play'); var na = el(doc, 'div', 'scx-artist', '');
    now.appendChild(nt); now.appendChild(na);
    var bar = el(doc, 'div', 'scx-bar'); var fill = el(doc, 'i'); bar.appendChild(fill);
    var ctl = el(doc, 'div', 'scx-ctl');
    var bPrev = el(doc, 'button', 'scx-prev', '\u23EE'), bPlay = el(doc, 'button', 'scx-play', '\u25B6'), bNext = el(doc, 'button', 'scx-next', '\u23ED'), bShuf = el(doc, 'button', 'scx-shuf', '\u21C4 SHUFFLE PLAY');
    ctl.appendChild(bPrev); ctl.appendChild(bPlay); ctl.appendChild(bNext); ctl.appendChild(bShuf);
    var list = el(doc, 'ol', 'scx-list');
    host.appendChild(top); host.appendChild(now); host.appendChild(bar); host.appendChild(ctl); host.appendChild(list);

    if (opts.editor) {
      // editor: only the look (the songs load on the live site)
      sub.textContent = 'SOUNDCLOUD PLAYLIST';
      nt.textContent = 'Your songs show here'; na.textContent = url.replace('https://', '');
      for (var i = 1; i <= 4; i++) {
        var li = el(doc, 'li'); li.appendChild(el(doc, 'span', 'scx-n', String(i)));
        var tx = el(doc, 'div', 'scx-tx'); tx.appendChild(el(doc, 'div', 'scx-t', 'Track ' + i)); tx.appendChild(el(doc, 'div', 'scx-a', 'INTEERNEETS'));
        li.appendChild(tx); list.appendChild(li);
      }
      return;
    }

    // Live site: dress the playlist with the site's glass scrollbar (fades in while scrolling/hovering,
    // replacing the default browser bar). glass-scroll.js is only present on the live site, not the editor.
    var gv = doc.defaultView;
    if (gv && gv.glassScroll) { host.__scGlass = gv.glassScroll({ el: list, host: host, inner: true }); list.__glass = host.__scGlass; }

    list.appendChild(el(doc, 'li', 'scx-msg', 'LOADING\u2026'));
    var frame = doc.createElement('iframe');
    frame.className = 'scx-frame'; frame.allow = 'autoplay';
    frame.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url) + '&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false';
    host.appendChild(frame);

    var tracks = [], order = [], pos = 0, shuffle = false, cur = -1, w = null, playing = false;
    function makeOrder(first) {
      var idx = tracks.map(function (_, i) { return i; });
      if (shuffle) for (var k = idx.length - 1; k > 0; k--) { var r = Math.floor(Math.random() * (k + 1)); var t = idx[k]; idx[k] = idx[r]; idx[r] = t; }
      if (first != null) { var at = idx.indexOf(first); if (at > 0) { idx.splice(at, 1); idx.unshift(first); } }
      order = idx; pos = 0;
    }
    function mark() {
      Array.prototype.forEach.call(list.children, function (li, i) { li.classList.toggle('on', i === cur); });
      bPlay.textContent = playing ? '\u23F8' : '\u25B6';
      bShuf.classList.toggle('on', shuffle);
    }
    function show(i) {
      cur = i; var t = tracks[i]; if (!t) return;
      nt.textContent = t.title; na.textContent = t.artist;
      if (t.art) { cover.src = t.art; cover.style.visibility = 'visible'; }
      var li = list.children[i]; if (li) { try { list.scrollTop = Math.max(0, li.offsetTop - list.offsetTop - 8); } catch (e) { /* ignore */ } }
      mark();
    }
    function go(i) { if (!w) return; w.skip(i); w.play(); show(i); }
    function step(d) {
      if (!tracks.length) return;
      if (!shuffle) { go((cur < 0 ? 0 : cur + d + tracks.length) % tracks.length); return; }
      if (!order.length) makeOrder();
      pos = (pos + d + order.length) % order.length;
      go(order[pos]);
    }
    function startShuffle() { shuffle = true; makeOrder(); go(order[0]); }

    loadApi().then(function () {
      w = g.SC.Widget(frame);
      w.bind(g.SC.Widget.Events.READY, function () {
        w.getSounds(function (sounds) {
          tracks = (sounds || []).map(function (s) {
            return { title: s.title || '', artist: (s.user && s.user.username) || '', dur: s.duration || 0, art: (s.artwork_url || (s.user && s.user.avatar_url) || '').replace('-large', '-t200x200') };
          });
          list.innerHTML = '';
          if (!tracks.length) { list.appendChild(el(doc, 'li', 'scx-msg', 'NO SONGS FOUND (IS THE PLAYLIST PUBLIC?)')); return; }
          sub.textContent = 'SOUNDCLOUD \u00B7 ' + tracks.length + ' TRACKS';
          if (tracks[0].art) { cover.src = tracks[0].art; cover.style.visibility = 'visible'; }
          tracks.forEach(function (t, i) {
            var li = el(doc, 'li');
            li.appendChild(el(doc, 'span', 'scx-n', String(i + 1)));
            var tx = el(doc, 'div', 'scx-tx'); tx.appendChild(el(doc, 'div', 'scx-t', t.title)); tx.appendChild(el(doc, 'div', 'scx-a', t.artist));
            li.appendChild(tx); li.appendChild(el(doc, 'span', 'scx-n', t.dur ? mm(t.dur) : ''));
            li.addEventListener('click', function () { makeOrder(i); go(i); });
            list.appendChild(li);
          });
          if (host.__scGlass) host.__scGlass.redraw();
        });
      });
      w.bind(g.SC.Widget.Events.PLAY, function () { playing = true; w.getCurrentSoundIndex(function (i) { if (i !== cur) show(i); else mark(); }); });
      w.bind(g.SC.Widget.Events.PAUSE, function () { playing = false; mark(); });
      w.bind(g.SC.Widget.Events.PLAY_PROGRESS, function (e) { fill.style.width = (e.relativePosition * 100) + '%'; });
      w.bind(g.SC.Widget.Events.FINISH, function () { if (shuffle) step(1); });
    }).catch(function () { list.innerHTML = ''; list.appendChild(el(doc, 'li', 'scx-msg', 'COULD NOT LOAD SOUNDCLOUD')); });

    bShuf.addEventListener('click', startShuffle);
    bNext.addEventListener('click', function () { step(1); });
    bPrev.addEventListener('click', function () { step(-1); });
    bPlay.addEventListener('click', function () { if (!w) return; if (cur < 0) startShuffle(); else w.toggle(); });
    bar.addEventListener('click', function (e) { if (!w) return; var r = bar.getBoundingClientRect(); var f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); w.getDuration(function (d) { w.seekTo(d * f); }); });
  }

  function mountAll(doc, opts) {
    Array.prototype.forEach.call((doc || document).querySelectorAll('[data-soundcloud-player]'), function (h) { mount(h, opts); });
  }
  function remount(host, opts) { host.__sc = false; mount(host, opts); }

  g.SoundCloudPlayer = { mount: mount, mountAll: mountAll, remount: remount, urlOf: urlOf };
})(window);
