/* Scam Detective — semi-realistic character parts generated in code:
 * sculpted head meshes (jaw, cheekbones, eye sockets, nose, lips), strand-textured hair meshes,
 * a shaped torso, painted skin/face textures, iris textures and beard textures. No image files.
 * Head space: centre at the origin, metres, +y up, +z forward (the face). */
(function (root) {
  'use strict';
  var A = 0.085, B = 0.108, C = 0.097;          // head ellipsoid half-sizes (width, height, depth)
  var LON = 96, LAT = 64;

  function g(x, c, s) { var d = (x - c) / s; return Math.exp(-d * d); }
  function sstep(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function dirOf(lon, lat) { return [Math.sin(lat) * Math.sin(lon), Math.cos(lat), Math.sin(lat) * Math.cos(lon)]; }
  function latOf(ny) { return Math.acos(Math.max(-1, Math.min(1, ny))); }
  /** Where a face feature sits on the head, as (lon, lat) from its front-facing unit coordinates. */
  function lonOf(nx, ny) { var r = Math.sqrt(Math.max(1e-6, 1 - ny * ny)); return Math.asin(Math.max(-1, Math.min(1, nx / r))); }

  /** The sculpted head surface. f: 1 = female features (softer jaw, smaller nose, fuller lips). */
  function surf(lon, lat, f) {
    var d = dirOf(lon, lat), nx = d[0], ny = d[1], nz = d[2], ax = Math.abs(nx);
    var p = [A * nx, B * ny, C * nz], front = sstep(0.25, 0.9, nz);
    var lower = sstep(-0.3, -0.98, ny);
    p[0] *= 1 - lower * (f ? 0.3 : 0.2) - sstep(-0.75, -1, ny) * 0.15;        // jaw narrows to a rounded chin
    p[2] *= 1 - lower * 0.14 * (1 - front);
    p[2] += front * g(ny, -0.8, 0.14) * (f ? 0.006 : 0.011);                  // chin
    p[0] += (nx < 0 ? -1 : 1) * g(ny, -0.02, 0.15) * g(ax, 0.62, 0.2) * 0.005; // cheekbones
    p[2] -= front * g(ny, 0.17, 0.08) * g(ax, 0.33, 0.12) * 0.010;            // eye sockets
    p[2] += front * g(ny, 0.3, 0.06) * g(ax, 0.3, 0.25) * (f ? 0.003 : 0.006); // brow ridge
    // nose: a ridge down the middle, widening into the nostrils at the tip
    var nh = ny > 0.26 ? 0 : ny > -0.12 ? (0.26 - ny) / 0.38 : ny > -0.21 ? (ny + 0.21) / 0.09 : 0;
    var nw = 0.045 + 0.06 * sstep(0.2, -0.13, ny);
    p[2] += front * g(nx, 0, nw) * Math.pow(nh, 1.3) * (f ? 0.021 : 0.027);
    p[2] += front * g(ny, -0.15, 0.04) * g(ax, 0.1, 0.045) * 0.006;          // nostril wings
    // lips: upper and lower, with the line between them
    var lw = g(nx, 0, f ? 0.17 : 0.16) * front;
    p[2] += lw * (g(ny, -0.34, 0.03) * (f ? 0.005 : 0.0035) + g(ny, -0.44, 0.035) * (f ? 0.006 : 0.0045)) - lw * g(ny, -0.39, 0.012) * 0.0028;
    p[2] -= front * g(ny, -0.27, 0.03) * g(nx, 0, 0.05) * 0.0015;             // groove above the lip
    if (nz < -0.2 && ny > -0.4) { p[2] *= 1.04; }                              // fuller back of the skull
    if (ny < -0.9) { var k = sstep(-0.9, -1, ny); p[0] *= 1 - k * 0.3; p[2] *= 1 - k * 0.3; }
    return p;
  }

  function finish(pos, uv, idx) {
    var nrm = new Array(pos.length).fill(0);
    for (var i = 0; i < idx.length; i += 3) {
      var a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
      var ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      [a, b, c].forEach(function (o) { nrm[o] += nx; nrm[o + 1] += ny; nrm[o + 2] += nz; });
    }
    for (var j = 0; j < nrm.length; j += 3) { var l = Math.hypot(nrm[j], nrm[j + 1], nrm[j + 2]) || 1; nrm[j] /= l; nrm[j + 1] /= l; nrm[j + 2] /= l; }
    return { pos: pos, nrm: nrm, uv: uv, idx: idx };
  }
  /** Grid over (lon, lat) with a position function; u wraps around the head, v runs top to bottom. */
  function grid(nu, nv, fn, uvfn, flip) {
    var pos = [], uv = [], idx = [];
    for (var j = 0; j <= nv; j++) for (var i = 0; i <= nu; i++) {
      var s = i / nu, t = j / nv, p = fn(s, t); pos.push(p[0], p[1], p[2]); var q = uvfn(s, t); uv.push(q[0], q[1]);
    }
    for (var jj = 0; jj < nv; jj++) for (var ii = 0; ii < nu; ii++) {
      var a = jj * (nu + 1) + ii, b = a + 1, c = a + nu + 1, d = c + 1;
      if (flip) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
    }
    return finish(pos, uv, idx);
  }
  function headGeo(f) {
    // uv: u = 0.5 at the front of the face, v = 0 at the top of the head (texture rows are flipped on upload)
    return grid(LON, LAT, function (s, t) { return surf(-Math.PI + s * Math.PI * 2, t * Math.PI, f); }, function (s, t) { return [s, 1 - t]; });
  }

  /** Lowest point of the hair (as a unit-height y) at each angle around the head. */
  function hairline(lon, style) {
    var a = Math.abs(lon);
    var pts = style === 'long' ? [[0, 0.5], [0.4, 0.46], [1.0, 0.25], [1.45, -0.05], [2.1, -0.95], [Math.PI, -1]]
      : style === 'bob' ? [[0, 0.48], [0.4, 0.44], [1.0, 0.2], [1.45, -0.2], [2.2, -0.6], [Math.PI, -0.7]]
        : [[0, 0.52], [0.4, 0.48], [1.0, 0.32], [1.45, 0.12], [2.2, -0.35], [Math.PI, -0.52]];
    for (var i = 1; i < pts.length; i++) if (a <= pts[i][0]) { var k = (a - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]); return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k; }
    return pts[pts.length - 1][1];
  }
  /** Hair as a shell over the skull down to the hairline, thicker on top. */
  function hairGeo(style) {
    var bald = style === 'bald';
    return grid(LON, 28, function (s, t) {
      var lon = -Math.PI + s * Math.PI * 2, lat0, lat1;
      if (bald) { var a = Math.abs(lon); if (a < 1.3) { lat0 = lat1 = latOf(0.1); } else { lat0 = latOf(0.18); lat1 = latOf(-0.5); } }
      else { lat0 = 0; lat1 = latOf(hairline(lon, style)); }
      var lat = lat0 + (lat1 - lat0) * t, d = dirOf(lon, lat), up = Math.max(0, d[1]);
      var th = bald ? 0.0045 : 0.006 + 0.014 * up * up + (style === 'long' || style === 'bob' ? 0.004 * (1 - up) : 0) + 0.003 * Math.max(0, -d[2]);
      var edge = 1 - sstep(0.85, 1, t) * 0.6;   // thin out at the hairline so it meets the skin softly
      return [(A + th * edge) * d[0] * (d[1] < -0.05 && !bald ? 1.04 : 1), (B + th * edge) * d[1] + (bald ? 0 : 0.004 * up), (C + th * edge) * d[2] * (d[2] < 0 ? 1.06 : 1)];
    }, function (s, t) { return [s * 10, 1 - t * 1.5]; }, true);
  }
  /** Long hair falling down the back. */
  function hairFallGeo(len) {
    return grid(24, 10, function (s, t) {
      var lon = Math.PI * 0.42 + s * Math.PI * 1.16, r = 1.08 + t * 0.15, y = -0.02 - t * len, w = 1 - 0.25 * t;
      return [A * r * Math.sin(lon) * w, y, C * r * Math.cos(lon) * w - 0.008 * t];
    }, function (s, t) { return [s * 5, 1 - t * 2]; }, false);
  }
  /** Torso: hips → waist → chest → shoulders → neck, with a flattened oval cross-section. y runs 0..1. */
  function torsoGeo(f) {
    var prof = f ? [[0, 0.175], [0.25, 0.14], [0.5, 0.155], [0.68, 0.165], [0.84, 0.17], [0.93, 0.13], [1, 0.06]]
      : [[0, 0.165], [0.25, 0.155], [0.5, 0.17], [0.68, 0.18], [0.84, 0.19], [0.93, 0.15], [1, 0.065]];
    function rad(y) { for (var i = 1; i < prof.length; i++) if (y <= prof[i][0]) { var k = (y - prof[i - 1][0]) / (prof[i][0] - prof[i - 1][0]); k = k * k * (3 - 2 * k); return prof[i - 1][1] + (prof[i][1] - prof[i - 1][1]) * k; } return prof[prof.length - 1][1]; }
    return grid(32, 24, function (s, t) {
      var a = -Math.PI + s * Math.PI * 2, y = t, r = rad(y), sa = Math.sin(a), ca = Math.cos(a);
      var depth = 0.6 + (f ? 0.1 * g(y, 0.62, 0.12) : 0.04 * g(y, 0.62, 0.15)) * Math.max(0, ca);   // chest
      var shoulderDrop = y > 0.84 ? (1 - Math.abs(ca)) * 0 : 0;
      return [r * sa, y - shoulderDrop, r * depth * ca];
    }, function (s, t) { return [s * 6, t * 8]; }, true);
  }

  /* ---------------- textures ---------------- */
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function css(c, k, a) { k = k || 1; return 'rgba(' + Math.round(Math.min(1, c[0] * k) * 255) + ',' + Math.round(Math.min(1, c[1] * k) * 255) + ',' + Math.round(Math.min(1, c[2] * k) * 255) + ',' + (a === undefined ? 1 : a) + ')'; }
  var TW = 1024, TH = 512;
  function uvPx(nx, ny) { return [(0.5 + lonOf(nx, ny) / (Math.PI * 2)) * TW, latOf(ny) / Math.PI * TH]; }
  function blob(gc, nx, ny, rw, rh, col, a) {   // soft radial spot centred on a face point, sizes in "unit face" coordinates
    var p = uvPx(nx, ny), sx = rw / (Math.PI * 2) * TW * 1.15, sy = rh / Math.PI * TH * 1.1;
    gc.save(); gc.translate(p[0], p[1]); gc.scale(1, sy / sx);
    var gr = gc.createRadialGradient(0, 0, 0, 0, 0, sx); gr.addColorStop(0, css(col, 1, a)); gr.addColorStop(1, css(col, 1, 0));
    gc.fillStyle = gr; gc.beginPath(); gc.arc(0, 0, sx, 0, Math.PI * 2); gc.fill(); gc.restore();
  }
  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

  /** Painted skin: tone variation, warm cheeks, shaded eye area, nose shadow, lips, stubble or beard. */
  function faceTexture(L) {
    var c = mk(TW, TH), gc = c.getContext('2d'), s = L.skin, r = rng(Math.round(s[0] * 997 + s[1] * 131 + (L.female ? 7 : 3)));
    gc.fillStyle = css(s); gc.fillRect(0, 0, TW, TH);
    for (var i = 0; i < 2600; i++) { var x = r() * TW, y = r() * TH, z = 2 + r() * 10; gc.fillStyle = css(s, 0.9 + r() * 0.2, 0.18); gc.fillRect(x, y, z, z * 0.8); }   // mottled skin
    var warm = [Math.min(1, s[0] * 1.12 + 0.05), s[1] * 0.82, s[2] * 0.8], dark = [s[0] * 0.72, s[1] * 0.66, s[2] * 0.66];
    blob(gc, 0, 0.38, 0.7, 0.18, [s[0] * 1.06, s[1] * 1.05, s[2] * 1.03], 0.5);          // forehead highlight
    [-1, 1].forEach(function (sd) {
      blob(gc, sd * 0.5, -0.12, 0.22, 0.16, warm, L.female ? 0.55 : 0.32);                // cheeks
      blob(gc, sd * 0.33, 0.15, 0.17, 0.07, dark, 0.45);                                   // around the eyes
      blob(gc, sd * 0.33, 0.06, 0.14, 0.04, dark, 0.35);                                   // under-eye
      blob(gc, sd * 0.33, 0.22, 0.16, 0.04, L.female ? [s[0] * 0.75, s[1] * 0.55, s[2] * 0.6] : dark, L.female ? 0.5 : 0.25);   // eyelid (a little colour for women)
      blob(gc, sd * 0.09, -0.19, 0.035, 0.02, [s[0] * 0.35, s[1] * 0.28, s[2] * 0.27], 0.85);   // nostrils
      blob(gc, sd * 0.2, -0.3, 0.06, 0.12, dark, 0.3);                                     // smile lines
      blob(gc, sd * 0.88, 0.0, 0.25, 0.35, dark, 0.35);                                    // side of the face (temples)
    });
    blob(gc, 0, -0.22, 0.12, 0.04, dark, 0.4);                                             // under the nose
    blob(gc, 0, 0.0, 0.05, 0.22, [s[0] * 1.08, s[1] * 1.06, s[2] * 1.04], 0.45);           // nose bridge highlight
    // lips
    var lip = L.female ? [0.66, 0.24, 0.28] : [Math.min(1, s[0] * 0.95 + 0.08), s[1] * 0.6, s[2] * 0.6];
    function lipShape(y0, h, w) {
      var a = uvPx(-w, y0), b = uvPx(w, y0), m = uvPx(0, y0 - h);
      gc.beginPath(); gc.moveTo(a[0], a[1]); gc.quadraticCurveTo(m[0], m[1] - (b[1] - m[1]) * 0.2, b[0], b[1]);
    }
    gc.fillStyle = css(lip, 1, 0.9);
    var ul = [uvPx(-0.17, -0.385), uvPx(-0.06, -0.335), uvPx(0, -0.35), uvPx(0.06, -0.335), uvPx(0.17, -0.385)];
    gc.beginPath(); gc.moveTo(ul[0][0], ul[0][1]); gc.quadraticCurveTo(ul[1][0], ul[1][1] - 2, ul[2][0], ul[2][1]); gc.quadraticCurveTo(ul[3][0], ul[3][1] - 2, ul[4][0], ul[4][1]);
    var ll = uvPx(0, -0.46); gc.quadraticCurveTo(ll[0] + 20, ll[1] + 4, ul[2][0], ll[1]); gc.quadraticCurveTo(ll[0] - 20, ll[1] + 4, ul[0][0], ul[0][1]); gc.fill();
    var lm = uvPx(0, -0.39); gc.strokeStyle = css(lip, 0.45, 0.9); gc.lineWidth = 2; lipShape(-0.39, 0.012, 0.165); gc.stroke();
    blob(gc, 0, -0.43, 0.07, 0.02, [1, 0.9, 0.85], 0.25);                                   // lower-lip shine
    void lm;
    // beard / stubble / moustache
    if (L.beard || L.moustache || (!L.female && !L.noStubble)) {
      var hc = L.hair, full = !!L.beard;
      for (var k = 0; k < (full ? 9000 : L.moustache ? 7000 : 3500); k++) {
        var fx = r() * 2 - 1, fy = -0.15 - r() * 0.85;
        var inLips = Math.abs(fx) < 0.19 && fy < -0.32 && fy > -0.47, jaw = Math.abs(fx) < 0.95 && fy < -0.12 + Math.abs(fx) * 0.1;
        var must = L.moustache && Math.abs(fx) < 0.25 && fy < -0.25 + Math.abs(fx) * 0.05 && fy > -0.345 - Math.abs(fx) * 0.25;
        if ((!jaw || inLips) && !must) continue;
        if (!full && !must && r() > 0.55) continue;
        var q = uvPx(fx * 0.98, fy);
        gc.fillStyle = css(hc, 0.9 + r() * 0.3, full || must ? 0.6 : 0.12); gc.fillRect(q[0], q[1], must ? 2 : 1.5, full || must ? 4 : 1.5);
      }
    }
    return c;
  }
  /** Iris: radial fibres, a dark rim and the pupil. */
  function irisTexture(col) {
    var c = mk(128, 128), gc = c.getContext('2d'), r = rng(42);
    var gr = gc.createRadialGradient(64, 64, 8, 64, 64, 62); gr.addColorStop(0, css(col, 1.4)); gr.addColorStop(0.7, css(col, 1)); gr.addColorStop(0.92, css(col, 0.45)); gr.addColorStop(1, 'rgba(255,255,255,1)');
    gc.fillStyle = gr; gc.fillRect(0, 0, 128, 128);
    for (var i = 0; i < 160; i++) { var a = r() * Math.PI * 2, r0 = 16 + r() * 10, r1 = 40 + r() * 16; gc.strokeStyle = css(col, 0.6 + r() * 0.9, 0.35); gc.lineWidth = 1; gc.beginPath(); gc.moveTo(64 + Math.cos(a) * r0, 64 + Math.sin(a) * r0); gc.lineTo(64 + Math.cos(a) * r1, 64 + Math.sin(a) * r1); gc.stroke(); }
    gc.fillStyle = '#0b0807'; gc.beginPath(); gc.arc(64, 64, 17, 0, Math.PI * 2); gc.fill();
        // the area outside the iris is eye-white, so the disc edge blends into the eyeball
    gc.globalCompositeOperation = 'destination-in'; var m = gc.createRadialGradient(64, 64, 56, 64, 64, 64); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); gc.fillStyle = m; gc.fillRect(0, 0, 128, 128);
    return c;
  }
  /** Hair strands: thin streaks of varying brightness. */
  function strandTexture() {
    var c = mk(256, 256), gc = c.getContext('2d'), r = rng(9);
    gc.fillStyle = '#c8c8c8'; gc.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 900; i++) { var x = r() * 256, w = 0.6 + r() * 1.6, v = 120 + Math.floor(r() * 135); gc.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; gc.globalAlpha = 0.5; gc.fillRect(x, 0, w, 256); }
    gc.globalAlpha = 1; return c;
  }

  var R = null, cache = {};
  function init(r, mats) {
    R = r; cache.fabric = mats && mats.fabric;
    r.meshes.headM = r._mesh(headGeo(0)); r.meshes.headF = r._mesh(headGeo(1));
    ['short', 'long', 'bob', 'bald'].forEach(function (st) { r.meshes['hair_' + st] = r._mesh(hairGeo(st)); });
    r.meshes.hairFall = r._mesh(hairFallGeo(0.26));
    r.meshes.torsoM = r._mesh(torsoGeo(0)); r.meshes.torsoF = r._mesh(torsoGeo(1));
    cache.strand = r.texture(strandTexture(), { repeat: true });
  }
  function faceTex(L) {
    var key = 'face|' + L.skin.join(',') + '|' + (L.hair || []).join(',') + '|' + !!L.female + !!L.beard + !!L.moustache;
    return cache[key] || (cache[key] = R.texture(faceTexture(L)));
  }
  function irisTex(col) { var key = 'iris|' + col.join(','); return cache[key] || (cache[key] = R.texture(irisTexture(col))); }
  /** Point on the sculpted face, from front-facing unit coordinates (nx left/right, ny up/down). */
  function facePoint(nx, ny, f) { return surf(lonOf(nx, ny), latOf(ny), f); }

  root.Faces = { init: init, ready: function () { return !!R; }, faceTex: faceTex, irisTex: irisTex, strand: function () { return cache.strand; }, fabric: function () { return cache.fabric; }, facePoint: facePoint, A: A, B: B, C: C };
})(this);
