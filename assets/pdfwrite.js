// Minimal PDF writer: one JPEG per page, each page drawn full-bleed at its own size in points.
// No library needed: JPEG bytes go into the PDF unchanged (DCTDecode). Used by the PDF compressor.
(function (root) {
  function enc(s) {
    var out = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 255;
    return out;
  }
  function num(n) { return (Math.round(n * 100) / 100).toString(); }

  // pages: [{ jpeg: Uint8Array, px: [width, height], pt: [width, height] }]
  // Browser canvas JPEGs always have 3 colour components, even for a grey page, so the colour space is always DeviceRGB.
  function build(pages) {
    var parts = [], offsets = [], pos = 0;
    function push(bytes) { parts.push(bytes); pos += bytes.length; }
    function obj(id, body, stream) {
      offsets[id] = pos;
      push(enc(id + ' 0 obj\n' + body));
      if (stream) { push(enc('\nstream\n')); push(stream); push(enc('\nendstream')); }
      push(enc('\nendobj\n'));
    }
    push(enc('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));
    var n = pages.length, kids = [];
    for (var i = 0; i < n; i++) kids.push((3 + i * 3) + ' 0 R');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Count ' + n + ' /Kids [' + kids.join(' ') + '] >>');
    for (i = 0; i < n; i++) {
      var p = pages[i], pid = 3 + i * 3, cid = pid + 1, iid = pid + 2;
      var w = num(p.pt[0]), h = num(p.pt[1]);
      var content = enc('q ' + w + ' 0 0 ' + h + ' 0 0 cm /Im0 Do Q');
      obj(pid, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + w + ' ' + h + '] /Resources << /XObject << /Im0 ' + iid + ' 0 R >> >> /Contents ' + cid + ' 0 R >>');
      obj(cid, '<< /Length ' + content.length + ' >>', content);
      obj(iid, '<< /Type /XObject /Subtype /Image /Width ' + p.px[0] + ' /Height ' + p.px[1] +
        ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.jpeg.length + ' >>', p.jpeg);
    }
    var count = 3 + n * 3, xref = pos, lines = ['xref', '0 ' + count, '0000000000 65535 f '];
    for (i = 1; i < count; i++) lines.push(('0000000000' + offsets[i]).slice(-10) + ' 00000 n ');
    push(enc(lines.join('\n') + '\ntrailer\n<< /Size ' + count + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n'));
    var out = new Uint8Array(pos), at = 0;
    for (i = 0; i < parts.length; i++) { out.set(parts[i], at); at += parts[i].length; }
    return out;
  }

  // Bytes the PDF adds around the JPEGs, so the compressor can budget for it before building.
  function overhead(nPages) { return 400 + nPages * 420; }

  var api = { build: build, overhead: overhead };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ASPdfWrite = api;
})(this);
