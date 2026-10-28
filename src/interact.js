/* Scam Detective — hands-on interactions that replace "tap the text":
 *  1. Crime scene: swipe a fingertip (or drag the mouse) across a document like a highlighter to mark evidence.
 *  2. Evidence room: grab the loose red string on the question and pull it to the evidence that answers it.
 *  3. Interrogation: evidence cards lie on the table; pick one up and slam it down in front of the suspect.
 * Tapping still works everywhere, for accessibility. */
(function (root) {
  'use strict';
  var M = root.M3, Game = root.Game, U = Game.U, T = root.I18N.T, FONT = U.FONT, now = U.now, ease = U.ease, rr = U.rr, wrapLines = U.wrapLines;
  var SLAM_TO = [0, 0.012, -0.16];          // where a slammed card lands, just in front of the suspect
  var ROW_Z = 0.085, CW = 0.09, CH = 0.058;  // evidence cards lying on the interrogation table

  function hitPanel(pn, o, d) {
    var po = M.point(pn.inv, o), pd = M.dir(pn.inv, d); if (pd[2] >= 0) return null;
    var t = -po[2] / pd[2], hx = po[0] + pd[0] * t, hy = po[1] + pd[1] * t;
    return { x: (hx + 0.5) * pn.cw, y: (0.5 - hy) * pn.ch, inside: Math.abs(hx) <= 0.5 && Math.abs(hy) <= 0.5 };
  }
  function btnAtPx(btns, x, y) { for (var i = 0; i < (btns || []).length; i++) { var b = btns[i]; if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b; } return null; }
  Game.prototype._panelNamed = function (name) { return this._panels().filter(function (p) { return p.name === name; })[0]; };
  Game.prototype._local = function (ow, dw) { return { o: M.point(this.invBoard, ow), d: M.dir(this.invBoard, dw) }; };

  /* ---------- 1. highlighter ---------- */
  Game.prototype._canMark = function () { var c = this.cur; return c.mode === 'inv' && this.state === 'scene' && c.open && !this._isLocked(this._item(c.open)) && this.anim.card >= 1; };
  Game.prototype._markAt = function (stroke, x, y) {
    var last = stroke.pts[stroke.pts.length - 1];
    if (!last || Math.hypot(x - last[0], y - last[1]) > 6) { stroke.pts.push([Math.round(x), Math.round(y)]); if (stroke.pts.length > 80) stroke.pts.shift(); }
    var b = btnAtPx(this.cardButtons, x, y);
    if (b && !/^k/.test(b.id) && !stroke.seen[b.id]) { stroke.seen[b.id] = 1; this.invPanelTap('card', b.id); }
    this.cur.markLive = stroke.pts; this.cur.markN = (this.cur.markN || 0) + 1;
  };
  Game.prototype._markEnd = function (stroke) {
    var c = this.cur; c.markLive = null;
    if (stroke && stroke.pts.length > 1 && c.open) { c.marks = c.marks || {}; var L = c.marks[c.open] = c.marks[c.open] || []; L.push(stroke.pts); if (L.length > 8) L.shift(); }
    c.markN = (c.markN || 0) + 1; this._save();
  };
  /** Yellow highlighter strokes on the open document (called while drawing the card). */
  Game.prototype._drawMarks = function (g, it) {
    var c = this.cur, strokes = ((c.marks && c.marks[it.id]) || []).concat(c.markLive ? [c.markLive] : []);
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 38; g.strokeStyle = 'rgba(255,214,0,0.5)';
    strokes.forEach(function (pts) { if (pts.length < 2) return; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); pts.forEach(function (q) { g.lineTo(q[0], q[1]); }); g.stroke(); });
    g.restore();
  };

  /* ---------- 3. evidence cards on the interrogation table ---------- */
  Game.prototype._evcList = function () { var c = this.cur; return (c.found || []).slice().sort().concat((c.testimony || []).slice().sort(), ['believe']); };
  Game.prototype._evcSlot = function (id) {
    var L = this._evcList(), i = L.indexOf(id), n = L.length, span = Math.min(0.4, (n - 1) * 0.075);
    return [-0.07 + (n > 1 ? -span / 2 + i * span / (n - 1) : 0), 0.0056, ROW_Z + (i % 2) * 0.03];
  };
  Game.prototype._evcActive = function () { var c = this.cur; return c.mode === 'inv' && this.state === 'interro' && !c.sdone && (c.iphase || 'stmt') === 'stmt'; };
  Game.prototype._evcTexture = function (id) {
    var v = this.inv(), key = root.I18N.lang + '|' + v.id + '|' + id; this._evcTex = this._evcTex || {};
    if (this._evcTex[key]) return this._evcTex[key];
    var cv = U.mk(384, 248), g = cv.getContext('2d'), believe = id === 'believe';
    rr(g, 2, 2, 380, 244, 18); g.fillStyle = believe ? '#e3f6e8' : '#fffdf6'; g.fill(); g.lineWidth = 4; g.strokeStyle = believe ? '#178a50' : '#c9b48a'; g.stroke();
    if (believe) {
      g.fillStyle = '#178a50'; g.textAlign = 'center'; g.font = '900 52px ' + FONT; g.fillText('✓', 192, 96);
      g.font = '800 36px ' + FONT; g.fillText(T('I BELIEVE YOU'), 192, 160); g.font = '500 22px ' + FONT; g.fillStyle = '#3d6b4d'; g.fillText(T('Slam this if the statement is true'), 192, 204);
    } else {
      var e = this._evInfo(id); g.fillStyle = e.testimony ? '#2b6cd4' : '#d4231b'; g.beginPath(); g.arc(352, 30, 10, 0, Math.PI * 2); g.fill();
      if (e.testimony) { g.fillStyle = 'rgba(43,108,212,.08)'; rr(g, 6, 6, 372, 236, 16); g.fill(); }
      g.fillStyle = e.testimony ? '#2b6cd4' : '#6b6f7a'; g.font = '700 22px ' + FONT; g.fillText(e.label, 22, 40);
      g.fillStyle = '#1b1d24'; g.font = '800 30px ' + FONT; wrapLines(g, e.title, 340).slice(0, 2).forEach(function (l, j) { g.fillText(l, 22, 82 + j * 34); });
      g.fillStyle = '#3d4150'; g.font = '500 22px ' + FONT; wrapLines(g, e.text, 340).slice(0, 3).forEach(function (l, j) { g.fillText(l, 22, 160 + j * 27); });
    }
    return (this._evcTex[key] = this.r.texture(cv));
  };
  Game.prototype._evcHit = function (o, d) {
    if (!this._evcActive() || this.cur.slam) return null;
    var self = this, best = null;
    this._evcList().forEach(function (id) {
      var s = self._evcSlot(id), t = M.rayBox(o, d, [s[0] - CW / 2, -0.005, s[2] - CH / 2], [s[0] + CW / 2, 0.03, s[2] + CH / 2]);
      if (t > 0 && (!best || t < best.t)) best = { t: t, type: 'item', item: 'evc:' + id };
    });
    return best;
  };
  /** Throw a card down in front of the suspect; when it lands, it counts as showing that evidence (or believing). */
  Game.prototype._slam = function (id, from) {
    var c = this.cur; if (c.slam || !this._evcActive()) return;
    c.slam = { id: id, from: from || this._evcSlot(id), t0: now() }; c.carry = null;
    this.sound.paper(this._world(c.slam.from));
  };
  Game.prototype._evcUpdate = function () {
    var c = this.cur; if (!c.slam) return;
    var k = (now() - c.slam.t0) / 0.32;
    if (k >= 1 && !c.slam.landed) {
      c.slam.landed = true; var id = c.slam.id, w = this._world(SLAM_TO);
      this.sound.stamp(w); this.shakeUntil = this.time + 0.22; this._burst('sparkle', w, [1, 1, 1]);
      c.tableCard = { id: id, si: c.si, t0: now() };
      this._invAnswer(id === 'believe' ? null : id);
    }
    if (k >= 1.0) c.slam = null;
  };
  Game.prototype._drawEvidenceCards = function (add, t) {
    var c = this.cur, self = this, r = this.r, hv = this._hovered();
    this._evcUpdate();
    if (this.state !== 'interro') return;
    // a card that was slammed stays in front of the suspect: if it was wrong it slides back after a moment
    var tc = c.tableCard && c.tableCard.si === c.si && (c.sdone || now() - c.tableCard.t0 < 1.3) ? c.tableCard.id : null;
    this._evcList().forEach(function (id, i) {
      var s = self._evcSlot(id), pos = s, rx = -Math.PI / 2, ry = ((i * 37) % 7 - 3) * 0.03, lift = 0;
      if (c.slam && c.slam.id === id) {
        var k = Math.min(1, (now() - c.slam.t0) / 0.32), e = ease(k), f = c.slam.from;
        pos = [f[0] + (SLAM_TO[0] - f[0]) * e, f[1] + (SLAM_TO[1] - f[1]) * e + Math.sin(k * Math.PI) * 0.09, f[2] + (SLAM_TO[2] - f[2]) * e]; ry = (1 - e) * ry;
      } else if (c.carry && c.carry.id === id) { pos = c.carry.pos; rx = -Math.PI / 2 + 0.5; }
      else if (tc === id) pos = SLAM_TO;
      else if (!c.sdone && hv.item === 'evc:' + id) lift = 0.01 + 0.004 * Math.sin(t * 6);
      var m = M.trs(pos[0], pos[1] + lift, pos[2], rx, 0, ry, CW, CH, 1);
      self._shadow(pos[0], 0.005, pos[2], CW * 1.3, CH * 1.4, pos[1] > 0.02 ? 0.35 : 0.6, ry);
      add('box', M.mul(m, M.trs(0, 0, -0.0012, 0, 0, 0, 1.03, 1.04, 0.002)), [0.8, 0.75, 0.62, 1]);
      add('quad', m, [1, 1, 1, 1], hv.item === 'evc:' + id && !c.sdone ? [0.12, 0.14, 0.2] : null, { tex: self._evcTexture(id), unlit: 1 });
    });
  };

  /* ---------- desktop gestures (mouse drag) ---------- */
  Game.prototype._gStart = function (src, ow, dw) {
    var c = this.cur; if (!c || c.mode !== 'inv') return false;
    var L = this._local(ow, dw);
    if (this._canMark()) {
      var hc = hitPanel(this._panelNamed('card'), L.o, L.d);
      if (hc && hc.inside) {
        var b0 = btnAtPx(this.cardButtons, hc.x, hc.y);
        if (b0 && /^k/.test(b0.id)) return false;
        this.gest = { kind: 'mark', stroke: { pts: [], seen: {} } }; this._markAt(this.gest.stroke, hc.x, hc.y); return true;
      }
    }
    if (this.state === 'board' && !c.bdone) {
      var bp = this._panelNamed('board'), hb = bp && hitPanel(bp, L.o, L.d), bb = hb && hb.inside && btnAtPx(this.boardButtons, hb.x, hb.y);
      if (bb && bb.id === 'q') { this.gest = { kind: 'string' }; c.strEnd = [hb.x, hb.y]; this.sound.paper(this._world([0, 0.2, -0.2])); return true; }
    }
    if (this._evcActive()) {
      var he = this._evcHit(L.o, L.d);
      if (he) { var id = he.item.slice(4); this.gest = { kind: 'carry', id: id, moved: 0 }; c.carry = { id: id, pos: this._evcSlot(id).slice() }; this.sound.paper(this._world(c.carry.pos)); return true; }
    }
    return false;
  };
  Game.prototype._gMove = function (src, ow, dw) {
    var g = this.gest, c = this.cur; if (!g) return; var L = this._local(ow, dw);
    if (g.kind === 'mark') { var hc = hitPanel(this._panelNamed('card'), L.o, L.d); if (hc && hc.inside) this._markAt(g.stroke, hc.x, hc.y); }
    else if (g.kind === 'string') { var bp = this._panelNamed('board'), hb = bp && hitPanel(bp, L.o, L.d); if (hb) c.strEnd = [Math.max(0, Math.min(U.BOARD.cw, hb.x)), Math.max(0, Math.min(U.BOARD.ch, hb.y))]; }
    else if (g.kind === 'carry' && c.carry && L.d[1] < -0.01) {   // follow the mouse across a plane just above the table
      var tt = (0.06 - L.o[1]) / L.d[1], q = [L.o[0] + L.d[0] * tt, 0.06, L.o[2] + L.d[2] * tt];
      q[0] = Math.max(-0.35, Math.min(0.35, q[0])); q[2] = Math.max(-0.2, Math.min(0.3, q[2]));
      g.moved += Math.hypot(q[0] - c.carry.pos[0], q[2] - c.carry.pos[2]); c.carry.pos = q;
    }
  };
  Game.prototype._gEnd = function (src, ow, dw) {
    var g = this.gest, c = this.cur; this.gest = null; if (!g) return;
    if (g.kind === 'mark') this._markEnd(g.stroke);
    else if (g.kind === 'string') {
      var b = null; if (ow) { var L = this._local(ow, dw), bp = this._panelNamed('board'), hb = bp && hitPanel(bp, L.o, L.d); b = hb && btnAtPx(this.boardButtons, hb.x, hb.y); }
      c.strEnd = null;
      if (b && b.id.indexOf('ev:') === 0) this.invPanelTap('board', b.id); else this.sound.unmark(this._world([0, 0.2, -0.2]));
    } else if (g.kind === 'carry' && c.carry) {
      var p = c.carry.pos;
      if (g.moved < 0.03 || p[2] < 0.0) this._slam(g.id, p.slice());   // a click, or pushed toward the suspect: slam it
      else c.carry = null;                                              // dropped near the row: it slides back
    }
  };

  /* ---------- headset: fingertip drags on panels ---------- */
  Game.prototype._touchPanel = function (p, pn, pl, b) {
    var c = this.cur; if (!c || c.mode !== 'inv') return false;
    var x = (pl[0] + 0.5) * pn.cw, y = (0.5 - pl[1]) * pn.ch;
    if (pn.name === 'card' && this._canMark()) {
      if (b && /^k/.test(b.id)) return false;
      if (!p.mark) p.mark = { pts: [], seen: {} };
      this._markAt(p.mark, x, y); return true;
    }
    if (pn.name === 'board' && this.state === 'board' && !c.bdone) {
      if (!p.str) { if (b && b.id === 'q') { p.str = true; this.sound.paper(this._world([0, 0.2, -0.2])); } else return false; }
      c.strEnd = [x, y]; p.strOver = b; return true;
    }
    return false;
  };
  Game.prototype._touchLift = function (p, name) {
    var c = this.cur;
    if (name === 'card' && p.mark) { var s = p.mark; p.mark = null; this._markEnd(s); }
    if (name === 'board' && p.str) {
      p.str = false; var b = p.strOver; p.strOver = null; c.strEnd = null;
      if (b && b.id.indexOf('ev:') === 0) this.invPanelTap('board', b.id); else this.sound.unmark(this._world([0, 0.2, -0.2]));
    }
  };
  /** Headset: pinch an evidence card to pick it up; let go over the suspect's side of the table to slam it. */
  Game.prototype._evcPinch = function (p, lt) {
    var c = this.cur; if (!this._evcActive() || !p.thumb) return false;
    var th = M.point(this.invBoard, p.thumb), mid = [(lt[0] + th[0]) / 2, (lt[1] + th[1]) / 2, (lt[2] + th[2]) / 2], self = this;
    if (p.pinching && !p.grabEv && !c.slam) {
      this._evcList().forEach(function (id) { var s = self._evcSlot(id); if (!p.grabEv && Math.abs(mid[0] - s[0]) < CW / 2 + 0.02 && Math.abs(mid[2] - s[2]) < CH / 2 + 0.02 && mid[1] < 0.07) p.grabEv = id; });
      if (p.grabEv) { c.carry = { id: p.grabEv, pos: mid }; this.sound.paper(this._world(mid)); }
    } else if (p.grabEv && !p.pinching) {
      var id2 = p.grabEv; p.grabEv = null;
      if (c.carry && c.carry.pos[2] < 0.02) this._slam(id2, c.carry.pos.slice()); else c.carry = null;
    }
    if (p.grabEv && c.carry) { c.carry.pos = mid; p.suppressRay = true; return true; }
    return false;
  };
})(this);
