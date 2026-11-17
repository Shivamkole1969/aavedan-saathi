// Krutidev <-> Unicode page: live conversion, auto direction, copy, hand-off to the typing test.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'as-custom-passage';
  function T(hi, en) { return window.ASLang() === 'en' ? en : hi; }

  function labels() {
    var k2u = $('dir').value === 'k2u';
    $('srcLabel').textContent = k2u ? T('कृतिदेव टेक्स्ट यहाँ पेस्ट करें', 'Paste Krutidev text here') : T('यूनिकोड हिंदी यहाँ पेस्ट करें', 'Paste Unicode Hindi here');
    $('outLabel').textContent = k2u ? T('यूनिकोड हिंदी', 'Unicode Hindi') : T('कृतिदेव टेक्स्ट (Kruti Dev 010)', 'Krutidev text (Kruti Dev 010)');
    $('src').placeholder = k2u ? 'Hkkjr ljdkj' : 'भारत सरकार';
  }

  function run(auto) {
    var src = $('src').value, dir = $('dir').value, hint = '';
    if (auto && src.trim()) {
      if (/[ऀ-ॿ]/.test(src) && dir === 'k2u') { dir = 'u2k'; hint = T('हिंदी अक्षर मिले, इसलिए दिशा "यूनिकोड → कृतिदेव" कर दी।', 'Hindi letters found, so the direction is now Unicode → Krutidev.'); }
      else if (dir === 'u2k' && window.ASKruti.looksKrutidev(src)) { dir = 'k2u'; hint = T('यह कृतिदेव टेक्स्ट लगता है, इसलिए दिशा "कृतिदेव → यूनिकोड" कर दी।', 'This looks like Krutidev text, so the direction is now Krutidev → Unicode.'); }
      if (dir !== $('dir').value) { $('dir').value = dir; labels(); }
    }
    var out = dir === 'k2u' ? window.ASKruti.toUnicode(src) : window.ASKruti.toKrutidev(src);
    $('out').value = out;
    $('hint').textContent = hint;
    var uni = dir === 'k2u' ? out : src;
    var words = uni.trim() ? uni.trim().split(/\s+/).length : 0;
    $('count').textContent = src ? T(words + ' शब्द', words + ' words') : '';
    $('kdNote').classList.toggle('hidden', !(dir === 'u2k' && src));
    $('latinNote').classList.toggle('hidden', !(dir === 'u2k' && /[A-Za-z]/.test(src)));
    $('practise').classList.toggle('hidden', !(words >= 5));
  }

  function copy() {
    var out = $('out'), btn = $('copy');
    var done = function () { btn.textContent = T('कॉपी हो गया ✓', 'Copied ✓'); setTimeout(function () { btn.textContent = T('कॉपी करें', 'Copy'); }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(out.value).then(done, function () { out.select(); try { document.execCommand('copy'); done(); } catch (e) {} });
    } else { out.select(); try { document.execCommand('copy'); done(); } catch (e) {} }
  }

  document.addEventListener('DOMContentLoaded', function () {
    labels(); run(false);
    $('dir').addEventListener('change', function () { labels(); run(false); });
    $('src').addEventListener('input', function () { run(true); });
    $('swap').addEventListener('click', function () {
      var out = $('out').value;
      $('dir').value = $('dir').value === 'k2u' ? 'u2k' : 'k2u';
      $('src').value = out; labels(); run(false);
    });
    $('clear').addEventListener('click', function () { $('src').value = ''; run(false); $('src').focus(); });
    $('copy').addEventListener('click', copy);
    $('practise').addEventListener('click', function () {
      var uni = $('dir').value === 'k2u' ? $('out').value : $('src').value;
      try { localStorage.setItem(KEY, uni.replace(/\s+/g, ' ').trim().slice(0, 6000)); } catch (e) {}
    });
    document.addEventListener('as-lang', function () { labels(); run(false); });
  });
})();
