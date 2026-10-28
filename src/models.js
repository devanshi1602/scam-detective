/* Scam Detective — 3D models made from real scans and Sketchfab assets (characters and rooms),
 * packed as base64 by tools/convert_model.py. Models.register(id, data) stores one; it is decoded and uploaded to the GPU
 * the first time it is needed. Characters stand with their feet at y = 0 and height normalised to 1; rooms are in metres. */
(function (root) {
  'use strict';
  var M = root.M3, store = {}, R = null;
  function b64(s, Type) {
    var bin = root.atob(s), u8 = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new Type(u8.buffer);
  }
  function uploadPart(id, k, p) {
    var gl = R.gl, Q = b64(p.pos, Uint16Array), N = b64(p.nrm, Int8Array), UV = b64(p.uv, Uint16Array), I = b64(p.idx, Uint16Array);
    var n = Q.length / 3, data = new Float32Array(n * 8);
    for (var i = 0; i < n; i++) {
      for (var a = 0; a < 3; a++) data[i * 8 + a] = p.lo[a] + Q[i * 3 + a] / 65535 * (p.hi[a] - p.lo[a]);
      data[i * 8 + 3] = N[i * 3] / 127; data[i * 8 + 4] = N[i * 3 + 1] / 127; data[i * 8 + 5] = N[i * 3 + 2] / 127;
      data[i * 8 + 6] = (UV[i * 2] - 32768) / 4096; data[i * 8 + 7] = 1 - (UV[i * 2 + 1] - 32768) / 4096;
    }
    var vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, I, gl.STATIC_DRAW);
    var name = 'model_' + id + '_' + k; R.meshes[name] = { vb: vb, ib: ib, n: I.length };
    p.mesh = name; p.pending = !!p.tex64;
    if (p.tex64) { var img = new root.Image(); img.onload = function () { p.tex = R.texture(img, { repeat: true }); p.pending = false; }; img.src = p.tex64; }
    p.pos = p.nrm = p.uv = p.idx = null;
  }
  function upload(id) {
    var d = store[id]; if (!R || !d || d.uploaded) return;
    d.uploaded = true; d.parts.forEach(function (p, k) { uploadPart(id, k, p); });
  }
  var Models = {
    register: function (id, data) { store[id] = data; },
    init: function (r) { R = r; },
    prepare: function (id) { if (store[id]) upload(id); },
    has: function (id) { var d = id && store[id]; return !!(d && d.uploaded && d.parts.every(function (p) { return !p.pending; })); },
    ids: function () { return Object.keys(store); },
    info: function (id) { return store[id]; },
    credits: function () { return Object.keys(store).map(function (k) { return store[k].credit; }).filter(function (c) { return c && c.title; }); },
    /** Draw a model. base: placement matrix; scale: height in metres for characters, 1 for rooms. */
    draw: function (add, base, id, scale, extra) {
      var d = store[id]; if (!Models.has(id)) { Models.prepare(id); return false; }
      var m = M.mul(base, M.trs(0, 0, 0, 0, 0, 0, scale, scale, scale));
      d.parts.forEach(function (p) {
        var it = { photo: 1 }; if (p.tex) it.tex = p.tex; if (extra) for (var k in extra) it[k] = extra[k];
        add(p.mesh, m, p.color ? [p.color[0], p.color[1], p.color[2], 1] : [1, 1, 1, 1], null, it);
      });
      return true;
    }
  };
  root.Models = Models;
})(this);
