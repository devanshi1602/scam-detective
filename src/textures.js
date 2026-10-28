/* Scam Detective — realistic surface materials generated in code (no image files):
 * wood planks, plaster, floor tiles, concrete, felt, brushed metal, fabric, plus a soft contact-shadow sprite.
 * Every texture tiles seamlessly and is mostly light-grey detail, so it can be tinted by each room's colour palette. */
(function (root) {
  'use strict';
  var N = 256; // texture size (power of two, so it can repeat and use mipmaps)

  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
  // tileable value noise with a given period (cells per side)
  function noiseField(period, seed) {
    var r = rng(seed), g = [];
    for (var i = 0; i < period * period; i++) g.push(r());
    return function (x, y) { // x,y in [0,1)
      var fx = x * period, fy = y * period, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
      tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
      function v(a, b) { return g[((b % period + period) % period) * period + ((a % period + period) % period)]; }
      var a = v(ix, iy) + (v(ix + 1, iy) - v(ix, iy)) * tx, b = v(ix, iy + 1) + (v(ix + 1, iy + 1) - v(ix, iy + 1)) * tx;
      return a + (b - a) * ty;
    };
  }
  function fbm(fields) { return function (x, y) { var s = 0, w = 0, a = 1; fields.forEach(function (f) { s += f(x, y) * a; w += a; a *= 0.5; }); return s / w; }; }
  function canvas() { var c = document.createElement('canvas'); c.width = c.height = N; return c; }
  function paint(fn) {
    var c = canvas(), g = c.getContext('2d'), img = g.createImageData(N, N), d = img.data;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var col = fn(x / N, y / N, x, y), o = (y * N + x) * 4;
      d[o] = Math.max(0, Math.min(255, col[0] * 255)); d[o + 1] = Math.max(0, Math.min(255, col[1] * 255)); d[o + 2] = Math.max(0, Math.min(255, col[2] * 255)); d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0); return c;
  }
  function grey(v) { return [v, v, v]; }

  var MAKERS = {
    wood: function () { // planks running along x: fine grain streaks, gentle figure, seams
      var fig = fbm([noiseField(4, 11), noiseField(8, 12)]), streak = noiseField(128, 14), plankTone = noiseField(8, 15), fine = noiseField(256, 16);
      return paint(function (u, v) {
        var plank = Math.floor(v * 6), pv = v * 6 - plank, off = (plank * 0.37) % 1, uu = (u + off) % 1;
        var grain = Math.sin((v * 6 + fig(uu, v) * 0.9) * 90) * 0.5 + 0.5;          // fine growth lines
        var str = streak(uu * 0.08, v);                                              // long fibre streaks along the plank
        var tone = 0.8 + 0.12 * plankTone(plank / 8 + 0.05, 0.5) + 0.05 * grain + 0.07 * str + 0.03 * fine(u, v);
        if (pv < 0.03 || pv > 0.97) tone *= 0.7;                                     // seam between planks
        if (((u + off * 3) % 0.5) < 0.004) tone *= 0.75;                             // plank ends
        return [tone * 1.03, tone * 0.98, tone * 0.91];
      });
    },
    plaster: function () {
      var n = fbm([noiseField(8, 21), noiseField(16, 22), noiseField(64, 23), noiseField(128, 24)]);
      return paint(function (u, v) { return grey(0.9 + 0.08 * n(u, v)); });
    },
    tile: function () { // 4x4 stone/ceramic floor tiles with grout
      var n = fbm([noiseField(16, 31), noiseField(64, 32)]), t = noiseField(4, 33);
      return paint(function (u, v) {
        var tu = u * 4 % 1, tv = v * 4 % 1, edge = Math.min(tu, 1 - tu, tv, 1 - tv);
        var base = 0.82 + 0.1 * t(Math.floor(u * 4) / 4 + 0.1, Math.floor(v * 4) / 4 + 0.1) + 0.08 * n(u, v);
        if (edge < 0.02) base = 0.55; else if (edge < 0.035) base *= 0.92;
        return grey(base);
      });
    },
    concrete: function () {
      var n = fbm([noiseField(4, 41), noiseField(8, 42), noiseField(32, 43), noiseField(128, 44)]), sp = noiseField(128, 45);
      return paint(function (u, v) { var s = sp(u, v); return grey(0.8 + 0.16 * n(u, v) - (s > 0.88 ? 0.08 : 0)); });
    },
    felt: function () {
      var n = fbm([noiseField(32, 51), noiseField(128, 52)]);
      return paint(function (u, v, x, y) { return grey(0.86 + 0.12 * n(u, v) + ((x * 7 + y * 13) % 5 === 0 ? 0.04 : 0)); });
    },
    metal: function () { // brushed along x
      var n = noiseField(128, 61), m = noiseField(8, 62);
      return paint(function (u, v) { return grey(0.8 + 0.12 * n(u * 0.02, v) + 0.06 * m(u, v)); });
    },
    fabric: function () { // fine weave
      var n = noiseField(16, 71);
      return paint(function (u, v, x, y) { var w = ((x >> 1) + (y >> 1)) % 2 ? 0.95 : 0.84; return grey(w - 0.08 * n(u, v)); });
    },
    shadow: function () { // soft round contact shadow (alpha only)
      var c = canvas(), g = c.getContext('2d'), gr = g.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
      gr.addColorStop(0, 'rgba(0,0,0,0.7)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, N, N); return c;
    },
    glow: function () { // soft white radial glow for light spots, sparkles and dust
      var c = canvas(), g = c.getContext('2d'), gr = g.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, N, N); return c;
    }
  };

  /** Build all materials once for a renderer. Returns {name: glTexture}. */
  function build(r) {
    var out = {};
    Object.keys(MAKERS).forEach(function (k) {
      var cv = MAKERS[k]();
      out[k] = r.texture(cv, k === 'shadow' || k === 'glow' ? null : { repeat: true });
    });
    return out;
  }
  root.Materials = { build: build, MAKERS: MAKERS };
})(this);
