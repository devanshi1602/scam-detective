/* Scam Detective — desk scene, message cards, stamps, panels, hands/controller/mouse input, WebXR. */
(function (root) {
  'use strict';
  var M = root.M3, C = root.Cases, Renderer = root.Renderer, Sound = root.Sound;

  var SAVE = 'scam-detective-v1', SKY = [0.07, 0.075, 0.1];
  var CARD = { w: 0.22, h: 0.275, cw: 720, ch: 900, pos: [0, 0.135, -0.06], rx: -0.32 };
  var INFO = { w: 0.21, h: 0.25, cw: 840, ch: 1000, pos: [0.255, 0.135, -0.035], rx: -0.22, ry: -0.42 };
  var TRAY = [-0.225, 0.012, -0.03], PILE = [-0.225, 0.006, 0.1];
  var STAMPS = { scam: { x: 0.085, z: 0.105, col: [0.78, 0.16, 0.14], label: 'SCAM' }, safe: { x: 0.185, z: 0.105, col: [0.12, 0.55, 0.32], label: 'SAFE' } };
  var TYPES = {
    sms: { bar: '#2d5fd3', app: 'Messages' }, email: { bar: '#b4471b', app: 'Mail' }, chat: { bar: '#0f766e', app: 'Chat' },
    upi: { bar: '#5b2bb5', app: 'ZappaPay' }, social: { bar: '#b0215f', app: 'Pixgram' }, alert: { bar: '#a61b1b', app: 'Browser' } };
  var FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  function load() { try { return JSON.parse(root.localStorage.getItem(SAVE)) || {}; } catch (e) { return {}; } }
  function persist(d) { try { root.localStorage.setItem(SAVE, JSON.stringify(d)); } catch (e) { /* storage blocked */ } }
  function yesterday(key) { var d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() - 1); return C.dateKey(d); }
  function ease(t) { t = M.clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function wrapLines(g, text, maxW) {
    var words = String(text).split(' '), lines = [], line = '';
    words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line); return lines;
  }

  function Game(canvas) {
    this.canvas = canvas; this.r = new Renderer(canvas); this.gl = this.r.gl; this.sound = new Sound();
    var s = load();
    this.p = s.profile || { streak: 0, lastDaily: null, totalCorrect: 0, totalPoints: 0, cases: 0, tutorialDone: false, recent: [] };
    this.settings = s.settings || { sound: true, big: false };
    this.sound.enabled = this.settings.sound;
    this.board = { pos: [0, -0.38, -0.44], yaw: 0 };
    this.cardCv = mk(CARD.cw, CARD.ch); this.infoCv = mk(INFO.cw, INFO.ch); this.cardSig = this.infoSig = '';
    this.cardTex = this.r.texture(this.cardCv); this.infoTex = this.r.texture(this.infoCv);
    this.labelTex = {}; for (var k in STAMPS) this.labelTex[k] = this.r.texture(labelCanvas(STAMPS[k]));
    this.cardButtons = []; this.infoButtons = []; this.pointers = {}; this.time = 0; this.xr = null;
    this.anim = { card: 1, cardT0: 0, out: 0, outT0: 0, stamp: null };
    this.cam = { yaw: 0, pitch: 0.62, dist: 0.62, target: [0.02, -0.29, -0.47] };
    this._resume(s.current);
    this._bindDesktop();
    this._last = performance.now(); var self = this; this._raf = function (t) { self._desktopFrame(t); };
    requestAnimationFrame(this._raf);
  }
  function now() { return performance.now() / 1000; }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function labelCanvas(st) {
    var c = mk(300, 120), g = c.getContext('2d'), col = 'rgb(' + st.col.map(function (v) { return Math.round(v * 255); }).join(',') + ')';
    rr(g, 6, 6, 288, 108, 18); g.fillStyle = '#f7f2e6'; g.fill(); g.lineWidth = 8; g.strokeStyle = col; g.stroke();
    g.fillStyle = col; g.font = '800 72px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(st.label, 150, 64);
    return c;
  }

  /* ======================= case flow ======================= */
  Game.prototype._resume = function (cur) {
    var today = C.dateKey();
    if (cur && cur.mode === 'training') { this.cur = cur; this._enterMessage(true); return; }
    if (cur && cur.mode === 'daily' && cur.key === today) { this.cur = cur; if (cur.finished) { this.msg = C.BY_ID[cur.ids[cur.idx]] || C.BY_ID.S1; this.state = 'summary'; } else this._enterMessage(true); return; }
    this.newDaily();
  };
  Game.prototype.newDaily = function () {
    var c = C.dailyCase(C.dateKey(), !this.p.tutorialDone);
    this.cur = { mode: 'daily', key: c.key, ids: c.ids, idx: 0, results: [], flagged: [], verdict: null, hints: 0, finished: false };
    this._enterMessage(false);
  };
  Game.prototype.training = function () {
    var id = C.trainingPick(this.p.recent, Date.now() & 0x7fffffff);
    this.cur = { mode: 'training', ids: [id], idx: 0, results: [], flagged: [], verdict: null, hints: 0, n: (this.cur && this.cur.mode === 'training' ? this.cur.n + 1 : 1) };
    this._enterMessage(false);
  };
  Game.prototype._enterMessage = function (resumed) {
    this.msg = C.BY_ID[this.cur.ids[this.cur.idx]] || C.BY_ID.S1;
    this.state = this.cur.verdict === null || this.cur.verdict === undefined ? 'reading' : 'verdict';
    this.hintKey = null; this.legitHint = false;
    if (!resumed) { this.anim.card = 0; this.anim.cardT0 = now(); this.sound.paper(this._world(TRAY)); }
    this._save();
  };
  Game.prototype.toggleFlag = function (key) {
    if (this.state !== 'reading' || this.anim.card < 1 || !this.msg.clues[key]) return;
    var f = this.cur.flagged, i = f.indexOf(key), wp = this._world(CARD.pos);
    if (i >= 0) { f.splice(i, 1); this.sound.unmark(wp); } else { f.push(key); this.sound.mark(wp); }
    this._save();
  };
  Game.prototype.stamp = function (which) {
    if (this.state !== 'reading' || this.anim.card < 1 || this.anim.stamp) return;
    var self = this; this.anim.stamp = { which: which, t0: now() };
    this.sound.stamp(this._world([STAMPS[which].x, 0.03, STAMPS[which].z]));
    setTimeout(function () { self._verdict(which === 'scam'); }, 180);
  };
  Game.prototype._verdict = function (saidScam) {
    var res = C.score(this.msg, saidScam, this.cur.flagged);
    res.points = Math.max(0, res.points - this.cur.hints * 10);
    this.cur.verdict = saidScam; this.cur.results.push({ id: this.msg.id, correct: res.correct, points: res.points, found: res.found.length });
    this.lastRes = res; this.state = 'verdict';
    if (res.correct) { this.p.totalCorrect++; this.sound.correct(); } else this.sound.wrong();
    this.p.totalPoints += res.points;
    this.p.recent = (this.p.recent || []).concat(this.msg.id).slice(-10);
    if (this.msg.tutorial) this.p.tutorialDone = true;
    this._save();
  };
  Game.prototype.next = function () {
    if (this.state !== 'verdict') return;
    this.anim.out = 0.0001; this.anim.outT0 = now(); var self = this;
    this.sound.paper(this._world(PILE));
    setTimeout(function () {
      self.anim.out = 0;
      if (self.cur.mode === 'training') return self.training();
      if (self.cur.idx + 1 < self.cur.ids.length) {
        self.cur.idx++; self.cur.flagged = []; self.cur.verdict = null; self.cur.hints = 0; self._enterMessage(false);
      } else self._closeCase();
    }, 420);
  };
  Game.prototype._closeCase = function () {
    var p = this.p, k = this.cur.key;
    this.cur.finished = true; this.state = 'summary';
    if (p.lastDaily !== k) { p.streak = p.lastDaily === yesterday(k) ? p.streak + 1 : 1; p.lastDaily = k; p.cases++; }
    this.sound.closed(); this._save();
  };
  Game.prototype.hint = function () {
    if (this.state !== 'reading') return;
    var f = this.cur.flagged, msg = this.msg;
    if (!msg.scam) { this.legitHint = true; return; }
    var miss = C.redFlags(msg).filter(function (k) { return f.indexOf(k) < 0; });
    if (!miss.length) { this.legitHint = true; return; }
    this.hintKey = miss[0]; this.cur.hints++; this._save();
  };
  Game.prototype._save = function () { persist({ profile: this.p, settings: this.settings, current: this.cur }); };

  Game.prototype.button = function (id) {
    this.sound.ui();
    var b = this.board;
    switch (id) {
      case 'next': this.next(); break;
      case 'hint': this.hint(); break;
      case 'read': this.readAloud(); break;
      case 'training': this.training(); break;
      case 'replay': this.newDaily(); break;
      case 'down': b.pos[1] -= 0.03; break;
      case 'up': b.pos[1] += 0.03; break;
      case 'center': this.needsRecenter = true; if (!this.xr) this.board = { pos: [0, -0.38, -0.44], yaw: 0 }; break;
      case 'sound': this.settings.sound = !this.settings.sound; this.sound.setEnabled(this.settings.sound); if (!this.settings.sound) this.stopSpeech(); this._save(); break;
      case 'big': this.settings.big = !this.settings.big; this._save(); break;
    }
  };
  Game.prototype.readAloud = function () {
    var ss = root.speechSynthesis; if (!ss || !root.SpeechSynthesisUtterance) return;
    if (ss.speaking) { ss.cancel(); return; }
    var m = this.msg, text;
    if (this.state === 'summary') text = 'Case closed. ' + this._summaryLine();
    else if (this.state === 'verdict') text = (this.lastRes && this.lastRes.correct ? 'Correct. ' : 'Not quite. ') + 'This was ' + (m.scam ? 'a scam. ' : 'a real message. ') + m.why + ' Tip: ' + m.tip;
    else text = 'Message from ' + m.from + '. ' + (m.subject ? 'Subject: ' + m.subject + '. ' : '') + C.plainText(m) + (m.action ? ' Button: ' + m.action + '.' : '');
    var u = new root.SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, '')); u.rate = 0.98; ss.speak(u);
  };
  Game.prototype.stopSpeech = function () { if (root.speechSynthesis) root.speechSynthesis.cancel(); };

  /* ======================= transforms ======================= */
  Game.prototype._boardMats = function () {
    this.boardMat = M.trs(this.board.pos[0], this.board.pos[1], this.board.pos[2], 0, this.board.yaw, 0, 1);
    this.invBoard = M.invert(this.boardMat);
    // card: slides in from the tray (lying flat) to standing on its stand; slides out to the pile
    var a = ease(this.anim.card), from = this.anim.out > 0 ? null : TRAY, p, rx;
    if (this.anim.out > 0) { var o = ease(this.anim.out); p = [M.lerp(CARD.pos[0], PILE[0], o), M.lerp(CARD.pos[1], PILE[1] + 0.002, o), M.lerp(CARD.pos[2], PILE[2], o)]; rx = M.lerp(CARD.rx, -Math.PI / 2, o); }
    else { p = [M.lerp(from[0], CARD.pos[0], a), M.lerp(from[1], CARD.pos[1], a) + Math.sin(a * Math.PI) * 0.05, M.lerp(from[2], CARD.pos[2], a)]; rx = M.lerp(-Math.PI / 2, CARD.rx, a); }
    var sc = this.settings.big ? 1.15 : 1;
    this.cardLocal = M.trs(p[0], p[1] + (sc - 1) * 0.02, p[2], rx, 0, 0, CARD.w * sc, CARD.h * sc, 1);
    this.infoLocal = M.trs(INFO.pos[0], INFO.pos[1], INFO.pos[2], INFO.rx, INFO.ry, 0, INFO.w, INFO.h, 1);
    this.invCard = M.invert(this.cardLocal); this.invInfo = M.invert(this.infoLocal);
  };
  Game.prototype._world = function (p) { if (!this.boardMat) this._boardMats(); return M.point(this.boardMat, p); };
  Game.prototype._bm = function (l) { return M.mul(this.boardMat, l); };

  /* ======================= card drawing ======================= */
  Game.prototype._drawCard = function (hoverKey) {
    var cur = this.cur, msg = this.msg, st = this.state;
    var sig = [msg.id, st, cur.flagged.join(','), cur.verdict, hoverKey, this.hintKey, this.state === 'summary' ? this.p.totalCorrect : ''].join('|');
    if (sig === this.cardSig) return; this.cardSig = sig;
    var g = this.cardCv.getContext('2d'), W = CARD.cw, H = CARD.ch, B = this.cardButtons = [];
    g.clearRect(0, 0, W, H);
    if (st === 'summary') { this._drawCertificate(g, W, H); this.r.updateTexture(this.cardTex, this.cardCv); return; }
    var T = TYPES[msg.type] || TYPES.sms;
    rr(g, 4, 4, W - 8, H - 8, 34); g.fillStyle = '#fbfaf7'; g.fill();
    g.save(); rr(g, 4, 4, W - 8, H - 8, 34); g.clip();
    g.fillStyle = T.bar; g.fillRect(0, 0, W, 92);
    g.fillStyle = '#fff'; g.font = '700 36px ' + FONT; g.textBaseline = 'middle'; g.fillText(T.app, 40, 48);
    g.font = '500 28px ' + FONT; g.textAlign = 'right'; g.fillText(msg.time, W - 40, 48); g.textAlign = 'left';
    g.restore();
    var y = 120, self = this;
    function hot(key, x, yy, w, h) { B.push({ id: key, x: x, y: yy, w: w, h: h }); }
    // sender row
    if (msg.type !== 'upi') {
      g.fillStyle = T.bar; g.beginPath(); g.arc(78, y + 40, 34, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; g.font = '700 32px ' + FONT; g.textAlign = 'center'; g.fillText(msg.avatar || (msg.type === 'alert' ? '!' : msg.from.replace(/[^A-Za-z+0-9]/, '').charAt(0)), 78, y + 41); g.textAlign = 'left';
      g.fillStyle = '#1b1d24'; g.font = '700 ' + (msg.from.length > 30 ? 25 : 31) + 'px ' + FONT;
      var fl = wrapLines(g, msg.from, W - 170).slice(0, 2);
      fl.forEach(function (l, i) { g.fillText(l, 128, y + 40 + (i - (fl.length - 1) / 2) * 32); });
      if (msg.clues.from) hot('from', 36, y, W - 72, 80);
      y += 100;
    } else {
      g.fillStyle = '#1b1d24'; g.font = '600 30px ' + FONT; g.fillText(msg.amount && msg.body.indexOf('received') >= 0 ? 'Money received' : 'Payment request', 44, y + 24);
      g.font = '800 92px ' + FONT; g.fillStyle = msg.body.indexOf('received') >= 0 ? '#14804a' : '#1b1d24'; g.fillText(msg.amount || '', 44, y + 110);
      y += 170;
    }
    if (msg.subject) { g.fillStyle = '#1b1d24'; g.font = '700 32px ' + FONT; wrapLines(g, msg.subject, W - 88).slice(0, 2).forEach(function (l) { g.fillText(l, 44, y + 20); y += 42; }); y += 12; }
    // body layout
    var fs = 33, lh = 46, maxW = W - 150, bx = msg.type === 'email' || msg.type === 'upi' ? 44 : 72;
    if (msg.type === 'email' || msg.type === 'upi') maxW = W - 88;
    g.font = '400 ' + fs + 'px ' + FONT;
    var toks = []; C.segments(msg.body).forEach(function (s) { if (/^\s/.test(s.text) && toks.length) toks[toks.length - 1].w += ' '; (s.text.match(/\S+\s*/g) || []).forEach(function (w) { toks.push({ w: w, key: s.key }); }); });
    var lines = [[]], x = 0;
    toks.forEach(function (t) { var tw = g.measureText(t.w.trimEnd()).width; if (x + tw > maxW && x > 0) { lines.push([]); x = 0; } lines[lines.length - 1].push({ w: t.w, key: t.key, x: x }); x += g.measureText(t.w).width; });
    var bodyH = lines.length * lh + 36, by = y;
    if (msg.type === 'sms' || msg.type === 'chat' || msg.type === 'social') { rr(g, bx - 22, by - 6, maxW + 44, bodyH, 28); g.fillStyle = msg.type === 'chat' ? '#e2f3ee' : '#eceef3'; g.fill(); }
    if (msg.type === 'alert') { rr(g, bx - 22, by - 6, maxW + 44, bodyH, 18); g.fillStyle = '#fde8e6'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#d33'; g.stroke(); }
    var rects = {};
    lines.forEach(function (ln, li) {
      var ly = by + 12 + li * lh;
      ln.forEach(function (t) {
        var tw = g.measureText(t.w.trimEnd()).width, full = g.measureText(t.w).width;
        if (t.key) { var R = rects[t.key] = rects[t.key] || []; var last = R[R.length - 1];
          if (last && last.line === li) last.w = bx + t.x + tw - last.x; else R.push({ line: li, x: bx + t.x, y: ly, w: tw, h: lh - 4 }); }
        var isLink = t.key && /link/.test(t.key);
        g.fillStyle = isLink ? '#1d4ed8' : '#1b1d24';
        g.textBaseline = 'top'; g.fillText(t.w, bx + t.x, ly + 4);
        if (isLink) g.fillRect(bx + t.x, ly + lh - 8, tw, 2);
        void full;
      });
    });
    g.textBaseline = 'alphabetic';
    Object.keys(rects).forEach(function (k) { rects[k].forEach(function (r) { hot(k, r.x - 6, r.y - 2, r.w + 12, r.h + 4); }); });
    y = by + bodyH + 24;
    if (msg.action) {
      var aw = Math.min(W - 88, g.measureText(msg.action).width + 120), ax = (W - aw) / 2;
      rr(g, ax, y, aw, 84, 20); g.fillStyle = T.bar; g.fill();
      g.fillStyle = '#fff'; g.font = '700 34px ' + FONT; g.textAlign = 'center'; g.fillText(msg.action, W / 2, y + 54); g.textAlign = 'left';
      if (msg.clues.action) hot('action', ax, y, aw, 84);
      y += 104;
    }
    // marks
    var flagged = cur.flagged, after = st === 'verdict';
    function boxesFor(k) { return B.filter(function (b) { return b.id === k; }); }
    B.forEach(function (b) {
      var k = b.id, isF = flagged.indexOf(k) >= 0, real = msg.clues[k].flag;
      if (!after) {
        if (isF) { g.fillStyle = 'rgba(230,40,40,.16)'; rr(g, b.x, b.y, b.w, b.h, 10); g.fill(); g.lineWidth = 5; g.strokeStyle = '#d42a2a'; g.stroke(); }
        else if (k === self.hintKey) { g.setLineDash([12, 8]); g.lineWidth = 5; g.strokeStyle = '#e8a400'; rr(g, b.x, b.y, b.w, b.h, 10); g.stroke(); g.setLineDash([]); }
        else if (k === hoverKey) { g.lineWidth = 4; g.strokeStyle = 'rgba(60,110,240,.7)'; rr(g, b.x, b.y, b.w, b.h, 10); g.stroke(); }
        else if (msg.tutorial && real) { g.setLineDash([10, 10]); g.lineWidth = 3; g.strokeStyle = 'rgba(232,164,0,.75)'; rr(g, b.x, b.y, b.w, b.h, 10); g.stroke(); g.setLineDash([]); }
      } else {
        if (real && isF) { g.lineWidth = 6; g.strokeStyle = '#13854b'; rr(g, b.x, b.y, b.w, b.h, 10); g.stroke(); }
        else if (real) { g.setLineDash([12, 8]); g.lineWidth = 5; g.strokeStyle = '#e07b00'; rr(g, b.x, b.y, b.w, b.h, 10); g.stroke(); g.setLineDash([]); }
        else if (isF) { g.lineWidth = 4; g.strokeStyle = '#8a8f99'; g.beginPath(); g.moveTo(b.x, b.y + b.h / 2); g.lineTo(b.x + b.w, b.y + b.h / 2); g.stroke(); }
      }
    });
    // badge numbers for found flags after verdict
    if (!after) {
      g.fillStyle = '#7b8090'; g.font = '500 24px ' + FONT; g.textAlign = 'center';
      g.fillText(msg.tutorial ? 'Tap the parts with dotted lines, then press the SCAM stamp' : 'Tap anything suspicious to mark it', W / 2, H - 34); g.textAlign = 'left';
    } else {
      // stamp ink
      var scam = cur.verdict, col = scam ? '#c62b23' : '#178a50';
      g.save(); g.translate(W / 2, H - 170); g.rotate(-0.16); g.globalAlpha = 0.86;
      g.lineWidth = 10; g.strokeStyle = col; rr(g, -190, -66, 380, 132, 18); g.stroke();
      g.fillStyle = col; g.font = '900 96px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(scam ? 'SCAM' : 'SAFE', 0, 6);
      g.restore(); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    }
    void boxesFor;
    this.r.updateTexture(this.cardTex, this.cardCv);
  };

  Game.prototype._drawCertificate = function (g, W, H) {
    var cur = this.cur, ok = cur.results.filter(function (r) { return r.correct; }).length, pts = cur.results.reduce(function (s, r) { return s + r.points; }, 0);
    var rk = C.rank(this.p.totalCorrect);
    rr(g, 4, 4, W - 8, H - 8, 34); g.fillStyle = '#f6f0df'; g.fill(); g.lineWidth = 10; g.strokeStyle = '#2c2a3a'; g.stroke();
    rr(g, 30, 30, W - 60, H - 60, 22); g.lineWidth = 3; g.strokeStyle = '#b08d3c'; g.stroke();
    g.textAlign = 'center'; g.fillStyle = '#2c2a3a';
    g.font = '700 30px ' + FONT; g.fillText('SCAM DETECTIVE BUREAU', W / 2, 110);
    g.font = '900 78px ' + FONT; g.fillText('Case closed', W / 2, 210);
    g.font = '500 30px ' + FONT; g.fillStyle = '#555'; g.fillText('Daily case · ' + cur.key, W / 2, 262);
    g.beginPath(); g.arc(W / 2, 430, 120, 0, Math.PI * 2); g.fillStyle = '#2c2a3a'; g.fill();
    g.beginPath(); g.arc(W / 2, 430, 104, 0, Math.PI * 2); g.lineWidth = 4; g.strokeStyle = '#d8b44e'; g.stroke();
    g.fillStyle = '#ffd36b'; g.font = '900 86px ' + FONT; g.fillText(ok + '/' + cur.results.length, W / 2, 460);
    g.fillStyle = '#2c2a3a'; g.font = '700 40px ' + FONT; g.fillText(pts + ' points', W / 2, 610);
    g.font = '500 30px ' + FONT; g.fillStyle = '#444'; g.fillText('Rank: ' + rk.name, W / 2, 662);
    g.fillText(this.p.streak + '-day streak', W / 2, 706);
    g.font = '500 26px ' + FONT; g.fillStyle = '#666'; g.fillText('A new case arrives tomorrow.', W / 2, 800);
    g.textAlign = 'left';
  };

  /* ======================= info panel ======================= */
  Game.prototype._summaryLine = function () {
    var cur = this.cur, ok = cur.results.filter(function (r) { return r.correct; }).length;
    return 'You judged ' + ok + ' of ' + cur.results.length + ' messages correctly.';
  };
  Game.prototype._drawInfo = function (hoverBtn) {
    var st = this.state, cur = this.cur, msg = this.msg, s = this.settings;
    var sig = [st, msg.id, cur.idx, cur.flagged.length, cur.verdict, hoverBtn, s.sound, s.big, this.legitHint, cur.mode].join('|');
    if (sig === this.infoSig) return; this.infoSig = sig;
    var g = this.infoCv.getContext('2d'), W = INFO.cw, H = INFO.ch, B = this.infoButtons = [];
    g.clearRect(0, 0, W, H);
    rr(g, 6, 6, W - 12, H - 12, 40); g.fillStyle = 'rgba(16,18,26,0.92)'; g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,.14)'; g.stroke();
    g.textBaseline = 'alphabetic';
    var y = 84, x = 48, maxW = W - 96;
    function text(t, size, weight, color, lh) { g.font = weight + ' ' + size + 'px ' + FONT; g.fillStyle = color; wrapLines(g, t, maxW).forEach(function (l) { g.fillText(l, x, y); y += lh || size * 1.32; }); }
    function button(id, label, bx, by, bw, bh, primary) {
      var hov = hoverBtn === id; rr(g, bx, by, bw, bh, 22);
      g.fillStyle = primary ? (hov ? '#ffe08a' : '#ffcc4d') : hov ? 'rgba(130,180,255,.42)' : 'rgba(255,255,255,.1)'; g.fill();
      if (hov) { g.lineWidth = 4; g.strokeStyle = '#bfe0ff'; g.stroke(); }
      g.fillStyle = primary ? '#2a1d00' : '#fff'; g.font = '700 ' + (primary ? 38 : 28) + 'px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(label, bx + bw / 2, by + bh / 2 + 2); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      B.push({ id: id, x: bx, y: by, w: bw, h: bh });
    }
    var head = cur.mode === 'training' ? 'Training · message ' + cur.n : 'Today’s case · ' + (cur.idx + 1) + ' of ' + cur.ids.length;
    if (st === 'summary') head = 'Case closed';
    text(head, 30, '600', '#93a4bd');
    y += 6;
    if (st === 'reading') {
      text(msg.tutorial ? 'Your first message' : 'Is this message a scam?', 48, '800', '#fff', 58); y += 10;
      text('1. Tap anything suspicious on the message to mark it.', 31, '500', '#d7e3ff', 42);
      text('2. Press the SCAM or SAFE stamp.', 31, '500', '#d7e3ff', 42); y += 14;
      text('Marked: ' + cur.flagged.length + (cur.flagged.length === 1 ? ' clue' : ' clues') + '  ·  each real red flag is +25', 27, '500', '#93a4bd', 38);
      if (this.legitHint) { y += 8; text(msg.scam ? 'You’ve found every red flag. Time to stamp it!' : 'Look closely. Maybe nothing here is wrong.', 29, '600', '#ffd36b', 40); }
      else if (this.hintKey) { y += 8; text('Hint: look at the part outlined in yellow.', 29, '600', '#ffd36b', 40); }
      var rk = C.rank(this.p.totalCorrect); y += 18;
      text('Rank: ' + rk.name + (rk.next ? '  ·  ' + rk.toNext + ' more correct to ' + rk.next : '') + '  ·  Streak ' + this.p.streak, 26, '500', '#7f8ca3', 36);
      button('hint', 'Hint (−10)', 48, 690, 360, 96); button('read', 'Read aloud', 432, 690, 360, 96);
    } else if (st === 'verdict') {
      var r = this.lastRes, good = r && r.correct;
      text(good ? '✓ Correct!' : '✗ Not quite', 52, '800', good ? '#5fe39b' : '#ff8a7a', 60);
      text('This was ' + (msg.scam ? 'a SCAM. ' : 'a REAL message. ') + msg.why, 29, '500', '#fff', 39); y += 8;
      var keys = C.clueKeys(msg).filter(function (k) { return msg.clues[k].flag === msg.scam; }).slice(0, msg.scam ? 5 : 3);
      text(msg.scam ? 'Red flags' : 'Good signs', 25, '700', '#93a4bd', 34);
      for (var i = 0; i < keys.length && y < 560; i++) {
        var k = keys[i], c = msg.clues[k], found = cur.flagged.indexOf(k) >= 0;
        g.font = '700 26px ' + FONT; g.fillStyle = msg.scam ? (found ? '#5fe39b' : '#ffb35c') : '#5fe39b';
        g.fillText(msg.scam ? (found ? '✓' : '○') : '✓', x, y);
        g.font = '500 25px ' + FONT; g.fillStyle = '#e6ebf5';
        wrapLines(g, c.note, maxW - 40).slice(0, 2).forEach(function (l) { g.fillText(l, x + 38, y); y += 33; }); y += 6;
      }
      y = Math.max(y, 580);
      rr(g, 40, y - 4, W - 80, 80, 16); g.fillStyle = 'rgba(255,211,107,.14)'; g.fill();
      g.font = '600 25px ' + FONT; g.fillStyle = '#ffd36b'; wrapLines(g, 'Tip: ' + msg.tip, maxW - 20).slice(0, 2).forEach(function (l, j) { g.fillText(l, x + 6, y + 30 + j * 32); });
      g.font = '700 30px ' + FONT; g.fillStyle = '#fff'; g.textAlign = 'right'; g.fillText('+' + (r ? r.points : 0) + ' pts', W - 48, 112); g.textAlign = 'left';
      button('next', cur.mode === 'daily' && cur.idx + 1 >= cur.ids.length ? 'Close the case ▶' : 'Next message ▶', 48, 690, 520, 96, true);
      button('read', 'Read aloud', 592, 690, 200, 96);
    } else {
      var ok = cur.results.filter(function (rr2) { return rr2.correct; }).length;
      text('Great work, detective!', 48, '800', '#fff', 58);
      text(this._summaryLine() + ' Share what you learned with your family. Scammers often target parents and grandparents.', 30, '500', '#d7e3ff', 42); y += 10;
      text('Spotted a real scam? Report it at cybercrime.gov.in or call 1930.', 28, '600', '#ffd36b', 40);
      void ok;
      button('training', 'Keep training ▶', 48, 690, 470, 96, true); button('read', 'Read aloud', 542, 690, 250, 96);
    }
    // system row
    var sys = [['down', '▼ Lower'], ['up', '▲ Raise'], ['center', '◎ Center'], ['sound', s.sound ? '♪ Sound' : '♪ Muted'], ['big', s.big ? 'A Big text ✓' : 'A Big text']];
    var bw = (W - 96 - 4 * 12) / 5;
    sys.forEach(function (d, i) { button(d[0], d[1], 48 + i * (bw + 12), 820, bw, 84); });
    g.font = '500 22px ' + FONT; g.fillStyle = '#6f7f96'; g.textAlign = 'center'; g.fillText('All companies, numbers and links in this game are made up.', W / 2, 950); g.textAlign = 'left';
    this.r.updateTexture(this.infoTex, this.infoCv);
  };

  /* ======================= scene ======================= */
  Game.prototype._scene = function (dt) {
    var r = this.r, self = this, t = this.time, ar = this.xr && this.xr.mode === 'immersive-ar';
    r.clearList();
    function add(mesh, l, color, em, extra) { var it = { mesh: mesh, m: self._bm(l), color: color, em: em }; if (extra) for (var k in extra) it[k] = extra[k]; return r.add(it); }
    if (!ar) {
      add('box', M.trs(0.03, -0.025, 0.02, 0, 0, 0, 1.0, 0.044, 0.6), [0.24, 0.17, 0.13, 1]);
      add('disc', M.trs(0, -0.74, 0.2, 0, 0, 0, 6), [0.12, 0.12, 0.15, 1]);
    }
    // desk mat (detective green felt) + stand
    add('box', M.trs(0.03, 0.002, 0.03, 0, 0, 0, 0.66, 0.004, 0.36), [0.15, 0.29, 0.24, 1]);
    add('box', M.trs(0, 0.03, -0.11, -0.32, 0, 0, 0.12, 0.07, 0.012), [0.33, 0.23, 0.16, 1]);
    // inbox tray + remaining messages
    add('box', M.trs(TRAY[0], 0.006, TRAY[2], 0, 0, 0, 0.17, 0.008, 0.13), [0.36, 0.26, 0.18, 1]);
    var left = this.cur.mode === 'daily' && this.state !== 'summary' ? this.cur.ids.length - this.cur.idx - 1 : this.cur.mode === 'training' ? 3 : 0;
    for (var i = 0; i < left; i++) add('box', M.trs(TRAY[0] + (i % 2) * 0.002, 0.012 + i * 0.003, TRAY[2] - (i % 3) * 0.002, 0, (i % 3 - 1) * 0.04, 0, 0.15, 0.002, 0.11), [0.96, 0.95, 0.92, 1]);
    // closed pile: one sheet per judged message, tinted by verdict
    var done = this.cur.results || [];
    add('box', M.trs(PILE[0], 0.004, PILE[2], 0, 0, 0, 0.17, 0.004, 0.13), [0.2, 0.2, 0.24, 1]);
    done.forEach(function (res, i) { add('box', M.trs(PILE[0] + ((i * 37) % 7 - 3) * 0.002, 0.008 + i * 0.003, PILE[2], 0, ((i * 53) % 9 - 4) * 0.03, 0, 0.15, 0.002, 0.11), res.correct ? [0.88, 0.97, 0.9, 1] : [0.99, 0.88, 0.85, 1]); });
    // stamps
    var active = this.state === 'reading' && this.anim.card >= 1;
    Object.keys(STAMPS).forEach(function (k) {
      var st = STAMPS[k], dip = 0, a = self.anim.stamp;
      if (a && a.which === k) { var e = now() - a.t0; dip = e < 0.12 ? e / 0.12 : e < 0.4 ? 1 - (e - 0.12) / 0.28 : 0; if (e > 0.5) self.anim.stamp = null; }
      var hov = self._hovered().box === k && active, y0 = -dip * 0.018, em = hov ? [0.12, 0.12, 0.1] : null;
      add('box', M.trs(st.x, 0.016 + y0, st.z, 0, 0, 0, 0.07, 0.022, 0.05), st.col.concat(1), em);
      add('box', M.trs(st.x, 0.03 + y0, st.z, 0, 0, 0, 0.074, 0.008, 0.054), [0.42, 0.3, 0.2, 1], em);
      add('cyl', M.trs(st.x, 0.06 + y0, st.z, 0, 0, 0, 0.018, 0.05, 0.018), [0.3, 0.21, 0.15, 1], em);
      add('sphere', M.trs(st.x, 0.092 + y0, st.z, 0, 0, 0, 0.036, 0.03, 0.036), st.col.map(function (v) { return v * 0.85; }).concat(1), em);
      r.add({ mesh: 'quad', m: self._bm(M.trs(st.x, 0.0045, st.z + 0.046, -Math.PI / 2, 0, 0, 0.075, 0.03, 1)), color: [1, 1, 1, active ? 1 : 0.45], tex: self.labelTex[k], unlit: 1 });
      if (active && (hov || (self.msg.tutorial && k === 'scam' && self.cur.flagged.length >= 2))) {
        var pulse = 0.25 + 0.2 * Math.sin(t * 6);
        r.add({ mesh: 'disc', m: self._bm(M.trs(st.x, 0.005, st.z, 0, 0, 0, 0.1)), color: [1, 0.85, 0.3, pulse], add: 1, unlit: 1 });
      }
    });
    // lamp
    add('cyl', M.trs(-0.29, 0.006, -0.16, 0, 0, 0, 0.07, 0.008, 0.07), [0.15, 0.15, 0.17, 1]);
    add('cyl', M.trs(-0.29, 0.1, -0.16, 0, 0, 0, 0.008, 0.19, 0.008), [0.2, 0.2, 0.22, 1]);
    add('cyl', M.trs(-0.27, 0.2, -0.15, 0.5, 0, -0.3, 0.07, 0.045, 0.07), [0.12, 0.35, 0.28, 1]);
    r.add({ mesh: 'sphere', m: this._bm(M.trs(-0.265, 0.18, -0.145, 0, 0, 0, 0.09)), color: [1, 0.85, 0.55, 0.16], add: 1, unlit: 1 });
    // panels
    var hv = this._hovered();
    if (this.anim.card < 1) this.anim.card = Math.min(1, (now() - this.anim.cardT0) / 0.5);
    if (this.anim.out > 0) this.anim.out = Math.max(0.0001, Math.min(1, (now() - this.anim.outT0) / 0.4));
    this._boardMats();
    this._drawCard(hv.card); this._drawInfo(hv.info);
    r.add({ mesh: 'box', m: this._bm(M.mul(this.cardLocal, M.trs(0, 0, -0.012, 0, 0, 0, 1.02, 1.02, 0.02))), color: [0.85, 0.83, 0.78, 1] });
    r.add({ mesh: 'quad', m: this._bm(this.cardLocal), color: [1, 1, 1, 1], tex: this.cardTex, unlit: 1 });
    r.add({ mesh: 'quad', m: this._bm(this.infoLocal), color: [1, 1, 1, 1], tex: this.infoTex, unlit: 1 });
    this._drawPointers();
  };

  /* ======================= input ======================= */
  Game.prototype._panels = function () {
    return [{ name: 'card', inv: this.invCard, cw: CARD.cw, ch: CARD.ch, buttons: this.cardButtons, live: this.anim.card >= 1 && this.anim.out === 0 },
            { name: 'info', inv: this.invInfo, cw: INFO.cw, ch: INFO.ch, buttons: this.infoButtons, live: true }];
  };
  function btnAt(p, u, v) {
    var px = u * p.cw, py = (1 - v) * p.ch;
    for (var i = 0; i < p.buttons.length; i++) { var b = p.buttons[i]; if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b; }
    return null;
  }
  function stampBox(k) { var s = STAMPS[k]; return [[s.x - 0.042, 0, s.z - 0.034], [s.x + 0.042, 0.115, s.z + 0.034]]; }
  Game.prototype._raycast = function (ow, dw) {
    var o = M.point(this.invBoard, ow), d = M.dir(this.invBoard, dw), best = null;
    this._panels().forEach(function (p) {
      var po = M.point(p.inv, o), pd = M.dir(p.inv, d);
      if (pd[2] >= 0) return;
      var t = -po[2] / pd[2], hx = po[0] + pd[0] * t, hy = po[1] + pd[1] * t;
      if (t > 0 && Math.abs(hx) <= 0.5 && Math.abs(hy) <= 0.5 && (!best || t < best.t)) best = { t: t, type: 'panel', panel: p.name, button: p.live ? btnAt(p, hx + 0.5, hy + 0.5) : null };
    });
    if (this.state === 'reading') Object.keys(STAMPS).forEach(function (k) { var b = stampBox(k), t = M.rayBox(o, d, b[0], b[1]); if (t > 0 && (!best || t < best.t)) best = { t: t, type: 'box', box: k }; });
    var tb = M.rayBox(o, d, [-0.31, -0.02, -0.16], [0.37, 0.004, 0.22]); if (tb > 0 && (!best || tb < best.t)) best = { t: tb, type: 'desk' };
    if (best) best.point = [ow[0] + dw[0] * best.t, ow[1] + dw[1] * best.t, ow[2] + dw[2] * best.t];
    return best;
  };
  Game.prototype._hovered = function () {
    var out = { card: null, info: null, box: null };
    for (var k in this.pointers) {
      var p = this.pointers[k];
      if (p.pokeCard) out.card = p.pokeCard; if (p.pokeInfo) out.info = p.pokeInfo; if (p.pokeBox) out.box = p.pokeBox;
      if (!p.hit || p.suppressRay) continue;
      if (p.hit.type === 'panel' && p.hit.button) out[p.hit.panel] = p.hit.button.id;
      if (p.hit.type === 'box') out.box = p.hit.box;
    }
    return out;
  };
  Game.prototype._activate = function (hit) {
    if (!hit) return; this.sound.unlock();
    if (hit.type === 'box') this.stamp(hit.box);
    else if (hit.type === 'panel' && hit.button) { if (hit.panel === 'card') this.toggleFlag(hit.button.id); else this.button(hit.button.id); }
  };
  /** Fingertip poke: press panel buttons by pushing through them, press stamps by touching their handle. */
  Game.prototype._poke = function (p) {
    p.pokeCard = p.pokeInfo = p.pokeBox = null; p.suppressRay = false; p.armed = p.armed || {};
    if (!p.tip || !this.invBoard) return;
    var lt = M.point(this.invBoard, p.tip), self = this;
    this._panels().forEach(function (pn) {
      var pl = M.point(pn.inv, lt);
      if (Math.abs(pl[0]) <= 0.5 && Math.abs(pl[1]) <= 0.5 && pl[2] > -0.03 && pl[2] < 0.08) {
        p.suppressRay = true;
        var b = pn.live ? btnAt(pn, pl[0] + 0.5, pl[1] + 0.5) : null;
        if (pn.name === 'card') p.pokeCard = b && b.id; else p.pokeInfo = b && b.id;
        if (pl[2] < 0.006 && p.armed[pn.name] && b) { p.armed[pn.name] = false; self._activate({ type: 'panel', panel: pn.name, button: b }); }
      }
      if (pl[2] > 0.02) p.armed[pn.name] = true;
    });
    Object.keys(STAMPS).forEach(function (k) {
      var b = stampBox(k), inside = lt[0] > b[0][0] && lt[0] < b[1][0] && lt[2] > b[0][2] && lt[2] < b[1][2] && lt[1] < b[1][1] && lt[1] > -0.01;
      var near = lt[0] > b[0][0] && lt[0] < b[1][0] && lt[2] > b[0][2] && lt[2] < b[1][2] && lt[1] < b[1][1] + 0.08;
      if (near) { p.pokeBox = k; p.suppressRay = true; }
      if (inside && !p['in_' + k] && self.time - (p.lastPoke === undefined ? -9 : p.lastPoke) > 0.5) { p.lastPoke = self.time; self.stamp(k); }
      p['in_' + k] = inside;
    });
    if (lt[1] < 0.06 && lt[0] > -0.32 && lt[0] < 0.37 && lt[2] > -0.17 && lt[2] < 0.23) p.suppressRay = true;
  };
  Game.prototype._drawPointers = function () {
    var r = this.r, ar = this.xr && this.xr.mode === 'immersive-ar';
    for (var k in this.pointers) {
      var p = this.pointers[k]; if (p.kind === 'mouse') continue;
      if (p.joints && !ar) p.joints.forEach(function (j) { r.add({ mesh: 'lowSphere', m: M.trs(j[0], j[1], j[2], 0, 0, 0, Math.max(j[3] * 2, 0.008)), color: [0.86, 0.82, 0.8, 1] }); });
      if (p.tip) r.add({ mesh: 'lowSphere', m: M.trs(p.tip[0], p.tip[1], p.tip[2], 0, 0, 0, 0.012), color: [0.6, 0.9, 1, 0.55], add: 1, unlit: 1 });
      if (p.o && !p.suppressRay) {
        var len = p.hit ? p.hit.t : 0.12, end = [p.o[0] + p.d[0] * len, p.o[1] + p.d[1] * len, p.o[2] + p.d[2] * len];
        r.add({ mesh: 'box', m: segMatrix(p.o, end, 0.0025), color: [0.7, 0.9, 1, p.hit ? 0.5 : 0.18], add: 1, unlit: 1 });
        if (p.hit) r.add({ mesh: 'lowSphere', m: M.trs(end[0], end[1], end[2], 0, 0, 0, 0.012), color: [0.85, 0.95, 1, 0.9], add: 1, unlit: 1 });
      }
    }
  };
  function segMatrix(a, b, th) {
    var d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(d[0], d[1], d[2]) || 1e-4, z = [d[0] / len, d[1] / len, d[2] / len];
    var up = Math.abs(z[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
    var x = M.norm([up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]]);
    var y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return new Float32Array([x[0] * th, x[1] * th, x[2] * th, 0, y[0] * th, y[1] * th, y[2] * th, 0, z[0] * len, z[1] * len, z[2] * len, 0, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, 1]);
  }

  Game.prototype._update = function (dt) {
    this.time += dt;
    this._boardMats();
    for (var k in this.pointers) { var p = this.pointers[k]; this._poke(p); p.hit = p.o ? this._raycast(p.o, p.d) : null; }
    this._scene(dt);
  };

  /* ======================= desktop ======================= */
  Game.prototype._bindDesktop = function () {
    var self = this, c = this.canvas, down = null;
    function ray(e) {
      var rect = c.getBoundingClientRect(), nx = (e.clientX - rect.left) / rect.width * 2 - 1, ny = 1 - (e.clientY - rect.top) / rect.height * 2;
      var inv = M.invert(M.mul(self.proj, self.view)), a = projW(inv, [nx, ny, -1]), b = projW(inv, [nx, ny, 1]);
      return { o: a, d: M.norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]) };
    }
    c.addEventListener('pointermove', function (e) {
      if (self.xr || !self.view) return;
      if (down && Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 5) {
        down.drag = true; self.cam.yaw = M.clamp(down.yaw - (e.clientX - down.x) * 0.005, -1.1, 1.1); self.cam.pitch = M.clamp(down.pitch + (e.clientY - down.y) * 0.005, 0.15, 1.3);
      }
      var rr2 = ray(e); self.pointers.mouse = { kind: 'mouse', o: rr2.o, d: rr2.d };
    });
    c.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, yaw: self.cam.yaw, pitch: self.cam.pitch }; });
    c.addEventListener('pointerup', function (e) { if (self.xr || !self.view) return; var drag = down && down.drag; down = null; if (drag) return; var rr2 = ray(e); self._activate(self._raycast(rr2.o, rr2.d)); });
    c.addEventListener('pointerleave', function () { delete self.pointers.mouse; down = null; });
    c.addEventListener('wheel', function (e) { e.preventDefault(); self.cam.dist = M.clamp(self.cam.dist + e.deltaY * 0.0006, 0.3, 1.2); }, { passive: false });
    document.addEventListener('visibilitychange', function () { if (document.hidden) self.sound.suspend(); else self.sound.resume(); });
  };
  function projW(inv, p) { var w = inv[3] * p[0] + inv[7] * p[1] + inv[11] * p[2] + inv[15], q = M.point(inv, p); return [q[0] / w, q[1] / w, q[2] / w]; }
  Game.prototype._desktopFrame = function (now) {
    if (this.xr) return; requestAnimationFrame(this._raf);
    var dt = Math.min(0.05, (now - this._last) / 1000); this._last = now;
    var gl = this.gl, c = this.canvas, dpr = Math.min(root.devicePixelRatio || 1, 2), w = Math.floor(c.clientWidth * dpr), h = Math.floor(c.clientHeight * dpr);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    var cam = this.cam, tg = cam.target, aspect = w / Math.max(h, 1), dist = cam.dist * Math.max(1, 0.9 / aspect);
    var eye = [tg[0] + Math.sin(cam.yaw) * Math.cos(cam.pitch) * dist, tg[1] + Math.sin(cam.pitch) * dist, tg[2] + Math.cos(cam.yaw) * Math.cos(cam.pitch) * dist];
    this.view = M.lookAt(eye, tg, [0, 1, 0]); this.proj = M.perspective(aspect < 1 ? 1.1 : 0.8, aspect, 0.01, 50);
    this.sound.listener(eye, M.norm([tg[0] - eye[0], tg[1] - eye[1], tg[2] - eye[2]]), [0, 1, 0]);
    this._update(dt);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, w, h); gl.clearColor(SKY[0], SKY[1], SKY[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.r.renderView(this.view, this.proj, eye);
  };

  /* ======================= WebXR ======================= */
  function srcKey(src) { return (src.handedness || 'none') + (src.hand ? '-hand' : '-ctrl'); }
  Game.prototype.enterXR = function (mode) {
    var self = this, gl = this.gl; this.sound.unlock();
    return navigator.xr.requestSession(mode, { optionalFeatures: ['hand-tracking', 'local-floor'] }).then(function (session) {
      return Promise.resolve(gl.makeXRCompatible ? gl.makeXRCompatible() : null).then(function () {
        session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl, { antialias: true, alpha: true }) });
        return session.requestReferenceSpace('local');
      }).then(function (ref) {
        self.xr = { session: session, ref: ref, mode: mode }; self.pointers = {}; self.needsRecenter = true;
        if (ref.addEventListener) ref.addEventListener('reset', function () { self.needsRecenter = true; });
        session.addEventListener('select', function (e) { var p = self.pointers[srcKey(e.inputSource)]; if (p && !p.suppressRay) self._activate(p.hit); });
        session.addEventListener('visibilitychange', function () { if (session.visibilityState === 'visible') self.sound.resume(); else { self.sound.suspend(); self.stopSpeech(); } });
        session.addEventListener('end', function () { self.xr = null; self.pointers = {}; self._last = performance.now(); requestAnimationFrame(self._raf); if (self.onExit) self.onExit(); });
        self._lastXR = null;
        session.requestAnimationFrame(function f(t, frame) { session.requestAnimationFrame(f); self._xrFrame(t, frame); });
      });
    });
  };
  Game.prototype._recenter = function (tr) {
    var m = tr.matrix, yaw = Math.atan2(m[8], m[10]);
    this.board.yaw = yaw; this.board.pos = [m[12] - Math.sin(yaw) * 0.44, m[13] - 0.38, m[14] - Math.cos(yaw) * 0.44]; this.needsRecenter = false;
  };
  Game.prototype._xrFrame = function (t, frame) {
    var xr = this.xr; if (!xr) return;
    var dt = this._lastXR == null ? 0.016 : Math.min(0.05, (t - this._lastXR) / 1000); this._lastXR = t;
    var pose = frame.getViewerPose(xr.ref); if (!pose) return;
    if (this.needsRecenter) this._recenter(pose.transform);
    var hm = pose.transform.matrix, self = this, seen = {};
    this.sound.listener([hm[12], hm[13], hm[14]], [-hm[8], -hm[9], -hm[10]], [hm[4], hm[5], hm[6]]);
    for (var i = 0; i < xr.session.inputSources.length; i++) {
      var src = xr.session.inputSources[i], key = srcKey(src); seen[key] = true;
      var p = this.pointers[key] || (this.pointers[key] = { kind: src.hand ? 'hand' : 'ctrl' });
      p.o = null; p.tip = null; p.joints = null;
      var rp = src.targetRaySpace && frame.getPose(src.targetRaySpace, xr.ref);
      if (rp) { var m = rp.transform.matrix; p.o = [m[12], m[13], m[14]]; p.d = M.norm([-m[8], -m[9], -m[10]]); }
      if (src.hand && frame.getJointPose) {
        var ts = src.hand.get('index-finger-tip'), tp = ts && frame.getJointPose(ts, xr.ref);
        if (tp) p.tip = [tp.transform.position.x, tp.transform.position.y, tp.transform.position.z];
        if (xr.mode !== 'immersive-ar') { p.joints = []; src.hand.forEach(function (space) { var jp = frame.getJointPose(space, xr.ref); if (jp) p.joints.push([jp.transform.position.x, jp.transform.position.y, jp.transform.position.z, jp.radius || 0.005]); }); }
      } else if (src.gripSpace) { var gp = frame.getPose(src.gripSpace, xr.ref); if (gp) { var gpp = gp.transform.position; p.joints = [[gpp.x, gpp.y, gpp.z, 0.012]]; } }
    }
    for (var k in this.pointers) if (!seen[k]) delete this.pointers[k];
    this._update(dt);
    var gl = this.gl, layer = xr.session.renderState.baseLayer, ar = xr.mode === 'immersive-ar';
    gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
    gl.clearColor(ar ? 0 : SKY[0], ar ? 0 : SKY[1], ar ? 0 : SKY[2], ar ? 0 : 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    pose.views.forEach(function (view) { var vp = layer.getViewport(view), pp = view.transform.position; gl.viewport(vp.x, vp.y, vp.width, vp.height); self.r.renderView(view.transform.inverse.matrix, view.projectionMatrix, [pp.x, pp.y, pp.z]); });
  };

  root.Game = Game;
})(this);
