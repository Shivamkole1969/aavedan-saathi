// PDF compressor: a PDF, or 1-10 phone photos, becomes a PDF under a target KB. Everything runs on the phone.
// Step 1 checks the file against the chosen rule (KB, A4, pages) and says why it would fail; step 2 fixes it.
// PDF pages are drawn with pdf.js (vendored, loaded only when a PDF is chosen) and saved as JPEG pages.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  function T(hi, en) { return window.ASLang() === 'en' ? en : hi; }
  function L(o) { return o ? (o[window.ASLang()] || o.hi) : ''; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function kb(bytes) { return (bytes / 1000).toFixed(1); } // 1 KB = 1000 bytes here, the same unit as the limit

  var PDFJS = '../assets/vendor/pdfjs-6.5.438/';
  var A4 = [595.28, 841.89]; // points, portrait
  var IBPS_SRC = {
    t: 'IBPS CRP PO/MT-XVI, Detailed Notification (file dated 30.06.2026), PDF p. 41 (printed p. 38), for the SSC/SSLC/10th certificate and the Clause J(ix) certificate: "Document must be in PDF format. Page size of the document to be A4. Size of the file should not be exceeding 500 KB." Read again on 27 Nov 2026.',
    url: 'https://www.ibps.in/wp-content/uploads/Detailed-Notification_CRP-PO-XVI_Final_V1_30.06.2026.pdf'
  };
  var TARGETS = [
    { id: 'ibps-cert', kb: 500, a4: true, src: IBPS_SRC,
      label: { hi: 'IBPS PO 2026: 10वीं/SSLC का प्रमाणपत्र (A4 PDF, अधिकतम 500 KB)', en: 'IBPS PO 2026: 10th/SSLC certificate (A4 PDF, up to 500 KB)' } },
    { id: 'k100', kb: 100, label: { hi: '100 KB तक', en: 'Up to 100 KB' } },
    { id: 'k200', kb: 200, label: { hi: '200 KB तक', en: 'Up to 200 KB' } },
    { id: 'k300', kb: 300, label: { hi: '300 KB तक', en: 'Up to 300 KB' } },
    { id: 'k500', kb: 500, label: { hi: '500 KB तक', en: 'Up to 500 KB' } },
    { id: 'k1000', kb: 1000, label: { hi: '1 MB (1000 KB) तक', en: 'Up to 1 MB (1000 KB)' } },
    { id: 'custom', custom: true, label: { hi: 'अपना KB डालें', en: 'Enter your own KB' } }
  ];
  var MAX_PAGES = 30, MAX_PHOTOS = 10;
  var S = { pages: null, kind: null, name: 'document', origBytes: 0, url: null, busy: false };

  function target() {
    var t = TARGETS.filter(function (x) { return x.id === $('target').value; })[0] || TARGETS[0];
    if (t.custom) return { id: 'custom', kb: Math.max(5, parseFloat($('ckb').value) || 200), a4: $('fitA4').checked };
    return t;
  }
  // KB limit uses 1 KB = 1000 bytes, so the file also passes a portal that counts 1 KB as 1024 bytes.
  function limitBytes(t) { return Math.floor(t.kb * 1000); }

  function fillTargets() {
    var sel = $('target'), cur = sel.value;
    sel.innerHTML = '';
    TARGETS.forEach(function (t) {
      var o = document.createElement('option');
      o.value = t.id; o.textContent = L(t.label);
      sel.appendChild(o);
    });
    if (cur) sel.value = cur;
  }
  function showInfo() {
    var t = target(), box = $('info'), html = '';
    $('customBox').classList.toggle('hidden', t.id !== 'custom');
    if (t.src) {
      html = '<p class="src">' + esc(T('स्रोत (आधिकारिक अधिसूचना):', 'Source (official notification):')) +
        ' <a href="' + t.src.url + '" rel="noopener" target="_blank">' + esc(t.src.t) + '</a></p>' +
        '<p class="small">' + esc(T('यही नियम आपकी भर्ती पर लागू है या नहीं, अपनी अधिसूचना में ज़रूर देखें।', 'Check that this rule applies to your recruitment in your own notification.')) + '</p>';
    }
    else if (t.id !== 'custom') {
      html = '<p class="small muted">' + esc(T('यह आम सीमा है, किसी अधिसूचना से नहीं। अपनी अधिसूचना में सीमा देखें।', 'This is a common limit, not taken from a notification. Check the limit in your own notification.')) + '</p>';
    }
    box.innerHTML = html;
    if (S.pages) renderCheck();
  }

  // ---------- loading ----------
  var pdfjsPromise = null;
  function loadPdfjs() {
    if (!pdfjsPromise) {
      pdfjsPromise = import(PDFJS + 'pdf.min.mjs').then(function (lib) {
        lib.GlobalWorkerOptions.workerSrc = new URL(PDFJS + 'pdf.worker.min.mjs', location.href).href;
        return lib;
      });
    }
    return pdfjsPromise;
  }
  function readBytes(file) {
    return new Promise(function (ok, bad) {
      var r = new FileReader();
      r.onload = function () { ok(new Uint8Array(r.result)); };
      r.onerror = function () { bad(r.error); };
      r.readAsArrayBuffer(file);
    });
  }
  function loadImage(file) {
    return new Promise(function (ok, bad) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { ok(img); };
      img.onerror = function () { URL.revokeObjectURL(url); bad(new Error('image')); };
      img.src = url;
    });
  }
  function isPdf(f) { return f.type === 'application/pdf' || /\.pdf$/i.test(f.name); }

  async function loadFiles(list) {
    var files = Array.prototype.slice.call(list || []);
    if (!files.length) return;
    resetResult();
    S.pages = null;
    $('check').innerHTML = '<p class="small muted">' + esc(T('फ़ाइल खुल रही है…', 'Opening the file…')) + '</p>';
    $('check').classList.remove('hidden');
    try {
      if (files.length === 1 && isPdf(files[0])) await loadPdf(files[0]);
      else await loadPhotos(files);
    } catch (e) {
      var msg = e && e.name === 'PasswordException'
        ? T('यह PDF पासवर्ड से बंद है (जैसे DigiLocker या बैंक की फ़ाइल)। पहले पासवर्ड हटाकर नई PDF सेव करें, फिर यहाँ डालें।', 'This PDF is locked with a password (for example a DigiLocker or bank file). Save a copy without the password first, then add it here.')
        : (e && e.message === 'mixed')
          ? T('एक बार में या तो एक PDF चुनें, या 1-10 फ़ोटो। दोनों साथ नहीं।', 'Choose either one PDF or 1-10 photos at a time, not both.')
          : (e && e.message === 'many')
            ? T('एक बार में ज़्यादा से ज़्यादा ' + MAX_PHOTOS + ' फ़ोटो चुनें।', 'Choose at most ' + MAX_PHOTOS + ' photos at a time.')
          : (e && e.message === 'pages')
            ? T('इस PDF में ' + MAX_PAGES + ' से ज़्यादा पेज हैं। सिर्फ़ ज़रूरी पेज वाली PDF बनाकर डालें।', 'This PDF has more than ' + MAX_PAGES + ' pages. Make a PDF with only the pages you need.')
            : T('यह फ़ाइल खुल नहीं रही। PDF, JPG या PNG चुनें।', 'This file could not be opened. Choose a PDF, JPG or PNG.');
      $('check').innerHTML = '<ul class="checks"><li class="bad">✗ ' + esc(msg) + '</li></ul>';
      return;
    }
    renderCheck();
  }

  async function loadPdf(file) {
    var lib = await loadPdfjs();
    var data = await readBytes(file);
    S.origBytes = data.length;
    S.name = file.name.replace(/\.pdf$/i, '') || 'document';
    var doc = await lib.getDocument({
      data: data,
      wasmUrl: new URL(PDFJS + 'wasm/', location.href).href,
      iccUrl: new URL(PDFJS + 'iccs/', location.href).href,
      standardFontDataUrl: new URL(PDFJS + 'standard_fonts/', location.href).href,
      enableXfa: false
    }).promise;
    if (doc.numPages > MAX_PAGES) throw new Error('pages');
    var pages = [];
    for (var i = 1; i <= doc.numPages; i++) {
      var page = await doc.getPage(i), vp = page.getViewport({ scale: 1 });
      pages.push({ pt: [vp.width, vp.height], page: page });
    }
    S.kind = 'pdf';
    S.pages = pages;
  }

  async function loadPhotos(files) {
    if (files.some(isPdf)) throw new Error('mixed');
    if (files.length > MAX_PHOTOS) throw new Error('many');
    var pages = [], total = 0;
    for (var i = 0; i < files.length; i++) {
      var img = await loadImage(files[i]);
      total += files[i].size;
      pages.push({ pt: null, img: img, w: img.naturalWidth, h: img.naturalHeight });
    }
    S.origBytes = total;
    S.name = (files[0].name.replace(/\.[a-z0-9]+$/i, '') || 'photos');
    S.kind = 'img';
    S.pages = pages;
  }

  // ---------- step 1: will it be accepted? ----------
  function isA4(pt) {
    var w = Math.min(pt[0], pt[1]), h = Math.max(pt[0], pt[1]);
    return Math.abs(w - A4[0]) / A4[0] < 0.02 && Math.abs(h - A4[1]) / A4[1] < 0.02;
  }
  function mm(pt) { return Math.round(pt[0] / 72 * 25.4) + '×' + Math.round(pt[1] / 72 * 25.4) + ' mm'; }

  function renderCheck() {
    var t = target(), lim = limitBytes(t), items = [], allOk = true;
    if (S.kind === 'pdf') {
      items.push(['ok', T('फ़ाइल PDF है, ' + S.pages.length + ' पेज।', 'The file is a PDF, ' + S.pages.length + ' page(s).')]);
      var under = S.origBytes <= lim;
      items.push([under ? 'ok' : 'bad', under
        ? T('साइज़ ' + kb(S.origBytes) + ' KB है, सीमा ' + t.kb + ' KB के अंदर।', 'Size is ' + kb(S.origBytes) + ' KB, inside the ' + t.kb + ' KB limit.')
        : T('साइज़ ' + kb(S.origBytes) + ' KB है, सीमा ' + t.kb + ' KB है। यह सीमा से ज़्यादा है। नीचे "छोटा करें" दबाएँ।', 'Size is ' + kb(S.origBytes) + ' KB, the limit is ' + t.kb + ' KB. It is over the limit. Press "Make it smaller" below.')]);
      if (!under) allOk = false;
      if (t.a4) {
        var bad = S.pages.filter(function (p) { return !isA4(p.pt); });
        items.push([bad.length ? 'bad' : 'ok', bad.length
          ? T(bad.length + ' पेज A4 नहीं है (जैसे ' + mm(bad[0].pt) + ')। नियम A4 माँगता है; "छोटा करें" हर पेज को A4 पर रख देगा।', bad.length + ' page(s) are not A4 (for example ' + mm(bad[0].pt) + '). The rule asks for A4; "Make it smaller" puts every page on A4.')
          : T('हर पेज A4 है (210×297 mm)।', 'Every page is A4 (210×297 mm).')]);
        if (bad.length) allOk = false;
      }
    } else {
      items.push(['bad', T(S.pages.length + ' फ़ोटो चुनी गईं। फॉर्म PDF माँगता है, इसलिए इन्हें A4 PDF में बदला जाएगा (हर फ़ोटो एक पेज)।', S.pages.length + ' photo(s) chosen. The form asks for a PDF, so they become an A4 PDF (one photo per page).')]);
      allOk = false;
    }
    var html = '<h2>' + esc(T('जाँच: फ़ाइल का साइज़ और पेज', 'Check: file size and page size')) + '</h2><ul class="checks">';
    items.forEach(function (it) { html += '<li class="' + it[0] + '">' + (it[0] === 'ok' ? '✓ ' : '✗ ') + esc(it[1]) + '</li>'; });
    html += '</ul>';
    if (allOk) html += '<p class="small"><b>' + esc(T('साइज़ और पेज पहले से इस सीमा के अंदर हैं, बदलने की ज़रूरत नहीं। फिर भी छोटा करना हो तो नीचे दबाएँ।', 'Size and page size are already within this limit; no change is needed. You can still make it smaller below.')) + '</b></p>';
    $('check').innerHTML = html;
    $('check').classList.remove('hidden');
    $('fitRow').classList.toggle('hidden', S.kind !== 'pdf');
    if (t.a4 && S.kind === 'pdf') $('fitA4').checked = true;
    $('go').disabled = false;
  }

  // ---------- step 2: make it smaller ----------
  // Output page size: photos always on A4 (portrait or landscape to match the photo); PDF pages keep their size unless "fit to A4".
  function outPt(p) {
    if (S.kind === 'img') return p.w > p.h ? [A4[1], A4[0]] : A4.slice();
    if ($('fitA4').checked && !isA4(p.pt)) return p.pt[0] > p.pt[1] ? [A4[1], A4[0]] : A4.slice();
    return p.pt;
  }

  async function drawPage(p, dpi, gray) {
    var pt = outPt(p), scale = dpi / 72;
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(pt[0] * scale));
    c.height = Math.max(1, Math.round(pt[1] * scale));
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    if (S.kind === 'img') {
      var m = Math.round(c.width * 0.04), fw = c.width - 2 * m, fh = c.height - 2 * m;
      var r = Math.min(fw / p.w, fh / p.h), dw = p.w * r, dh = p.h * r;
      ctx.drawImage(p.img, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
    } else if (pt === p.pt) {
      await p.page.render({ canvasContext: ctx, viewport: p.page.getViewport({ scale: scale }), background: '#ffffff' }).promise;
    } else {
      var fit = Math.min(pt[0] / p.pt[0], pt[1] / p.pt[1]) * scale;
      var vp = p.page.getViewport({ scale: fit });
      var tmp = document.createElement('canvas');
      tmp.width = Math.round(vp.width); tmp.height = Math.round(vp.height);
      await p.page.render({ canvasContext: tmp.getContext('2d'), viewport: vp, background: '#ffffff' }).promise;
      ctx.drawImage(tmp, (c.width - tmp.width) / 2, (c.height - tmp.height) / 2);
      tmp.width = tmp.height = 0;
    }
    if (gray) toGray(ctx, c.width, c.height);
    return c;
  }
  // Grey + whiter paper: scanner grain on the paper costs many bytes, so near-white turns white and the ink is kept.
  function toGray(ctx, w, h) {
    var d = ctx.getImageData(0, 0, w, h), a = d.data;
    for (var i = 0; i < a.length; i += 4) {
      var y = (a[i] * 299 + a[i + 1] * 587 + a[i + 2] * 114) / 1000;
      y = y >= 190 ? 255 : y;
      a[i] = a[i + 1] = a[i + 2] = y;
    }
    ctx.putImageData(d, 0, 0);
  }
  function jpeg(c, q) {
    return new Promise(function (ok) {
      c.toBlob(function (b) { b.arrayBuffer().then(function (buf) { ok(new Uint8Array(buf)); }); }, 'image/jpeg', q);
    });
  }
  async function encodeAll(canvases, pts, q) {
    var pages = [];
    for (var i = 0; i < canvases.length; i++) {
      pages.push({ jpeg: await jpeg(canvases[i], q), px: [canvases[i].width, canvases[i].height], pt: pts[i] });
    }
    var bytes = window.ASPdfWrite.build(pages);
    return { bytes: bytes, q: q, first: pages[0].jpeg };
  }

  // Highest resolution first; at high resolution JPEG quality may not drop below 0.5 (text gets blotchy), lower down it may go to 0.3.
  var LADDER = [[150, 0.5], [120, 0.5], [100, 0.45], [85, 0.4], [72, 0.35], [60, 0.3]];
  async function compress(lim, gray, progress) {
    var pts = S.pages.map(outPt), smallest = null;
    for (var s = 0; s < LADDER.length; s++) {
      var dpi = LADDER[s][0], qMin = LADDER[s][1];
      progress(T('काम चल रहा है… ' + dpi + ' DPI पर', 'Working… trying ' + dpi + ' DPI'));
      var canv = [];
      for (var i = 0; i < S.pages.length; i++) canv.push(await drawPage(S.pages[i], dpi, gray));
      var found = null, r = await encodeAll(canv, pts, 0.85);
      if (r.bytes.length <= lim) found = r;
      else {
        r = await encodeAll(canv, pts, qMin);
        if (!smallest || r.bytes.length < smallest.bytes.length) smallest = Object.assign(r, { dpi: dpi });
        if (r.bytes.length <= lim) {
          found = r;
          var lo = qMin, hi = 0.85;
          for (var k = 0; k < 5; k++) {
            var mid = (lo + hi) / 2, m = await encodeAll(canv, pts, mid);
            if (m.bytes.length <= lim) { found = m; lo = mid; } else hi = mid;
          }
        }
      }
      canv.forEach(function (c) { c.width = c.height = 0; });
      if (found) return Object.assign(found, { dpi: dpi, ok: true, pts: pts });
    }
    return Object.assign(smallest, { ok: false, pts: pts });
  }

  function resetResult() {
    if (S.url) { URL.revokeObjectURL(S.url); S.url = null; }
    $('result').classList.add('hidden');
    $('result').innerHTML = '';
  }

  async function run() {
    if (!S.pages || S.busy) return;
    var t = target(), lim = limitBytes(t), gray = $('gray').checked;
    S.busy = true; $('go').disabled = true; resetResult();
    var box = $('result');
    box.classList.remove('hidden');
    box.innerHTML = '<p id="prog" class="small muted"></p>';
    try {
      var r = await compress(lim, gray, function (msg) { var p = $('prog'); if (p) p.textContent = msg; });
      showResult(r, t, lim, gray);
    } catch (e) {
      box.innerHTML = '<ul class="checks"><li class="bad">✗ ' + esc(T('फ़ाइल नहीं बन पाई। कम पेज या छोटी फ़ोटो के साथ फिर कोशिश करें।', 'The file could not be made. Try again with fewer pages or smaller photos.')) + '</li></ul>';
    }
    S.busy = false; $('go').disabled = false;
  }

  function showResult(r, t, lim, gray) {
    var size = r.bytes.length, html = '', box = $('result');
    var blob = new Blob([r.bytes], { type: 'application/pdf' });
    S.url = URL.createObjectURL(blob);
    var name = S.name.replace(/[^\wऀ-ॿ-]+/g, '-').slice(0, 40) + '-' + Math.ceil(size / 1000) + 'kb.pdf';
    if (r.ok) {
      html += '<h2>' + esc(T('तैयार: फिर से जाँच', 'Ready: checked again')) + '</h2><ul class="checks">';
      html += '<li class="ok">✓ ' + kb(size) + ' KB (' + size.toLocaleString('en-IN') + ' bytes) · ' + esc(T('सीमा', 'limit')) + ' ' + t.kb + ' KB</li>';
      if (t.a4 || S.kind === 'img') {
        var allA4 = r.pts.every(isA4);
        html += '<li class="' + (allA4 ? 'ok' : 'bad') + '">' + (allA4 ? '✓ ' : '✗ ') + esc(allA4 ? T('हर पेज A4', 'Every page is A4') : T('कुछ पेज A4 नहीं हैं; "हर पेज A4 पर रखें" चुनें', 'Some pages are not A4; tick "Put every page on A4"')) + '</li>';
      }
      html += '<li class="ok">✓ ' + esc(T(r.pts.length + ' पेज · ' + r.dpi + ' DPI', r.pts.length + ' page(s) · ' + r.dpi + ' DPI')) + '</li></ul>';
      if (r.dpi < 100) html += '<p class="small"><b>' + esc(T('रिज़ॉल्यूशन कम है: छोटे अक्षर पढ़ने में मुश्किल हो सकते हैं। IBPS जैसे फॉर्म साफ़ और पढ़ने लायक दस्तावेज़ माँगते हैं। हो सके तो कम पेज रखें।', 'Low resolution: small print may be hard to read. Forms such as IBPS ask for clear, readable documents. Keep fewer pages if you can.')) + '</b></p>';
      if (S.kind === 'pdf' && S.origBytes <= lim && size >= S.origBytes) {
        html += '<p class="small"><b>' + esc(T('आपकी मूल फ़ाइल (' + kb(S.origBytes) + ' KB) इससे छोटी है और नियम के अंदर है। मूल फ़ाइल ही अपलोड करें।', 'Your original file (' + kb(S.origBytes) + ' KB) is smaller and already within the rule. Upload the original.')) + '</b></p>';
      }
    } else {
      html += '<ul class="checks"><li class="bad">✗ ' + esc(T('इतना छोटा करने पर पढ़ना मुश्किल हो जाएगा। सबसे छोटी फ़ाइल ' + kb(size) + ' KB बनी, सीमा ' + t.kb + ' KB है।', 'Going this small would make it hard to read. The smallest file was ' + kb(size) + ' KB; the limit is ' + t.kb + ' KB.')) + '</li></ul>';
      html += '<p class="small">' + esc(gray
        ? T('कम पेज रखें (सिर्फ़ ज़रूरी पेज), या फ़ोटो पास से और सिर्फ़ कागज़ की लें।', 'Keep fewer pages (only the ones needed), or photograph the paper closer so it fills the photo.')
        : T('कम पेज रखें, या ऊपर "ग्रे + सफ़ेद कागज़" चुनकर फिर कोशिश करें।', 'Keep fewer pages, or tick "Grey + white paper" above and try again.')) + '</p>';
    }
    html += '<img alt="" src="' + URL.createObjectURL(new Blob([r.first], { type: 'image/jpeg' })) + '">';
    html += '<div class="btns"><a class="btn" download="' + esc(name) + '" href="' + S.url + '">' + esc(r.ok ? T('PDF डाउनलोड करें', 'Download the PDF') : T('फिर भी डाउनलोड करें', 'Download anyway')) + '</a></div>';
    html += '<div class="note small">' + esc(T('ध्यान दें: नई PDF में हर पेज एक फ़ोटो बन जाता है, इसलिए टेक्स्ट सेलेक्ट या कॉपी नहीं होगा। अपलोड से पहले फ़ाइल खोलकर देखें कि नाम, अंक और मुहर साफ़ पढ़ी जा रही हैं। डिजिटल हस्ताक्षर (जैसे DigiLocker) हट जाते हैं और QR कोड पढ़ने में मुश्किल हो सकती है; अगर फॉर्म मूल साइन की हुई PDF माँगता है, तो वही अपलोड करें।', 'Note: every page of the new PDF becomes an image, so text can no longer be selected or copied. Open the file before you upload it and check that names, marks and stamps are clearly readable. Digital signatures (such as DigiLocker) are removed and QR codes can become hard to read; if the form wants the original signed PDF, upload that.')) + '</div>';
    box.innerHTML = html;
  }

  // For tests: compress files without the file picker.
  window.ASCompress = {
    load: loadFiles,
    run: function (targetId, kbValue, gray, fitA4) {
      $('target').value = targetId; if (kbValue) $('ckb').value = kbValue;
      $('gray').checked = !!gray; if (fitA4 !== undefined) $('fitA4').checked = fitA4;
      return compress(limitBytes(target()), !!gray, function () {});
    },
    state: S
  };

  document.addEventListener('DOMContentLoaded', function () {
    fillTargets(); showInfo();
    $('target').addEventListener('change', showInfo);
    $('ckb').addEventListener('input', function () { if (S.pages) renderCheck(); });
    $('file').addEventListener('change', function (e) { loadFiles(e.target.files); });
    $('go').addEventListener('click', run);
  });
  document.addEventListener('as-lang', function () { fillTargets(); showInfo(); });
})();
