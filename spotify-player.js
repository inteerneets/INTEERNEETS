/* INTEERNEETS playlist player: a see-through "glass" card that shows a Spotify playlist and plays it shuffled.
   Put <div data-spotify-player="PLAYLIST_ID_OR_LINK"> anywhere (the editor's "Playlist" button does it for you).
   It scales with its box: drag the corners in the editor to make it bigger or smaller.
   Visitors without a Spotify login can only hear Spotify's 30-second previews; every song also has an
   "open in Spotify" link for the full track. */
(function (g) {
  var CSS_ID = 'spx-css';
  var CSS = [
    '[data-spotify-player]{container-type:inline-size;box-sizing:border-box;overflow:hidden;color:#fff;',
    'font-family:"Inter 18pt Bold","Inter",sans-serif;font-weight:700;border-radius:22px;padding:4.5cqw;',
    'background:linear-gradient(145deg,rgba(255,255,255,.16),rgba(255,255,255,.05));',
    'border:1px solid rgba(255,255,255,.30);',
    'box-shadow:0 12px 40px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.40);',
    '-webkit-backdrop-filter:blur(14px) saturate(1.5);backdrop-filter:blur(14px) saturate(1.5);',
    'display:flex;flex-direction:column;gap:3cqw;user-select:none;-webkit-user-select:none;}',
    '[data-spotify-player] *{box-sizing:border-box;}',
    '.spx-top{display:flex;align-items:center;gap:3cqw;flex:none;}',
    '.spx-cover{width:15cqw;height:15cqw;border-radius:12px;object-fit:cover;flex:none;background:rgba(255,255,255,.12);box-shadow:0 4px 14px rgba(0,0,0,.35);}',
    '.spx-meta{flex:1;min-width:0;}',
    '.spx-brand{font-size:clamp(14px,5.6cqw,26px);letter-spacing:.14em;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.spx-sub{font-size:clamp(9px,3cqw,13px);letter-spacing:.2em;opacity:.65;margin-top:.5cqw;}',
    '.spx-open{flex:none;color:#fff;text-decoration:none;font-size:clamp(9px,2.8cqw,12px);letter-spacing:.16em;padding:1.6cqw 3cqw;border-radius:999px;border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.08);transition:background .2s,color .2s;}',
    '.spx-open:hover{background:#fff;color:#000;}',
    '.spx-now{flex:none;min-height:11cqw;}',
    '.spx-title{font-size:clamp(12px,4.4cqw,20px);line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.spx-artist{font-size:clamp(10px,3.2cqw,14px);opacity:.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:.6cqw;}',
    '.spx-bar{flex:none;height:1.6cqw;min-height:5px;border-radius:99px;background:rgba(255,255,255,.18);cursor:pointer;overflow:hidden;}',
    '.spx-bar i{display:block;height:100%;width:0;border-radius:99px;background:var(--c-highlight,#e53935);box-shadow:0 0 12px var(--c-highlight,#e53935);}',
    '.spx-ctl{flex:none;display:flex;align-items:center;gap:2.4cqw;}',
    '.spx-ctl button{font:inherit;color:#fff;cursor:pointer;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.1);border-radius:999px;',
    'height:9.5cqw;min-height:30px;padding:0 3.2cqw;font-size:clamp(11px,3.6cqw,16px);letter-spacing:.1em;line-height:1;display:flex;align-items:center;justify-content:center;transition:background .2s,color .2s,transform .12s;}',
    '.spx-ctl button:hover{background:#fff;color:#000;}.spx-ctl button:active{transform:scale(.96);}',
    '.spx-ctl .spx-play{width:9.5cqw;min-width:30px;padding:0;}',
    '.spx-ctl .spx-shuf{margin-left:auto;background:var(--c-highlight,#e53935);border-color:var(--c-highlight,#e53935);color:#000;}',
    '.spx-ctl .spx-shuf:hover{background:#fff;border-color:#fff;color:#000;}',
    '.spx-ctl .spx-shuf.on{box-shadow:0 0 16px var(--c-highlight,#e53935);}',
    '.spx-list{flex:1;min-height:0;margin:0;padding:0;list-style:none;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.4) transparent;}',
    '.spx-list li{display:flex;align-items:center;gap:2.4cqw;padding:2cqw 2.4cqw;border-radius:12px;cursor:pointer;transition:background .15s;}',
    '.spx-list li:hover{background:rgba(255,255,255,.12);}',
    '.spx-list li.on{background:rgba(255,255,255,.2);}',
    '.spx-list li.on .spx-t{color:var(--c-highlight,#e53935);}',
    '.spx-list li.np{opacity:.45;}',
    '.spx-n{flex:none;width:6cqw;text-align:right;font-size:clamp(9px,2.8cqw,12px);opacity:.55;}',
    '.spx-tx{min-width:0;flex:1;}',
    '.spx-t{font-size:clamp(11px,3.6cqw,16px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.spx-a{font-size:clamp(9px,2.8cqw,12px);opacity:.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.spx-msg{margin:auto;text-align:center;opacity:.7;font-size:clamp(11px,3.6cqw,16px);letter-spacing:.1em;padding:4cqw;}'
  ].join('');

  function addCss(doc, editor) {
    if (doc.getElementById(CSS_ID)) return;
    var s = doc.createElement('style'); s.id = CSS_ID;
    // in the editor the card must stay draggable: clicks go to the box, not to the buttons inside
    s.textContent = CSS + (editor ? '[data-spotify-player] *{pointer-events:none!important;}' : '');
    doc.head.appendChild(s);
  }

  function idOf(raw) {
    var s = String(raw || '').trim();
    var m = s.match(/playlist[\/:]([A-Za-z0-9]{10,32})/) || s.match(/^([A-Za-z0-9]{10,32})$/);
    return m ? m[1] : '';
  }
  function mm(ms) { var t = Math.round(ms / 1000); return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2); }
  function el(doc, tag, cls, txt) { var e = doc.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function mount(host, opts) {
    opts = opts || {};
    if (host.__sp) return;
    var doc = host.ownerDocument;
    addCss(doc, opts.editor);
    var id = idOf(host.getAttribute('data-spotify-player'));
    host.__sp = true;
    host.innerHTML = '';
    if (!id) { host.appendChild(el(doc, 'div', 'spx-msg', 'ADD A SPOTIFY PLAYLIST LINK')); return; }

    var top = el(doc, 'div', 'spx-top');
    var cover = el(doc, 'img', 'spx-cover'); cover.alt = '';
    var meta = el(doc, 'div', 'spx-meta');
    var brand = el(doc, 'div', 'spx-brand', 'INTEERNEETS');
    var sub = el(doc, 'div', 'spx-sub', 'PLAYLIST');
    meta.appendChild(brand); meta.appendChild(sub);
    var open = el(doc, 'a', 'spx-open', 'SPOTIFY \u2197'); open.href = 'https://open.spotify.com/playlist/' + id; open.target = '_blank'; open.rel = 'noopener';
    top.appendChild(cover); top.appendChild(meta); top.appendChild(open);
    var now = el(doc, 'div', 'spx-now'); var nt = el(doc, 'div', 'spx-title', 'Press shuffle play'); var na = el(doc, 'div', 'spx-artist', '');
    now.appendChild(nt); now.appendChild(na);
    var bar = el(doc, 'div', 'spx-bar'); var fill = el(doc, 'i'); bar.appendChild(fill);
    var ctl = el(doc, 'div', 'spx-ctl');
    var bPrev = el(doc, 'button', 'spx-prev', '\u23EE'), bPlay = el(doc, 'button', 'spx-play', '\u25B6'), bNext = el(doc, 'button', 'spx-next', '\u23ED'), bShuf = el(doc, 'button', 'spx-shuf', '\u21C4 SHUFFLE PLAY');
    ctl.appendChild(bPrev); ctl.appendChild(bPlay); ctl.appendChild(bNext); ctl.appendChild(bShuf);
    var list = el(doc, 'ol', 'spx-list');
    host.appendChild(top); host.appendChild(now); host.appendChild(bar); host.appendChild(ctl); host.appendChild(list);
    list.appendChild(el(doc, 'li', 'spx-msg', 'LOADING\u2026'));

    var tracks = [], order = [], pos = -1, shuffle = false, audio = null, cur = -1;
    function playable(i) { return !!tracks[i].preview; }
    function makeOrder(first) {
      var idx = []; for (var i = 0; i < tracks.length; i++) if (playable(i)) idx.push(i);
      if (shuffle) for (var k = idx.length - 1; k > 0; k--) { var r = Math.floor(Math.random() * (k + 1)); var tmp = idx[k]; idx[k] = idx[r]; idx[r] = tmp; }
      if (first != null) { var at = idx.indexOf(first); if (at > 0) { idx.splice(at, 1); idx.unshift(first); } }
      order = idx; pos = 0;
    }
    function mark() {
      Array.prototype.forEach.call(list.children, function (li, i) { li.classList.toggle('on', i === cur); });
      bPlay.textContent = audio && !audio.paused ? '\u23F8' : '\u25B6';
      bShuf.classList.toggle('on', shuffle);
    }
    function load(i) {
      if (opts.editor) return;
      if (!audio) {
        audio = new g.Audio(); audio.preload = 'auto';
        audio.addEventListener('timeupdate', function () { if (audio.duration) fill.style.width = (audio.currentTime / audio.duration * 100) + '%'; });
        audio.addEventListener('ended', function () { step(1); });
        audio.addEventListener('play', mark); audio.addEventListener('pause', mark);
        audio.addEventListener('error', function () { step(1); });
      }
      cur = i; var t = tracks[i];
      nt.textContent = t.title; na.textContent = t.artist;
      audio.src = t.preview; var p = audio.play(); if (p && p.catch) p.catch(function () { mark(); });
      var li = list.children[i]; if (li && li.scrollIntoView) { try { list.scrollTop = Math.max(0, li.offsetTop - list.offsetTop - 8); } catch (e) { /* ignore */ } }
      mark();
    }
    function step(d) {
      if (!order.length) makeOrder();
      pos = (pos + d + order.length) % order.length;
      load(order[pos]);
    }
    function startShuffle() { shuffle = true; makeOrder(); load(order[0]); }
    if (!opts.editor) {
      bShuf.addEventListener('click', startShuffle);
      bNext.addEventListener('click', function () { step(1); });
      bPrev.addEventListener('click', function () { if (audio && audio.currentTime > 4) audio.currentTime = 0; else step(-1); });
      bPlay.addEventListener('click', function () { if (!audio || cur < 0) startShuffle(); else if (audio.paused) audio.play(); else audio.pause(); });
      bar.addEventListener('click', function (e) { if (!audio || !audio.duration) return; var r = bar.getBoundingClientRect(); audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * audio.duration; });
    }

    g.fetch('/api/playlist?id=' + encodeURIComponent(id)).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.tracks) throw new Error('no data');
      tracks = j.tracks;
      brand.textContent = (j.name || 'INTEERNEETS').toUpperCase();
      sub.textContent = 'PLAYLIST \u00B7 ' + tracks.length + ' TRACKS';
      if (j.cover) cover.src = j.cover; else cover.style.visibility = 'hidden';
      list.innerHTML = '';
      tracks.forEach(function (t, i) {
        var li = el(doc, 'li', playable(i) ? '' : 'np');
        li.appendChild(el(doc, 'span', 'spx-n', String(i + 1)));
        var tx = el(doc, 'div', 'spx-tx'); tx.appendChild(el(doc, 'div', 'spx-t', t.title)); tx.appendChild(el(doc, 'div', 'spx-a', t.artist));
        li.appendChild(tx); li.appendChild(el(doc, 'span', 'spx-n', t.dur ? mm(t.dur) : ''));
        if (!opts.editor) li.addEventListener('click', function () {
          if (playable(i)) { makeOrder(i); load(i); } else if (t.uri) g.open('https://open.spotify.com/track/' + String(t.uri).split(':').pop(), '_blank', 'noopener');
        });
        list.appendChild(li);
      });
      if (!tracks.some(function (_, i) { return playable(i); })) nt.textContent = 'Open in Spotify to listen';
    }).catch(function () { list.innerHTML = ''; list.appendChild(el(doc, 'li', 'spx-msg', 'COULD NOT LOAD THE PLAYLIST')); });
  }

  function mountAll(doc, opts) {
    Array.prototype.forEach.call((doc || document).querySelectorAll('[data-spotify-player]'), function (h) { mount(h, opts); });
  }
  function remount(host, opts) { host.__sp = false; mount(host, opts); }

  g.SpotifyPlayer = { mount: mount, mountAll: mountAll, remount: remount, idOf: idOf };
})(window);
