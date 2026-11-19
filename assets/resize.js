// Photo / signature / thumb / declaration resizer. Everything happens in this browser tab; no file is sent anywhere.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var PRESETS = window.AS_PRESETS;
  var S = { file: null, img: null, rot: 0, src: null, box: null, zoom: 100, preset: PRESETS[0], drag: null, url: null };

  function L(o) { return o ? (o[window.ASLang()] || o.hi) : ''; }
  function T(hi, en) { return window.ASLang() === 'en' ? en : hi; }

  function fillPresets() {
    var sel = $('preset'), keep = S.preset.id;
    sel.innerHTML = '';
    var groups = {};
    PRESETS.forEach(function (p) {
      var key = p.group.en;
      if (!groups[key]) {
        groups[key] = document.createElement('optgroup');
        groups[key].label = L(p.group);
        sel.appendChild(groups[key]);
      }
      var o = document.createElement('option');
      o.value = p.id;
      o.textContent = L(p.label);
      groups[key].appendChild(o);
    });
    sel.value = keep;
  }

  function current() {
    var p = S.preset;
    if (!p.custom) { var q = Object.assign({}, p); q.clean = $('clean').checked; return q; }
    var w = parseInt($('cw').value, 10), h = parseInt($('ch').value, 10);
    var dpi = parseInt($('cdpi').value, 10);
    return {
      id: 'custom', label: p.label, custom: true, sources: [],
      w: w > 0 && h > 0 ? w : null, h: w > 0 && h > 0 ? h : null,
      minKB: Math.max(0, parseFloat($('cmin').value) || 0),
      maxKB: Math.max(1, parseFloat($('cmax').value) || 50),
      dpi: dpi > 0 ? dpi : null, clean: $('clean').checked
    };
  }

  function showInfo() {
    var p = S.preset, box = $('info');
    $('customBox').classList.toggle('hidden', !p.custom);
    var html = '';
    if (!p.custom) {
      html += '<p><b>' + esc(L(p.label)) + '</b>' + (p.dpi ? ' · ' + p.dpi + ' DPI' : '') + '</p>';
      if (p.notes) html += '<p>' + esc(L(p.notes)) + '</p>';
      if (p.extra) html += '<p class="note">' + esc(L(p.extra)) + '</p>';
      if (p.decl) html += '<p class="small"><b>' + esc(T('घोषणा का पाठ (अपने हाथ से अंग्रेज़ी में लिखें):', 'Declaration text (write it by hand in English):')) + '</b><br>' + esc(window.AS_DECL) + '</p>' +
        '<p class="small muted">' + esc(T('SBI PO 2026-27 में नाम के बाद जन्मतिथि और अंत में यह वाक्य भी है: "The signature, photograph and left-hand thumb impression is of mine."', 'SBI PO 2026-27 adds your date of birth after the name and ends with: "The signature, photograph and left-hand thumb impression is of mine."')) + '</p>';
      html += '<p class="small muted">' + esc(T('अगर सबसे अच्छी क्वालिटी पर भी फ़ाइल न्यूनतम KB से छोटी रहे, तो हम फ़ाइल में एक खाली टिप्पणी-भाग जोड़ते हैं; पिक्सेल और तस्वीर नहीं बदलते।', 'If the file is still under the minimum KB at top quality, we add a blank comment block inside the file; the pixels and the picture do not change.')) + '</p>';
      html += '<div class="src">' + esc(T('स्रोत (आधिकारिक अधिसूचना, 19 नवंबर 2026 को जाँची):', 'Source (official notice, checked 19 Nov 2026):')) + '<ul>';
      p.sources.forEach(function (s) { html += '<li><a href="' + s.url + '" rel="noopener" target="_blank">' + esc(s.t) + '</a></li>'; });
      html += '</ul>' + esc(T('नई भर्ती में नियम बदल सकते हैं। अपलोड से पहले अपनी अधिसूचना से मिलान करें।', 'Rules can change with each new recruitment. Match against your own notice before uploading.')) + '</div>';
      $('clean').checked = !!p.clean;
    }
    box.innerHTML = html;
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- source image ----------
  function loadFile(file) {
    if (!file) return;
    S.file = file;
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () { S.img = img; S.rot = 0; buildSource(); URL.revokeObjectURL(url); };
    img.onerror = function () { alert(T('यह फ़ाइल खुल नहीं रही। JPG या PNG फोटो चुनें।', 'This file could not be opened. Choose a JPG or PNG photo.')); };
    img.src = url;
  }

  function buildSource() {
    var img = S.img, max = 3000;
    var s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    var w = Math.round(img.naturalWidth * s), h = Math.round(img.naturalHeight * s);
    var c = document.createElement('canvas');
    var side = S.rot % 180 !== 0;
    c.width = side ? h : w; c.height = side ? w : h;
    var g = c.getContext('2d');
    g.translate(c.width / 2, c.height / 2);
    g.rotate(S.rot * Math.PI / 180);
    g.drawImage(img, -w / 2, -h / 2, w, h);
    S.src = c;
    resetBox();
    $('editor').classList.remove('hidden');
    $('result').classList.add('hidden');
    draw();
  }

  function aspect() { var p = current(); return p.w && p.h ? p.w / p.h : null; }

  function resetBox() {
    if (!S.src) return;
    var W = S.src.width, H = S.src.height, a = aspect();
    $('zoomRow').classList.toggle('hidden', !a);
    if (!a) { S.box = { x: 0, y: 0, w: W, h: H }; return; }
    var bw = W, bh = W / a;
    if (bh > H) { bh = H; bw = H * a; }
    bw *= S.zoom / 100; bh *= S.zoom / 100;
    var cx = S.box ? S.box.x + S.box.w / 2 : W / 2, cy = S.box ? S.box.y + S.box.h / 2 : H / 2;
    S.box = clampBox({ x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh });
  }

  function clampBox(b) {
    var W = S.src.width, H = S.src.height;
    b.x = Math.max(0, Math.min(W - b.w, b.x));
    b.y = Math.max(0, Math.min(H - b.h, b.y));
    return b;
  }

  function draw() {
    if (!S.src) return;
    var cv = $('stage'), stage = cv.parentNode;
    var cssW = stage.clientWidth || 600;
    var scale = cssW / S.src.width;
    var dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(cssW * dpr);
    cv.height = Math.round(S.src.height * scale * dpr);
    var g = cv.getContext('2d');
    g.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    g.drawImage(S.src, 0, 0);
    var b = S.box;
    g.fillStyle = 'rgba(0,0,0,0.5)';
    g.fillRect(0, 0, S.src.width, b.y);
    g.fillRect(0, b.y + b.h, S.src.width, S.src.height - b.y - b.h);
    g.fillRect(0, b.y, b.x, b.h);
    g.fillRect(b.x + b.w, b.y, S.src.width - b.x - b.w, b.h);
    g.strokeStyle = '#facc15';
    g.lineWidth = 3 / scale;
    g.strokeRect(b.x, b.y, b.w, b.h);
    S.scale = scale;
  }

  function pointer(e) {
    var r = $('stage').getBoundingClientRect();
    return { x: (e.clientX - r.left) / S.scale, y: (e.clientY - r.top) / S.scale };
  }

  // ---------- output ----------
  function render(w, h, clean) {
    var b = S.box, src = S.src, sx = b.x, sy = b.y, sw = b.w, sh = b.h;
    while (sw > w * 2 && sh > h * 2) {
      var t = document.createElement('canvas');
      t.width = Math.round(sw / 2); t.height = Math.round(sh / 2);
      var tg = t.getContext('2d');
      tg.imageSmoothingQuality = 'high';
      tg.drawImage(src, sx, sy, sw, sh, 0, 0, t.width, t.height);
      src = t; sx = 0; sy = 0; sw = t.width; sh = t.height;
    }
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    g.imageSmoothingQuality = 'high';
    g.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
    if (clean) whiten(g, w, h);
    return c;
  }

  // Ink on paper: grey scale, paper to white, ink darker.
  function whiten(g, w, h) {
    var d = g.getImageData(0, 0, w, h), a = d.data, n = w * h, hist = new Uint32Array(256), i;
    for (i = 0; i < n; i++) hist[(a[i * 4] * 299 + a[i * 4 + 1] * 587 + a[i * 4 + 2] * 114) / 1000 | 0]++;
    function pct(p) { var t = n * p, s = 0; for (var v = 0; v < 256; v++) { s += hist[v]; if (s >= t) return v; } return 255; }
    var black = pct(0.01), white = Math.max(black + 30, pct(0.5) - 10);
    for (i = 0; i < n; i++) {
      var y = (a[i * 4] * 299 + a[i * 4 + 1] * 587 + a[i * 4 + 2] * 114) / 1000;
      var v = Math.max(0, Math.min(1, (y - black) / (white - black)));
      v = Math.round(255 * Math.pow(v, 1.6));
      a[i * 4] = a[i * 4 + 1] = a[i * 4 + 2] = v;
    }
    g.putImageData(d, 0, 0);
  }

  function blobOf(c, q) { return new Promise(function (r) { c.toBlob(r, 'image/jpeg', q); }); }

  function setDpi(blob, dpi) {
    if (!dpi) return Promise.resolve(blob);
    return blob.arrayBuffer().then(function (ab) {
      var b = new Uint8Array(ab);
      if (b[0] !== 0xFF || b[1] !== 0xD8) return blob;
      if (b[2] === 0xFF && b[3] === 0xE0 && b[6] === 0x4A && b[7] === 0x46 && b[8] === 0x49 && b[9] === 0x46 && b[10] === 0) {
        b[13] = 1; b[14] = dpi >> 8; b[15] = dpi & 255; b[16] = dpi >> 8; b[17] = dpi & 255;
        return new Blob([b], { type: 'image/jpeg' });
      }
      var app0 = [0xFF, 0xE0, 0, 16, 0x4A, 0x46, 0x49, 0x46, 0, 1, 1, 1, dpi >> 8, dpi & 255, dpi >> 8, dpi & 255, 0, 0];
      var out = new Uint8Array(b.length + 18);
      out.set(b.subarray(0, 2), 0); out.set(app0, 2); out.set(b.subarray(2), 20);
      return new Blob([out], { type: 'image/jpeg' });
    });
  }

  function enc(c, q, dpi) { return blobOf(c, q).then(function (b) { return setDpi(b, dpi); }); }

  // A small image at top quality can still be under a form's minimum KB. Keep the exact pixels and add a JPEG
  // comment block (blank text, ignored by every viewer) so the file reaches the minimum.
  function pad(blob, target) {
    return blob.arrayBuffer().then(function (ab) {
      var b = new Uint8Array(ab), need = target - b.length;
      if (need <= 0) return blob;
      var at = 2;
      if (b[2] === 0xFF && b[3] === 0xE0) at = 4 + (b[4] << 8 | b[5]);
      var parts = [b.subarray(0, at)];
      while (need > 0) {
        var len = Math.min(65533, Math.max(2, need - 2));
        var seg = new Uint8Array(len + 2);
        seg[0] = 0xFF; seg[1] = 0xFE; seg[2] = len >> 8; seg[3] = len & 255;
        seg.fill(0x20, 4);
        parts.push(seg);
        need -= seg.length;
      }
      parts.push(b.subarray(at));
      return new Blob(parts, { type: 'image/jpeg' });
    });
  }

  // KB limits: max uses 1 KB = 1000 bytes and min uses 1 KB = 1024 bytes, so the file passes either way a portal counts.
  async function fit(p) {
    var minB = p.minKB * 1024, maxB = p.maxKB * 1000;
    var fixed = !!(p.w && p.h), w, h, changed = null;
    if (fixed) { w = p.w; h = p.h; } else {
      var s = Math.min(1, 1200 / Math.max(S.box.w, S.box.h));
      w = Math.max(1, Math.round(S.box.w * s)); h = Math.max(1, Math.round(S.box.h * s));
    }
    for (var attempt = 0; attempt < 16; attempt++) {
      var c = render(w, h, p.clean);
      var top = await enc(c, 1.0, p.dpi);
      if (top.size < minB && fixed) {
        return { blob: await pad(top, minB + 512), w: w, h: h, q: 1.0, changed: 'pad' };
      }
      if (top.size < minB) {
        if (w * 1.15 > 5000) break;
        w = Math.round(w * 1.15); h = Math.round(h * 1.15); changed = 'up'; continue;
      }
      var low = await enc(c, 0.05, p.dpi);
      if (low.size > maxB) {
        if (w < 40) break;
        w = Math.round(w * 0.85); h = Math.round(h * 0.85); changed = 'down'; continue;
      }
      var best = top, q = 1.0;
      if (top.size > maxB) {
        var lo = 0.05, hi = 1.0; best = low; q = 0.05;
        for (var k = 0; k < 10; k++) {
          var m = (lo + hi) / 2, b = await enc(c, m, p.dpi);
          if (b.size <= maxB) { best = b; q = m; lo = m; } else hi = m;
        }
      }
      if (best.size < minB && fixed) return { blob: await pad(best, minB + 512), w: w, h: h, q: q, changed: 'pad' };
      if (best.size < minB) { w = Math.round(w * 1.1); h = Math.round(h * 1.1); changed = 'up'; continue; }
      return { blob: best, w: w, h: h, q: q, changed: fixed ? changed : null };
    }
    return null;
  }

  async function make() {
    var p = current();
    if (!S.src) return;
    if (p.minKB >= p.maxKB) { alert(T('न्यूनतम KB, अधिकतम KB से कम होना चाहिए।', 'Minimum KB must be below maximum KB.')); return; }
    var btn = $('makeBtn');
    btn.disabled = true; btn.textContent = T('बन रहा है…', 'Working…');
    try {
      var r = await fit(p);
      showResult(p, r);
    } finally {
      btn.disabled = false; btn.textContent = T('फ़ाइल बनाएँ', 'Make the file');
    }
  }

  function showResult(p, r) {
    var box = $('result');
    box.classList.remove('hidden');
    if (!r) {
      box.innerHTML = '<p class="bad">' + esc(T('इस फोटो से इस सीमा में फ़ाइल नहीं बन पाई। दूसरी फोटो या दूसरा साइज़ आज़माएँ।', 'Could not fit this photo into that range. Try another photo or size.')) + '</p>';
      return;
    }
    if (S.url) URL.revokeObjectURL(S.url);
    S.url = URL.createObjectURL(r.blob);
    var kb = r.blob.size / 1024;
    var name = (p.id || 'file') + '-' + r.w + 'x' + r.h + '-' + Math.round(kb) + 'kb.jpg';
    var html = '<h2>' + esc(T('आपकी फ़ाइल तैयार है', 'Your file is ready')) + '</h2>';
    html += '<img alt="" src="' + S.url + '">';
    html += '<ul class="checks">';
    html += '<li class="ok">✓ JPEG (.jpg)</li>';
    html += '<li class="ok">✓ ' + r.w + '×' + r.h + ' px</li>';
    html += '<li class="ok">✓ ' + kb.toFixed(1) + ' KB (' + r.blob.size.toLocaleString('en-IN') + ' bytes) · ' + esc(T('सीमा', 'range')) + ' ' + p.minKB + '-' + p.maxKB + ' KB</li>';
    if (p.dpi) html += '<li class="ok">✓ ' + p.dpi + ' DPI</li>';
    html += '</ul>';
    if (r.changed === 'pad') html += '<p class="note">' + esc(T('इतने पिक्सेल पर सबसे अच्छी क्वालिटी में भी फ़ाइल न्यूनतम KB से छोटी थी। पिक्सेल वही रखे गए हैं और फ़ाइल के अंदर एक खाली टिप्पणी-भाग जोड़ा गया है ताकि फ़ाइल न्यूनतम KB तक पहुँचे। तस्वीर पर इसका कोई असर नहीं होता।', 'At these pixels the file was under the minimum KB even at top quality. The pixels are kept exactly, and a blank comment block was added inside the file so it reaches the minimum KB. It does not change the picture.')) + '</p>';
    if (r.changed === 'down') html += '<p class="note">' + esc(T('फ़ाइल अधिकतम KB में लाने के लिए पिक्सेल घटाए गए (' + r.w + '×' + r.h + ')।', 'The pixels were reduced (' + r.w + '×' + r.h + ') to get under the maximum KB.')) + '</p>';
    html += '<div class="btns"><a class="btn" download="' + name + '" href="' + S.url + '">' + esc(T('डाउनलोड करें', 'Download')) + '</a></div>';
    html += '<p class="small muted">' + esc(T('फ़ाइल आपके फ़ोन/कंप्यूटर में ही बनी है; कहीं भेजी नहीं गई।', 'The file was made on your own phone or computer; it was not sent anywhere.')) + '</p>';
    box.innerHTML = html;
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------- wiring ----------
  document.addEventListener('DOMContentLoaded', function () {
    fillPresets(); showInfo();
    document.addEventListener('as-lang', function () { fillPresets(); showInfo(); });
    $('preset').addEventListener('change', function () {
      S.preset = PRESETS.filter(function (p) { return p.id === $('preset').value; })[0];
      showInfo(); S.box = null; S.zoom = 100; $('zoom').value = 100; resetBox(); draw();
      $('result').classList.add('hidden');
    });
    ['cw', 'ch'].forEach(function (id) { $(id).addEventListener('change', function () { S.box = null; resetBox(); draw(); }); });
    $('file').addEventListener('change', function (e) { loadFile(e.target.files[0]); });
    $('rotate').addEventListener('click', function () { if (!S.img) return; S.rot = (S.rot + 90) % 360; S.box = null; buildSource(); });
    $('zoom').addEventListener('input', function () { S.zoom = +$('zoom').value; resetBox(); draw(); });
    $('makeBtn').addEventListener('click', make);
    var cv = $('stage');
    cv.addEventListener('pointerdown', function (e) {
      if (!S.src) return;
      var pt = pointer(e);
      S.drag = { x: pt.x, y: pt.y, bx: S.box.x, by: S.box.y };
      cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', function (e) {
      if (!S.drag) return;
      var pt = pointer(e);
      S.box.x = S.drag.bx + (pt.x - S.drag.x);
      S.box.y = S.drag.by + (pt.y - S.drag.y);
      clampBox(S.box); draw();
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) { cv.addEventListener(ev, function () { S.drag = null; }); });
    window.addEventListener('resize', draw);
  });
})();
