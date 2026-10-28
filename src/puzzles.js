/* Scam Detective — a different case puzzle for every investigation, solved on the big board between the crime
 * scene and the evidence board:
 *   timeline  put jumbled events in the right order on a clock line
 *   torn      fit torn strips of paper back together (some strips are from other papers)
 *   money     follow the money: pick what happened next in a flow chart
 *   match     compare handwriting samples with the note found at the scene
 * Every type is played the same way with a finger or the mouse: tap the piece that comes next. */
(function (root) {
  'use strict';
  var M = root.M3, Game = root.Game, U = Game.U, T = root.I18N.T, rr = U.rr, wrapLines = U.wrapLines, FONT = U.FONT, now = U.now;
  var BW = 1200, BH = 785;

  function shuffled(n, seed) {   // stable shuffle so options keep their places
    var a = []; for (var i = 0; i < n; i++) a.push(i);
    var s = seed * 9301 + 49297;
    for (i = n - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; var j = Math.floor(s / 233280 * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  /** All the tappable options: real pieces plus decoys, in a fixed shuffled order. */
  Game.prototype._pzOptions = function () {
    var P = this.inv().puzzle; if (!P) return [];
    if (P.type === 'match') return P.options.map(function (o, i) { return { i: i, text: o.text, real: o.id === P.answer ? 0 : -1, opt: o }; });
    var all = P.pieces.map(function (t, i) { return { text: t, real: i }; }).concat((P.decoys || []).map(function (t) { return { text: t, real: -1 }; }));
    return shuffled(all.length, this.cur.idx + 3).map(function (k, i) { var o = all[k]; o.i = i; return o; });
  };
  Game.prototype._pzStart = function () { var c = this.cur; c.pz = c.pz || { n: 0, wrong: null, done: false }; this._invStage('puzzle'); };
  Game.prototype._pzTap = function (i) {
    var c = this.cur, P = this.inv().puzzle, o = this._pzOptions()[i]; if (!P || !c.pz || c.pz.done || !o) return;
    var need = P.type === 'match' ? 1 : P.pieces.length;
    if (o.real === c.pz.n) {
      c.pz.n++; c.pz.wrong = null; c.points += 30; this.sound.correct(); c.pz.lastT = now();
      this._burst('sparkle', this._world([0, 0.22, -0.2]));
      if (c.pz.n >= need) { c.pz.done = true; c.points += 70; if (this.sound.twang) this.sound.twang(); this._burst('confetti', this._world([0, 0.3, -0.2])); }
    } else if (o.real >= 0 && o.real < c.pz.n) return;   // already placed
    else { c.pz.wrong = i; c.pz.wrongT = now(); c.points = Math.max(0, c.points - 10); c.mistakes += 0.25; this.sound.wrong(); }
    this._save();
  };
  Game.prototype._pzReadText = function () {
    var P = this.inv().puzzle, c = this.cur; if (!P) return '';
    return c.pz && c.pz.done ? T('Solved! ') + P.lesson : P.title + '. ' + P.intro;
  };

  function hand(g, text, x, y, h, size) {   // three different handwritings
    var st = [{ slant: 0, font: '500 ', col: '#22356f', under: 0 }, { slant: -0.38, font: '700 ', col: '#1b2a5a', under: 2 }, { slant: 0.22, font: '400 ', col: '#3b2b6a', under: 1 }][h];
    g.save(); g.translate(x, y); g.transform(1, 0, st.slant, 1, 0, 0);
    g.fillStyle = st.col; g.font = st.font + 'italic ' + size + 'px "Segoe Script", "Bradley Hand", "Comic Sans MS", cursive, ' + FONT; g.fillText(text, 0, 0);
    var w = g.measureText(text).width; g.strokeStyle = st.col; g.lineWidth = h === 1 ? 4 : 2.5;
    for (var u = 0; u < st.under; u++) { g.beginPath(); g.moveTo(-4, 12 + u * 9); g.quadraticCurveTo(w / 2, 18 + u * 9, w + 6, 9 + u * 9); g.stroke(); }
    g.restore();
  }
  function tornStrip(g, x, y, w, h, seed, fill) {
    g.beginPath(); var s = seed;
    function r1() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    g.moveTo(x, y + r1() * 6); for (var k = 1; k <= 14; k++) g.lineTo(x + w * k / 14, y + r1() * 8 - 2);
    g.lineTo(x + w, y + h); for (k = 13; k >= 0; k--) g.lineTo(x + w * k / 14, y + h - r1() * 8 + 2);
    g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = 'rgba(80,60,30,.35)'; g.lineWidth = 1.5; g.stroke();
  }

  Game.prototype._invDrawPuzzle = function (hover) {
    var c = this.cur, v = this.inv(), P = v.puzzle, pz = c.pz || { n: 0 };
    if (!this.boardCv) { this.boardCv = U.mk(BW, BH); this.boardTex = this.r.texture(this.boardCv); }
    var shake = pz.wrong !== null && pz.wrongT && now() - pz.wrongT < 0.45, pop = pz.lastT && now() - pz.lastT < 0.5;
    var sig = ['pz', c.idx, pz.n, pz.wrong, pz.done, hover, shake ? Math.floor(now() * 30) : 0, pop ? Math.floor(now() * 30) : 0, root.I18N.lang].join('|');
    if (sig === this.boardSig) return; this.boardSig = sig;
    var g = this.boardCv.getContext('2d'), B = this.boardButtons = [], opts = this._pzOptions(), self = this;
    g.clearRect(0, 0, BW, BH); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    var bg = { timeline: ['#1d2433', '#2b3448'], torn: ['#6b4a2e', '#7d5838'], money: ['#0f3a5a', '#164b72'], match: ['#e9dfc8', '#f3ead5'] }[P.type];
    var gr = g.createLinearGradient(0, 0, 0, BH); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]); g.fillStyle = gr; g.fillRect(0, 0, BW, BH);
    if (P.type === 'money') { g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1; for (var gx = 0; gx < BW; gx += 30) { g.beginPath(); g.moveTo(gx, 0); g.lineTo(gx, BH); g.stroke(); } for (var gy = 0; gy < BH; gy += 30) { g.beginPath(); g.moveTo(0, gy); g.lineTo(BW, gy); g.stroke(); } }
    if (P.type === 'torn') for (var wg = 0; wg < 40; wg++) { g.fillStyle = 'rgba(40,25,10,.12)'; g.fillRect(0, wg * 20 + (wg % 3) * 4, BW, 2); }
    var ink = P.type === 'match' ? '#2a1f0e' : '#fff8e8';
    g.fillStyle = P.type === 'match' ? '#8a5a1a' : '#ffd36b'; g.font = '800 22px ' + FONT; g.fillText(T('CASE PUZZLE'), 40, 44);
    g.fillStyle = ink; g.font = '800 40px ' + FONT; g.fillText(P.title, 40, 90);
    function optBox(o, x, y, w, h, draw) {
      var placed = o.real >= 0 && o.real < pz.n, wrong = pz.wrong === o.i && shake, hov = hover === 'pz:' + o.i;
      if (placed) return;
      var dx = wrong ? Math.sin(now() * 60) * 8 : 0;
      g.save(); g.translate(dx, hov ? -3 : 0); draw(x, y, w, h, hov, pz.wrong === o.i); g.restore();
      if (!pz.done) B.push({ id: 'pz:' + o.i, x: x, y: y, w: w, h: h });
    }
    function card(x, y, w, h, text, hov, bad, style) {
      rr(g, x, y, w, h, 14); g.fillStyle = bad ? '#ffe3dc' : hov ? '#fffbe6' : '#fffdf7'; g.fill();
      g.lineWidth = hov ? 4 : 2; g.strokeStyle = bad ? '#c62b23' : hov ? '#e0a020' : 'rgba(0,0,0,.2)'; g.stroke();
      g.fillStyle = '#1b1d24'; g.font = (style || '600 24px ') + FONT;
      var L = wrapLines(g, text, w - 28).slice(0, 2); L.forEach(function (l, k) { g.fillText(l, x + 14, y + h / 2 + 8 - (L.length - 1) * 14 + k * 28); });
    }

    if (P.type === 'timeline') {
      var n = P.pieces.length, top = 150, step = Math.min(118, (BH - top - 40) / n), lx = 660;
      g.strokeStyle = 'rgba(255,211,107,.6)'; g.lineWidth = 6; g.beginPath(); g.moveTo(lx, top + 10); g.lineTo(lx, top + step * (n - 1) + 40); g.stroke();
      for (var k = 0; k < n; k++) {
        var yy = top + k * step, done = k < pz.n;
        g.beginPath(); g.arc(lx, yy + 30, 14, 0, 7); g.fillStyle = done ? '#ffd36b' : k === pz.n && !pz.done ? '#fff' : 'rgba(255,255,255,.25)'; g.fill();
        if (done) { var sc = pop && k === pz.n - 1 ? 1 + 0.08 * Math.sin((now() - pz.lastT) * 12) : 1; g.save(); g.translate(lx + 30, yy); g.scale(sc, sc); card(0, 0, 480, 62, P.pieces[k], false, false, '700 22px '); g.restore(); }
        else if (k === pz.n && !pz.done) { g.setLineDash([10, 8]); rr(g, lx + 30, yy, 480, 62, 14); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 3; g.stroke(); g.setLineDash([]);
          g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '600 22px ' + FONT; g.fillText(T('What happened next?'), lx + 50, yy + 39); }
      }
      opts.forEach(function (o, i) { optBox(o, 40, 130 + i * 92, 560, 80, function (x, y, w, h, hov, bad) { card(x, y, w, h, o.text, hov, bad); }); });
    } else if (P.type === 'torn') {
      var px = 640, pw = 500, rowH = 74, ptop = 140, total = P.pieces.length;
      g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 18; rr(g, px - 10, ptop - 20, pw + 20, total * rowH + 40, 6); g.fillStyle = 'rgba(255,250,235,.18)'; g.fill(); g.restore();
      for (var tk = 0; tk < total; tk++) {
        var ty = ptop + tk * rowH;
        if (tk < pz.n) { tornStrip(g, px, ty, pw, rowH - 4, tk * 7 + 3, '#fbf6e6'); g.fillStyle = tk === 0 ? '#7a1010' : '#2a2620'; g.font = (tk === 0 ? '900 30px ' : '700 28px ') + '"Courier New", monospace'; g.fillText(P.pieces[tk], px + 22, ty + 46); }
        else { g.setLineDash([8, 8]); g.strokeStyle = 'rgba(255,240,210,.45)'; g.lineWidth = 2; g.strokeRect(px, ty, pw, rowH - 6); g.setLineDash([]); }
      }
      opts.forEach(function (o, i) {
        var rot = ((i * 37) % 9 - 4) * 0.012, ox = 40 + (i % 2) * 14, oy = 130 + i * 98;
        optBox(o, ox, oy, 540, 76, function (x, y, w, h, hov, bad) {
          g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot); tornStrip(g, -w / 2, -h / 2, w, h, i * 11 + 5, bad ? '#ffd9cf' : hov ? '#fffbe0' : ['#f5efdc', '#fbf3e4', '#f1ead6', '#fdf0e8'][i % 4]);
          g.fillStyle = '#2a2620'; g.font = '700 25px "Courier New", monospace'; g.fillText(o.text, -w / 2 + 20, 9); g.restore();
        });
      });
    } else if (P.type === 'money') {
      var nodes = [P.start].concat(P.pieces), cols = 3, nw = 330, nh = 96, gapX = 60, ox0 = 40, oy0 = 130;
      function pos(k) { var row = Math.floor(k / cols), col = k % cols; if (row % 2) col = cols - 1 - col; return [ox0 + col * (nw + gapX), oy0 + row * (nh + 50)]; }
      for (var mk = 0; mk < nodes.length; mk++) {
        var p0 = pos(mk);
        if (mk > 0) { var pp = pos(mk - 1), ax = pp[0] + nw / 2, ay = pp[1] + nh / 2, bx = p0[0] + nw / 2, by = p0[1] + nh / 2;
          g.strokeStyle = mk <= pz.n ? '#5fe39b' : 'rgba(255,255,255,.3)'; g.lineWidth = 6; g.beginPath();
          if (ay === by) { var dir = bx > ax ? 1 : -1; g.moveTo(ax + dir * nw / 2, ay); g.lineTo(bx - dir * nw / 2 - dir * 6, by); g.stroke(); g.beginPath(); g.moveTo(bx - dir * nw / 2, by); g.lineTo(bx - dir * nw / 2 - dir * 18, by - 11); g.lineTo(bx - dir * nw / 2 - dir * 18, by + 11); g.fillStyle = g.strokeStyle; g.fill(); }
          else { g.moveTo(ax, ay + nh / 2); g.lineTo(bx, by - nh / 2 - 6); g.stroke(); g.beginPath(); g.moveTo(bx, by - nh / 2); g.lineTo(bx - 11, by - nh / 2 - 18); g.lineTo(bx + 11, by - nh / 2 - 18); g.fillStyle = g.strokeStyle; g.fill(); } }
        var known = mk === 0 || mk <= pz.n;
        rr(g, p0[0], p0[1], nw, nh, 16); g.fillStyle = mk === 0 ? '#ffd36b' : known ? '#e9fff2' : 'rgba(255,255,255,.08)'; g.fill();
        g.lineWidth = 3; g.strokeStyle = known ? 'rgba(0,0,0,.2)' : 'rgba(255,255,255,.4)'; if (!known) g.setLineDash([10, 8]); g.stroke(); g.setLineDash([]);
        if (known) { g.fillStyle = '#10202e'; g.font = '700 23px ' + FONT; var NL = wrapLines(g, nodes[mk], nw - 28).slice(0, 3); NL.forEach(function (l, q) { g.fillText(l, p0[0] + 14, p0[1] + nh / 2 + 8 - (NL.length - 1) * 13 + q * 26); }); }
        else { g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '800 44px ' + FONT; g.textAlign = 'center'; g.fillText('?', p0[0] + nw / 2, p0[1] + nh / 2 + 15); g.textAlign = 'left'; }
      }
      var rows = Math.ceil(nodes.length / cols), oy = oy0 + rows * (nh + 50) + 6;
      g.fillStyle = '#bfe0ff'; g.font = '600 22px ' + FONT; if (!pz.done) g.fillText(T('Where did the money go next? Tap one:'), 40, oy); oy += 16;
      opts.forEach(function (o, i) { optBox(o, 40 + (i % 2) * 570, oy + Math.floor(i / 2) * 76, 550, 66, function (x, y, w, h, hov, bad) { card(x, y, w, h, '₹ → ' + o.text, hov, bad, '600 22px '); }); });
    } else if (P.type === 'match') {
      // the sticky note from the scene, and three handwriting samples underneath
      g.save(); g.translate(600, 210); g.rotate(-0.03); g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 14; g.fillStyle = '#fde68a'; g.fillRect(-190, -70, 380, 140); g.restore();
      g.fillStyle = '#6b5a1a'; g.font = '700 18px ' + FONT; g.fillText(T('Sticky note from the laptop'), 425, 160);
      hand(g, P.sample, 440, 235, 1, 42);
      g.fillStyle = '#5a4630'; g.font = '600 22px ' + FONT; if (!pz.done) g.fillText(T('Which sample was written by the same hand? Tap it.'), 40, 330);
      opts.forEach(function (o, i) {
        var x = 40 + i * 380, y = 360, sel = pz.done && o.real === 0;
        if (sel) { rr(g, x - 6, y - 6, 362, 372, 20); g.fillStyle = '#5fe39b'; g.fill(); }
        optBox(o, x, y, 350, 360, function (x2, y2, w, h, hov, bad) {
          rr(g, x2, y2, w, h, 16); g.fillStyle = bad ? '#ffe3dc' : '#fffdf7'; g.fill(); g.lineWidth = hov ? 5 : 2; g.strokeStyle = bad ? '#c62b23' : hov ? '#e0a020' : 'rgba(0,0,0,.2)'; g.stroke();
          g.fillStyle = '#6b6f7a'; g.font = '700 18px ' + FONT; g.fillText(o.opt.from.toUpperCase(), x2 + 18, y2 + 34);
          for (var ln = 0; ln < 6; ln++) { g.fillStyle = 'rgba(80,120,200,.18)'; g.fillRect(x2 + 14, y2 + 120 + ln * 36, w - 28, 2); }
          hand(g, o.text, x2 + 24, y2 + 150, o.opt.hand, 30);
          hand(g, o.text.split(' ')[0], x2 + 24, y2 + 240, o.opt.hand, 30);
          g.fillStyle = '#1b1d24'; g.font = '800 24px ' + FONT; g.fillText(o.opt.name, x2 + 18, y2 + h - 24);
        });
        if (sel) { g.fillStyle = '#fffdf7'; rr(g, x, y, 350, 360, 16); g.fill(); hand(g, o.text, x + 24, y + 150, o.opt.hand, 30); g.fillStyle = '#178a50'; g.font = '900 30px ' + FONT; g.fillText('✓ ' + o.opt.name, x + 18, y + 336); }
      });
    }
    if (pz.done) {   // a stamp across the board
      g.save(); g.translate(BW - 200, 66); g.scale(0.78, 0.78); g.rotate(-0.08); g.globalAlpha = 0.92; g.lineWidth = 8; g.strokeStyle = '#5fe39b'; rr(g, -170, -44, 340, 88, 14); g.stroke();
      g.fillStyle = '#5fe39b'; g.font = '900 52px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(T('SOLVED'), 0, 4); g.restore(); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    }
    this.r.updateTexture(this.boardTex, this.boardCv);
  };
})(this);
