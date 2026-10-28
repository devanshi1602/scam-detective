/* Scam Detective — six different crime scenes, one per investigation.
 * Each scene has its own colours and surfaces (walls, floor, the table you search) and its own furniture:
 * a living room, a bride's room decorated for the wedding, a paint shop, an abandoned job agency,
 * a retired man's study and a home kitchen. Everything is built from simple shapes in desk-local metres:
 * the table top is at y = 0, the floor at y = -0.74 and the back wall at z = -0.95. */
(function (root) {
  'use strict';
  var M = root.M3, Game = root.Game, U = Game.U, T = root.I18N.T;

  // per scene: wall, floor, table, table top colours for day and night, plus which surface textures to use
  var LOOK = {
    drawing: { day: { wall: [0.95, 0.89, 0.78, 1], floor: [0.72, 0.55, 0.38, 1], table: [0.6, 0.44, 0.3, 1], top: [0.78, 0.62, 0.45, 1] },
      night: { wall: [0.52, 0.42, 0.33, 1], floor: [0.32, 0.22, 0.16, 1], table: [0.24, 0.17, 0.13, 1], top: [0.5, 0.36, 0.25, 1] },
      wallTex: 'plaster', floorTex: ['wood', 1.3], topTex: ['wood', 3] },
    bridal: { day: { wall: [0.98, 0.84, 0.86, 1], floor: [0.93, 0.9, 0.86, 1], table: [0.92, 0.88, 0.8, 1], top: [0.96, 0.93, 0.88, 1] },
      night: { wall: [0.55, 0.32, 0.38, 1], floor: [0.46, 0.42, 0.4, 1], table: [0.52, 0.46, 0.4, 1], top: [0.62, 0.56, 0.5, 1] },
      wallTex: 'plaster', floorTex: ['tile', 0.6], topTex: ['tile', 2] },
    shop: { day: { wall: [0.62, 0.78, 0.74, 1], floor: [0.58, 0.58, 0.56, 1], table: [0.3, 0.32, 0.36, 1], top: [0.72, 0.8, 0.84, 1] },
      night: { wall: [0.24, 0.34, 0.33, 1], floor: [0.2, 0.2, 0.21, 1], table: [0.16, 0.17, 0.2, 1], top: [0.36, 0.42, 0.46, 1] },
      wallTex: 'concrete', floorTex: ['concrete', 0.6], topTex: ['metal', 3] },
    agency: { day: { wall: [0.86, 0.9, 0.95, 1], floor: [0.42, 0.48, 0.58, 1], table: [0.82, 0.82, 0.8, 1], top: [0.9, 0.9, 0.88, 1] },
      night: { wall: [0.3, 0.34, 0.4, 1], floor: [0.16, 0.19, 0.25, 1], table: [0.36, 0.36, 0.36, 1], top: [0.46, 0.46, 0.45, 1] },
      wallTex: 'plaster', floorTex: ['felt', 2.5], topTex: ['felt', 6] },
    study: { day: { wall: [0.55, 0.62, 0.5, 1], floor: [0.45, 0.3, 0.2, 1], table: [0.36, 0.22, 0.14, 1], top: [0.22, 0.4, 0.3, 1] },
      night: { wall: [0.22, 0.27, 0.2, 1], floor: [0.2, 0.13, 0.09, 1], table: [0.2, 0.12, 0.08, 1], top: [0.12, 0.24, 0.18, 1] },
      wallTex: 'plaster', floorTex: ['wood', 1.6], topTex: ['felt', 5] },
    kitchen: { day: { wall: [0.98, 0.95, 0.82, 1], floor: [0.85, 0.82, 0.78, 1], table: [0.55, 0.42, 0.3, 1], top: [0.92, 0.92, 0.9, 1] },
      night: { wall: [0.5, 0.46, 0.36, 1], floor: [0.36, 0.34, 0.32, 1], table: [0.26, 0.2, 0.15, 1], top: [0.55, 0.55, 0.54, 1] },
      wallTex: 'plaster', floorTex: ['tile', 0.45], topTex: ['tile', 2.5] }
  };
  var SOUND = { drawing: 'home', bridal: 'party', shop: 'street', agency: 'empty', study: 'home', kitchen: 'kitchen' };
  Game.SCENE_LOOK = LOOK;
  Game.prototype._sceneKind = function () { var v = this.inv && this.cur && this.cur.mode === 'inv' ? this.inv() : null; return (v && v.scene) || 'drawing'; };
  Game.prototype._sceneLook = function () { var L = LOOK[this._sceneKind()] || LOOK.drawing; return { pal: this.isDay() ? L.day : L.night, wallTex: this.mat[L.wallTex], floor: [this.mat[L.floorTex[0]], L.floorTex[1]], top: [this.mat[L.topTex[0]], L.topTex[1]] }; };
  Game.prototype._sceneSound = function () { return SOUND[this._sceneKind()] || 'home'; };

  /** A painted sign or poster, drawn once onto a canvas. */
  Game.prototype._signTex = function (key, w, h, draw) {
    this._signs = this._signs || {}; var k = key + '|' + root.I18N.lang;
    if (!this._signs[k]) { var cv = U.mk(w, h), g = cv.getContext('2d'); draw(g, w, h); this._signs[k] = this.r.texture(cv); }
    return this._signs[k];
  };

  Game.prototype._drawCrimeScene = function (add, t) {
    var kind = this._sceneKind(), r = this.r, self = this, day = this.isDay(), W = -0.935, mat = this.mat;
    function glow(mesh, l, col) { r.add({ mesh: mesh, m: self._bm(l), color: col, unlit: 1 }); }
    function B(x, y, z, sx, sy, sz, col, ry, extra) { add('box', M.trs(x, y, z, 0, ry || 0, 0, sx, sy, sz), col, null, extra); }
    function C(x, y, z, d, h, col, extra) { add('cyl', M.trs(x, y, z, 0, 0, 0, d, h, d), col, null, extra); }
    function S(x, y, z, d, col, extra) { add('sphere', M.trs(x, y, z, 0, 0, 0, d), col, null, extra); }
    function sign(x, y, z, w, h, tex, ry) { add('quad', M.trs(x, y, z, 0, ry || 0, 0, w, h, 1), [1, 1, 1, 1], null, { tex: tex, unlit: 1 }); }
    function windowPane(cx, cy, w, h, seed) {
      if (day) glow('box', M.trs(cx, cy, W, 0, 0, 0, w, h, 0.01), [0.66, 0.85, 1, 1]);
      else add('box', M.trs(cx, cy, W, 0, 0, 0, w, h, 0.01), [0.04, 0.06, 0.12, 1], [0.02, 0.03, 0.07]);
      self._skyline(add, glow, cx, cy, w, h, W + 0.005, day, seed, t);
      B(cx, cy, W + 0.012, 0.02, h, 0.01, [0.95, 0.95, 0.93, 1]); B(cx, cy, W + 0.012, w, 0.02, 0.01, [0.95, 0.95, 0.93, 1]);
      B(cx, cy - h / 2 - 0.02, W + 0.03, w + 0.08, 0.025, 0.07, [0.92, 0.9, 0.86, 1]);
    }
    if (kind === 'drawing') { this._drawRoomProps(add, 'home', t); return; }

    if (kind === 'bridal') {
      // the bride's room the night after the sangeet: marigold garlands, fairy lights, a bed, the lehenga on a stand
      for (var gI = 0; gI < 3; gI++) for (var k = 0; k <= 26; k++) {   // three marigold garlands sagging across the back wall
        var gx = -1.3 + k * 0.1, sag = 0.12 * (1 - Math.pow((k - 13) / 13, 2));
        S(gx, 0.95 - gI * 0.008 - sag, W + 0.04 + gI * 0.012, 0.05, gI === 1 ? [0.98, 0.78, 0.12, 1] : [0.98, 0.5, 0.08, 1]);
      }
      for (var s2 = 0; s2 < 6; s2++) for (var d = 0; d < 7; d++) S(-1.25 + s2 * 0.5, 0.88 - d * 0.06, W + 0.04, 0.04, d % 2 ? [0.98, 0.78, 0.12, 1] : [0.98, 0.5, 0.08, 1]);   // hanging strings
      for (var f = 0; f < 34; f++) {   // twinkling fairy lights
        var fx = -1.6 + f * 0.1, on = 0.6 + 0.4 * Math.sin(t * 3 + f * 1.7);
        glow('sphere', M.trs(fx, 1.2 - 0.05 * Math.sin(f * 0.9), W + 0.03, 0, 0, 0, 0.018), [1 * on, 0.85 * on, 0.45 * on, 1]);
      }
      // bed with a red bedspread and pillows, on the left
      B(-1.15, -0.55, -0.35, 0.9, 0.3, 1.3, [0.6, 0.42, 0.28, 1], 0, { tex: mat.wood, tile: 2 });
      B(-1.15, -0.37, -0.35, 0.88, 0.08, 1.26, [0.72, 0.1, 0.14, 1], 0, { tex: mat.fabric, tile: 6 });
      B(-1.15, -0.32, -0.35, 0.92, 0.012, 0.5, [0.95, 0.72, 0.2, 1], 0, { tex: mat.fabric, tile: 8 });
      [-1.35, -0.95].forEach(function (px) { B(px, -0.28, -0.88, 0.32, 0.1, 0.2, [0.98, 0.9, 0.86, 1]); });
      B(-1.15, -0.1, -0.97, 0.94, 0.85, 0.06, [0.5, 0.33, 0.2, 1], 0, { tex: mat.wood, tile: 2 });
      // gold-framed mirror and the open, empty jewellery box on the dressing table to the right
      B(1.15, -0.4, -0.75, 0.8, 0.68, 0.38, [0.94, 0.9, 0.82, 1]); B(1.15, -0.06, -0.75, 0.84, 0.03, 0.42, [0.85, 0.68, 0.3, 1]);
      B(1.15, 0.38, -0.92, 0.6, 0.78, 0.03, [0.85, 0.66, 0.25, 1]); add('box', M.trs(1.15, 0.38, -0.9, 0, 0, 0, 0.52, 0.7, 0.01), [0.72, 0.82, 0.9, 1], [0.12, 0.14, 0.16]);
      B(0.98, -0.0, -0.72, 0.16, 0.09, 0.12, [0.55, 0.08, 0.12, 1]); add('box', M.trs(0.98, 0.07, -0.79, -1.1, 0, 0, 0.16, 0.11, 0.015), [0.55, 0.08, 0.12, 1]);
      B(0.98, 0.048, -0.72, 0.13, 0.005, 0.09, [0.95, 0.85, 0.75, 1]);
      [[1.25, 0.04, -0.7, [0.95, 0.4, 0.6, 1]], [1.33, 0.03, -0.65, [0.3, 0.7, 0.4, 1]], [1.4, 0.05, -0.72, [0.9, 0.8, 0.3, 1]]].forEach(function (b) { C(b[0], b[1] - 0.02, b[2], 0.04, b[1] * 2, b[3]); });
      // the lehenga on a dress form, red with a gold border
      add('cyl', M.trs(0.62, -0.42, -0.8, 0, 0, 0, 0.5, 0.62, 0.5), [0.72, 0.06, 0.12, 1], null, { tex: mat.fabric, tile: 10 });
      C(0.62, -0.72, -0.8, 0.52, 0.03, [0.92, 0.7, 0.22, 1]); C(0.62, -0.12, -0.8, 0.22, 0.02, [0.92, 0.7, 0.22, 1]);
      add('sphere', M.trs(0.62, 0.05, -0.8, 0, 0, 0, 0.22, 0.34, 0.16), [0.78, 0.1, 0.16, 1], null, { tex: mat.fabric, tile: 6 });
      add('box', M.mul(M.trs(0.62, 0.15, -0.74, 0, 0, 0.4, 1), M.trs(0, -0.25, 0, 0, 0, 0, 0.12, 0.7, 0.01)), [0.98, 0.55, 0.62, 0.85], null, { tex: mat.fabric, tile: 12 });
      C(0.62, 0.3, -0.8, 0.03, 0.12, [0.3, 0.25, 0.2, 1]);
      // rose petals scattered on the floor, and a mehendi cone left behind
      for (var p = 0; p < 40; p++) { var a = p * 2.39996, rad = 0.25 + (p % 9) * 0.1; add('box', M.trs(Math.cos(a) * rad * 1.3, -0.735, 0.2 + Math.sin(a) * rad, 0, a, 0, 0.03, 0.002, 0.022), p % 3 ? [0.85, 0.08, 0.2, 1] : [0.98, 0.55, 0.65, 1]); }
      windowPane(-0.25, 0.42, 0.5, 0.42, 11);
      // a door left ajar with warm light spilling through
      B(1.69, -0.15, 0.55, 0.02, 1.2, 0.6, [0.98, 0.84, 0.5, 1], 0, { unlit: 1 });
      add('box', M.trs(1.55, -0.15, 0.37, 0, 0.9, 0, 0.6, 1.2, 0.04), [0.55, 0.36, 0.22, 1], null, { tex: mat.wood, tile: 2 });
      r.add({ mesh: 'disc', m: self._bm(M.trs(1.3, -0.735, 0.55, 0, 0, 0, 0.9, 1, 0.5)), color: [1, 0.85, 0.5, 0.16], add: 1, unlit: 1 });
      glow('sphere', M.trs(0, 1.12, -0.2, 0, 0, 0, 0.07), [1, 0.88, 0.7, 1]);
      add('cyl', M.trs(0, 1.18, -0.2, 0, 0, 0, 0.22, 0.12, 0.22), [0.95, 0.78, 0.35, 0.92]);
      return;
    }

    if (kind === 'shop') {
      // Arjun's paint and hardware shop: shelves of paint tins, a shade card, a half-down rolling shutter, a tube light
      var SHADES = [[0.85, 0.2, 0.2], [0.95, 0.75, 0.15], [0.2, 0.5, 0.85], [0.25, 0.65, 0.35], [0.95, 0.95, 0.92], [0.6, 0.3, 0.6], [0.95, 0.5, 0.2], [0.4, 0.75, 0.8]];
      for (var sh = 0; sh < 4; sh++) {
        var sy = -0.45 + sh * 0.36; B(-0.25, sy, -0.85, 2.3, 0.025, 0.2, [0.55, 0.42, 0.3, 1], 0, { tex: mat.wood, tile: 4 });
        for (var tn = 0; tn < 16; tn++) {
          var col = SHADES[(tn * 3 + sh * 5) % SHADES.length], big = (tn + sh) % 3 === 0, tx = -1.32 + tn * 0.14 + (sh % 2) * 0.03;
          if (tx > 0.85) continue;
          C(tx, sy + 0.013 + (big ? 0.075 : 0.055), -0.84, big ? 0.12 : 0.1, big ? 0.15 : 0.11, [0.75, 0.75, 0.76, 1], { tex: mat.metal, tile: 1 });
          C(tx, sy + 0.013 + (big ? 0.07 : 0.05), -0.84 + (big ? 0.0605 : 0.0505), 0.06, 0.06, [col[0], col[1], col[2], 1]);
        }
      }
      B(-0.25, 0.25, -0.94, 2.36, 1.5, 0.02, [0.5, 0.38, 0.26, 1], 0, { tex: mat.wood, tile: 3 });
      // a fan of colour shade cards pinned to the wall on the right
      for (var sc = 0; sc < 9; sc++) { var c9 = SHADES[sc % SHADES.length]; add('box', M.mul(M.trs(1.15, 0.3, W + 0.02 + sc * 0.002, 0, 0, -0.9 + sc * 0.22, 1), M.trs(0, 0.13, 0, 0, 0, 0, 0.05, 0.26, 0.002)), [c9[0], c9[1], c9[2], 1]); }
      sign(1.15, 0.72, W + 0.02, 0.5, 0.16, this._signTex('nairpaints', 512, 160, function (g, w, h) {
        g.fillStyle = '#c62b23'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '900 64px ' + U.FONT; g.textAlign = 'center'; g.fillText('NAIR PAINTS', w / 2, 82);
        g.font = '600 30px ' + U.FONT; g.fillText(T('Paints · Hardware · Tools'), w / 2, 130);
      }));
      // the rolling shutter, half down, on the right-hand wall
      for (var rs = 0; rs < 18; rs++) add('box', M.trs(1.68, 1.1 - rs * 0.04, -0.1, 0, 0, 0, 0.03, 0.035, 1.2), [0.62, 0.64, 0.66, 1], null, { tex: mat.metal, tile: 2 });
      glow('box', M.trs(1.69, -0.15, -0.1, 0, 0, 0, 0.01, 1.1, 1.15), day ? [0.85, 0.92, 1, 1] : [0.1, 0.12, 0.2, 1]);
      // stacked tins and a stool on the floor, a calendar, the cash drawer under the counter
      [[-1.2, 0.3], [-1.05, 0.45], [-1.25, 0.6]].forEach(function (q, i) { for (var h2 = 0; h2 < 3 - i % 2; h2++) C(q[0], -0.66 + h2 * 0.16, q[1], 0.2, 0.15, [0.72, 0.72, 0.74, 1], { tex: mat.metal, tile: 1 }); });
      C(0.95, -0.42, 0.25, 0.32, 0.03, [0.2, 0.45, 0.75, 1]); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { C(0.95 + q[0] * 0.1, -0.58, 0.25 + q[1] * 0.1, 0.02, 0.32, [0.6, 0.6, 0.62, 1]); });
      sign(0.95, 0.25, -0.83, 0.18, 0.24, this._signTex('calendar', 180, 240, function (g, w, h) {
        g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#c62b23'; g.fillRect(0, 0, w, 50); g.fillStyle = '#fff'; g.font = '800 30px ' + U.FONT; g.textAlign = 'center'; g.fillText(T('OCTOBER'), w / 2, 36);
        g.fillStyle = '#333'; g.font = '500 16px ' + U.FONT; for (var i = 0; i < 31; i++) g.fillText(String(i + 1), 20 + (i % 7) * 23, 80 + Math.floor(i / 7) * 32);
        g.strokeStyle = '#c62b23'; g.lineWidth = 3; g.beginPath(); g.arc(20 + 6 * 23, 80 + 2 * 32 - 6, 13, 0, 7); g.stroke();
      }));
      B(0.03, -0.38, 0.3, 1.0, 0.68, 0.015, [0.24, 0.26, 0.3, 1], 0, { tex: mat.metal, tile: 3 });   // counter front
      B(0.03, -0.12, 0.31, 0.3, 0.07, 0.02, [0.5, 0.52, 0.55, 1]);
      var fl2 = Math.sin(t * 29) > 0.985 ? 0.5 : 1;
      glow('box', M.trs(0, 1.3, -0.4, 0, 0, 0, 1.0, 0.025, 0.04), [0.9 * fl2, 0.97 * fl2, 1 * fl2, 1]);
      B(0, 1.32, -0.4, 1.06, 0.02, 0.07, [0.85, 0.85, 0.84, 1]);
      return;
    }

    if (kind === 'agency') {
      // the abandoned office of "SkyHigh Careers": aeroplane posters, a big logo, empty chairs, boxes, papers everywhere
      sign(-0.05, 0.62, W + 0.015, 0.9, 0.24, this._signTex('skyhigh', 900, 240, function (g, w, h) {
        var gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#0b4fa8'); gr.addColorStop(1, '#3fa3e8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.fillStyle = '#fff'; g.font = '900 96px ' + U.FONT; g.textAlign = 'center'; g.fillText('SkyHigh Careers', w / 2, 130);
        g.font = '600 38px ' + U.FONT; g.fillText(T('Cabin crew jobs · 100% placement'), w / 2, 196);
      }));
      [[-1.05, 0.2], [0.95, 0.2]].forEach(function (pp, i) {
        sign(pp[0], pp[1], W + 0.015, 0.42, 0.56, self._signTex('plane' + i, 420, 560, function (g, w, h) {
          var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, i ? '#f7a541' : '#59a8f0'); gr.addColorStop(1, i ? '#ffe2b0' : '#d8ecff'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
          g.fillStyle = '#fff'; g.save(); g.translate(w / 2, h * 0.38); g.rotate(-0.35);
          g.fillRect(-150, -14, 300, 28); g.beginPath(); g.moveTo(-30, -10); g.lineTo(40, -110); g.lineTo(70, -110); g.lineTo(40, -10); g.fill();
          g.beginPath(); g.moveTo(-30, 10); g.lineTo(40, 110); g.lineTo(70, 110); g.lineTo(40, 10); g.fill(); g.fillRect(-150, -50, 26, 50); g.restore();
          g.fillStyle = '#123'; g.font = '900 46px ' + U.FONT; g.textAlign = 'center'; g.fillText(T('FLY HIGH'), w / 2, h - 110);
          g.font = '600 26px ' + U.FONT; g.fillText(T('Your dream job awaits'), w / 2, h - 66);
        }));
      });
      // one poster has slipped and hangs by a corner
      add('quad', M.mul(M.trs(1.45, 0.45, W + 0.02, 0, 0, 0.5, 1), M.trs(0.12, -0.16, 0, 0, 0, 0, 0.3, 0.4, 1)), [0.95, 0.93, 0.88, 1]);
      // rows of empty plastic chairs where the students waited
      for (var ch = 0; ch < 4; ch++) {
        var cx = -1.5 + ch * 0.3, cz = -0.72, tip = ch === 2;
        var base = M.trs(cx, -0.74, cz, 0, 0.05 * ch, 0, 1);
        if (tip) base = M.mul(M.trs(cx, -0.74 + 0.2, cz + 0.3, 0, 0.3, 0, 1), M.trs(0, 0, 0, -1.45, 0, 0, 1));
        [[0, 0.42, 0, 0.38, 0.03, 0.36], [0, 0.66, -0.17, 0.38, 0.45, 0.03]].forEach(function (pt) { add('box', M.mul(base, M.trs(pt[0], pt[1], pt[2], 0, 0, 0, pt[3], pt[4], pt[5])), [0.15, 0.4, 0.75, 1]); });
        [[-0.16, -0.15], [0.16, -0.15], [-0.16, 0.15], [0.16, 0.15]].forEach(function (lg) { add('cyl', M.mul(base, M.trs(lg[0], 0.2, lg[1], 0, 0, 0, 0.02, 0.4, 0.02)), [0.7, 0.7, 0.72, 1]); });
      }
      // cardboard boxes, one taped, one open, stacked by the wall
      [[1.2, -0.6, 0.0, 0.42, 0.28, 0.36, 0.2], [1.25, -0.32, -0.05, 0.36, 0.26, 0.3, -0.1], [0.75, -0.62, -0.62, 0.4, 0.24, 0.34, 0.5]].forEach(function (bx) {
        add('box', M.trs(bx[0], bx[1], bx[2], 0, bx[6], 0, bx[3], bx[4], bx[5]), [0.72, 0.55, 0.36, 1]);
        add('box', M.trs(bx[0], bx[1] + bx[4] / 2 + 0.001, bx[2], 0, bx[6], 0, bx[3] + 0.002, 0.003, 0.05), [0.75, 0.68, 0.5, 1]);
      });
      // papers scattered over the carpet
      for (var pq = 0; pq < 26; pq++) { var pa = pq * 2.1, pr = 0.3 + (pq % 7) * 0.17; add('box', M.trs(Math.cos(pa) * pr * 1.4, -0.735 + (pq % 3) * 0.002, 0.2 + Math.sin(pa) * pr * 0.8, 0, pa, 0, 0.16, 0.002, 0.21), [0.97, 0.97, 0.95, 1]); }
      // water cooler with an empty bottle, and a whiteboard with half-erased figures
      B(-1.45, -0.4, 0.4, 0.3, 0.68, 0.3, [0.92, 0.92, 0.92, 1]); add('cyl', M.trs(-1.45, 0.1, 0.4, 0, 0, 0, 0.26, 0.32, 0.26), [0.7, 0.85, 1, 0.35]);
      add('box', M.trs(-1.69, 0.35, -0.2, 0, Math.PI / 2, 0, 0.9, 0.6, 0.02), [0.96, 0.96, 0.97, 1]);
      add('quad', M.trs(-1.675, 0.35, -0.2, 0, Math.PI / 2, 0, 0.84, 0.54, 1), [1, 1, 1, 1], null, { tex: this._signTex('whiteboard', 840, 540, function (g, w, h) {
        g.fillStyle = '#fbfbfc'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(30,60,160,.75)'; g.lineWidth = 6; g.font = '700 46px ' + U.FONT; g.fillStyle = 'rgba(30,60,160,.8)';
        g.fillText('42 × ₹45,000', 60, 110); g.fillText('= ₹18,90,000', 60, 180); g.fillStyle = 'rgba(200,40,40,.8)'; g.fillText(T('VACATE 20 OCT'), 60, 290);
        g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(0, 330, w, 120); g.fillRect(380, 40, 420, 200);
      }), unlit: 1 });
      // cold, flickering tube light; blinds pulled down
      var fl3 = Math.sin(t * 23) > 0.9 ? 0.35 : 1;
      glow('box', M.trs(0.2, 1.3, -0.3, 0, 0, 0, 1.2, 0.025, 0.05), [0.85 * fl3, 0.93 * fl3, 1 * fl3, 1]);
      for (var bl = 0; bl < 14; bl++) add('box', M.trs(1.69, 0.05 + bl * 0.05, 0.75, 0.9, 0, 0, 0.01, 0.04, 0.7), [0.88, 0.88, 0.86, 1]);
      return;
    }

    if (kind === 'study') {
      // Gurdeep ji's study: book-lined walls, a banker's lamp, a grandfather clock, family photos, an armchair
      var BK = [[0.55, 0.15, 0.12], [0.15, 0.25, 0.45], [0.2, 0.4, 0.25], [0.6, 0.45, 0.2], [0.35, 0.2, 0.35], [0.8, 0.75, 0.62], [0.12, 0.12, 0.14]];
      [[-1.2, 0], [1.2, 1]].forEach(function (bs) {
        var x0 = bs[0]; B(x0, 0.2, -0.82, 0.74, 1.9, 0.3, [0.32, 0.2, 0.12, 1], 0, { tex: mat.wood, tile: 2 });
        for (var lv = 0; lv < 5; lv++) {
          var yy = -0.62 + lv * 0.36; B(x0, yy, -0.7, 0.68, 0.02, 0.26, [0.4, 0.26, 0.16, 1]);
          var bx2 = x0 - 0.31, n = 0;
          while (bx2 < x0 + 0.3) {
            var bw = 0.025 + ((n * 7 + lv * 3 + bs[1] * 5) % 4) * 0.008, bh = 0.2 + ((n * 5 + lv) % 4) * 0.03, cc = BK[(n * 3 + lv * 2 + bs[1]) % BK.length];
            var lean = (n + lv) % 11 === 5 ? 0.25 : 0;
            add('box', M.trs(bx2 + bw / 2, yy + 0.01 + bh / 2, -0.7, 0, 0, lean, bw, bh, 0.2), [cc[0], cc[1], cc[2], 1]);
            bx2 += bw + 0.003 + lean * 0.06; n++;
          }
        }
      });
      // grandfather clock with a swinging pendulum, between the shelves
      B(0.55, -0.1, -0.85, 0.32, 1.28, 0.2, [0.3, 0.18, 0.1, 1], 0, { tex: mat.wood, tile: 2 });
      add('cyl', M.trs(0.55, 0.36, -0.745, Math.PI / 2, 0, 0, 0.22, 0.01, 0.22), [0.95, 0.93, 0.86, 1]);
      var sec = (Date.now() / 1000) % 60; add('box', M.trs(0.55 + Math.sin(-sec / 60 * Math.PI * 2) * 0.045, 0.36 + Math.cos(sec / 60 * Math.PI * 2) * 0.045, -0.737, 0, 0, -sec / 60 * Math.PI * 2, 0.004, 0.09, 0.002), [0.1, 0.1, 0.1, 1]);
      add('box', M.trs(0.55, 0.0, -0.745, 0, 0, 0, 0.2, 0.55, 0.005), [0.1, 0.08, 0.06, 1], [0.03, 0.02, 0.01]);
      var sw = Math.sin(t * 2.2) * 0.25; add('box', M.mul(M.trs(0.55, 0.22, -0.74, 0, 0, sw, 1), M.trs(0, -0.2, 0, 0, 0, 0, 0.006, 0.4, 0.004)), [0.85, 0.7, 0.3, 1]);
      add('cyl', M.mul(M.trs(0.55, 0.22, -0.74, 0, 0, sw, 1), M.trs(0, -0.42, 0, Math.PI / 2, 0, 0, 0.07, 0.01, 0.07)), [0.9, 0.75, 0.35, 1]);
      // framed family photos and a portrait in a garland
      [[-0.35, 0.55, 0.26, 0.2], [-0.05, 0.62, 0.2, 0.26], [0.2, 0.5, 0.18, 0.14]].forEach(function (fr, i) {
        add('box', M.trs(fr[0], fr[1], W + 0.01, 0, 0, 0, fr[2], fr[3], 0.015), [0.45, 0.32, 0.15, 1]);
        add('box', M.trs(fr[0], fr[1], W + 0.019, 0, 0, 0, fr[2] - 0.03, fr[3] - 0.03, 0.002), [0.78 - i * 0.1, 0.72 - i * 0.05, 0.6, 1]);
        for (var hh = 0; hh < 2 + i; hh++) add('sphere', M.trs(fr[0] - 0.05 + hh * 0.045, fr[1] - 0.01, W + 0.021, 0, 0, 0, 0.03, 0.05, 0.003), [0.55 + hh * 0.05, 0.4, 0.3, 1]);
      });
      for (var gm = 0; gm < 12; gm++) { var ga = gm / 11 * Math.PI; S(-0.05 + Math.cos(ga) * 0.14, 0.62 - Math.sin(ga) * 0.15, W + 0.03, 0.028, [0.98, 0.95, 0.92, 1]); }
      // leather armchair on the right, a side table with his BP tablets, a Persian rug
      add('box', M.trs(1.25, -0.5, 0.25, 0, -0.5, 0, 0.6, 0.35, 0.6), [0.42, 0.18, 0.1, 1]);
      add('box', M.trs(1.38, -0.15, 0.03, 0, -0.5, 0, 0.6, 0.6, 0.15), [0.4, 0.17, 0.1, 1]);
      [-1, 1].forEach(function (sd) { add('box', M.trs(1.25 + Math.cos(-0.5) * sd * 0.28, -0.3, 0.25 - Math.sin(-0.5) * sd * 0.28, 0, -0.5, 0, 0.1, 0.3, 0.58), [0.38, 0.16, 0.09, 1]); });
      B(-1.0, -0.45, 0.35, 0.36, 0.58, 0.36, [0.36, 0.22, 0.12, 1], 0, { tex: mat.wood, tile: 2 });
      B(-1.0, -0.13, 0.35, 0.1, 0.05, 0.06, [0.95, 0.95, 0.95, 1]); C(-0.92, -0.11, 0.38, 0.05, 0.09, [0.25, 0.45, 0.85, 0.8]);
      add('box', M.trs(0, -0.737, 0.2, 0, 0, 0, 2.0, 0.006, 1.4), [0.45, 0.1, 0.1, 1]);
      add('box', M.trs(0, -0.734, 0.2, 0, 0, 0, 1.7, 0.006, 1.1), [0.12, 0.18, 0.35, 1]);
      add('box', M.trs(0, -0.731, 0.2, 0, Math.PI / 4, 0, 0.6, 0.006, 0.6), [0.75, 0.6, 0.3, 1]);
      // green banker's lamp glowing on the desk corner
      C(0.42, 0.01, -0.2, 0.1, 0.02, [0.75, 0.6, 0.25, 1]); C(0.42, 0.1, -0.2, 0.015, 0.18, [0.75, 0.6, 0.25, 1]);
      add('cyl', M.trs(0.42, 0.2, -0.2, 0, 0, Math.PI / 2, 0.08, 0.22, 0.08), [0.1, 0.42, 0.25, 1]);
      glow('box', M.trs(0.42, 0.17, -0.2, 0, 0, 0, 0.2, 0.01, 0.05), [1, 0.92, 0.7, 1]);
      r.add({ mesh: 'disc', m: self._bm(M.trs(0.3, 0.0055, -0.1, 0, 0, 0, 0.5)), color: [1, 0.9, 0.6, 0.1], add: 1, unlit: 1 });
      glow('sphere', M.trs(0, 1.12, -0.2, 0, 0, 0, 0.06), [1, 0.85, 0.62, 1]);
      add('cyl', M.trs(0, 1.16, -0.2, 0, 0, 0, 0.18, 0.09, 0.18), [0.85, 0.7, 0.45, 0.9]);
      return;
    }

    if (kind === 'kitchen') {
      // Kavita's kitchen: tiled backsplash, a stove with a whistling cooker, a fridge, a spice rack, cabinets
      add('box', M.trs(-0.1, 0.12, W + 0.005, 0, 0, 0, 2.6, 0.5, 0.01), [0.92, 0.96, 0.95, 1], null, { tex: mat.tile, tile: 0.25 });
      B(-0.15, -0.33, -0.66, 2.5, 0.8, 0.56, [0.55, 0.45, 0.32, 1], 0, { tex: mat.wood, tile: 2 });
      B(-0.15, 0.08, -0.66, 2.54, 0.04, 0.6, [0.2, 0.2, 0.22, 1], 0, { tex: mat.tile, tile: 1.5 });
      for (var dr = 0; dr < 6; dr++) { B(-1.25 + dr * 0.42, -0.33, -0.375, 0.4, 0.74, 0.01, [0.62, 0.5, 0.36, 1]); B(-1.12 + dr * 0.42, -0.1, -0.365, 0.1, 0.015, 0.02, [0.8, 0.8, 0.8, 1]); }
      for (var uc = 0; uc < 5; uc++) { B(-1.2 + uc * 0.5, 0.75, -0.78, 0.48, 0.5, 0.32, [0.95, 0.94, 0.9, 1]); B(-1.2 + uc * 0.5, 0.58, -0.61, 0.12, 0.015, 0.02, [0.7, 0.7, 0.7, 1]); }
      // gas stove with a pressure cooker letting off steam, and a kettle
      B(-0.75, 0.12, -0.7, 0.6, 0.05, 0.4, [0.15, 0.15, 0.16, 1]);
      [-0.9, -0.6].forEach(function (bx) { C(bx, 0.15, -0.7, 0.14, 0.01, [0.3, 0.3, 0.3, 1]); r.add({ mesh: 'disc', m: self._bm(M.trs(bx, 0.156, -0.7, 0, 0, 0, 0.11)), color: [0.3, 0.5, 1, 0.5 + 0.2 * Math.sin(t * 17 + bx)], add: 1, unlit: 1 }); });
      C(-0.9, 0.24, -0.7, 0.2, 0.17, [0.78, 0.78, 0.8, 1], { tex: mat.metal, tile: 1 }); C(-0.9, 0.33, -0.7, 0.03, 0.04, [0.15, 0.15, 0.15, 1]);
      add('box', M.trs(-0.78, 0.31, -0.7, 0, 0, 0, 0.16, 0.02, 0.03), [0.12, 0.12, 0.12, 1]);
      this._steam(add, -0.9, 0.36, -0.7, t * 1.6); this._steam(add, -0.9, 0.4, -0.68, t * 1.3 + 0.5);
      add('sphere', M.trs(-0.6, 0.23, -0.7, 0, 0, 0, 0.16, 0.13, 0.16), [0.85, 0.3, 0.2, 1]);
      // spice rack with colourful jars, a steel plate rack and a calendar
      var SP = [[0.85, 0.65, 0.1], [0.75, 0.15, 0.1], [0.45, 0.28, 0.15], [0.2, 0.5, 0.2], [0.95, 0.85, 0.6], [0.55, 0.2, 0.08]];
      B(0.1, 0.25, -0.88, 0.6, 0.02, 0.12, [0.5, 0.35, 0.2, 1]);
      SP.forEach(function (cl, i) { C(-0.14 + i * 0.09, 0.29, -0.88, 0.055, 0.06, [cl[0], cl[1], cl[2], 1]); C(-0.14 + i * 0.09, 0.3, -0.88, 0.062, 0.08, [0.85, 0.9, 0.92, 0.25]); C(-0.14 + i * 0.09, 0.345, -0.88, 0.062, 0.015, [0.7, 0.7, 0.72, 1]); });
      for (var pl = 0; pl < 6; pl++) add('cyl', M.trs(0.55 + pl * 0.04, 0.27, -0.8, 0, 0, Math.PI / 2, 0.24, 0.01, 0.24), [0.8, 0.82, 0.85, 1], null, { tex: mat.metal, tile: 1 });
      windowPane(0.95, 0.32, 0.5, 0.36, 5);
      // the fridge with magnets and a shopping list
      B(1.45, -0.05, -0.55, 0.42, 1.4, 0.5, [0.92, 0.93, 0.94, 1]); B(1.25, 0.25, -0.3, 0.015, 0.25, 0.02, [0.6, 0.6, 0.62, 1]);
      add('box', M.trs(1.45, 0.35, -0.299, 0, 0, 0.05, 0.14, 0.18, 0.002), [0.98, 0.95, 0.65, 1]);
      [[1.38, 0.1, [0.9, 0.2, 0.2]], [1.52, 0.0, [0.2, 0.5, 0.9]], [1.42, -0.15, [0.95, 0.8, 0.2]]].forEach(function (mg) { S(mg[0], mg[1], -0.3, 0.035, [mg[2][0], mg[2][1], mg[2][2], 1]); });
      // a dining chair pulled back, tea cups on the table edge, onions in a basket
      add('box', M.trs(-1.2, -0.3, 0.45, 0, 0.6, 0, 0.4, 0.04, 0.4), [0.55, 0.38, 0.24, 1], null, { tex: mat.wood, tile: 2 });
      add('box', M.trs(-1.32, 0.0, 0.62, 0, 0.6, 0, 0.4, 0.55, 0.04), [0.55, 0.38, 0.24, 1], null, { tex: mat.wood, tile: 2 });
      C(1.1, -0.62, 0.35, 0.3, 0.22, [0.6, 0.45, 0.25, 1]); for (var on2 = 0; on2 < 7; on2++) S(1.03 + (on2 % 3) * 0.07, -0.49 + Math.floor(on2 / 3) * 0.04, 0.3 + (on2 % 2) * 0.08, 0.075, [0.6, 0.22, 0.3, 1]);
      glow('box', M.trs(-0.15, 0.48, -0.62, 0, 0, 0, 1.6, 0.012, 0.03), [1, 0.96, 0.85, 1]);   // under-cabinet light
      return;
    }
  };
})(this);
