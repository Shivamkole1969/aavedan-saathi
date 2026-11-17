// Typing test: timer, key-depression count and an SSC-rule scorecard (see score.js).
// Hindi can be typed in Unicode (the device's own Hindi keyboard) or Krutidev mode: English keys typed
// the Kruti Dev way, kept as raw keys in S.raw and shown as Unicode (krutidev.js).
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var S = { lang: 'hi', idx: 0, mins: 10, start: 0, timer: null, done: false, keys: 0, passage: '', kbd: 'uni', raw: '', custom: '', shift: false };
  var CUSTOM_KEY = 'as-custom-passage';
  var TOUCH = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  function T(hi, en) { return window.ASLang() === 'en' ? en : hi; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function list() { return window.AS_PASSAGES[S.lang]; }
  function kdMode() { return S.lang === 'hi' && S.kbd === 'kd'; }

  function fillPassages() {
    var sel = $('passage'), keep = sel.value;
    sel.innerHTML = '';
    list().forEach(function (p, i) {
      var o = document.createElement('option'); o.value = i; o.textContent = p.title; sel.appendChild(o);
    });
    var c = document.createElement('option'); c.value = 'custom'; c.textContent = T('अपना पाठ (पेस्ट करें)', 'Your own passage (paste)'); sel.appendChild(c);
    if (keep === 'custom' || (keep && +keep < list().length)) sel.value = keep;
    S.idx = sel.value === 'custom' ? 'custom' : (+sel.value || 0);
    $('customBox').classList.toggle('hidden', S.idx !== 'custom');
  }

  function text() {
    if (S.idx === 'custom') return S.custom || T('ऊपर अपना पाठ पेस्ट करें और "इस पाठ से टेस्ट तैयार करें" दबाएँ।', 'Paste your passage above and press "Use this passage".');
    var L = list(), t = L[S.idx].text;
    // 10 and 15-minute tests get a second passage so a fast typist does not run out.
    if (S.mins >= 10) t += ' ' + L[(S.idx + 1) % L.length].text;
    return t;
  }

  function reset() {
    clearInterval(S.timer);
    S.start = 0; S.done = false; S.keys = 0; S.timer = null; S.raw = '';
    S.passage = text();
    $('passageBox').textContent = S.passage;
    var box = $('typebox');
    box.value = ''; box.disabled = S.idx === 'custom' && !S.custom;
    box.setAttribute('lang', S.lang === 'hi' ? 'hi' : 'en');
    // on phones the Krutidev keys come from our own keyboard, so keep the system keyboard closed
    if (kdMode() && TOUCH) box.setAttribute('inputmode', 'none'); else box.removeAttribute('inputmode');
    $('timer').textContent = fmt(S.mins * 60);
    $('report').classList.add('hidden');
    $('kbdBox').classList.toggle('hidden', S.lang !== 'hi');
    $('hiHelp').classList.toggle('hidden', S.lang !== 'hi' || kdMode());
    $('kdHelp').classList.toggle('hidden', !kdMode());
    $('layoutSrc').classList.toggle('hidden', S.lang !== 'hi');
    $('oskWrap').classList.toggle('hidden', !kdMode());
  }

  function fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }

  function startClock() { if (!S.start) { S.start = Date.now(); S.timer = setInterval(tick, 250); } }

  function tick() {
    var left = S.mins * 60 - (Date.now() - S.start) / 1000;
    $('timer').textContent = fmt(left);
    if (left <= 0) finish();
  }

  function finish() {
    if (S.done) return;
    S.done = true;
    clearInterval(S.timer);
    var box = $('typebox');
    box.disabled = true;
    var secs = S.start ? Math.min(S.mins * 60, (Date.now() - S.start) / 1000) : 0;
    report(box.value, secs);
  }

  // ---- Krutidev mode ----
  function kdShow() {
    var box = $('typebox');
    box.value = window.ASKruti.toUnicode(S.raw);
    box.selectionStart = box.selectionEnd = box.value.length;
    box.scrollTop = box.scrollHeight;
  }
  function kdType(ch) {
    if (S.done || $('typebox').disabled) return;
    startClock();
    S.raw += ch;
    kdShow();
  }
  function kdBack(word) {
    if (S.done || $('strict').checked) return;
    S.raw = word ? S.raw.replace(/\S*\s*$/, '') : S.raw.slice(0, -1);
    kdShow();
  }
  var NAV = /^(Delete|ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home|End|PageUp|PageDown)$/;
  function kdKeydown(e) {
    if (e.altKey || e.isComposing || e.keyCode === 229) return;      // Alt codes and phone keyboards arrive as beforeinput
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'Backspace') { e.preventDefault(); kdBack(true); }
      return;
    }
    if (e.key === 'Backspace') { e.preventDefault(); kdBack(false); flash('Backspace'); return; }
    if (e.key === 'Enter') { e.preventDefault(); kdType('\n'); return; }
    if (e.key === 'Tab') { e.preventDefault(); kdType('\t'); return; }
    if (NAV.test(e.key)) { e.preventDefault(); return; }
    if (e.key.length === 1) { e.preventDefault(); kdType(e.key); flash(e.key); }
  }
  function kdBeforeInput(e) {
    var t = e.inputType || '';
    if (t === 'insertText' && e.data) { e.preventDefault(); for (var i = 0; i < e.data.length; i++) kdType(e.data[i]); }
    else if (t === 'insertLineBreak' || t === 'insertParagraph') { e.preventDefault(); kdType('\n'); }
    else if (/^delete/.test(t)) { e.preventDefault(); kdBack(t === 'deleteWordBackward'); }
  }

  // on-screen Krutidev keyboard: each key shows the Hindi it types (shifted glyph top-left)
  var ROWS = [['`1234567890-=', '~!@#$%^&*()_+'], ['qwertyuiop[]\\', 'QWERTYUIOP{}|'], ["asdfghjkl;'", 'ASDFGHJKL:"'], ['zxcvbnm,./', 'ZXCVBNM<>?']];
  function glyph(ch) {
    var g = window.ASKruti.toUnicode(ch);
    return /^[\u0900-\u0903\u093A-\u094F\u0962\u0963]/.test(g) ? '◌' + g : g;
  }
  function buildOsk() {
    var osk = $('osk'), html = '';
    ROWS.forEach(function (r) {
      html += '<div class="krow">';
      for (var i = 0; i < r[0].length; i++) {
        var n = r[0][i], s = r[1][i];
        html += '<button type="button" data-n="' + esc(n) + '" data-s="' + esc(s) + '"><span class="s">' + esc(glyph(s)) + '</span><span class="k">' + esc(n.toUpperCase()) + '</span><span class="n">' + esc(glyph(n)) + '</span></button>';
      }
      html += '</div>';
    });
    html += '<div class="krow"><button type="button" class="wide" data-act="shift">Shift</button><button type="button" class="wide space" data-act="space">' + esc(T('स्पेस', 'Space')) + '</button><button type="button" class="wide" data-act="back">⌫</button></div>';
    osk.innerHTML = html;
  }
  function oskPress(btn) {
    var act = btn.getAttribute('data-act');
    if (act === 'shift') { S.shift = !S.shift; }
    else if (act === 'space') kdType(' ');
    else if (act === 'back') kdBack(false);
    else { kdType(btn.getAttribute(S.shift ? 'data-s' : 'data-n')); S.shift = false; }
    $('osk').classList.toggle('shift', S.shift);
    var sb = $('osk').querySelector('[data-act="shift"]');
    if (sb) sb.classList.toggle('on', S.shift);
    if (!TOUCH) $('typebox').focus();
  }
  function flash(key) {
    var b = key === 'Backspace' ? $('osk').querySelector('[data-act="back"]') : key === ' ' ? $('osk').querySelector('[data-act="space"]') :
      $('osk').querySelector('[data-n="' + cssq(key) + '"]') || $('osk').querySelector('[data-s="' + cssq(key) + '"]');
    if (!b) return;
    b.classList.add('hit');
    setTimeout(function () { b.classList.remove('hit'); }, 160);
  }
  function cssq(k) { return k.replace(/["\\]/g, '\\$&'); }

  // ---- your own passage ----
  function readCustom(src) {
    var t = String(src || '').replace(/\s+/g, ' ').trim(), hint = '';
    if (!t) return { text: '', hint: '' };
    if (window.ASKruti.looksKrutidev(t)) { t = window.ASKruti.toUnicode(t); hint = T('कृतिदेव टेक्स्ट मिला, उसे यूनिकोड हिंदी में बदल दिया।', 'Krutidev text found and converted to Unicode Hindi.'); }
    var lang = /[\u0900-\u097F]/.test(t) ? 'hi' : 'en';
    return { text: t, hint: hint, lang: lang };
  }
  function useCustom(src) {
    var r = readCustom(src);
    S.custom = r.text;
    $('customHint').textContent = r.text ? (r.hint ? r.hint + ' ' : '') + T(r.text.split(' ').length + ' शब्द।', r.text.split(' ').length + ' words.') : '';
    if (r.text && r.lang !== S.lang) { S.lang = r.lang; $('lang').value = r.lang; fillPassages(); }
    $('passage').value = 'custom'; S.idx = 'custom';
    $('customBox').classList.remove('hidden');
    reset();
  }

  function report(typed, secs) {
    var r = window.ASScore.score(S.passage, typed, S.lang);
    var mins = Math.max(secs / 60, 1 / 60);
    // key depressions: in Krutidev mode the keys actually pressed, otherwise characters
    var chars = (kdMode() ? S.raw : typed).replace(/\s+$/, '').length;
    var gross = chars / 5 / mins;
    var errPerMin = (r.full + r.half / 2) / mins;
    var net = Math.max(0, gross - errPerMin);
    var kdph = chars / mins * 60;
    var pct = r.typedWords ? (r.full + r.half / 2) / r.typedWords * 100 : 0;
    var target = S.lang === 'hi' ? 30 : 35;
    var html = '<h2>' + esc(T('आपका परिणाम', 'Your result')) + '</h2>';
    html += '<div class="stats">' +
      stat(Math.round(gross), T('ग्रॉस स्पीड (wpm)', 'Gross speed (wpm)')) +
      stat(Math.round(net), T('नेट स्पीड (wpm)', 'Net speed (wpm)')) +
      stat(r.full, T('पूरी गलतियाँ', 'Full mistakes')) +
      stat(r.half, T('आधी गलतियाँ', 'Half mistakes')) +
      stat(Math.round(kdph).toLocaleString('en-IN'), T('की-डिप्रेशन / घंटा', 'Key depressions / hour')) +
      stat(pct.toFixed(2) + '%', T('गलती प्रतिशत', 'Mistake %')) +
      stat(r.typedWords, T('टाइप किए शब्द', 'Words typed')) +
      stat(fmt(secs), T('समय', 'Time')) + '</div>';
    html += '<p class="small">' + esc(T(
      'SSC CHSL (LDC/JSA) लक्ष्य: अंग्रेज़ी 35 wpm (लगभग 10,500 की-डिप्रेशन/घंटा), हिंदी 30 wpm (लगभग 9,000/घंटा), 10 मिनट। आपका लक्ष्य (' + target + ' wpm) से तुलना: ' + (gross >= target ? 'ग्रॉस स्पीड लक्ष्य से ऊपर है।' : 'ग्रॉस स्पीड अभी लक्ष्य से कम है।'),
      'SSC CHSL (LDC/JSA) target: English 35 wpm (about 10,500 key depressions/hour), Hindi 30 wpm (about 9,000/hour), 10 minutes. Against your target (' + target + ' wpm): ' + (gross >= target ? 'your gross speed is above it.' : 'your gross speed is still below it.'))) + '</p>';
    html += '<p class="small muted">' + esc(T(
      'कैसे गिना: 5 की-डिप्रेशन (स्पेस सहित) = 1 शब्द' + (kdMode() ? '; कृतिदेव मोड में की-डिप्रेशन = आपकी दबाई कुंजियाँ, जो पाठ में बचीं' : '; यूनिकोड मोड में हर अक्षर = 1 की-डिप्रेशन') + '। नेट स्पीड = ग्रॉस स्पीड − प्रति मिनट गलतियाँ (आम तरीका, SSC का आधिकारिक सूत्र नहीं)। गलती % = (पूरी + ½ आधी) ÷ टाइप किए शब्द × 100 (हमारा सूत्र)। SSC नोटिस में पास होने का गलती-प्रतिशत नहीं दिया है, इसलिए हम पास/फेल नहीं बताते।',
      'How we count: 5 key depressions (with spaces) = 1 word' + (kdMode() ? '; in Krutidev mode a key depression is a key you pressed that stayed in the text' : '; in Unicode mode each character counts as 1 key depression') + '. Net speed = gross speed − mistakes per minute (common practice, not an official SSC formula). Mistake % = (full + ½ half) ÷ words typed × 100 (our formula). The SSC notice gives no pass percentage for mistakes, so we do not say pass or fail.')) + '</p>';
    if (r.mistakes.length) {
      html += '<h2>' + esc(T('गलतियों की सूची', 'List of mistakes')) + '</h2><div class="tablewrap"><table><tr><th>' +
        esc(T('पाठ में', 'In the passage')) + '</th><th>' + esc(T('आपने लिखा', 'You typed')) + '</th><th>' + esc(T('प्रकार', 'Type')) + '</th></tr>';
      r.mistakes.forEach(function (m) {
        var half = m.cost < 1 || m.type === 'capitalisation+punctuation';
        html += '<tr><td>' + esc(m.want || '—') + '</td><td>' + esc(m.got || '—') + '</td><td class="' + (half ? 'tag-half' : 'tag-full') + '">' + esc(label(m.type)) + '</td></tr>';
      });
      html += '</table></div>';
    } else if (r.typedWords) {
      html += '<p class="ok">' + esc(T('कोई गलती नहीं मिली।', 'No mistakes found.')) + '</p>';
    }
    html += '<p class="src">' + esc(T('गलतियों के नियम: SSC, "Revised guidelines for evaluation of typing test/DEST scripts (English/Hindi)", 20.06.2022: ', 'Mistake rules: SSC, "Revised guidelines for evaluation of typing test/DEST scripts (English/Hindi)", 20.06.2022: ')) +
      '<a href="https://sscer.org/matter/TypeDEST_Guidelines_20062022" target="_blank" rel="noopener">sscer.org</a>. ' +
      esc(T('गति के लक्ष्य: ', 'Speed targets: ')) + '<a href="https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_chsl_2025.pdf" target="_blank" rel="noopener">SSC CHSL 2025</a> ' + esc(T('नोटिस (23.06.2025), पैरा 13.8.13.6-7।', 'notice (23.06.2025), paras 13.8.13.6-7.')) + '</p>';
    html += '<div class="btns"><button class="btn" type="button" id="again">' + esc(T('फिर से टेस्ट दें', 'Take the test again')) + '</button></div>';
    var box = $('report');
    box.innerHTML = html;
    box.classList.remove('hidden');
    $('again').addEventListener('click', function () { reset(); $('typebox').focus(); });
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function stat(v, l) { return '<div class="stat"><b>' + esc(v) + '</b>' + esc(l) + '</div>'; }

  function label(t) {
    var hi = { omission: 'पूरी: शब्द छूटा', addition: 'पूरी: शब्द जोड़ा', repetition: 'पूरी: शब्द दोहराया', spelling: 'पूरी: वर्तनी', substitution: 'पूरी: गलत शब्द', incomplete: 'पूरी: अधूरा शब्द',
      spacing: 'आधी: स्पेस', capitalisation: 'आधी: कैपिटल', punctuation: 'आधी: विराम चिह्न', transposition: 'आधी: शब्दों का क्रम', 'capitalisation+punctuation': '2 × आधी: कैपिटल + विराम चिह्न' };
    var en = { omission: 'Full: word left out', addition: 'Full: word added', repetition: 'Full: word repeated', spelling: 'Full: spelling', substitution: 'Full: wrong word', incomplete: 'Full: incomplete word',
      spacing: 'Half: spacing', capitalisation: 'Half: capitalisation', punctuation: 'Half: punctuation', transposition: 'Half: words swapped', 'capitalisation+punctuation': '2 × half: capital + punctuation' };
    return (window.ASLang() === 'en' ? en : hi)[t] || t;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(location.search);
    fillPassages(); buildOsk(); reset();
    if (params.get('custom') === '1') {
      var saved = '';
      try { saved = localStorage.getItem(CUSTOM_KEY) || ''; } catch (e) {}
      $('customText').value = saved;
      if (saved) useCustom(saved);
    }
    if (params.get('kbd') === 'kd') { $('kbd').value = 'kd'; S.kbd = 'kd'; reset(); }
    $('lang').addEventListener('change', function () { S.lang = $('lang').value; $('passage').value = '0'; fillPassages(); reset(); });
    $('passage').addEventListener('change', function () { S.idx = $('passage').value === 'custom' ? 'custom' : +$('passage').value; $('customBox').classList.toggle('hidden', S.idx !== 'custom'); reset(); });
    $('mins').addEventListener('change', function () { S.mins = +$('mins').value; reset(); });
    $('kbd').addEventListener('change', function () { S.kbd = $('kbd').value; reset(); });
    $('useCustom').addEventListener('click', function () { useCustom($('customText').value); $('typebox').focus(); });
    $('restart').addEventListener('click', function () { reset(); $('typebox').focus(); });
    $('submit').addEventListener('click', function () { if (S.start) finish(); });
    $('oskToggle').addEventListener('click', function () {
      var hide = !$('osk').classList.contains('hidden');
      $('osk').classList.toggle('hidden', hide);
      $('oskToggle').textContent = hide ? T('कृतिदेव कीबोर्ड दिखाएँ', 'Show the Krutidev keyboard') : T('कृतिदेव कीबोर्ड छिपाएँ', 'Hide the Krutidev keyboard');
    });
    // pointerdown keeps focus in the text box and reacts at once on phones
    $('osk').addEventListener('pointerdown', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      e.preventDefault();
      oskPress(b);
    });
    document.addEventListener('as-lang', function () { fillPassages(); buildOsk(); });
    var box = $('typebox');
    box.addEventListener('paste', function (e) { e.preventDefault(); });
    box.addEventListener('drop', function (e) { e.preventDefault(); });
    box.addEventListener('keydown', function (e) {
      if (S.done) return;
      if (kdMode()) { kdKeydown(e); return; }
      if (e.key === 'Backspace' && $('strict').checked) { e.preventDefault(); return; }
      if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '\t'); }
    });
    box.addEventListener('beforeinput', function (e) {
      if (S.done) return;
      if (kdMode()) { kdBeforeInput(e); return; }
      // phone keyboards report Backspace here rather than as a key press
      if ($('strict').checked && /^delete/.test(e.inputType || '')) e.preventDefault();
    });
    box.addEventListener('input', function () {
      if (S.done) return;
      if (kdMode()) { kdShow(); return; }      // undo anything that slipped past (cut, composition)
      startClock();
    });
  });
})();
