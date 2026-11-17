// Language toggle: Hindi first, English on request. The choice is remembered on this device only.
(function () {
  var KEY = 'as-lang';
  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function apply(lang) {
    var root = document.documentElement;
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang === 'en' ? 'en' : 'hi');
    var nodes = document.querySelectorAll('[data-hi]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var text = el.getAttribute('data-' + lang) || el.getAttribute('data-hi');
      if (el.hasAttribute('placeholder')) el.setAttribute('placeholder', text);
      else el.textContent = text;
    }
    var btn = document.getElementById('langbtn');
    if (btn) btn.textContent = lang === 'en' ? 'हिंदी' : 'English';
    document.dispatchEvent(new CustomEvent('as-lang', { detail: lang }));
  }
  window.ASLang = function () { return document.documentElement.getAttribute('data-lang') || 'hi'; };
  document.addEventListener('DOMContentLoaded', function () {
    apply(saved() === 'en' ? 'en' : 'hi');
    var btn = document.getElementById('langbtn');
    if (btn) btn.addEventListener('click', function () {
      var next = window.ASLang() === 'en' ? 'hi' : 'en';
      try { localStorage.setItem(KEY, next); } catch (e) {}
      apply(next);
    });
  });
})();

// WhatsApp share card at the end of every page: in India, tools spread by forwarding.
// It only builds a wa.me link; the visitor chooses whether to send it.
(function () {
  var MSG = {
    hi: 'फॉर्म भर रहे हो? यह मुफ़्त टूल फोटो/सिग्नेचर को सही KB में बदलता है, हिंदी टाइपिंग टेस्ट और कृतिदेव कन्वर्टर भी है। फोटो आपके फ़ोन से बाहर नहीं जाती:',
    en: 'Filling a form? This free tool resizes your photo/signature to the exact KB, and has a Hindi typing test and a Krutidev converter. Your photo never leaves your phone:'
  };
  function build() {
    var main = document.querySelector('main');
    if (!main || document.getElementById('as-share')) return;
    var lang = window.ASLang ? window.ASLang() : 'hi';
    var url = location.origin + location.pathname;
    var box = document.createElement('section');
    box.id = 'as-share';
    box.className = 'card share';
    var p = document.createElement('p');
    p.textContent = lang === 'en' ? 'Know someone filling a form this week? Send them this tool.' : 'इस हफ़्ते कोई फॉर्म भर रहा है? उसे यह टूल भेजें।';
    var a = document.createElement('a');
    a.className = 'btn wa';
    a.rel = 'noopener';
    a.target = '_blank';
    a.href = 'https://wa.me/?text=' + encodeURIComponent(MSG[lang] + ' ' + url);
    a.textContent = lang === 'en' ? 'Share on WhatsApp' : 'WhatsApp पर भेजें';
    box.appendChild(p);
    box.appendChild(a);
    main.appendChild(box);
  }
  document.addEventListener('DOMContentLoaded', build);
  document.addEventListener('as-lang', function () {
    var old = document.getElementById('as-share');
    if (old) old.remove();
    build();
  });
})();
