// Typing-test scorer following SSC's "Revised guidelines for evaluation of typing test/DEST scripts (English/Hindi)", 20.06.2022:
// full mistakes = omission, substitution, addition, spelling error, repetition, incomplete word;
// half mistakes = spacing, capitalisation (English only), punctuation, transposition.
(function (root) {
  var PUNCT = '.,;:!?\'"()[]{}-–—।॥/…‘’“”';
  function isP(ch) { return PUNCT.indexOf(ch) >= 0; }
  function strip(t) {
    var a = 0, b = t.length;
    while (a < b && isP(t[a])) a++;
    while (b > a && isP(t[b - 1])) b--;
    return t.slice(a, b);
  }
  function tokens(s) { return s.normalize('NFC').split(/\s+/).filter(Boolean); }

  // cost and type for comparing passage word p with typed word t
  function cmp(p, t, lang) {
    if (p === t) return [0, null];
    var pb = strip(p), tb = strip(t);
    var punctDiff = (p !== t) && (p.replace(pb, '') !== t.replace(tb, ''));
    if (pb === tb) return [0.5, 'punctuation'];
    if (lang === 'en' && pb.toLowerCase() === tb.toLowerCase()) {
      return punctDiff ? [1, 'capitalisation+punctuation'] : [0.5, 'capitalisation'];
    }
    return [1, 'spelling'];
  }

  function score(passage, typed, lang) {
    var P = tokens(passage), T = tokens(typed), n = P.length, m = T.length;
    var INF = 1e9, dp = [], op = [], i, j;
    for (i = 0; i <= n; i++) { dp.push(new Float64Array(m + 1).fill(INF)); op.push(new Array(m + 1)); }
    dp[0][0] = 0;
    for (i = 0; i <= n; i++) {
      for (j = 0; j <= m; j++) {
        if (i === 0 && j === 0) continue;
        var best = INF, how = null, c;
        if (i > 0 && j > 0) {
          c = cmp(P[i - 1], T[j - 1], lang);
          if (dp[i - 1][j - 1] + c[0] < best) { best = dp[i - 1][j - 1] + c[0]; how = ['sub', c]; }
        }
        if (i > 1 && j > 0 && P[i - 2] + P[i - 1] === T[j - 1] && dp[i - 2][j - 1] + 0.5 < best) { best = dp[i - 2][j - 1] + 0.5; how = ['merge']; }
        if (i > 0 && j > 1 && T[j - 2] + T[j - 1] === P[i - 1] && dp[i - 1][j - 2] + 0.5 < best) { best = dp[i - 1][j - 2] + 0.5; how = ['split']; }
        if (i > 1 && j > 1 && P[i - 2] === T[j - 1] && P[i - 1] === T[j - 2] && P[i - 2] !== P[i - 1] && dp[i - 2][j - 2] + 0.5 < best) { best = dp[i - 2][j - 2] + 0.5; how = ['swap']; }
        if (i > 0 && dp[i - 1][j] + 1 < best) { best = dp[i - 1][j] + 1; how = ['omit']; }
        if (j > 0 && dp[i][j - 1] + 1 < best) { best = dp[i][j - 1] + 1; how = ['add']; }
        dp[i][j] = best; op[i][j] = how;
      }
    }
    // Words after the last typed word were never reached, so they are not omissions.
    var end = 0;
    for (i = 0; i <= n; i++) if (dp[i][m] < dp[end][m]) end = i;
    var list = [];
    i = end; j = m;
    while (i > 0 || j > 0) {
      var o = op[i][j];
      if (o[0] === 'sub') {
        if (o[1][0] > 0) {
          var kind = o[1][1];
          if (kind === 'spelling' && j === m && P[i - 1].indexOf(T[j - 1]) === 0) kind = 'incomplete';
          else if (kind === 'spelling' && strip(P[i - 1]).toLowerCase().length && similarity(strip(P[i - 1]), strip(T[j - 1])) < 0.5) kind = 'substitution';
          list.push({ want: P[i - 1], got: T[j - 1], type: kind, cost: o[1][0] });
        }
        i--; j--;
      } else if (o[0] === 'merge') { list.push({ want: P[i - 2] + ' ' + P[i - 1], got: T[j - 1], type: 'spacing', cost: 0.5 }); i -= 2; j--; }
      else if (o[0] === 'split') { list.push({ want: P[i - 1], got: T[j - 2] + ' ' + T[j - 1], type: 'spacing', cost: 0.5 }); i--; j -= 2; }
      else if (o[0] === 'swap') { list.push({ want: P[i - 2] + ' ' + P[i - 1], got: T[j - 2] + ' ' + T[j - 1], type: 'transposition', cost: 0.5 }); i -= 2; j -= 2; }
      else if (o[0] === 'omit') { list.push({ want: P[i - 1], got: '', type: 'omission', cost: 1 }); i--; }
      else {
        var t = T[j - 1], type = 'addition';
        if (j === m && i < n && P[i].indexOf(t) === 0) type = 'incomplete';
        else if ((j > 1 && t === T[j - 2]) || (j < m && t === T[j])) type = 'repetition';
        list.push({ want: type === 'incomplete' ? P[i] : '', got: t, type: type, cost: 1 }); j--;
      }
    }
    list.reverse();
    var full = 0, half = 0;
    // a word with both wrong capitals and wrong punctuation is two half mistakes, not one full
    list.forEach(function (e) { if (e.type === 'capitalisation+punctuation') half += 2; else if (e.cost >= 1) full++; else half++; });
    return { full: full, half: half, mistakes: list, passageWords: n, typedWords: m, reached: end };
  }

  function similarity(a, b) {
    var n = a.length, m = b.length;
    if (!n || !m) return 0;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= m; j++) prev[j] = j;
    for (i = 1; i <= n; i++) {
      cur = [i];
      for (j = 1; j <= m; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return 1 - prev[m] / Math.max(n, m);
  }

  var api = { score: score, tokens: tokens, strip: strip };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ASScore = api;
})(this);
