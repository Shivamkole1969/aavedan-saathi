// Kruti Dev 010 <-> Unicode Hindi. Written for Aavedan Saathi (no third-party code).
// Kruti Dev is a legacy font: plain ASCII codes that the font draws as Devanagari glyphs,
// typed on an English keyboard. Two glyphs sit on the "wrong" side of the letter:
//   f = short-i matra, typed BEFORE the consonant cluster;   Z = reph (र् on top), typed AFTER the syllable.
// toUnicode() tokenises by longest match, then moves those two to Unicode order; toKrutidev() does the reverse.
(function (root) {
  var PRE_I = '', PRE_IM = '', PRE_RI = '', PRE_RIM = '', REPH = '';
  var NUKTA = '़', HAL = '्';

  // [Kruti Dev, Unicode]. Later rows win in the Unicode -> Kruti Dev direction, so the preferred
  // spelling of each Unicode piece is listed last.
  var PAIRS = [
    // independent vowels
    ['v', 'अ'], ['vk', 'आ'], ['b', 'इ'], ['Ã', 'ई'], ['bZ', 'ई'], ['b±', 'ईं'], ['m', 'उ'], ['Å', 'ऊ'], ['_', 'ऋ'],
    [',', 'ए'], [',s', 'ऐ'], ['vks', 'ओ'], ['vkS', 'औ'], ['v‚', 'ऑ'],
    // consonants: full form, then half form
    ['Dk', 'क'], ['d', 'क'], ['D', 'क्'],
    ['[k', 'ख'], ['[', 'ख्'],
    ['Xk', 'ग'], ['x', 'ग'], ['X', 'ग्'],
    ['Ä', 'घ'], ['?k', 'घ'], ['?', 'घ्'],
    ['³', 'ङ'],
    ['Pk', 'च'], ['p', 'च'], ['P', 'च्'],
    ['N', 'छ'],
    ['Tk', 'ज'], ['t', 'ज'], ['T', 'ज्'],
    ['>', 'झ'], ['Ö', 'झ्'], ['÷', 'झ्'],
    ['¥', 'ञ'],
    ['V', 'ट'], ['B', 'ठ'], ['M', 'ड'], ['<', 'ढ'],
    ['.k', 'ण'], ['.', 'ण्'],
    ['Rk', 'त'], ['r', 'त'], ['R', 'त्'],
    ['Fk', 'थ'], ['F', 'थ्'],
    ['n', 'द'],
    ['èk', 'ध'], ['/k', 'ध'], ['è', 'ध्'], ['Ë', 'ध्'], ['/', 'ध्'],
    ['Uk', 'न'], ['u', 'न'], ['U', 'न्'],
    ['Ik', 'प'], ['i', 'प'], ['I', 'प्'],
    ['Q', 'फ'], ['¶', 'फ्'],
    ['Ck', 'ब'], ['c', 'ब'], ['C', 'ब्'],
    ['Ò', 'भ'], ['Hk', 'भ'], ['H', 'भ्'],
    ['Ek', 'म'], ['e', 'म'], ['E', 'म्'],
    [';', 'य'], ['¸', 'य्'],
    ['j', 'र'],
    ['Yk', 'ल'], ['y', 'ल'], ['Y', 'ल्'],
    ['G', 'ळ'],
    ['Ok', 'व'], ['o', 'व'], ['O', 'व्'],
    ['Ük', 'श'], ["'k", 'श'], ['Ü', 'श्'], ["'", 'श्'],
    ['"k', 'ष'], ['"', 'ष्'],
    ['Lk', 'स'], ['l', 'स'], ['L', 'स्'],
    ['g', 'ह'],
    // conjunct glyphs
    ['{k', 'क्ष'], ['{', 'क्ष्'],
    ['=', 'त्र'], ['«', 'त्र्'],
    ['K', 'ज्ञ'], ['J', 'श्र'],
    ['Ùk', 'त्त'], ['Ù', 'त्त्'],
    ['ä', 'क्त'], ['ô', 'क्क'],
    ['Ì', 'द्द'], ['í', 'द्द'], [')', 'द्ध'], ['|', 'द्य'], ['}', 'द्व'], ['æ', 'द्र'],
    ['Á', 'प्र'], ['ç', 'प्र'], ['Ø', 'क्र'], ['Ý', 'फ्र'],
    ['#', 'रु'], [':', 'रू'],
    ['à', 'ह्न'], ['á', 'ह्य'], ['â', 'हृ'], ['ã', 'ह्म'], ['ºz', 'ह्र'], ['º', 'ह्'],
    ['–', 'दृ'], ['Ñ', 'कृ'], ['—', 'कृ'],
    ['é', 'न्न'], ['™', 'न्न्'],
    ['Í', 'ट्ट'], ['ê', 'ट्ट'], ['Î', 'ट्ठ'], ['ë', 'ट्ठ'], ['Ï', 'ड्ड'], ['ì', 'ड्ड'], ['Ô', 'ड्ढ'], ['ï', 'ड्ढ'],
    ['Nî', 'छ्य'], ['Vî', 'ट्य'], ['Bî', 'ठ्य'], ['Mî', 'ड्य'], ['<î', 'ढ्य'],
    ['Vª', 'ट्र'], ['Mª', 'ड्र'], ['<ªª', 'ढ्र'], ['Nª', 'छ्र'],
    ['[+k', 'ख' + NUKTA], ['[+', 'ख' + NUKTA + HAL],
    // signs
    ['k', 'ा'], ['h', 'ी'], ['q', 'ु'], ['w', 'ू'], ['`', 'ृ'], ['s', 'े'], ['S', 'ै'], ['ks', 'ो'], ['kS', 'ौ'],
    ['‚', 'ॉ'], ['a', 'ं'], ['¡', 'ँ'], ['%', 'ः'], ['W', 'ॅ'], ['~', HAL], ['+', NUKTA],
    ['Ó', '्य'], ['î', '्य'], ['ª', '्र'], ['z', '्र'],
    ['È', 'ीं'], ['Ê', 'ी' + REPH], ['±', REPH + 'ं'], ['Z', REPH],
    ['f', PRE_I], ['Ç', PRE_IM], ['Æ', PRE_RI], ['É', PRE_RIM],
    ['•', 'ऽ'], ['∙', 'ऽ'], ['·', 'ऽ'],
    // digits (ASCII digits stay ASCII in both directions)
    ['å', '०'], ['ƒ', '१'], ['„', '२'], ['…', '३'], ['†', '४'], ['‡', '५'], ['ˆ', '६'], ['‰', '७'], ['Š', '८'], ['‹', '९'],
    // punctuation
    ['A', '।'], ['-', '.'], ['&', '-'], [']', ','], ['\\', '?'], ['@', '/'], ['(', ';'],
    ['¼', '('], ['½', ')'], ['¿', '{'], ['À', '}'], ['¾', '='],
    ['^', '‘'], ['*', '’'], ['Þ', '“'], ['ß', '”'], ['ñ', '॰'], ['Œ', '॰']
  ];

  function build(pairs, from, to) {
    var map = {}, max = 1;
    pairs.forEach(function (p) { map[p[from]] = p[to]; if (p[from].length > max) max = p[from].length; });
    return { map: map, max: max };
  }
  function tokenize(s, t) {
    var out = '', i = 0, n = s.length;
    while (i < n) {
      var hit = false;
      for (var L = Math.min(t.max, n - i); L > 0; L--) {
        var k = s.substr(i, L);
        if (Object.prototype.hasOwnProperty.call(t.map, k)) { out += t.map[k]; i += L; hit = true; break; }
      }
      if (!hit) { out += s[i]; i++; }
    }
    return out;
  }

  function isCons(c) { return !!c && c >= 'क' && c <= 'ह'; }
  var SIGNS = 'ािीुूृॄेैोौॅॉंँ' + NUKTA;

  // ---------- Kruti Dev -> Unicode ----------
  var K2U = build(PAIRS, 0, 1);
  var PRE = {};
  PRE[PRE_I] = ['', 'ि']; PRE[PRE_IM] = ['', 'िं']; PRE[PRE_RI] = ['र्', 'ि']; PRE[PRE_RIM] = ['र्', 'िं'];

  function toUnicode(kd) {
    // Word turns the ' and " keys into curly quotes; read them the way the font draws them.
    var s = String(kd).replace(/[‘’]/g, '"').replace(/[“”]/g, "'");
    s = tokenize(s, K2U);
    s = s.split(HAL + NUKTA).join(NUKTA + HAL);       // ज़् -> ज़्
    s = s.split(HAL + 'ा').join('');                    // half letter + ा = full letter (Dk, Rk ...)
    s = s.split(NUKTA + HAL + 'ा').join(NUKTA);         // [+k = ख़
    // short-i: from before the cluster to after it
    var i;
    while ((i = firstPre(s)) >= 0) {
      var m = s[i], j = i + 1;
      if (isCons(s[j])) {
        for (;;) {
          j++;
          if (s[j] === NUKTA) j++;
          if (s[j] === HAL && isCons(s[j + 1])) { j++; continue; }
          break;
        }
        s = s.slice(0, i) + PRE[m][0] + s.slice(i + 1, j) + PRE[m][1] + s.slice(j);
      } else {
        s = s.slice(0, i) + PRE[m][0] + PRE[m][1] + s.slice(i + 1);
      }
    }
    // reph: from after the syllable to before its cluster
    while ((i = s.indexOf(REPH)) >= 0) {
      var k = i - 1;
      while (k >= 0 && SIGNS.indexOf(s[k]) >= 0) k--;
      if (isCons(s[k])) {
        var start = k;
        for (;;) {
          if (s[start - 1] !== HAL) break;
          var t = start - 2;
          if (s[t] === NUKTA) t--;
          // a leading र् is itself a reph, never part of the next cluster
          if (isCons(s[t]) && s[t] !== 'र') { start = t; continue; }
          break;
        }
        s = s.slice(0, start) + 'र्' + s.slice(start, i) + s.slice(i + 1);
      } else {
        s = s.slice(0, i) + 'र्' + s.slice(i + 1);
      }
    }
    s = s.replace(/ाे/g, 'ो').replace(/ाै/g, 'ौ')
      .replace(/अा/g, 'आ').replace(/आे/g, 'ओ').replace(/आै/g, 'औ').replace(/अो/g, 'ओ').replace(/अौ/g, 'औ').replace(/एे/g, 'ऐ')
      .replace(/([ंँ])([ािीुूृेैोौॅॉ])/g, '$2$1')
      .replace(/([ािीुूृेैोौ])़/g, '़$1');
    return s.normalize('NFC');
  }
  function firstPre(s) {
    for (var i = 0; i < s.length; i++) if (PRE[s[i]]) return i;
    return -1;
  }

  // ---------- Unicode -> Kruti Dev ----------
  var U2K_PAIRS = PAIRS.filter(function (p) { return p[1].length && PRE[p[1]] === undefined; });
  // consonant + ्र (rakar): full glyph + z, unless a ready-made glyph exists (added after, so it wins)
  var FULL = {};
  PAIRS.forEach(function (p) { if (p[1].length === 1 && isCons(p[1])) FULL[p[1]] = p[0]; });
  var extra = [];
  Object.keys(FULL).forEach(function (c) { extra.push([FULL[c] + 'z', c + '्र']); });
  var U2K = build(extra.concat(U2K_PAIRS).concat([
    ['Ø', 'क्र'], ['ç', 'प्र'], ['Ý', 'फ्र'], ['æ', 'द्र'], ['=', 'त्र'], ['J', 'श्र'], ['ºz', 'ह्र'], ['xz', 'ग्र'],
    ['Vª', 'ट्र'], ['Mª', 'ड्र'], ['<ªª', 'ढ्र'], ['Nª', 'छ्र'],
    ['[+k', 'ख' + NUKTA], ['[+', 'ख' + NUKTA + HAL], ['D+', 'क' + NUKTA + HAL], ['X+', 'ग' + NUKTA + HAL],
    ['T+', 'ज' + NUKTA + HAL], ['¶+', 'फ' + NUKTA + HAL],
    ['f', PRE_I], ['Z', REPH], ['±', REPH + 'ं'], ['Ê', 'ी' + REPH], ['È', 'ीं'],
    ['bZ', 'ई'], ['AA', '॥'], ['&', '–'], ['&', '-'], ['%', ':']
  ]), 1, 0);

  var DECOMP = { '\u0958': 'क' + NUKTA, '\u0959': 'ख' + NUKTA, '\u095A': 'ग' + NUKTA, '\u095B': 'ज' + NUKTA, '\u095C': 'ड' + NUKTA,
    '\u095D': 'ढ' + NUKTA, '\u095E': 'फ' + NUKTA, '\u095F': 'य' + NUKTA, '\u0929': 'न' + NUKTA, '\u0931': 'र' + NUKTA, '\u0934': 'ळ' + NUKTA };
  var VSIGN = 'ािीुूृेैोौॅॉ';

  function toKrutidev(uni) {
    var s = String(uni).normalize('NFC').replace(/[‌‍]/g, '');
    s = s.replace(/[\u0958-\u095F\u0929\u0931\u0934]/g, function (c) { return DECOMP[c]; });
    // reph: र् + consonant cluster -> cluster (+ vowel signs) + Z
    var i = s.indexOf('र्');
    while (i >= 0) {
      if (isCons(s[i + 2]) && s[i - 1] !== HAL) {
        var j = i + 3;
        if (s[j] === NUKTA) j++;
        while (s[j] === HAL && isCons(s[j + 1])) { j += 2; if (s[j] === NUKTA) j++; }
        while (s[j] && VSIGN.indexOf(s[j]) >= 0) j++;
        s = s.slice(0, i) + s.slice(i + 2, j) + REPH + s.slice(j);
        i = s.indexOf('र्', j - 1);
      } else {
        i = s.indexOf('र्', i + 1);
      }
    }
    // short-i: move before its consonant cluster
    for (i = 0; i < s.length; i++) {
      if (s[i] !== 'ि') continue;
      var k = i - 1;
      if (s[k] === NUKTA) k--;
      if (!isCons(s[k])) { s = s.slice(0, i) + PRE_I + s.slice(i + 1); continue; }
      var start = k;
      for (;;) {
        if (s[start - 1] !== HAL) break;
        var t = start - 2;
        if (s[t] === NUKTA) t--;
        if (isCons(s[t])) { start = t; continue; }
        break;
      }
      s = s.slice(0, start) + PRE_I + s.slice(start, i) + s.slice(i + 1);
    }
    // straight quotes: there is no straight quote glyph, use the curly ones
    s = s.replace(/"/g, function (q, at, str) { return at === 0 || /[\s(\[{]/.test(str[at - 1]) ? '“' : '”'; })
      .replace(/'/g, function (q, at, str) { return at === 0 || /[\s(\[{]/.test(str[at - 1]) ? '‘' : '’'; });
    return tokenize(s, U2K);
  }

  // True when the text looks like Kruti Dev (Latin letters, no Devanagari). Kruti Dev words often have no
  // vowel letter (Hkkjr, ljdkj), a capital or a mark mid-word (gSa, xbZA, cM+k) and many k's (the ा matra).
  // Tuned on 3- and 6-word chunks of our passages: 6-word chunks 119/119 Kruti Dev and 0/139 English.
  function kdWord(w) {
    w = w.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
    if (!w) return null;
    return /[a-z][A-Z]/.test(w) || /[A-Za-z][+;|{}\[\]`~,][A-Za-z]/.test(w) || !/[aeiouyAEIOUY]/.test(w);
  }
  function looksKrutidev(s) {
    s = String(s);
    if (/[\u0900-\u097F]/.test(s)) return false;
    var letters = s.match(/[A-Za-z]/g) || [];
    if (letters.length < 4) return false;
    var words = s.split(/\s+/).map(kdWord).filter(function (x) { return x !== null; });
    var shape = words.filter(Boolean).length / words.length;
    var k = (s.match(/k/g) || []).length / letters.length;
    var v = (s.match(/[aeiouAEIOU]/g) || []).length / letters.length;
    return shape >= 0.5 || (k >= 0.1 && v < 0.3) || (shape >= 0.34 && k >= 0.07);
  }

  var api = { toUnicode: toUnicode, toKrutidev: toKrutidev, looksKrutidev: looksKrutidev };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ASKruti = api;
})(this);
