/* Scam Detective — Detective HQ menu and full investigations:
 * Stage 1 crime scene (inspect objects, collect evidence) → Stage 2 evidence room (corkboard deductions)
 * → Stage 3 interrogation (believe the suspect or present evidence) → confession → case closed. */
(function (root) {
  'use strict';
  var M = root.M3, C = root.Cases, Game = root.Game, U = Game.U, INV = root.Investigations, T = root.I18N.T;
  var rr = U.rr, wrapLines = U.wrapLines, FONT = U.FONT, now = U.now, ease = U.ease, CARD = U.CARD, INFO = U.INFO;
  var BOARD = { w: 0.5, h: 0.327, cw: 1200, ch: 785, pos: [0, 0.2, -0.2], rx: -0.12 };
  var SLOTS = [[-0.25, -0.08, 0.2], [-0.25, 0.13, -0.15], [-0.06, 0.12, 0.1], [0.07, 0.12, -0.12], [0.19, 0.12, 0.12], [0.32, 0.12, -0.1]];
  var IS = 0.75; // item scale
  U.BOARD = BOARD;
  var MAG = [-0.345, 0.2];  // where the magnifying glass rests on the crime-scene table
  function isHidden(k) { return k.indexOf('h_') === 0; }
  function roomOf(st) { return st === 'scene' ? 'home' : st === 'interro' || st === 'confess' ? 'interro' : st === 'lineup' ? 'lineup' : 'office'; }
  // room colours: wall, floor, table, table top, for the bright daytime look and the moody night look
  var PAL_NIGHT = {
    home: { wall: [0.52, 0.42, 0.33, 1], floor: [0.32, 0.22, 0.16, 1], table: [0.24, 0.17, 0.13, 1], top: [0.5, 0.36, 0.25, 1] },
    office: { wall: [0.18, 0.14, 0.12, 1], floor: [0.12, 0.12, 0.15, 1], table: [0.24, 0.17, 0.13, 1], top: [0.15, 0.29, 0.24, 1] },
    lineup: { wall: [0.16, 0.17, 0.19, 1], floor: [0.12, 0.12, 0.15, 1], table: [0.24, 0.17, 0.13, 1], top: [0.15, 0.29, 0.24, 1] },
    interro: { wall: [0.2, 0.21, 0.23, 1], floor: [0.12, 0.12, 0.15, 1], table: [0.3, 0.31, 0.33, 1], top: [0.42, 0.44, 0.47, 1] } };
  var PAL_DAY = {
    home: { wall: [0.95, 0.89, 0.78, 1], floor: [0.72, 0.55, 0.38, 1], table: [0.6, 0.44, 0.3, 1], top: [0.78, 0.62, 0.45, 1] },
    office: { wall: [0.88, 0.9, 0.92, 1], floor: [0.62, 0.58, 0.52, 1], table: [0.55, 0.4, 0.28, 1], top: [0.22, 0.45, 0.38, 1] },
    lineup: { wall: [0.82, 0.84, 0.86, 1], floor: [0.55, 0.56, 0.58, 1], table: [0.55, 0.4, 0.28, 1], top: [0.22, 0.45, 0.38, 1] },
    interro: { wall: [0.8, 0.84, 0.86, 1], floor: [0.5, 0.52, 0.55, 1], table: [0.6, 0.62, 0.65, 1], top: [0.75, 0.77, 0.8, 1] } };
  var HALF = { laptop: [0.1, 0.09], phone: [0.04, 0.075], notebook: [0.075, 0.1], letter: [0.08, 0.105], printout: [0.08, 0.105], receipt: [0.04, 0.07], cup: [0.05, 0.05], jewelbox: [0.075, 0.07], clipboard: [0.07, 0.095], cone: [0.07, 0.025] };
  var HEIGHT = { laptop: 0.13, cup: 0.085, jewelbox: 0.11, notebook: 0.025, cone: 0.03 };
  /** Item footprint [hx, hz], swapped when the item is turned more than 45 degrees. */
  function half(it) { var h = (HALF[it.kind] || [0.07, 0.07]).map(function (v) { return v * IS; }), yaw = Math.abs(SLOTS[it.slot][2]) % Math.PI; return yaw > 0.785 && yaw < 2.356 ? [h[1], h[0]] : h; }
  function topOf(it) { return (HEIGHT[it.kind] || 0.024) * IS; }
  var BAR = { laptop: '#334155', phone: '#0f766e', notebook: '#8a5a2b', letter: '#7a5a2a', printout: '#475569', receipt: '#6b5b3e', cup: '#6b4f3a', jewelbox: '#7a1e2e', clipboard: '#7a5a2a', cone: '#3f6b2a' };
  var PAPER = { notebook: 1, letter: 1, printout: 1, receipt: 1, clipboard: 1 };
  var SUS = { x: 0, z: -0.47 };
  var LINE = { xs: [-0.5, 0, 0.5], z: -1.3 };
  var People = root.People;

  function lbl(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function stars(mist) { return mist <= 1 ? 3 : mist <= 4 ? 2 : 1; }

  /* ======================= flow ======================= */
  Game.prototype.openMenu = function (resumed) {
    this.stopSpeech();
    this.cur = { mode: 'menu' }; this.state = 'menu'; this._camFor('menu');
    this.anim.card = resumed ? 1 : 0; this.anim.cardT0 = now(); this.anim.out = 0;
    if (!resumed) this.sound.paper(this._world([0, 0.05, -0.06]));
    this._save();
  };
  Game.prototype.inv = function () { return INV[this.cur.idx]; };
  Game.prototype.startInv = function (i, fresh) {
    var s = this.slots.inv;
    if (!fresh && s && s.idx === i && s.stage !== 'closed') { this.cur = s; this.state = s.stage; this._camFor(s.stage); this._invCardIn(); this._save(); return; }
    this.cur = this.slots.inv = { mode: 'inv', idx: i, stage: 'brief', found: [], tapped: [], open: null, note: null, hintItem: null, hintKey: null,
      bq: 0, bdone: false, bwrong: null, si: 0, sdone: false, swrong: null, mistakes: 0, points: 0 };
    this.state = 'brief'; this._invCardIn(); this.sound.paper(this._world([0, 0.05, -0.06])); this._save();
  };
  /** Flat-screen camera framing for each stage (headsets ignore this). */
  Game.prototype._camFor = function (st) {
    if (this.xr) return;
    var f = { scene: [0.76, 0.72, [0.02, -0.31, -0.45]], board: [0.78, 0.32, [0.0, -0.2, -0.56]], puzzle: [0.78, 0.32, [0.0, -0.2, -0.56]], interro: [0.95, 0.52, [0.0, 0.0, -0.33]], confess: [1.02, 0.22, [0.0, -0.03, -0.74]], lineup: [1.7, 0.18, [0.0, 0.2, -0.85]] }[st]
      || [0.62, 0.62, [0.02, -0.29, -0.47]];
    this.cam.dist = f[0]; this.cam.pitch = f[1]; this.cam.target = f[2].slice(); this.cam.yaw = 0;
  };
  Game.prototype._person = function (id) { return this.inv().people[id]; };
  Game.prototype._culprit = function () { var v = this.inv(); return v.people[v.suspect.id]; };
  /** A character speaks a line in their own voice; the mouth moves while they talk. */
  Game.prototype._say = function (text, who) {
    var ss = root.speechSynthesis, self = this, look = who ? this._person(who).look : null;
    this.speaking = { who: who, until: now() + 0.6 + text.length * 0.062 };
    if (!this.settings.sound || !ss || !root.SpeechSynthesisUtterance) return;
    try {
      ss.cancel();
      var u = new root.SpeechSynthesisUtterance(text.replace(/["\u201C\u201D]/g, '')), lang = root.I18N.speechLang().slice(0, 2);
      u.lang = root.I18N.speechLang(); u.rate = 0.97; u.pitch = look && look.voice ? look.voice : 1;
      var vs = ss.getVoices ? ss.getVoices() : [], pick = null;
      vs.forEach(function (vc) { if (!pick && vc.lang && vc.lang.replace('_', '-').indexOf(u.lang) === 0) pick = vc; });
      if (!pick) vs.forEach(function (vc) { if (!pick && vc.lang && vc.lang.indexOf(lang) === 0) pick = vc; });
      if (pick) u.voice = pick;
      u.onstart = function () { self.speaking = { who: who, until: now() + 60 }; };
      u.onend = u.onerror = function () { if (self.speaking && self.speaking.who === who) self.speaking = null; };
      ss.speak(u);
    } catch (e) { /* speech not available */ }
  };
  Game.prototype._invCardIn = function () { this.anim.card = 0; this.anim.cardT0 = now(); };
  Game.prototype._invStage = function (st) {
    var c = this.cur, prevRoom = roomOf(c.stage); c.stage = st; this.state = st;
    if (roomOf(st) !== prevRoom) { this.fadeT0 = now(); this.sound.whoosh(); }
    if (st === 'confess') { this.arrestT0 = this.time; this.sound.siren(4); }
    if (st === 'closed') { this.medalT0 = this.time; this._burst('confetti', this._world([0, 0.32, -0.15])); this.sound.medal(); }
    this._camFor(st); c.open = null; c.note = null; c.hintItem = null; c.hintKey = null;
    this._invCardIn(); this.sound.paper(this._world([0, 0.05, -0.06])); this._save();
  };
  Game.prototype.invInspect = function (id) {
    var c = this.cur;
    if (id.indexOf('sus:') === 0) { this._invAccuse(id.slice(4)); return; }
    if (id.indexOf('evc:') === 0) { if (this._slam) this._slam(id.slice(4)); return; }
    if (c.stage !== 'scene') return;
    if (id === 'magnifier') { this._toggleMag(); return; }
    if (c.open === id) return;
    c.open = id; c.hintKey = null; if (c.hintItem === id) c.hintItem = null;
    this._invCardIn(); this.sound.paper(this._world(this._slotPos(this._item(id).slot)));
    if (this.cur.hintEv) { var it = this._item(id), self = this; Object.keys(it.clues).some(function (k) { if (it.clues[k].ev === self.cur.hintEv) { self.cur.hintKey = k; return true; } }); }
    this._save();
  };
  Game.prototype._toggleMag = function (on) {
    var c = this.cur; c.magnify = on === undefined ? !c.magnify : on;
    this.sound.mark(this._world([MAG[0], 0.03, MAG[1]])); this._save();
  };
  Game.prototype._item = function (id) { var v = this.inv(); for (var i = 0; i < v.items.length; i++) if (v.items[i].id === id) return v.items[i]; return null; };
  Game.prototype._slotPos = function (slot) { var s = SLOTS[slot]; return [s[0], 0.03, s[1]]; };
  Game.prototype.invPanelTap = function (panel, id) {
    var c = this.cur, v = this.inv();
    if (panel === 'card' && /^k(\d|del|ok)$/.test(id) && (c.stage === 'report' || (c.stage === 'scene' && this._isLocked(this._item(c.open))))) { this._keypadPress(id.slice(1)); return; }
    if (panel === 'card' && c.stage === 'scene' && c.open) {
      var it = this._item(c.open), cl = it.clues[id], tag = it.id + ':' + id; if (!cl || (isHidden(id) && !c.magnify)) return;
      if (c.tapped.indexOf(tag) < 0) c.tapped.push(tag);
      if (cl.ev) {
        if (c.found.indexOf(cl.ev) < 0) { c.found.push(cl.ev); c.points += 50; this.sound.correct(); this._burst('sparkle', this._world([this.cardLocal[12], this.cardLocal[13], this.cardLocal[14] + 0.01])); c.note = { good: true, title: v.evidence[cl.ev].title, text: cl.note }; }
        else c.note = { good: true, title: T('Already in your evidence bag'), text: cl.note };
        if (c.hintKey === id) { c.hintKey = null; c.hintEv = null; }
      } else { c.points = Math.max(0, c.points - 5); c.mistakes += 0.34; this.sound.unmark(this._world([0, 0.1, -0.06])); c.note = { good: false, title: T('Dead end'), text: cl.note }; }
      this._save();
    } else if (panel === 'board' && c.stage === 'puzzle' && id.indexOf('pz:') === 0) { this._pzTap(Number(id.slice(3)));
    } else if (panel === 'board' && c.stage === 'board' && !c.bdone && id.indexOf('ev:') === 0) {
      var ev = id.slice(3), Q = v.board[c.bq];
      if (ev === Q.answer) { c.bdone = true; c.bdoneT = this.time; c.bwrong = null; c.points += 100; this.sound.correct(); if (this.sound.twang) this.sound.twang(); }
      else { c.bwrong = ev; c.points = Math.max(0, c.points - 25); c.mistakes++; this.sound.wrong(); }
      this._save();
    }
  };
  Game.prototype.invButton = function (id) {
    var c = this.cur; if (!c || (c.mode !== 'inv' && c.mode !== 'menu')) return;
    if (/^inv\d$/.test(id)) { this.startInv(Number(id.slice(3)), false); return; }
    if (c.mode !== 'inv') return;
    var v = this.inv();
    switch (id) {
      case 'tobrief': this._invStage('brief'); break;
      case 'toscene': this._invStage('scene'); break;
      case 'putback': c.open = null; c.note = null; this._save(); break;
      case 'magnify': this._toggleMag(); break;
      case 'invhint': this._invHint(); break;
      case 'toboard': if (c.found.length >= Object.keys(v.evidence).length) { if (v.puzzle && !(c.pz && c.pz.done)) this._pzStart(); else { c.bq = 0; c.bdone = false; c.bwrong = null; this._invStage('board'); } } break;
      case 'pznext': if (c.pz && c.pz.done) { c.bq = 0; c.bdone = false; c.bwrong = null; this._invStage('board'); } break;
      case 'bnext': if (c.bdone) { if (c.bq + 1 < v.board.length) { c.bq++; c.bdone = false; c.bwrong = null; this._save(); } else { c.lwrong = null; c.ldone = false; this._invStage('lineup'); } } break;
      case 'tointerro': if (c.ldone) { c.si = 0; c.lies = 0; c.tones = {}; c.testimony = []; this._invStage('interro'); this._enterStep(); this._save(); } break;
      case 'hear': if (c.stage === 'interro') this._hearStep(); else if (c.stage === 'confess') this._say(v.suspect.confession, v.suspect.id); else if (c.stage === 'lineup' && (c.lwrong || c.ldone)) this._say(c.ldone ? v.lineup.caught : v.lineup.alibis[c.lwrong].say, c.ldone ? v.lineup.culprit : c.lwrong); break;
      case 'believe': this._invAnswer(null); break;
      case 'snext': if (c.sdone) { if (c.si + 1 < this._isteps().length) { c.si++; this._invCardIn(); this._enterStep(); this._save(); } else { this._invStage('confess'); this._say(v.suspect.confession, v.suspect.id); } } break;
      case 'tone:calm': case 'tone:tough': this._invTone(id.slice(5)); break;
      case 'tonego': if (c.stage === 'interro' && c.iphase === 'tone' && c.tones && c.tones[this._step().who]) { this._invCardIn(); this._afterTone(); this._save(); } break;
      case 'charge': if (c.stage === 'confess') { c.pinEntry = ''; c.pinWrong = false; this._invStage('report'); } else this._invClose(); break;
      case 'skipreport': this._invClose(); break;
      case 'replayinv': this.startInv(c.idx, true); break;
      default: if (id.indexOf('show:') === 0) this._invAnswer(id.slice(5)); else if (id.indexOf('ask:') === 0) this._invAsk(Number(id.slice(4))); else if (id.indexOf('acc:') === 0) this._invAccuse(id.slice(4));
    }
  };
  Game.prototype._invHint = function () {
    var c = this.cur, v = this.inv(), self = this;
    var missing = Object.keys(v.evidence).filter(function (e) { return c.found.indexOf(e) < 0; });
    if (!missing.length) return;
    var ev = missing[0], item = null;
    v.items.some(function (it) { return Object.keys(it.clues).some(function (k) { if (it.clues[k].ev === ev) { item = it; return true; } }); });
    c.hintEv = ev; c.points = Math.max(0, c.points - 10); c.mistakes += 0.5;
    if (c.open === item.id) { Object.keys(item.clues).some(function (k) { if (item.clues[k].ev === ev) { c.hintKey = k; return true; } }); }
    else c.hintItem = item.id;
    c.hintMag = Object.keys(item.clues).some(function (k) { return item.clues[k].ev === ev && isHidden(k); });
    void self; this._save();
  };
  Game.prototype._invAccuse = function (id) {
    var c = this.cur, v = this.inv(); if (c.stage !== 'lineup' || c.ldone || !v.people[id]) return;
    if (id === v.lineup.culprit) {
      c.ldone = true; c.lwrong = null; c.points += 150; this.sound.correct();
      c.lreact = { id: id, type: 'shake', t0: now() }; this._invCardIn(); this._say(v.lineup.caught, id);
    } else {
      c.lwrong = id; c.points = Math.max(0, c.points - 25); c.mistakes++; this.sound.wrong();
      c.lreact = { id: id, type: 'nod', t0: now() }; this._invCardIn(); this._say(v.lineup.alibis[id].say, id);
    }
    this._save();
  };
  Game.prototype._invAnswer = function (ev) {
    var c = this.cur, S = this._step().S; if (c.stage !== 'interro' || c.sdone || (c.iphase && c.iphase !== 'stmt')) return;
    var ok = ev === null ? S.truth : (!S.truth && S.contradict.indexOf(ev) >= 0);
    if (ok) {
      c.sdone = true; c.swrong = null; c.points += 100; this.sound.correct(); c.react = { type: S.truth ? 'nod' : 'shake', t0: now() }; if (!S.truth) c.lies = (c.lies || 0) + 1;
      if (S.truth && S.tag) { c.testimony = c.testimony || []; if (c.testimony.indexOf(S.tag) < 0) c.testimony.push(S.tag); }
    }
    else { c.swrong = ev === null ? 'believe' : ev; c.points = Math.max(0, c.points - 25); c.mistakes++; this.sound.wrong(); c.react = { type: 'smirk', t0: now() }; }
    this._save();
  };
  /* ---------- interrogation steps: optional partner in another room, then the suspect ---------- */
  Game.prototype._isteps = function () {
    var S = this.inv().suspect, out = [];
    if (S.partner) S.partner.statements.forEach(function (s, i) { out.push({ who: S.partner.id, S: s, P: S.partner, n: i, of: S.partner.statements.length }); });
    S.statements.forEach(function (s, i) { out.push({ who: S.id, S: s, P: S, n: i, of: S.statements.length }); });
    return out;
  };
  Game.prototype._step = function () { var a = this._isteps(); return a[Math.max(0, Math.min((this.cur && this.cur.si) || 0, a.length - 1))]; };
  /** Evidence (E1…) or a recorded testimony card (P1…) from the partner's interview. */
  Game.prototype._evInfo = function (id) {
    var v = this.inv(); if (v.evidence[id]) return { label: T('EVIDENCE ') + id.slice(1), title: v.evidence[id].title, text: v.evidence[id].text };
    var P = v.suspect.partner, s = P && P.statements.filter(function (x) { return x.tag === id; })[0];
    return s ? { label: T('TESTIMONY'), title: this._person(P.id).name, text: '“' + s.short + '”', testimony: true } : { label: id, title: id, text: '' };
  };
  Game.prototype._askOpts = function () {
    var st = this._step(), S = st.S; if (!S.ask) return [];
    var o = [{ k: 'good', q: S.ask }].concat(S.alts.map(function (a, i) { return { k: 'alt' + i, q: a.q, a: a.a }; }));
    var r = ((this.cur.si || 0) * 2 + 1) % 3; return o.slice(r).concat(o.slice(0, r));
  };
  Game.prototype._liesBy = function (who) {
    var c = this.cur, a = this._isteps(), n = 0, tot = 0;
    a.forEach(function (x, i) { if (x.who !== who || x.S.truth) return; tot++; if (i < c.si || (i === c.si && c.sdone)) n++; });
    return [n, tot];
  };
  Game.prototype._enterStep = function () {
    var c = this.cur, a = this._isteps(), st = a[c.si];
    c.sdone = false; c.swrong = null; c.altUsed = []; c.altNote = null; c.toneWrong = null; c.tones = c.tones || {}; c.react = null;
    var first = c.si === 0 || a[c.si - 1].who !== st.who;
    if (first && c.si > 0) { this.fadeT0 = now(); if (this.sound.whoosh) this.sound.whoosh(); }   // the next person is brought into the room
    if (first && st.P.tone && !c.tones[st.who]) c.iphase = 'tone';
    else this._afterTone();
  };
  Game.prototype._afterTone = function () {
    var c = this.cur, st = this._step(); c.react = null;
    if (st.S.ask) c.iphase = 'ask'; else { c.iphase = 'stmt'; this._say(st.S.say, st.who); }
  };
  Game.prototype._hearStep = function () {
    var c = this.cur, st = this._step(), TN = st.P.tone;
    if (c.iphase === 'tone') { var ch = c.tones[st.who] || c.toneWrong; if (ch) this._say(TN[ch], st.who); }
    else if (c.iphase === 'ask') { if (c.altNote) this._say(c.altNote.a, st.who); }
    else this._say(st.S.say, st.who);
  };
  /** Calm or tough: some people open up when treated gently, others only talk under pressure. */
  Game.prototype._invTone = function (choice) {
    var c = this.cur, st = this._step(), TN = st.P.tone; if (c.stage !== 'interro' || c.iphase !== 'tone' || !TN) return;
    c.tones = c.tones || {}; if (c.tones[st.who] || c.toneWrong === choice) return;
    if (choice === TN.prefers) { c.tones[st.who] = choice; c.points += 50; this.sound.correct(); c.react = { type: 'nod', t0: now() }; }
    else { c.toneWrong = choice; c.points = Math.max(0, c.points - 25); c.mistakes += 0.5; this.sound.wrong(); c.react = { type: TN.prefers === 'tough' ? 'smirk' : 'shake', t0: now() }; }
    this._say(TN[choice], st.who); this._save();
  };
  /** Pick a question: a sharp one forces a statement you can test, a vague one gets dodged. */
  Game.prototype._invAsk = function (k) {
    var c = this.cur, st = this._step(), o = this._askOpts()[k]; if (c.stage !== 'interro' || c.iphase !== 'ask' || !o) return;
    c.altUsed = c.altUsed || []; if (c.altUsed.indexOf(o.k) >= 0) return;
    if (o.k === 'good') { c.iphase = 'stmt'; c.altNote = null; c.react = null; this._invCardIn(); this.sound.paper(this._world([0, 0.1, -0.1])); this._say(st.S.say, st.who); }
    else { c.altUsed.push(o.k); c.altNote = { q: o.q, a: o.a }; c.points = Math.max(0, c.points - 15); c.mistakes += 0.34; this.sound.wrong(); c.react = { type: 'smirk', t0: now() }; this._say(o.a, st.who); }
    this._save();
  };
  Game.prototype._invClose = function () {
    var c = this.cur, v = this.inv(), st = stars(c.mistakes), prev = this.p.invDone[v.id] || 0;
    this.p.invDone[v.id] = Math.max(prev, st);
    if (this.p.badges.indexOf(v.badge) < 0) this.p.badges.push(v.badge);
    this.p.totalPoints += c.points; c.stars = st;
    this._invStage('closed'); this.sound.closed();
  };

  /* ======================= transforms ======================= */
  Game.prototype._invCardVisible = function () {
    var st = this.state, c = this.cur; return st === 'menu' || st === 'brief' || st === 'interro' || st === 'confess' || st === 'closed' || st === 'report' || (st === 'scene' && !!c.open) || (st === 'lineup' && !!(c.lwrong || c.ldone));
  };
  Game.prototype._invMats = function () {
    var e = ease(this.anim.card), st = this.state, pos, rx, ry = 0, sc;
    if (st === 'interro' || st === 'confess') { pos = [-0.3, 0.25 - (1 - e) * 0.03, -0.25]; rx = -0.08; ry = 0.5; sc = 0.85; }
    else { pos = [CARD.pos[0], CARD.pos[1] - (1 - e) * 0.05, CARD.pos[2]]; rx = CARD.rx; sc = 1; }
    sc *= 0.9 + 0.1 * e;
    this.cardLocal = M.trs(pos[0], pos[1], pos[2], rx, ry, 0, CARD.w * sc, CARD.h * sc, 1);
    this.boardLocal = M.trs(BOARD.pos[0], BOARD.pos[1], BOARD.pos[2], BOARD.rx, 0, 0, BOARD.w, BOARD.h, 1);
    this.invBoardM = M.invert(this.boardLocal);
  };
  Game.prototype._invPanels = function () {
    var out = [];
    if (this._invCardVisible()) out.push({ name: 'card', inv: this.invCard, cw: CARD.cw, ch: CARD.ch, buttons: this.cardButtons, live: this.anim.card >= 1 });
    out.push({ name: 'info', inv: this.invInfo, cw: INFO.cw, ch: INFO.ch, buttons: this.infoButtons, live: true });
    if (this.state === 'board' || this.state === 'puzzle') out.push({ name: 'board', inv: this.invBoardM, cw: BOARD.cw, ch: BOARD.ch, buttons: this.boardButtons || [], live: true });
    return out;
  };
  Game.prototype._invRaycastItems = function (o, d, best) {
    if (this.state === 'lineup' && !this.cur.ldone) {
      this.inv().lineup.ids.forEach(function (id, i) {
        var x = LINE.xs[i], t = M.rayBox(o, d, [x - 0.22, -0.74, LINE.z - 0.15], [x + 0.22, 1.05, LINE.z + 0.15]);
        if (t > 0 && (!best || t < best.t)) best = { t: t, type: 'item', item: 'sus:' + id };
      });
      return best;
    }
    if (this.state === 'interro' && this._evcHit) { var he = this._evcHit(o, d); if (he && (!best || he.t < best.t)) best = he; return best; }
    if (this.state !== 'scene') return best;
    var v = this.inv();
    v.items.forEach(function (it) {
      var s = SLOTS[it.slot], h = half(it), t = M.rayBox(o, d, [s[0] - h[0], 0, s[1] - h[1]], [s[0] + h[0], topOf(it), s[1] + h[1]]);
      if (t > 0 && (!best || t < best.t)) best = { t: t, type: 'item', item: it.id };
    });
    var tm = M.rayBox(o, d, [MAG[0] - 0.05, 0, MAG[1] - 0.06], [MAG[0] + 0.05, 0.03, MAG[1] + 0.06]);
    if (tm > 0 && (!best || tm < best.t)) best = { t: tm, type: 'item', item: 'magnifier' };
    return best;
  };
  Game.prototype._invPokeItems = function (p, lt) {
    if (this.state === 'interro' && this._evcPinch) { this._evcPinch(p, lt); return; }
    if (this.state !== 'scene') return;
    var v = this.inv(), self = this, inside = null, c = this.cur;
    // pinch-grab: pick an object up between thumb and index finger, it follows the hand and returns when released
    if (p.thumb) {
      var th = M.point(this.invBoard, p.thumb), mid = [(lt[0] + th[0]) / 2, (lt[1] + th[1]) / 2, (lt[2] + th[2]) / 2];
      if (p.pinching && !p.grab) {
        var target = null;
        if (Math.abs(mid[0] - MAG[0]) < 0.07 && Math.abs(mid[2] - MAG[1]) < 0.08 && mid[1] < 0.09) target = 'magnifier';
        v.items.forEach(function (it) { var s = SLOTS[it.slot], h = half(it); if (!target && Math.abs(mid[0] - s[0]) < h[0] + 0.03 && Math.abs(mid[2] - s[1]) < h[1] + 0.03 && mid[1] < topOf(it) + 0.06) target = it.id; });
        if (target) {
          p.grab = target; c.held = target; this.sound.paper(this._world(mid));
          if (target === 'magnifier') this._toggleMag(true); else this.invInspect(target);
        }
      } else if (p.grab && !p.pinching) {
        c.ret = { id: p.grab, from: (this._held && this._held.pos) || mid, t0: now() };
        if (p.grab === 'magnifier') this._toggleMag(false);
        c.held = null; p.grab = null; this._held = null;
      }
      if (p.grab) { this._held = { id: p.grab, pos: mid }; p.suppressRay = true; return; }
    }
    if (Math.abs(lt[0] - MAG[0]) < 0.05 && Math.abs(lt[2] - MAG[1]) < 0.06) {
      if (lt[1] < 0.09) p.pokeItem = 'magnifier';
      if (lt[1] < 0.025 && lt[1] > -0.01) inside = 'magnifier';
    }
    v.items.forEach(function (it) {
      var s = SLOTS[it.slot], h = half(it), top = topOf(it);
      if (Math.abs(lt[0] - s[0]) < h[0] && Math.abs(lt[2] - s[1]) < h[1]) {
        if (lt[1] < top + 0.07) p.pokeItem = it.id;
        if (lt[1] < top + 0.005 && lt[1] > -0.01) inside = it.id;
      }
    });
    if (inside && inside !== p.inItem && this.time - (p.lastItemPoke === undefined ? -9 : p.lastItemPoke) > 0.5) { p.lastItemPoke = this.time; self.invInspect(inside); }
    p.inItem = inside;
  };

  /* ======================= read aloud ======================= */
  Game.prototype._invReadText = function () {
    var c = this.cur, st = this.state;
    if (st === 'menu') return T('Detective headquarters. Choose an investigation, the cyber case files, the daily case or training.');
    var v = this.inv();
    if (st === 'brief') return T('Investigation: ') + v.title + '. ' + v.type + T('. Client: ') + v.client + ', ' + v.role + '. ' + v.brief;
    if (st === 'scene') {
      if (c.open) { var it = this._item(c.open), body = C.segments(it.body).filter(function (sg) { return !sg.key || !isHidden(sg.key) || c.magnify; }).map(function (sg) { return sg.text; }).join('');
        return it.name + '. ' + (it.from ? T('From ') + it.from + '. ' : '') + (it.subject ? it.subject + '. ' : '') + body; }
      return T('Crime scene: ') + v.place + T('. Touch an object to inspect it. Evidence found: ') + c.found.length + T(' of ') + Object.keys(v.evidence).length + '.';
    }
    if (st === 'puzzle') return this._pzReadText();
    if (st === 'board') { var Q = v.board[c.bq]; return c.bdone ? T('Correct. ') + Q.why : Q.q + T(' Choose the evidence card on the board.'); }
    if (st === 'lineup') {
      if (c.ldone) return T('Correct. ') + v.lineup.why;
      if (c.lwrong) return this._person(c.lwrong).name + T(' says: ') + v.lineup.alibis[c.lwrong].say + ' ' + v.lineup.alibis[c.lwrong].why;
      return v.lineup.q + ' ' + v.lineup.ids.map(function (id, i) { return T('Number ') + (i + 1) + ': ' + v.people[id].name + ', ' + v.people[id].role + '.'; }).join(' ');
    }
    if (st === 'interro') {
      var sp = this._step(), S = sp.S, nm = this._person(sp.who).name;
      if (c.iphase === 'tone') return sp.P.intro + ' ' + sp.P.tone.mood + ' ' + T('How will you play it?');
      if (c.iphase === 'ask') return (c.altNote ? nm + T(' says: ') + c.altNote.a + ' ' : '') + T('Choose your question:') + ' ' + this._askOpts().map(function (o) { return o.q; }).join(' ');
      return c.sdone ? (S.truth ? T('That was true. ') : T('Lie exposed. ')) + S.why : nm + T(' says: ') + S.say + T(' Do you believe this, or will you show evidence?');
    }
    if (st === 'confess') return this._culprit().name + T(' confesses: ') + v.suspect.confession;
    if (st === 'report') return v.report === '112' ? T('In India, call 112 for police emergencies and crimes like theft.') : T('In India, call 1930 to report cyber crime, or use cybercrime.gov.in. Reporting fast can freeze the money.');
    if (st === 'closed') return T('Case closed. ') + v.ending + T(' You earned the ') + T(v.badge) + T(' badge.') + (v.real ? ' ' + T('Based on a real case') + ': ' + v.real.text : '');
    return '';
  };

  /* ======================= scene ======================= */
  Game.prototype._invScene = function (dt) {
    var r = this.r, self = this, t = this.time, st = this.state, ar = this.xr && this.xr.mode === 'immersive-ar', c = this.cur;
    r.clearList();
    if (this.anim.card < 1) this.anim.card = Math.min(1, (now() - this.anim.cardT0) / 0.45);
    this._boardMats();
    function add(mesh, l, color, em, extra) { var it = { mesh: mesh, m: self._bm(l), color: color, em: em }; if (extra) for (var k in extra) it[k] = extra[k]; return r.add(it); }
    var room = st === 'scene' ? 'home' : st === 'interro' || st === 'confess' ? 'interro' : st === 'lineup' ? 'lineup' : 'office';
    var day = this.isDay(), PAL = day ? PAL_DAY : PAL_NIGHT, P = PAL[room], look = room === 'home' && this._sceneLook ? this._sceneLook() : null;
    if (look) P = look.pal;   // every investigation has its own crime scene
    this.sound.setRoom(st === 'menu' ? 'office' : look ? this._sceneSound() : room);
    // the scanned interrogation room (walls, mirror, pipes, cameras) replaces the plain shell once it has loaded
    var scanned = false;
    if (room === 'interro' && !ar && root.Models && root.Models.info('interro_room')) {
      var X = this.roomXf || [-0.53, -0.74, 1.3, Math.PI / 2];
      scanned = root.Models.draw(add, M.trs(X[0], X[1], X[2], 0, X[3], 0, 1), 'interro_room', 1, { photo: 0 });
      if (scanned) add('box', M.trs(X[4] || 2.95, 0.3, 0, 0, 0, 0, 0.03, 2.4, 6.4), [0.62, 0.64, 0.66, 1], null, { tex: this.mat.plaster, tile: 1.2 });   // the room's open fourth side
    }
    if (!ar) {
      if (look) this._drawCrimeScene(add, t); else if (!scanned) this._drawRoomProps(add, room, t);
      var MT = this.mat, FLOORMAT = look ? look.floor : { home: [MT.wood, 1.3], office: [MT.tile, 0.8], lineup: [MT.concrete, 0.6], interro: [MT.concrete, 0.6] }[room];
      add('box', M.trs(0.03, -0.025, 0.02, 0, 0, 0, 1.0, 0.044, 0.6), P.table, null, { tex: MT.wood, tile: 2.5 });
      if (!scanned) add('disc', M.trs(0, -0.74, 0.2, 0, 0, 0, 6), P.floor, null, { tex: FLOORMAT[0], tile: FLOORMAT[1] });
      var wall = P.wall;
      if (!scanned) { add('box', M.trs(0, 0.3, room === 'lineup' ? -1.56 : -0.95, 0, 0, 0, 3.4, 2.4, 0.02), wall, null, { tex: look ? look.wallTex : this.mat.plaster, tile: 1.2 }); this._roomShell(add, wall, look && look.wallTex); }
      if (room === 'interro' && !scanned) add('box', M.trs(0.45, 0.35, -0.93, 0, 0, 0, 0.6, 0.35, 0.01), [0.06, 0.07, 0.09, 1], [0.03, 0.04, 0.06]);
      if (room === 'home' && this._sceneKind() === 'drawing') { add('box', M.trs(-0.55, 0.35, -0.93, 0, 0, 0, 0.36, 0.28, 0.01), [0.75, 0.82, 0.9, 1], [0.15, 0.17, 0.2]); add('box', M.trs(-0.55, 0.35, -0.925, 0, 0, 0, 0.02, 0.28, 0.01), [0.4, 0.3, 0.2, 1]); }
    }
    // table top per room
    var top = P.top;
    if (room === 'home') add('box', M.trs(0.015, 0.002, 0.03, 0, 0, 0, 0.8, 0.004, 0.42), top, null, look ? { tex: look.top[0], tile: look.top[1] } : { tex: this.mat.wood, tile: 3 });
    else add('box', M.trs(0.03, 0.002, 0.03, 0, 0, 0, 0.66, 0.004, 0.36), top, null, room === 'interro' ? { tex: this.mat.metal, tile: 3 } : { tex: this.mat.felt, tile: 5 });
    var hv = this._hovered();

    if (room === 'office') {
      // desk lamp + case folders + magnifying glass
      this._shadow(-0.29, 0.0045, -0.16, 0.13, 0.13, 0.8); this._shadow(-0.22, 0.0045, 0.12, 0.22, 0.18, 0.55); this._shadow(0.16, 0.0045, 0.13, 0.2, 0.2, 0.5);
      add('cyl', M.trs(-0.29, 0.006, -0.16, 0, 0, 0, 0.07, 0.008, 0.07), [0.15, 0.15, 0.17, 1]);
      add('cyl', M.trs(-0.29, 0.1, -0.16, 0, 0, 0, 0.008, 0.19, 0.008), [0.2, 0.2, 0.22, 1]);
      add('cyl', M.trs(-0.27, 0.2, -0.15, 0.5, 0, -0.3, 0.07, 0.045, 0.07), [0.12, 0.35, 0.28, 1]);
      r.add({ mesh: 'sphere', m: this._bm(M.trs(-0.265, 0.18, -0.145, 0, 0, 0, 0.09)), color: [1, 0.85, 0.55, 0.16], add: 1, unlit: 1 });
      [0, 1, 2].forEach(function (i) { add('box', M.trs(-0.22 + i * 0.006, 0.006 + i * 0.006, 0.12 - i * 0.004, 0, 0.1 - i * 0.12, 0, 0.16, 0.005, 0.12), [0.86, 0.72, 0.45, 1]); });
      add('cyl', M.trs(0.16, 0.006, 0.13, 0, 0.5, 0, 0.075, 0.006, 0.075), [0.25, 0.22, 0.2, 1]);
      r.add({ mesh: 'disc', m: this._bm(M.trs(0.16, 0.0105, 0.13, 0, 0, 0, 0.06)), color: [0.7, 0.85, 1, 0.35], add: 1, unlit: 1 });
      add('box', M.trs(0.215, 0.006, 0.175, 0, -0.8, 0, 0.012, 0.01, 0.08), [0.3, 0.2, 0.12, 1]);
      if (st === 'board' || st === 'puzzle') {
        add('box', M.mul(this.boardLocal, M.trs(0, 0, -0.012, 0, 0, 0, 1.05, 1.08, 0.02)), [0.36, 0.24, 0.14, 1]);
        add('box', M.trs(-0.18, 0.04, -0.21, 0.25, 0, 0, 0.012, 0.09, 0.012), [0.36, 0.24, 0.14, 1]);
        add('box', M.trs(0.18, 0.04, -0.21, 0.25, 0, 0, 0.012, 0.09, 0.012), [0.36, 0.24, 0.14, 1]);
      }
    }
    if (room === 'home') {
      var v = this.inv();
      v.items.forEach(function (it) {
        var s = SLOTS[it.slot], open = c.open === it.id, hov = hv.item === it.id && !open;
        var lift = open ? 0.012 + 0.006 * Math.sin(t * 3) : 0, base = M.trs(s[0], lift + 0.0045, s[1], 0, s[2], 0, IS);
        if (self._held && self._held.id === it.id) { var hp = self._held.pos; base = M.trs(hp[0], hp[1] - 0.01, hp[2], -0.85, s[2], 0, IS); }
        else if (c.ret && c.ret.id === it.id) {
          var k = Math.min(1, (now() - c.ret.t0) / 0.45), e2 = ease(k), f = c.ret.from;
          base = M.trs(M.lerp(f[0], s[0], e2), M.lerp(f[1], lift + 0.0045, e2) + Math.sin(k * Math.PI) * 0.03, M.lerp(f[2], s[1], e2), -0.85 * (1 - e2), s[2], 0, IS);
          if (k >= 1) c.ret = null;
        }
        var em = open ? [0.18, 0.16, 0.08] : hov ? [0.14, 0.18, 0.24] : null, hh = half(it);
        if (!(self._held && self._held.id === it.id)) self._shadow(s[0], 0.0048, s[1], hh[0] * 2 * IS * 1.5, hh[1] * 2 * IS * 1.5, 0.75, s[2]);
        itemParts(it.kind).forEach(function (pt) {
          var x = { mesh: pt[0], m: self._bm(M.mul(base, pt[1])), color: pt[2], em: pt[3] || em };
          if (pt[4]) x.unlit = 1; r.add(x);
        });
        var examined = c.tapped.some(function (tg) { return tg.indexOf(it.id + ':') === 0; });
        var hasEv = Object.keys(it.clues).some(function (k) { return it.clues[k].ev; });
        var done = hasEv && Object.keys(it.clues).every(function (k) { var e = it.clues[k].ev; return !e || c.found.indexOf(e) >= 0; });
        var h = topOf(it) + 0.03;
        if (done) r.add({ mesh: 'sphere', m: self._bm(M.trs(s[0], h, s[1], 0, 0, 0, 0.016)), color: [0.35, 0.9, 0.55, 1], unlit: 1 });
        else if (examined && !hasEv) r.add({ mesh: 'sphere', m: self._bm(M.trs(s[0], h, s[1], 0, 0, 0, 0.012)), color: [0.6, 0.62, 0.66, 1], unlit: 1 });
        if (c.hintItem === it.id || hov) {
          var pulse = 0.25 + 0.2 * Math.sin(t * 6);
          r.add({ mesh: 'disc', m: self._bm(M.trs(s[0], 0.005, s[1], 0, 0, 0, Math.max(half(it)[0], half(it)[1]) * 2.3)), color: c.hintItem === it.id ? [1, 0.8, 0.25, pulse] : [0.5, 0.8, 1, 0.3], add: 1, unlit: 1 });
        }
      });
    }
    if (room === 'lineup') this._drawLineup(add, t);
    if (room === 'home') this._drawMagnifier(add, t);
    if (room === 'interro') {
      if (!ar) add('box', M.trs(0.03, -0.37, 0.31, 0, 0, 0, 1.0, 0.7, 0.015), [0.27, 0.28, 0.3, 1], null, { tex: this.mat.metal, tile: 3 });   // the desk's front panel
      this._drawInterroPerson(add, t);
      // tape recorder + glass of water
      this._shadow(-0.27, 0.0045, -0.1, 0.17, 0.11, 0.7); this._shadow(0.29, 0.0045, -0.08, 0.09, 0.09, 0.5);
      add('box', M.trs(-0.27, 0.015, -0.1, 0, 0.2, 0, 0.12, 0.03, 0.07), [0.12, 0.12, 0.13, 1]);
      [-1, 1].forEach(function (sd) { add('cyl', M.trs(-0.27 + sd * 0.028, 0.031, -0.1, 0, t * 2, 0, 0.032, 0.004, 0.032), [0.55, 0.55, 0.58, 1]); });
      add('sphere', M.trs(-0.23, 0.032, -0.075, 0, 0, 0, 0.008), [1, 0.15, 0.1, 1], null, { unlit: Math.sin(t * 4) > 0 ? 1 : 0 });
      add('cyl', M.trs(0.29, 0.045, -0.08, 0, 0, 0, 0.055, 0.09, 0.055), [0.75, 0.88, 0.95, 0.35]);
      if (this._drawEvidenceCards) this._drawEvidenceCards(add, t);
      add('cyl', M.trs(0, 0.82, -0.2, 0, 0, 0, 0.12, 0.05, 0.12), [0.15, 0.15, 0.16, 1]);
      add('cyl', M.trs(0, 1.15, -0.2, 0, 0, 0, 0.006, 0.6, 0.006), [0.1, 0.1, 0.1, 1]);
      r.add({ mesh: 'sphere', m: this._bm(M.trs(0, 0.795, -0.2, 0, 0, 0, 0.07, 0.03, 0.07)), color: [1, 0.95, 0.8, 1], unlit: 1 });
      r.add({ mesh: 'disc', m: this._bm(M.trs(0, 0.0055, -0.12, 0, 0, 0, 0.42)), color: [1, 0.92, 0.7, 0.08], add: 1, unlit: 1 });
      if (st === 'confess') this._drawArrestLights(add, t);
    }
    if (st === 'closed' && this.medalT0 !== undefined) this._drawMedal(add, t);
    // panels
    var visible = this._invCardVisible();
    if (visible) {
      this._invDrawCard(hv.card);
      r.add({ mesh: 'box', m: this._bm(M.mul(this.cardLocal, M.trs(0, 0, -0.012, 0, 0, 0, 1.02, 1.02, 0.02))), color: [0.85, 0.83, 0.78, 1] });
      r.add({ mesh: 'quad', m: this._bm(this.cardLocal), color: [1, 1, 1, 1], tex: this.cardTex, unlit: 1 });
      if (st === 'scene' && c.open) { // stand
        add('box', M.trs(0, 0.03, -0.11, -0.32, 0, 0, 0.12, 0.07, 0.012), [0.33, 0.23, 0.16, 1]);
      }
    } else this.cardButtons = [];
    if (st === 'puzzle') {
      this._invDrawPuzzle(hv.board);
      r.add({ mesh: 'quad', m: this._bm(this.boardLocal), color: [1, 1, 1, 1], tex: this.boardTex, unlit: 1 });
    }
    if (st === 'board') {
      this._invDrawBoard(hv.board);
      r.add({ mesh: 'quad', m: this._bm(this.boardLocal), color: [1, 1, 1, 1], tex: this.boardTex, unlit: 1 });
    }
    this._invDrawInfo(hv.info, hv.item);
    r.add({ mesh: 'quad', m: this._bm(this.infoLocal), color: [1, 1, 1, 1], tex: this.infoTex, unlit: 1 });
    this._drawPointers(); this._drawFx();
  };

  function P(x, y, z, rx, ry, rz, sx, sy, sz) { return M.trs(x, y, z, rx || 0, ry || 0, rz || 0, sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz); }
  /** Each part: [mesh, localMatrix, color, emissive?, unlit?] */
  function itemParts(kind) {
    switch (kind) {
      case 'laptop':
        var th = -0.3, lc = [0, 0.012 + 0.062 * Math.cos(th), -0.035 + 0.062 * Math.sin(th)], n = [0, -Math.sin(th), Math.cos(th)];
        return [['box', P(0, 0.006, 0.03, 0, 0, 0, 0.19, 0.012, 0.13), [0.62, 0.64, 0.68, 1]],
          ['box', P(0, 0.0125, 0.045, 0, 0, 0, 0.16, 0.001, 0.07), [0.25, 0.26, 0.29, 1]],
          ['box', P(lc[0], lc[1], lc[2], th, 0, 0, 0.19, 0.125, 0.006), [0.55, 0.57, 0.6, 1]],
          ['box', P(lc[0] + n[0] * 0.0035, lc[1] + n[1] * 0.0035, lc[2] + n[2] * 0.0035, th, 0, 0, 0.17, 0.105, 0.001), [0.25, 0.5, 0.85, 1], [0.15, 0.25, 0.4], 1]];
      case 'phone':
        return [['box', P(0, 0.005, 0, 0, 0, 0, 0.07, 0.009, 0.14), [0.08, 0.08, 0.1, 1]],
          ['box', P(0, 0.0098, 0, 0, 0, 0, 0.062, 0.001, 0.126), [0.3, 0.55, 0.62, 1], [0.1, 0.2, 0.22], 1]];
      case 'notebook':
        return [['box', P(0, 0.007, 0, 0, 0, 0, 0.14, 0.013, 0.19), [0.62, 0.17, 0.16, 1]],
          ['box', P(0.004, 0.0142, 0, 0, 0, 0, 0.128, 0.002, 0.178), [0.96, 0.93, 0.84, 1]],
          ['box', P(-0.066, 0.016, 0, 0, 0, 0, 0.008, 0.004, 0.18), [0.2, 0.2, 0.22, 1]]];
      case 'letter':
        return [['box', P(0, 0.0018, 0, 0, 0, 0, 0.15, 0.003, 0.2), [0.95, 0.94, 0.9, 1]],
          ['box', P(0, 0.0035, -0.075, 0, 0, 0, 0.11, 0.0005, 0.02), [0.55, 0.2, 0.15, 1]],
          ['cyl', P(0.045, 0.0035, 0.07, 0, 0, 0, 0.035, 0.001, 0.035), [0.7, 0.2, 0.2, 1]]];
      case 'printout':
        return [['box', P(0, 0.0018, 0, 0, 0, 0, 0.15, 0.003, 0.2), [0.94, 0.94, 0.94, 1]],
          ['box', P(0, 0.0035, -0.045, 0, 0, 0, 0.12, 0.0005, 0.07), [0.25, 0.27, 0.3, 1]],
          ['box', P(0, 0.0035, 0.045, 0, 0, 0, 0.12, 0.0005, 0.07), [0.3, 0.32, 0.35, 1]]];
      case 'receipt':
        return [['box', P(0, 0.0018, 0, 0, 0, 0, 0.07, 0.003, 0.13), [0.97, 0.96, 0.92, 1]],
          ['box', P(0, 0.0035, -0.045, 0, 0, 0, 0.05, 0.0005, 0.01), [0.4, 0.4, 0.4, 1]]];
      case 'cup':
        return [['cyl', P(0, 0.044, 0, 0, 0, 0, 0.055, 0.07, 0.055), [0.95, 0.94, 0.92, 1]],
          ['disc', P(0, 0.075, 0, 0, 0, 0, 0.046), [0.55, 0.36, 0.2, 1]],
          ['box', P(0.034, 0.045, 0, 0, 0, 0, 0.014, 0.035, 0.008), [0.95, 0.94, 0.92, 1]],
          ['cyl', P(0, 0.007, 0, 0, 0, 0, 0.09, 0.004, 0.09), [0.9, 0.88, 0.85, 1]]];
      case 'jewelbox':
        var lt = -1.3, lcz = -0.05 + 0.05 * Math.cos(lt), lcy = 0.05 - 0.05 * Math.sin(lt);
        return [['box', P(0, 0.025, 0, 0, 0, 0, 0.14, 0.05, 0.1), [0.45, 0.08, 0.13, 1]],
          ['box', P(0, 0.0505, 0, 0, 0, 0, 0.125, 0.001, 0.085), [0.6, 0.1, 0.15, 1]],
          ['box', P(0, lcy, lcz, lt, 0, 0, 0.14, 0.01, 0.1), [0.45, 0.08, 0.13, 1]],
          ['box', P(0, 0.051, 0.05, 0, 0, 0, 0.142, 0.004, 0.004), [0.85, 0.66, 0.25, 1]],
          ['sphere', P(-0.03, 0.055, 0.015, 0, 0, 0, 0.012), [0.9, 0.75, 0.3, 1]],
          ['sphere', P(-0.012, 0.055, 0.015, 0, 0, 0, 0.012), [0.9, 0.75, 0.3, 1]]];
      case 'clipboard':
        return [['box', P(0, 0.004, 0, 0, 0, 0, 0.13, 0.007, 0.18), [0.5, 0.35, 0.2, 1]],
          ['box', P(0, 0.0085, 0.006, 0, 0, 0, 0.11, 0.002, 0.15), [0.97, 0.97, 0.95, 1]],
          ['box', P(0, 0.012, -0.08, 0, 0, 0, 0.045, 0.01, 0.016), [0.75, 0.76, 0.8, 1]]];
      case 'cone':
        return [['cyl', P(0, 0.012, 0, 0, 0, Math.PI / 2, 0.022, 0.11, 0.022), [0.22, 0.45, 0.2, 1]],
          ['sphere', P(-0.058, 0.012, 0, 0, 0, 0, 0.012), [0.35, 0.2, 0.08, 1]]];
    }
    return [['box', P(0, 0.01, 0, 0, 0, 0, 0.08, 0.02, 0.08), [0.6, 0.6, 0.6, 1]]];
  }

  // background props that make each room feel like a real place (VR only; in mixed reality your room is the backdrop)
  Game.prototype._drawRoomProps = function (add, room, t) {
    var r = this.r, self = this, W = room === 'lineup' ? -1.54 : -0.935;
    function glow(mesh, l, col) { r.add({ mesh: mesh, m: self._bm(l), color: col, unlit: 1 }); }
    function clock(x, y, z) {
      add('cyl', M.trs(x, y, z, Math.PI / 2, 0, 0, 0.13, 0.02, 0.13), [0.15, 0.15, 0.16, 1]);
      add('cyl', M.trs(x, y, z + 0.011, Math.PI / 2, 0, 0, 0.115, 0.004, 0.115), [0.95, 0.94, 0.9, 1]);
      var d = new Date(), sec = d.getSeconds() + (d.getMilliseconds() > 500 ? 0.5 : 0), mn = d.getMinutes() + sec / 60, hr = (d.getHours() % 12) + mn / 60;
      [[hr / 12, 0.055, 0.008, [0.1, 0.1, 0.1, 1]], [mn / 60, 0.085, 0.006, [0.1, 0.1, 0.1, 1]], [Math.floor(sec) / 60, 0.095, 0.0025, [0.8, 0.1, 0.1, 1]]].forEach(function (h) {
        var a = -h[0] * Math.PI * 2;
        add('box', M.trs(x - Math.sin(a) * h[1] / 2, y + Math.cos(a) * h[1] / 2, z + 0.016, 0, 0, a, h[2], h[1], 0.003), h[3]);
      });
      for (var i = 0; i < 12; i++) { var a2 = i / 12 * Math.PI * 2; add('box', M.trs(x + Math.sin(a2) * 0.1, y + Math.cos(a2) * 0.1, z + 0.014, 0, 0, -a2, 0.006, i % 3 ? 0.012 : 0.022, 0.002), [0.2, 0.2, 0.2, 1]); }
    }
    if (room === 'home') {
      // rug, sofa, plant, picture frames, shelf with books, wall clock, ceiling light
      add('box', M.trs(0, -0.737, 0.15, 0, 0.05, 0, 2.2, 0.006, 1.6), [0.48, 0.16, 0.14, 1]);
      add('box', M.trs(0, -0.733, 0.15, 0, 0.05, 0, 1.9, 0.006, 1.3), [0.62, 0.42, 0.22, 1]);
      add('box', M.trs(1.45, -0.5, -0.75, 0, -0.4, 0, 0.9, 0.42, 0.42), [0.28, 0.33, 0.45, 1]);
      add('box', M.trs(1.52, -0.2, -0.9, 0, -0.4, 0, 0.9, 0.4, 0.12), [0.25, 0.3, 0.42, 1]);
      add('cyl', M.trs(-1.25, -0.6, -0.75, 0, 0, 0, 0.16, 0.28, 0.16), [0.6, 0.35, 0.22, 1]);
      [[0, 0.3], [0.8, 0.22], [1.6, 0.26], [2.4, 0.2], [3.3, 0.24]].forEach(function (l, i) {
        add('sphere', M.trs(-1.25 + Math.sin(l[0]) * 0.1, -0.3 + i * 0.07, -0.75 + Math.cos(l[0]) * 0.1, 0, 0, 0, l[1] * 0.6), [0.18, 0.42 + i * 0.03, 0.2, 1]);
      });
      add('box', M.trs(-1.1, 0.75, -0.9, 0, 0, 0, 0.5, 0.025, 0.14), [0.38, 0.26, 0.17, 1]);
      [[0.62, 0.2, 0.18], [0.2, 0.35, 0.55], [0.85, 0.7, 0.3], [0.3, 0.5, 0.3], [0.7, 0.3, 0.4]].forEach(function (cl, i) {
        add('box', M.trs(-1.3 + i * 0.045, 0.85, -0.9, 0, 0, i === 4 ? 0.25 : 0, 0.035, 0.17 + (i % 2) * 0.03, 0.11), [cl[0], cl[1], cl[2], 1]);
      });
      add('box', M.trs(0.15, 0.45, W, 0, 0, 0, 0.32, 0.24, 0.015), [0.3, 0.2, 0.12, 1]);
      add('box', M.trs(0.15, 0.45, W + 0.009, 0, 0, 0, 0.27, 0.19, 0.004), [0.55, 0.7, 0.62, 1], [0.05, 0.06, 0.05]);
      add('sphere', M.trs(0.1, 0.43, W + 0.012, 0, 0, 0, 0.03, 0.06, 0.004), [0.85, 0.62, 0.45, 1]);
      add('sphere', M.trs(0.2, 0.43, W + 0.012, 0, 0, 0, 0.03, 0.06, 0.004), [0.75, 0.55, 0.42, 1]);
      clock(0.62, 0.62, W);
      var dayH = this.isDay();
      if (dayH) glow('box', M.trs(-0.45, 0.5, W, 0, 0, 0, 0.6, 0.55, 0.01), [0.66, 0.85, 1, 1]);
      else add('box', M.trs(-0.45, 0.5, W, 0, 0, 0, 0.6, 0.55, 0.01), [0.04, 0.06, 0.12, 1], [0.02, 0.03, 0.07]);
      if (dayH) glow('sphere', M.trs(-0.33, 0.66, W + 0.004, 0, 0, 0, 0.04, 0.04, 0.002), [1, 0.97, 0.8, 1]);
      else glow('sphere', M.trs(-0.6, 0.68, W + 0.004, 0, 0, 0, 0.03, 0.03, 0.002), [0.95, 0.95, 0.85, 1]);
      this._skyline(add, glow, -0.45, 0.5, 0.6, 0.55, W + 0.005, dayH, 3, t);
      add('box', M.trs(-0.45, 0.5, W + 0.012, 0, 0, 0, 0.02, 0.55, 0.01), [0.95, 0.95, 0.93, 1]);
      add('box', M.trs(-0.45, 0.5, W + 0.012, 0, 0, 0, 0.6, 0.02, 0.01), [0.95, 0.95, 0.93, 1]);
      [-1, 1].forEach(function (sd) {   // curtains sway gently
        var sw = Math.sin(t * 0.8 + sd) * 0.04;
        add('box', M.mul(M.trs(-0.45 + sd * 0.38, 0.85, W + 0.03, 0, 0, sw, 1), M.trs(0, -0.35, 0, 0, 0, 0, 0.16, 0.7, 0.012)), [0.86, 0.45, 0.35, 1], null, { tex: self.mat.fabric, tile: 14 });
      });
      if (dayH) {
        r.add({ mesh: 'disc', m: self._bm(M.trs(-0.2, -0.73, 0.0, 0, 0.4, 0, 1.0, 1, 0.45)), color: [1, 0.95, 0.75, 0.2], add: 1, unlit: 1 });
        this._dust(add, -0.35, 0.0, -0.45, t);
      }
      // ceiling fan
      add('cyl', M.trs(0.55, 1.3, -0.3, 0, 0, 0, 0.006, 0.12, 0.006), [0.2, 0.2, 0.2, 1]);
      add('cyl', M.trs(0.55, 1.23, -0.3, 0, 0, 0, 0.07, 0.04, 0.07), [0.85, 0.85, 0.82, 1]);
      for (var fb = 0; fb < 3; fb++) { var fa = t * 4 + fb * Math.PI * 2 / 3; add('box', M.mul(M.trs(0.55, 1.22, -0.3, 0, fa, 0, 1), M.trs(0.2, 0, 0, 0.08, 0, 0, 0.34, 0.006, 0.07)), [0.5, 0.36, 0.24, 1], null, { tex: self.mat.wood, tile: 6 }); }
      // TV on a low cabinet; its screen flickers with a programme
      add('box', M.trs(1.05, -0.55, -0.85, 0, -0.35, 0, 0.5, 0.38, 0.28), [0.45, 0.32, 0.22, 1], null, { tex: self.mat.wood, tile: 3 });
      add('box', M.trs(1.05, -0.24, -0.88, 0, -0.35, 0, 0.42, 0.25, 0.025), [0.06, 0.06, 0.07, 1]);
      var tvc = 0.45 + 0.25 * Math.sin(t * 2.3) + 0.15 * Math.sin(t * 7.1);
      add('box', M.trs(1.055, -0.24, -0.866, 0, -0.35, 0, 0.38, 0.21, 0.003), [0.25 * tvc, 0.4 * tvc, 0.65 * tvc, 1], null, { unlit: 1 });
      add('cyl', M.trs(0, 1.25, -0.2, 0, 0, 0, 0.004, 0.2, 0.004), [0.1, 0.1, 0.1, 1]);
      glow('sphere', M.trs(0, 1.12, -0.2, 0, 0, 0, 0.06), [1, 0.9, 0.72, 1]);
      add('cyl', M.trs(0, 1.16, -0.2, 0, 0, 0, 0.14, 0.07, 0.14), [0.9, 0.82, 0.62, 0.9]);
    } else if (room === 'office') {
      // filing cabinet, case-file shelf, clock, wanted notices, window blinds, coat stand
      add('box', M.trs(-1.0, -0.25, -0.7, 0, 0.25, 0, 0.42, 1.0, 0.5), [0.42, 0.44, 0.42, 1]);
      [0, 1, 2].forEach(function (i) {
        add('box', M.trs(-0.97, 0.1 - i * 0.32, -0.46, 0, 0.25, 0, 0.36, 0.26, 0.01), [0.5, 0.52, 0.5, 1]);
        add('box', M.trs(-0.97, 0.15 - i * 0.32, -0.45, 0, 0.25, 0, 0.1, 0.02, 0.02), [0.8, 0.8, 0.78, 1]);
      });
      clock(0.55, 0.68, W);
      this._drawIndiaMap(add, -0.42, 0.62, W);
      this._drawTrophyShelf(add, 0.25, 0.22, W, t);
      [[0.12, 0.72, 0.04]].forEach(function (n) {
        add('box', M.trs(n[0], n[1], W, 0, 0, n[2], 0.2, 0.26, 0.004), [0.92, 0.88, 0.76, 1]);
        add('sphere', M.trs(n[0], n[1] + 0.03, W + 0.004, 0, 0, 0, 0.04, 0.05, 0.002), [0.3, 0.28, 0.27, 1]);
        add('box', M.trs(n[0], n[1] + 0.105, W + 0.004, 0, 0, n[2], 0.15, 0.02, 0.002), [0.7, 0.12, 0.1, 1]);
        add('sphere', M.trs(n[0], n[1] + 0.12, W + 0.006, 0, 0, 0, 0.008), [0.85, 0.15, 0.12, 1]);
      });
      // night window with blinds
      var dayW = this.isDay();
      if (dayW) glow('box', M.trs(1.05, 0.45, W, 0, 0, 0, 0.7, 0.6, 0.01), [0.62, 0.82, 1, 1]);
      else add('box', M.trs(1.05, 0.45, W, 0, 0, 0, 0.7, 0.6, 0.01), [0.05, 0.08, 0.14, 1], [0.03, 0.05, 0.1]);
      this._skyline(add, glow, 1.05, 0.45, 0.7, 0.6, W + 0.005, dayW, 7, t);
      for (var b = 0; b < 12; b++) add('box', M.trs(1.05, 0.2 + b * 0.045, W + 0.012, dayW ? 1.2 : 0.6, 0, 0, 0.68, 0.025, 0.004), dayW ? [0.96, 0.94, 0.88, 1] : [0.75, 0.7, 0.58, 1]);
      if (dayW) this._dust(add, 0.75, 0.1, -0.5, t);
      if (!dayW) [[0.95, 0.4], [1.15, 0.55], [1.25, 0.32]].forEach(function (lt) { glow('sphere', M.trs(lt[0], lt[1], W + 0.006, 0, 0, 0, 0.008), [1, 0.85, 0.5, 1]); });
      else r.add({ mesh: 'disc', m: self._bm(M.trs(0.7, -0.735, -0.3, 0, 0.3, 0, 1.1, 1, 0.5)), color: [1, 0.95, 0.75, 0.18], add: 1, unlit: 1 });
      add('cyl', M.trs(1.2, -0.12, -0.55, 0, 0, 0, 0.012, 1.25, 0.012), [0.25, 0.18, 0.12, 1]);
      // the detective's own cup of chai, still steaming
      this._shadow(-0.28, 0.0045, -0.07, 0.08, 0.08, 0.6);
      add('cyl', M.trs(-0.28, 0.03, -0.07, 0, 0, 0, 0.045, 0.055, 0.045), [0.92, 0.9, 0.86, 1]);
      add('cyl', M.trs(-0.28, 0.056, -0.07, 0, 0, 0, 0.038, 0.002, 0.038), [0.62, 0.42, 0.25, 1]);
      add('box', M.trs(-0.253, 0.03, -0.07, 0, 0, 0, 0.012, 0.03, 0.006), [0.92, 0.9, 0.86, 1]);
      this._steam(add, -0.28, 0.06, -0.07, t);
      add('box', M.trs(1.2, 0.3, -0.53, 0.1, 0.4, 0, 0.32, 0.55, 0.1), [0.42, 0.33, 0.24, 1]);
      add('cyl', M.trs(1.2, 0.5, -0.55, 0, 0, 0, 0.1, 0.05, 0.1), [0.2, 0.17, 0.14, 1]);
    } else if (room === 'interro') {
      // camera in the corner with blinking light, door, flickering strip light
      add('box', M.trs(-1.15, 1.0, -0.85, 0.4, 0.6, 0, 0.12, 0.08, 0.18), [0.88, 0.88, 0.86, 1]);
      add('sphere', M.trs(-1.1, 0.97, -0.77, 0, 0, 0, 0.012), [1, 0.15, 0.1, 1], null, { unlit: Math.sin(t * 3) > 0.3 ? 1 : 0 });
      add('box', M.trs(-0.7, -0.2, W, 0, 0, 0, 0.5, 1.1, 0.02), [0.28, 0.3, 0.33, 1]);
      add('box', M.trs(-0.52, -0.2, W + 0.02, 0, 0, 0, 0.06, 0.02, 0.03), [0.7, 0.7, 0.68, 1]);
      add('box', M.trs(-0.7, 0.22, W + 0.012, 0, 0, 0, 0.18, 0.12, 0.004), [0.08, 0.1, 0.12, 1], [0.02, 0.03, 0.04]);
      var fl = Math.sin(t * 37) > 0.97 ? 0.4 : 1;
      glow('box', M.trs(0.45, 1.2, -0.5, 0, 0, 0, 0.9, 0.02, 0.08), [0.85 * fl, 0.95 * fl, 1 * fl, 1]);
    }
  };

  /** Red and blue police lights sweeping the interrogation room once the suspect confesses. */
  Game.prototype._drawArrestLights = function (add, t) {
    var r = this.r, self = this, glow = this.mat.glow, e = this.time - (this.arrestT0 || 0), fadeIn = Math.min(1, e / 0.6);
    [[1, 0.12, 0.1], [0.15, 0.35, 1]].forEach(function (col, i) {
      var ph = t * 3.2 + i * Math.PI, x = Math.sin(ph) * 1.1, on = 0.55 + 0.45 * Math.sin(t * 9 + i * Math.PI);
      if (glow) {
        r.add({ mesh: 'quad', m: self._bm(M.trs(x, 0.45, -0.92, 0, 0, 0, 1.3, 1.1, 1)), color: col.concat(0.95 * on * fadeIn), tex: glow, add: 1, unlit: 1 });
        r.add({ mesh: 'quad', m: self._bm(M.trs(-x * 0.8, -0.73, -0.2, -Math.PI / 2, 0, 0, 1.4, 1.0, 1)), color: col.concat(0.6 * on * fadeIn), tex: glow, add: 1, unlit: 1 });
      }
      // beacon on top of the door frame
      add('sphere', M.trs(-0.78 + i * 0.16, 0.42, -0.9, 0, 0, 0, 0.035), col.concat(1), null, { unlit: on > 0.6 ? 1 : 0 });
    });
  };
  /** The case badge rises out of the desk as a spinning gold medal. */
  Game.prototype._drawMedal = function (add, t) {
    var e = this.time - this.medalT0, k = Math.min(1, e / 0.9), y = 0.02 + ease(k) * 0.15, spin = e < 1.2 ? (1 - Math.min(1, e / 1.2)) * 14 + e * 0.4 : 0.4 * Math.sin(e * 0.8);
    var base = M.trs(-0.17, y, 0.04, 0, spin, 0, 1), self = this;
    function A(mesh, l, col, ex) { add(mesh, M.mul(base, l), col, null, ex); }
    A('cyl', M.trs(0, 0, 0, Math.PI / 2, 0, 0, 0.075, 0.008, 0.075), [0.95, 0.75, 0.25, 1], { em: [0.12, 0.08, 0.0] });
    A('cyl', M.trs(0, 0, 0.0045, Math.PI / 2, 0, 0, 0.06, 0.002, 0.06), [1, 0.85, 0.4, 1]);
    A('octa', M.trs(0, 0, 0.007, 0, 0, 0, 0.022, 0.022, 0.006), [0.75, 0.55, 0.12, 1]);
    A('cyl', M.trs(0, 0, -0.0045, Math.PI / 2, 0, 0, 0.06, 0.002, 0.06), [1, 0.85, 0.4, 1]);
    [-1, 1].forEach(function (sd) { A('box', M.trs(sd * 0.012, 0.06, 0, 0, 0, sd * 0.25, 0.022, 0.06, 0.002), sd < 0 ? [0.8, 0.15, 0.15, 1] : [0.15, 0.3, 0.75, 1]); });
    if (this.mat.glow) this.r.add({ mesh: 'quad', m: this._bm(M.trs(-0.17, y, 0.02, 0, 0, 0, 0.22 * (0.7 + 0.3 * Math.sin(t * 3)), 0.22 * (0.7 + 0.3 * Math.sin(t * 3)), 1)), color: [1, 0.85, 0.4, 0.25 * k], tex: this.mat.glow, add: 1, unlit: 1 });
    this._shadow(-0.17, 0.0046, 0.04, 0.1, 0.06, 0.5 * (1 - k * 0.5));
    void self;
  };
  // where each investigation happened, as [longitude, latitude] (cities are only a setting; the stories are fictional)
  var CASE_PLACES = { inv1: [73.86, 18.52], inv2: [77.1, 28.7], inv3: [76.27, 9.97], inv4: [88.36, 22.57], inv5: [75.85, 30.9], inv6: [77.59, 12.97] };
  var INDIA = [[68.2, 23.7], [69.1, 22.4], [70.3, 20.9], [72.6, 21.1], [72.8, 19.0], [73.4, 16.3], [74.1, 14.8], [74.8, 12.8], [75.6, 11.4], [76.3, 9.6], [77.1, 8.2], [77.5, 8.1], [78.2, 8.9],
    [79.2, 10.3], [79.9, 10.3], [79.8, 11.7], [80.3, 13.3], [80.1, 15.1], [81.3, 16.4], [82.3, 16.6], [83.4, 17.7], [84.8, 19.3], [86.4, 20.0], [87.0, 21.5], [88.2, 21.7], [88.9, 21.8], [88.7, 23.3],
    [88.6, 24.3], [88.1, 24.8], [88.4, 25.4], [89.8, 25.4], [89.9, 26.0], [90.6, 25.2], [92.0, 25.1], [91.8, 24.0], [92.3, 23.2], [92.6, 21.9], [93.2, 22.6], [93.4, 23.9], [94.2, 23.9], [94.6, 25.2],
    [95.5, 26.5], [97.2, 27.2], [96.9, 28.3], [95.3, 28.0], [94.1, 27.6], [92.1, 27.0], [89.8, 26.7], [88.8, 27.2], [88.1, 27.9], [88.0, 26.5], [86.0, 26.6], [84.0, 27.5], [82.0, 27.9], [80.6, 28.7],
    [80.2, 29.9], [81.0, 30.3], [79.5, 31.0], [78.8, 32.5], [79.4, 33.1], [78.2, 34.6], [77.8, 35.5], [76.2, 35.9], [74.6, 35.1], [74.0, 34.6], [73.8, 33.8], [74.6, 32.6], [75.3, 32.2],
    [74.6, 31.0], [73.9, 30.0], [73.4, 29.9], [72.3, 28.1], [71.0, 27.9], [70.2, 27.0], [69.5, 26.0], [70.7, 25.3], [71.0, 24.4], [68.8, 24.3]];
  /** A wall map of India with a pin for every investigation: red once solved, grey until then. */
  Game.prototype._drawIndiaMap = function (add, x, y, W) {
    var p = this.p, key = 'map|' + Object.keys(p.invDone || {}).join(',') + '|' + root.I18N.lang;
    if (this._mapKey !== key) {
      this._mapKey = key;
      var cv = this._mapCv || (this._mapCv = U.mk(512, 512)), g = cv.getContext('2d');
      g.fillStyle = '#efe4c8'; g.fillRect(0, 0, 512, 512);
      g.strokeStyle = 'rgba(120,100,70,.18)'; g.lineWidth = 1; for (var gx = 0; gx < 512; gx += 32) { g.beginPath(); g.moveTo(gx, 0); g.lineTo(gx, 512); g.stroke(); g.beginPath(); g.moveTo(0, gx); g.lineTo(512, gx); g.stroke(); }
      function px(lon, lat) { return [(lon - 66) / 33 * 460 + 26, 512 - ((lat - 6) / 32 * 470 + 20)]; }
      g.beginPath(); INDIA.forEach(function (q, i) { var a = px(q[0], q[1]); if (i) g.lineTo(a[0], a[1]); else g.moveTo(a[0], a[1]); }); g.closePath();
      g.fillStyle = '#c9dbb0'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#6d7d55'; g.stroke();
      g.fillStyle = '#5a4a2e'; g.font = '800 30px ' + FONT; g.fillText(T('CASE MAP'), 24, 46);
      INV.forEach(function (v, i) {
        var c = CASE_PLACES[v.id]; if (!c) return; var a = px(c[0], c[1]), done = p.invDone[v.id];
        g.beginPath(); g.arc(a[0], a[1], 13, 0, Math.PI * 2); g.fillStyle = done ? '#d33a2c' : '#9aa0a8'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke();
        g.fillStyle = '#2a2016'; g.font = '700 20px ' + FONT; g.fillText(String(i + 1), a[0] + 16, a[1] + 7);
      });
      if (!this._mapTex) this._mapTex = this.r.texture(cv); else this.r.updateTexture(this._mapTex, cv);
    }
    add('box', M.trs(x, y, W, 0, 0, 0, 0.46, 0.46, 0.012), [0.35, 0.25, 0.16, 1]);
    add('quad', M.trs(x, y, W + 0.008, 0, 0, 0, 0.42, 0.42, 1), [1, 1, 1, 1], null, { tex: this._mapTex, unlit: 1 });
  };
  /** A shelf of medals: one for every badge earned, empty stands for the rest. */
  Game.prototype._drawTrophyShelf = function (add, x, y, W, t) {
    var all = INV.map(function (v) { return v.badge; }).concat((C.STORIES || []).map(function (s2) { return s2.badge; })), earned = this.p.badges || [], n = all.length;
    add('box', M.trs(x, y, W + 0.06, 0, 0, 0, 0.66, 0.018, 0.12), [0.45, 0.32, 0.22, 1], null, { tex: this.mat.wood, tile: 4 });
    [-1, 1].forEach(function (sd) { add('box', M.trs(x + sd * 0.28, y - 0.04, W + 0.02, 0, 0, 0, 0.02, 0.06, 0.04), [0.3, 0.3, 0.32, 1]); });
    all.forEach(function (b, i) {
      var mx = x - 0.3 + (i + 0.5) * 0.6 / n, got = earned.indexOf(b) >= 0, my = y + 0.045;
      add('box', M.trs(mx, y + 0.012, W + 0.06, 0, 0, 0, 0.03, 0.008, 0.03), [0.2, 0.2, 0.22, 1]);
      if (got) {
        add('cyl', M.trs(mx, my, W + 0.06, Math.PI / 2, Math.sin(t * 0.7 + i) * 0.3, 0, 0.042, 0.006, 0.042), [0.95, 0.75, 0.25, 1], [0.12, 0.08, 0]);
        add('octa', M.trs(mx, my, W + 0.064, 0, 0, 0, 0.012, 0.012, 0.004), [0.75, 0.55, 0.12, 1]);
        add('box', M.trs(mx, my + 0.032, W + 0.06, 0, 0, 0, 0.014, 0.02, 0.002), i % 2 ? [0.15, 0.3, 0.75, 1] : [0.8, 0.15, 0.15, 1]);
      } else add('cyl', M.trs(mx, my, W + 0.06, Math.PI / 2, 0, 0, 0.042, 0.003, 0.042), [0.55, 0.57, 0.6, 0.35]);
    });
  };
  /** Side walls, back wall and ceiling, so a headset player looking around is inside a real room. */
  Game.prototype._roomShell = function (add, wall, wtex) {
    var pl = { tex: wtex || this.mat.plaster, tile: 1.2 }, side = [wall[0] * 0.93, wall[1] * 0.93, wall[2] * 0.93, 1];
    add('box', M.trs(-1.7, 0.3, 0.0, 0, 0, 0, 0.02, 2.4, 3.2), side, null, pl);
    add('box', M.trs(1.7, 0.3, 0.0, 0, 0, 0, 0.02, 2.4, 3.2), side, null, pl);
    add('box', M.trs(0, 0.3, 1.6, 0, 0, 0, 3.4, 2.4, 0.02), side, null, pl);
    add('box', M.trs(0, 1.5, 0.0, 0, 0, 0, 3.4, 0.02, 3.2), [0.95, 0.95, 0.94, 1], null, pl);
    if (this.state !== 'lineup') add('box', M.trs(0, -0.66, -0.93, 0, 0, 0, 3.4, 0.16, 0.03), [0.92, 0.9, 0.86, 1]);   // skirting board
  };
  /** City skyline seen through a window: building silhouettes, lit windows at night, a passing plane by day. */
  Game.prototype._skyline = function (add, glow, cx, cy, w, h, z, day, seed, t) {
    var x = cx - w / 2 + 0.01, base = cy - h / 2, i = 0, rnd = seed;
    function r1() { rnd = (rnd * 9301 + 49297) % 233280; return rnd / 233280; }
    while (x < cx + w / 2 - 0.02) {
      var bw = 0.05 + r1() * 0.07, bh = 0.08 + r1() * h * 0.55; bw = Math.min(bw, cx + w / 2 - 0.01 - x);
      var shade = day ? 0.62 + r1() * 0.15 : 0.08 + r1() * 0.05;
      add('box', M.trs(x + bw / 2, base + bh / 2, z, 0, 0, 0, bw, bh, 0.002), day ? [shade * 0.9, shade * 0.95, shade, 1] : [shade, shade, shade * 1.3, 1], null, { unlit: 1 });
      if (!day) for (var wy = base + 0.02; wy < base + bh - 0.015; wy += 0.025) for (var wx = x + 0.012; wx < x + bw - 0.01; wx += 0.018) {
        if (r1() > 0.55) add('box', M.trs(wx, wy, z + 0.001, 0, 0, 0, 0.007, 0.01, 0.001), [1, 0.85, 0.5, 1], null, { unlit: 1 });
      }
      x += bw + 0.004; i++;
    }
    if (day) { var px = cx - w / 2 + ((t * 0.02 + seed * 0.1) % 1) * w; add('box', M.trs(px, cy + h * 0.32, z + 0.001, 0, 0, 0, 0.02, 0.004, 0.001), [0.95, 0.95, 0.97, 1], null, { unlit: 1 }); }
  };
  /** Dust drifting through a beam of sunlight. */
  Game.prototype._dust = function (add, cx, cy, cz, t) {
    for (var i = 0; i < 26; i++) {
      var a = i * 12.9898, ph = (t * 0.03 + (Math.sin(a) * 0.5 + 0.5)) % 1;
      var x = cx + Math.sin(a * 1.7) * 0.25 + Math.sin(t * 0.3 + i) * 0.02, y = cy + ph * 0.6, z = cz + Math.cos(a * 2.3) * 0.2;
      add('sphere', M.trs(x, y, z, 0, 0, 0, 0.0025), [1, 0.96, 0.85, 0.22 * Math.sin(ph * Math.PI)], null, { add: 1, unlit: 1 });
    }
  };
  /** Steam curling up from a hot drink. */
  Game.prototype._steam = function (add, x, y, z, t) {
    if (!this.mat.glow) return;
    for (var i = 0; i < 7; i++) {
      var ph = (t * 0.3 + i / 7) % 1, sz = 0.025 + ph * 0.05;
      this.r.add({ mesh: 'quad', m: this._bm(M.trs(x + Math.sin(t * 1.3 + i * 2) * 0.015 * ph, y + ph * 0.13, z, 0, 0, Math.sin(t + i), sz, sz * 1.4, 1)), color: [1, 1, 1, 0.13 * Math.sin(ph * Math.PI)], tex: this.mat.glow, add: 1, unlit: 1 });
    }
  };
  Game.prototype._drawMagnifier = function (add, t) {
    var c = this.cur, hv = this._hovered(), base;
    if (this._held && this._held.id === 'magnifier') { var hp = this._held.pos; base = M.trs(hp[0], hp[1], hp[2], -1.1, 0.4, 0, 1); }
    else if (c.magnify && c.open) base = M.trs(0.125, 0.235, -0.04, Math.PI / 2 - 0.32, 0, 0.5, 1);
    else base = M.trs(MAG[0], 0.008, MAG[1], 0, 0.6, 0, 1);
    function A(mesh, l, col, em, extra) { add(mesh, M.mul(base, l), col, em, extra); }
    var glow = hv.item === 'magnifier' || c.hintMag && !c.magnify ? [0.2, 0.18, 0.08] : null;
    A('cyl', M.trs(0, 0, 0, 0, 0, 0, 0.082, 0.008, 0.082), [0.2, 0.17, 0.14, 1], glow);
    A('disc', M.trs(0, 0.0045, 0, 0, 0, 0, 0.07), [0.75, 0.88, 1, c.magnify ? 0.45 : 0.25], null, { add: 1, unlit: 1 });
    A('box', M.trs(0, 0, 0.075, 0, 0, 0, 0.016, 0.012, 0.075), [0.42, 0.24, 0.12, 1], glow);
    if (c.hintMag && !c.magnify) add('disc', M.trs(MAG[0], 0.005, MAG[1], 0, 0, 0, 0.17), [1, 0.8, 0.25, 0.25 + 0.2 * Math.sin(t * 6)], null, { add: 1, unlit: 1 });
  };
  function talkAmt() { var n = now(); return Math.max(0, 0.5 + 0.5 * Math.sin(n * 17) * Math.sin(n * 5.3 + 1)); }
  Game.prototype._talkFor = function (id) { var sp = this.speaking; return sp && sp.who === id && now() < sp.until ? talkAmt() : 0; };
  Game.prototype._drawInterroPerson = function (add, t) {
    var c = this.cur, v = this.inv(), sp = this.state === 'interro' ? this._step() : null, id = sp ? sp.who : v.suspect.id, L = this._person(id).look;
    var lies = sp ? this._liesBy(id)[0] : 9, recent = c.react && now() - c.react.t0 < 3;
    var mood = this.state === 'confess' ? 'sad' : sp && c.iphase === 'tone' && c.toneWrong && recent ? (sp.P.tone.prefers === 'tough' ? 'smug' : 'nervous')
      : (c.swrong || (c.iphase === 'ask' && c.altNote)) && recent ? 'smug' : lies >= 1 ? 'nervous' : 'calm';
    this._shadow(SUS.x, 0.0046, SUS.z + 0.14, 0.5, 0.18, 0.5);
    People.drawPerson(add, M.trs(SUS.x, 0, SUS.z, 0, 0, 0, 1), L, { viewer: this._viewerLocal(), t: t, pose: 'seated', talk: this._talkFor(id), mood: mood,
      react: c.react ? { type: c.react.type, e: now() - c.react.t0 } : null, phase: 0.7, sweat: lies >= 2 && this.state !== 'confess' });
  };
  Game.prototype._placard = function (n) {
    this._placards = this._placards || {};
    if (!this._placards[n]) {
      var cv = U.mk(256, 140), g = cv.getContext('2d');
      g.fillStyle = '#111'; g.fillRect(0, 0, 256, 140); g.fillStyle = '#fff'; g.font = '900 96px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 128, 74);
      this._placards[n] = this.r.texture(cv);
    }
    return this._placards[n];
  };
  Game.prototype._heightChart = function () {
    var day = this.isDay(), key = day ? '_chartTexDay' : '_chartTex';
    if (!this[key]) {
      var cv = U.mk(1024, 456), g = cv.getContext('2d');
      g.fillStyle = day ? '#e9ebee' : '#2b2e35'; g.fillRect(0, 0, 1024, 456);
      for (var cm = 130; cm <= 210; cm += 5) {
        var y = 456 - (cm - 130) / 80 * 456; g.fillStyle = day ? (cm % 10 ? 'rgba(20,24,30,.3)' : 'rgba(20,24,30,.8)') : (cm % 10 ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.7)');
        g.fillRect(0, y - (cm % 10 ? 1 : 2), 1024, cm % 10 ? 2 : 4);
        if (!(cm % 10)) { g.font = '700 26px ' + FONT; g.fillText(cm + ' cm', 12, y - 8); g.fillText(cm + ' cm', 900, y - 8); }
      }
      this[key] = this.r.texture(cv);
    }
    return this[key];
  };
  Game.prototype._drawLineup = function (add, t) {
    var c = this.cur, v = this.inv(), self = this, hv = this._hovered();
    // height chart wall, light bar and the observation-window frame
    add('quad', M.trs(0, 0.96, LINE.z - 0.2, 0, 0, 0, 1.8, 0.8, 1), [1, 1, 1, 1], null, { tex: this._heightChart(), unlit: 1 });
    add('box', M.trs(0, 1.45, LINE.z, 0, 0, 0, 1.6, 0.03, 0.08), [1, 0.97, 0.9, 1], null, { unlit: 1 });
    var day = this.isDay(), frame = day ? [0.35, 0.37, 0.4, 1] : [0.1, 0.1, 0.11, 1];
    add('box', M.trs(0, -0.735, LINE.z, 0, 0, 0, 1.8, 0.01, 0.6), day ? [0.6, 0.62, 0.66, 1] : [0.22, 0.23, 0.26, 1]);
    if (day) { add('box', M.trs(0, 0.3, LINE.z - 0.22, 0, 0, 0, 2.2, 2.2, 0.01), [0.85, 0.87, 0.9, 1]); [-1, 1].forEach(function (sd) { add('box', M.trs(sd * 1.05, 0.3, LINE.z, 0, 0, 0, 0.01, 2.2, 0.6), [0.8, 0.82, 0.85, 1]); }); }
    [-1, 1].forEach(function (sd) { add('box', M.trs(sd * 0.98, 0.15, -0.78, 0, 0, 0, 0.05, 1.8, 0.05), frame); });
    add('box', M.trs(0, 1.03, -0.78, 0, 0, 0, 2.0, 0.05, 0.05), frame);
    add('quad', M.trs(0, 0.15, -0.78, 0, 0, 0, 1.92, 1.76, 1), [0.55, 0.65, 0.75, 0.06], null, { unlit: 1 });
    // people in the line-up are alive: whoever you point at steps forward, the others turn to look at them,
    // a cleared person steps back, and the culprit is pulled forward once identified
    var fw = this._lfwd = this._lfwd || {}, dtl = Math.min(0.1, now() - (this._lfwdT || now())), focus = null; this._lfwdT = now();
    v.lineup.ids.forEach(function (id, i) { if (hv.item === 'sus:' + id && !c.ldone) focus = [LINE.xs[i], 1.2, LINE.z + 0.3]; });
    v.lineup.ids.forEach(function (id, i) {
      var goal = c.ldone ? (id === v.lineup.culprit ? 0.32 : -0.06) : c.lwrong === id ? -0.08 : hv.item === 'sus:' + id ? 0.22 : 0;
      fw[id] = (fw[id] || 0) + (goal - (fw[id] || 0)) * Math.min(1, dtl * 5);
      var x = LINE.xs[i], z = LINE.z + fw[id], L = v.people[id].look, re = c.lreact && c.lreact.id === id ? { type: c.lreact.type, e: now() - c.lreact.t0 } : null;
      var mood = c.ldone && id === v.lineup.culprit ? 'nervous' : c.lwrong === id ? 'angry' : hv.item === 'sus:' + id ? 'nervous' : 'calm';
      var look = focus && Math.abs(focus[0] - x) > 0.01 ? focus : self._viewerLocal();
      self._shadow(x, -0.733, z + 0.02, 0.55, 0.4, 0.75);
      People.drawPerson(add, M.trs(x, 0, z, 0, 0, 0, 1), L, { viewer: look, lookWide: look !== null && focus !== null && look === focus, t: t, pose: 'standing', talk: self._talkFor(id), mood: mood, react: re, phase: i * 1.3, placard: self._placard(i + 1), sweat: c.ldone && id === v.lineup.culprit });
      var sel = hv.item === 'sus:' + id && !c.ldone;
      if (sel || (c.ldone && id === v.lineup.culprit)) add('disc', M.trs(x, -0.728, z, 0, 0, 0, 0.6), c.ldone ? [1, 0.35, 0.3, 0.45] : [0.5, 0.8, 1, 0.4], null, { add: 1, unlit: 1 });
    });
  };

  /* ======================= card canvas ======================= */
  Game.prototype._invDrawCard = function (hoverKey) {
    var c = this.cur, st = this.state, p = this.p;
    var sig = ['inv', st, c.idx, c.lwrong, c.ldone, c.magnify, c.open, c.markN, c.pinEntry, c.pinWrong, (c.unlocked || []).length, this._hovered().card, (c.tapped || []).length, (c.found || []).length, hoverKey, c.hintKey, c.si, c.sdone, c.swrong, p.badges.length, c.stage, c.lwrong, c.ldone, c.iphase, c.toneWrong, JSON.stringify(c.tones || {}), c.altNote && c.altNote.q].join('|');
    if (sig === this.cardSig) return; this.cardSig = sig;
    var g = this.cardCv.getContext('2d'), W = CARD.cw, H = CARD.ch; this.cardButtons = [];
    g.clearRect(0, 0, W, H); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    if (st === 'menu') this._cardHQ(g, W, H);
    else if (st === 'brief') this._cardBrief(g, W, H);
    else if (st === 'scene') this._cardItem(g, W, H, hoverKey);
    else if (st === 'interro' || st === 'confess' || st === 'lineup') this._cardBubble(g, W, H);
    else if (st === 'closed') this._cardClosed(g, W, H);
    else if (st === 'report') this._cardKeypad(g, W, H, { mode: 'report' });
    this.r.updateTexture(this.cardTex, this.cardCv);
  };
  function folder(g, W, H, tab) {
    rr(g, 30, 4, 300, 70, 18); g.fillStyle = '#d9bf85'; g.fill();
    rr(g, 4, 40, W - 8, H - 44, 24); g.fillStyle = '#ecd9a8'; g.fill();
    g.lineWidth = 3; g.strokeStyle = 'rgba(110,80,30,.35)'; rr(g, 26, 62, W - 52, H - 88, 16); g.stroke();
    g.fillStyle = '#6b4f1d'; g.font = '700 26px ' + FONT; g.fillText(tab, 52, 36);
  }
  function fit(g, t, maxW) {
    t = String(t); if (g.measureText(t).width <= maxW) return t;
    while (t.length > 1 && g.measureText(t + '…').width > maxW) t = t.slice(0, -1);
    return t.trim() + '…';
  }
  function para(g, t, x, y, maxW, size, weight, color, lh, maxLines) {
    g.font = weight + ' ' + size + 'px ' + FONT; g.fillStyle = color;
    wrapLines(g, t, maxW).slice(0, maxLines || 99).forEach(function (l) { g.fillText(l, x, y); y += lh; });
    return y;
  }
  Game.prototype._cardHQ = function (g, W, H) {
    var p = this.p, solved = INV.filter(function (v) { return p.invDone[v.id]; }).length, rk = C.rank(p.totalCorrect + solved * 5);
    rr(g, 4, 4, W - 8, H - 8, 30); g.fillStyle = '#1e2230'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#c9a54a'; g.stroke();
    g.textAlign = 'center'; g.fillStyle = '#c9a54a'; g.font = '700 28px ' + FONT; g.fillText('SCAM DETECTIVE', W / 2, 92);
    g.fillStyle = '#fff'; g.font = '900 70px ' + FONT; g.fillText(T('Detective HQ'), W / 2, 172);
    // badge shield
    g.beginPath(); g.moveTo(W / 2, 220); g.lineTo(W / 2 + 90, 255); g.lineTo(W / 2 + 80, 360); g.quadraticCurveTo(W / 2, 430, W / 2, 430); g.quadraticCurveTo(W / 2, 430, W / 2 - 80, 360); g.lineTo(W / 2 - 90, 255); g.closePath();
    g.fillStyle = '#c9a54a'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#8a6d1f'; g.stroke();
    g.fillStyle = '#1e2230'; g.font = '900 64px ' + FONT; g.fillText('★', W / 2, 352);
    g.fillStyle = '#fff'; g.font = '700 38px ' + FONT; g.fillText(T(rk.name), W / 2, 500);
    g.fillStyle = '#aab3c5'; g.font = '500 28px ' + FONT;
    g.fillText(p.streak + T('-day streak  ·  ') + p.totalPoints + T(' points'), W / 2, 548);
    g.fillText(T('Investigations solved: ') + solved + T(' of ') + INV.length, W / 2, 592);
    g.fillStyle = '#c9a54a'; g.font = '700 26px ' + FONT; g.fillText(T('BADGES'), W / 2, 664);
    g.fillStyle = '#fff'; g.font = '500 25px ' + FONT;
    var b = p.badges.length ? p.badges.map(function (x) { return T(x); }) : [T('None yet. Solve a case!')];
    wrapLines(g, b.join('  ·  '), W - 100).slice(0, 4).forEach(function (l, i) { g.fillText(l, W / 2, 704 + i * 36); });
    g.textAlign = 'left';
  };
  Game.prototype._cardBrief = function (g, W, H) {
    var v = this.inv(), y;
    folder(g, W, H, T('INVESTIGATION #') + (this.cur.idx + 1));
    rr(g, W - 250, 84, 200, 44, 22); g.fillStyle = /Cyber|साइबर/.test(v.type) ? '#2d5fd3' : '#8a2b2b'; g.fill();
    g.fillStyle = '#fff'; g.font = '700 24px ' + FONT; g.textAlign = 'center'; g.fillText(v.type.toUpperCase(), W - 150, 115); g.textAlign = 'left';
    if (v.real) { rr(g, W - 330, 34, 280, 40, 20); g.fillStyle = '#b3261e'; g.fill(); g.fillStyle = '#fff'; g.font = '800 20px ' + FONT; g.textAlign = 'center'; g.fillText(T('BASED ON A REAL CASE'), W - 190, 61); g.textAlign = 'left'; }
    y = para(g, v.title, 52, 180, W - 104, 50, '800', '#2a1f0e', 58, 2) + 6;
    g.fillStyle = '#7a5520'; g.beginPath(); g.arc(88, y + 20, 34, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.font = '700 34px ' + FONT; g.textAlign = 'center'; g.fillText(v.initial, 88, y + 32); g.textAlign = 'left';
    g.fillStyle = '#2a1f0e'; g.font = '700 30px ' + FONT; g.fillText(v.client, 138, y + 12);
    g.fillStyle = '#6b5a3c'; g.font = '500 25px ' + FONT; g.fillText(v.role, 138, y + 46); y += 96;
    g.fillStyle = 'rgba(255,255,255,.55)'; rr(g, 46, y - 36, W - 92, 312, 14); g.fill();
    para(g, '“' + v.brief + '”', 66, y, W - 132, 28, '500', '#2a1f0e', 39, 7);
    g.fillStyle = '#b3261e'; g.font = '800 30px ' + FONT; g.fillText(lbl(T('Lost: ') + v.lost, 40), 52, 772);
    g.fillStyle = '#4b3a1c'; g.font = '600 25px ' + FONT; g.fillText(lbl(T('Crime scene: ') + v.place, 46), 52, 818);
  };
  Game.prototype._isLocked = function (it) { return !!(it && it.lock && (this.cur.unlocked || []).indexOf(it.id) < 0); };
  /** Phone keypad drawn on the card: unlock a phone with a PIN found at the scene, or dial a helpline to report the crime. */
  Game.prototype._cardKeypad = function (g, W, H, o) {
    var c = this.cur, v = this.inv(), B = this.cardButtons = [], hov = this._hovered().card, report = o.mode === 'report';
    rr(g, 4, 4, W - 8, H - 8, 40); g.fillStyle = '#15171e'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#3a3f4c'; g.stroke();
    g.textAlign = 'center'; g.fillStyle = '#aab3c5'; g.font = '600 26px ' + FONT;
    g.fillText(report ? T('REPORT THE CRIME') : T('PHONE LOCKED'), W / 2, 70);
    g.fillStyle = '#fff'; g.font = '700 34px ' + FONT;
    g.fillText(report ? T('Dial {n}', { n: v.report || '1930' }) : T('Enter the 4-digit PIN'), W / 2, 122);
    var entry = c.pinEntry || '', shown = report ? entry : entry.replace(/./g, '●');
    rr(g, 110, 150, W - 220, 96, 20); g.fillStyle = c.pinWrong ? 'rgba(220,60,50,.25)' : 'rgba(255,255,255,.08)'; g.fill();
    g.fillStyle = c.pinWrong ? '#ff8a7a' : '#fff'; g.font = '800 58px ' + FONT; g.textBaseline = 'middle';
    g.fillText(c.pinWrong ? (report ? T('Wrong number') : T('Wrong PIN')) : (shown || (report ? '' : '_ _ _ _')), W / 2, 200);
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'], kw = 150, kh = 112, gx = (W - 3 * kw - 2 * 34) / 2;
    keys.forEach(function (k, i) {
      var x = gx + (i % 3) * (kw + 34), y = 280 + Math.floor(i / 3) * (kh + 22), id = 'k' + k, h = hov === id;
      rr(g, x, y, kw, kh, kh / 2);
      g.fillStyle = k === 'ok' ? (h ? '#2fc46f' : '#1fa75a') : k === 'del' ? (h ? '#4a4f5c' : '#353a45') : (h ? '#4a5266' : '#2b303b'); g.fill();
      g.fillStyle = '#fff'; g.font = (k.length > 1 ? '700 34px ' : '700 52px ') + FONT;
      g.fillText(k === 'ok' ? (report ? '📞' : '✓') : k === 'del' ? '⌫' : k, x + kw / 2, y + kh / 2 + 2);
      B.push({ id: id, x: x, y: y, w: kw, h: kh });
    });
    g.textBaseline = 'alphabetic'; g.fillStyle = '#7b8090'; g.font = '500 24px ' + FONT;
    g.fillText(report ? T('Touch the keys with your fingertip') : T('Look around the scene for the PIN'), W / 2, H - 40);
    g.textAlign = 'left';
  };
  Game.prototype._keypadPress = function (k) {
    var c = this.cur, v = this.inv(), report = c.stage === 'report', it = report ? null : this._item(c.open);
    var code = report ? (v.report || '1930') : it.lock;
    c.pinWrong = false;
    if (/^\d$/.test(k)) { if ((c.pinEntry || '').length < (report ? 6 : 4)) c.pinEntry = (c.pinEntry || '') + k; this.sound.mark(this._world([0, 0.12, -0.06])); return; }
    if (k === 'del') { c.pinEntry = (c.pinEntry || '').slice(0, -1); this.sound.unmark(this._world([0, 0.12, -0.06])); return; }
    if (k === 'ok') {
      if (c.pinEntry === code) {
        c.pinEntry = ''; this.sound.correct();
        if (report) { c.reported = true; c.points += 50; this._invClose(); }
        else { c.unlocked = (c.unlocked || []).concat(it.id); c.note = { good: true, title: T('Phone unlocked'), text: T('Now look for evidence on the screen.') }; this._save(); }
      } else { c.pinEntry = ''; c.pinWrong = true; this.sound.wrong(); }
    }
  };
  Game.prototype._cardItem = function (g, W, H, hoverKey) {
    var c = this.cur, it = this._item(c.open), paper = PAPER[it.kind], B = this.cardButtons = [];
    if (this._isLocked(it)) return this._cardKeypad(g, W, H, { mode: 'unlock' });
    rr(g, 4, 4, W - 8, H - 8, 30); g.fillStyle = paper ? '#fbf6e6' : '#fbfaf7'; g.fill();
    g.save(); rr(g, 4, 4, W - 8, H - 8, 30); g.clip(); g.fillStyle = BAR[it.kind] || '#444'; g.fillRect(0, 0, W, 92); g.restore();
    g.fillStyle = '#fff'; g.font = '700 32px ' + FONT; g.textBaseline = 'middle'; g.fillText(lbl(it.app || it.name, 26), 36, 48);
    if (it.time) { g.font = '500 26px ' + FONT; g.textAlign = 'right'; g.fillText(it.time, W - 36, 48); g.textAlign = 'left'; }
    g.textBaseline = 'alphabetic';
    if (this._drawMarks) this._drawMarks(g, it);
    var y = 140;
    g.fillStyle = '#6b6f7a'; g.font = '600 24px ' + FONT; g.fillText(T('INSPECTING: ') + it.name.toUpperCase(), 40, y); y += 46;
    if (it.from) { g.fillStyle = '#1b1d24'; g.font = '700 30px ' + FONT; wrapLines(g, it.from, W - 80).slice(0, 2).forEach(function (l) { g.fillText(l, 40, y); y += 38; }); y += 6; }
    if (it.subject) { g.fillStyle = '#1b1d24'; g.font = '800 32px ' + FONT; g.fillText(lbl(it.subject, 34), 40, y); y += 50; }
    // body with clue spans
    var fs = 34, lh = 50, bx = 40, maxW = W - 80; g.font = (paper ? 'italic 500 ' : '400 ') + fs + 'px ' + FONT;
    var toks = []; C.segments(it.body).forEach(function (sg) { if (/^\s/.test(sg.text) && toks.length) toks[toks.length - 1].w += ' '; (sg.text.match(/\S+\s*/g) || []).forEach(function (w) { toks.push({ w: w, key: sg.key }); }); });
    var lines = [[]], x = 0;
    toks.forEach(function (tk) { var tw = g.measureText(tk.w.trimEnd()).width; if (x + tw > maxW && x > 0) { lines.push([]); x = 0; } lines[lines.length - 1].push({ w: tk.w, key: tk.key, x: x }); x += g.measureText(tk.w).width; });
    var rects = {};
    lines.forEach(function (ln, li) {
      var ly = y + li * lh;
      ln.forEach(function (tk) {
        var tw = g.measureText(tk.w.trimEnd()).width;
        if (tk.key) { var R = rects[tk.key] = rects[tk.key] || []; var last = R[R.length - 1]; if (last && last.line === li) last.w = bx + tk.x + tw - last.x; else R.push({ line: li, x: bx + tk.x, y: ly, w: tw, h: lh - 6 }); }
        var hid = tk.key && isHidden(tk.key);
        g.fillStyle = hid ? (c.magnify ? '#5a3c00' : 'rgba(27,29,36,0.13)') : '#1b1d24'; g.textBaseline = 'top';
        if (hid && !c.magnify) g.font = (paper ? 'italic 500 ' : '400 ') + Math.round(fs * 0.62) + 'px ' + FONT;
        g.fillText(tk.w, bx + tk.x, ly + 4);
        if (hid) g.font = (paper ? 'italic 500 ' : '400 ') + fs + 'px ' + FONT;
      });
    });
    g.textBaseline = 'alphabetic';
    var self = this;
    Object.keys(rects).forEach(function (k) {
      var cl = it.clues[k], tapped = c.tapped.indexOf(it.id + ':' + k) >= 0;
      if (isHidden(k) && !c.magnify) return;
      rects[k].forEach(function (rc) {
        var b = { id: k, x: rc.x - 6, y: rc.y - 2, w: rc.w + 12, h: rc.h + 6 }; B.push(b);
        if (isHidden(k) && !tapped) { g.fillStyle = 'rgba(255,200,60,.22)'; rr(g, b.x, b.y, b.w, b.h, 10); g.fill(); }
        if (tapped && cl.ev) { g.fillStyle = 'rgba(30,160,90,.14)'; rr(g, b.x, b.y, b.w, b.h, 10); g.fill(); g.lineWidth = 5; g.strokeStyle = '#13854b'; g.stroke(); }
        else if (tapped) { g.setLineDash([10, 8]); g.lineWidth = 3; g.strokeStyle = '#8a8f99'; rr(g, b.x, b.y, b.w, b.h, 10); g.stroke(); g.setLineDash([]); }
        else if (k === c.hintKey) { g.setLineDash([12, 8]); g.lineWidth = 5; g.strokeStyle = '#e8a400'; rr(g, b.x, b.y, b.w, b.h, 10); g.stroke(); g.setLineDash([]); }
        else if (k === hoverKey) { g.lineWidth = 4; g.strokeStyle = 'rgba(60,110,240,.75)'; rr(g, b.x, b.y, b.w, b.h, 10); g.stroke(); }
      });
    });
    void self;
    g.fillStyle = '#7b8090'; g.font = '500 24px ' + FONT; g.textAlign = 'center';
    g.fillText(c.magnify ? T('Magnifier on: tiny details are now visible') : T('Swipe across anything that could be evidence, like a highlighter'), W / 2, H - 40); g.textAlign = 'left';
    if (c.magnify) { g.lineWidth = 10; g.strokeStyle = 'rgba(200,150,40,.55)'; rr(g, 10, 10, W - 20, H - 20, 30); g.stroke(); }
  };
  Game.prototype._cardBubble = function (g, W, H) {
    var c = this.cur, v = this.inv(), S = v.suspect, st = this.state, stmt = S.statements[c.si];
    if (st === 'lineup') {
      var who = c.ldone ? v.lineup.culprit : c.lwrong, line = c.ldone ? v.lineup.caught : v.lineup.alibis[c.lwrong].say;
      rr(g, 4, 4, W - 8, H - 8, 34); g.fillStyle = '#fffdf7'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#2c2a3a'; g.stroke();
      g.fillStyle = '#6b6f7a'; g.font = '700 26px ' + FONT; g.fillText(T('LINE-UP  ·  NO. ') + (v.lineup.ids.indexOf(who) + 1), 48, 70);
      g.fillStyle = '#1b1d24'; g.font = '800 38px ' + FONT; g.fillText(lbl(this._person(who).name, 28), 48, 124);
      g.fillStyle = '#6b6f7a'; g.font = '500 26px ' + FONT; g.fillText(lbl(this._person(who).role, 44), 48, 162);
      var yy = para(g, '“' + line + '”', 48, 250, W - 96, 42, '700', '#1b1d24', 56, 6);
      var col = c.ldone ? '#c62b23' : '#178a50';
      g.save(); g.translate(W / 2, Math.min(yy + 120, H - 150)); g.rotate(-0.12); g.globalAlpha = 0.9; g.lineWidth = 10; g.strokeStyle = col; rr(g, -250, -60, 500, 120, 18); g.stroke();
      g.fillStyle = col; g.font = '900 64px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(c.ldone ? T('IDENTIFIED') : T('CLEARED'), 0, 4); g.restore();
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      return;
    }
    rr(g, 4, 4, W - 8, H - 120, 40); g.fillStyle = '#fffdf7'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#2c2a3a'; g.stroke();
    g.beginPath(); g.moveTo(W - 220, H - 120); g.lineTo(W - 90, H - 20); g.lineTo(W - 130, H - 120); g.closePath(); g.fillStyle = '#fffdf7'; g.fill(); g.stroke();
    g.fillStyle = '#fffdf7'; g.fillRect(W - 216, H - 126, 84, 10);
    var sp = st === 'interro' ? this._step() : null, ph = sp ? c.iphase || 'stmt' : 'confess', who = sp ? sp.who : S.id;
    if (sp) stmt = sp.S;
    g.fillStyle = '#6b6f7a'; g.font = '700 26px ' + FONT;
    g.fillText(st === 'confess' ? T('CONFESSION') : ph === 'tone' ? T('FIRST IMPRESSION') : ph === 'ask' ? T('QUESTION ') + (sp.n + 1) + T(' OF ') + sp.of : T('STATEMENT ') + (sp.n + 1) + T(' OF ') + sp.of, 48, 70);
    g.fillStyle = '#1b1d24'; g.font = '800 34px ' + FONT; g.fillText(lbl(this._person(who).name, 24), 48, 120);
    if (sp && ph !== 'tone') {   // pressure meter: how many of this person's lies you have exposed
      var lb = this._liesBy(who), mw = 170, mx = W - 48 - mw;
      g.fillStyle = '#6b6f7a'; g.font = '700 20px ' + FONT; g.textAlign = 'right'; g.fillText(T('PRESSURE'), W - 48, 96); g.textAlign = 'left';
      rr(g, mx, 106, mw, 18, 9); g.fillStyle = '#e5e1d6'; g.fill();
      if (lb[0]) { rr(g, mx, 106, Math.max(18, mw * lb[0] / Math.max(1, lb[1])), 18, 9); g.fillStyle = lb[0] >= lb[1] ? '#c62b23' : '#e0892b'; g.fill(); }
    }
    var y;
    if (st === 'confess') y = para(g, '“' + S.confession + '”', 48, 200, W - 96, 36, '600', '#1b1d24', 50, 9);
    else if (ph === 'tone') {
      var TN = sp.P.tone, ch = (c.tones && c.tones[who]) || c.toneWrong;
      y = ch ? para(g, '“' + TN[ch] + '”', 48, 220, W - 96, 44, '700', '#1b1d24', 58, 6) : para(g, TN.mood, 48, 210, W - 96, 36, '500', '#4b4f5c', 50, 8);
      if (ch) { var good = c.tones && c.tones[who]; g.save(); g.translate(W / 2, Math.min(y + 100, H - 230)); g.rotate(-0.12); g.globalAlpha = 0.9; g.lineWidth = 9; g.strokeStyle = good ? '#178a50' : '#c62b23'; rr(g, -230, -52, 460, 104, 16); g.stroke();
        g.fillStyle = good ? '#178a50' : '#c62b23'; g.font = '900 52px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch === 'calm' ? T('CALM') : T('TOUGH'), 0, 4); g.restore(); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; }
      return;
    } else if (ph === 'ask') {
      y = c.altNote ? para(g, '“' + c.altNote.a + '”', 48, 220, W - 96, 44, '700', '#1b1d24', 58, 6) : para(g, T('What will you ask?'), 48, 230, W - 96, 44, '700', '#8a8f9c', 58, 3);
      if (c.altNote) { g.save(); g.translate(W / 2, Math.min(y + 100, H - 230)); g.rotate(-0.12); g.globalAlpha = 0.85; g.lineWidth = 9; g.strokeStyle = '#8a8f9c'; rr(g, -210, -52, 420, 104, 16); g.stroke();
        g.fillStyle = '#8a8f9c'; g.font = '900 56px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(T('DODGED'), 0, 4); g.restore(); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; }
      return;
    } else y = para(g, '“' + stmt.say + '”', 48, 220, W - 96, 46, '700', '#1b1d24', 60, 6);
    if (st === 'interro' && c.sdone) {
      var lie = !stmt.truth, col = lie ? '#c62b23' : '#178a50';
      g.save(); g.translate(W / 2, Math.min(y + 110, H - 230)); g.rotate(-0.14); g.globalAlpha = 0.9;
      g.lineWidth = 10; g.strokeStyle = col; rr(g, -200, -62, 400, 124, 18); g.stroke();
      g.fillStyle = col; g.font = '900 84px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(lie ? T('LIE!') : T('TRUE'), 0, 6); g.restore();
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    }
  };
  Game.prototype._cardClosed = function (g, W, H) {
    var c = this.cur, v = this.inv(), st = c.stars || stars(c.mistakes), y;
    folder(g, W, H, T('INVESTIGATION #') + (c.idx + 1));
    y = para(g, v.title, 52, 140, W - 104, 46, '800', '#2a1f0e', 54, 2) + 10;
    g.fillStyle = '#c99a1a'; g.font = '900 64px ' + FONT;
    g.fillText('★★★'.slice(0, st) , 52, y + 30); g.fillStyle = 'rgba(120,90,30,.3)'; g.fillText('★★★'.slice(st), 52 + g.measureText('★★★'.slice(0, st)).width, y + 30);
    g.fillStyle = '#4b3a1c'; g.font = '700 30px ' + FONT; g.fillText(c.points + T(' points'), 300, y + 22); y += 80;
    y = para(g, v.ending, 52, y, W - 104, 29, '500', '#2a1f0e', 41, 6) + 20;
    var bx = W / 2 - 110, by = Math.max(y + 90, 690);
    g.fillStyle = '#c0392b'; g.beginPath(); g.moveTo(bx - 46, by + 30); g.lineTo(bx - 10, by + 30); g.lineTo(bx - 20, by + 120); g.lineTo(bx - 34, by + 100); g.lineTo(bx - 56, by + 116); g.fill();
    g.fillStyle = '#1f5fbf'; g.beginPath(); g.moveTo(bx + 46, by + 30); g.lineTo(bx + 10, by + 30); g.lineTo(bx + 20, by + 120); g.lineTo(bx + 34, by + 100); g.lineTo(bx + 56, by + 116); g.fill();
    g.beginPath(); g.arc(bx, by, 70, 0, Math.PI * 2); g.fillStyle = '#d8a93b'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#8a6514'; g.stroke();
    g.fillStyle = '#5a3f08'; g.font = '900 54px ' + FONT; g.textAlign = 'center'; g.fillText('★', bx, by + 18);
    g.font = '800 26px ' + FONT; g.fillStyle = '#2a1f0e'; g.fillText(T(v.badge), bx, by + 150); g.textAlign = 'left';
    g.save(); g.translate(W / 2 + 140, by); g.rotate(-0.22); g.globalAlpha = 0.85; g.lineWidth = 8; g.strokeStyle = '#178a50'; rr(g, -130, -48, 260, 96, 14); g.stroke();
    g.fillStyle = '#178a50'; g.font = '900 54px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(T('CLOSED'), 0, 4); g.restore();
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  };

  /* ======================= evidence board ======================= */
  Game.prototype._invDrawBoard = function (hover) {
    var c = this.cur, v = this.inv();
    if (!this.boardCv) { this.boardCv = U.mk(BOARD.cw, BOARD.ch); this.boardTex = this.r.texture(this.boardCv); }
    var sAge = c.bdone && c.bdoneT !== undefined ? this.time - c.bdoneT : 9, sAnim = sAge < 1.0;
    var se = c.strEnd ? Math.round(c.strEnd[0] / 6) + ',' + Math.round(c.strEnd[1] / 6) : '', pulse = c.bdone ? 0 : (Math.floor(this.time * 4) % 4 + 4) % 4;
    var sig = [c.idx, c.bq, c.bdone, c.bwrong, hover, sAnim ? Math.floor(sAge * 40) : 'still', se, pulse, root.I18N.lang].join('|'); if (sig === this.boardSig) return; this.boardSig = sig;
    var g = this.boardCv.getContext('2d'), W = BOARD.cw, H = BOARD.ch, B = this.boardButtons = [];
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#b78a5c'; g.fillRect(0, 0, W, H);
    for (var i = 0; i < 700; i++) { g.fillStyle = 'rgba(80,50,20,' + (0.07 + (i % 5) * 0.02) + ')'; g.fillRect((i * 97) % W, (i * 53) % H, 3, 3); }
    g.fillStyle = '#fff8e8'; g.font = '800 40px ' + FONT; g.fillText(T('EVIDENCE BOARD'), 40, 58);
    g.font = '600 26px ' + FONT; g.fillStyle = 'rgba(255,248,232,.85)'; g.textAlign = 'right'; g.fillText(lbl(v.title, 40), W - 40, 56); g.textAlign = 'left';
    // theory notes (questions) along the top
    var notes = [];
    v.board.forEach(function (Q, i) {
      var nx = 40 + i * 380, ny = 86, solved = i < c.bq || (i === c.bq && c.bdone), cur = i === c.bq;
      g.save(); g.translate(nx + 170, ny + 62); g.rotate((i - 1) * 0.02);
      g.fillStyle = cur ? '#fff59a' : solved ? '#d9f7c8' : '#f3eecf'; g.fillRect(-170, -62, 340, 124);
      g.fillStyle = '#2a1f0e'; g.font = '800 22px ' + FONT; g.fillText(T('QUESTION ') + (i + 1) + (solved ? '  ✓' : ''), -150, -30);
      g.font = '600 21px ' + FONT; wrapLines(g, Q.q, 300).slice(0, 3).forEach(function (l, j) { g.fillText(l, -150, j * 26); });
      g.restore();
      notes.push({ x: nx + 170, y: ny + 8, solved: solved, ans: Q.answer, upto: i < c.bq || (i === c.bq && c.bdone) });
      if (cur && !c.bdone) B.push({ id: 'q', x: nx, y: ny, w: 340, h: 150 });
    });
    // evidence cards grid
    var ids = Object.keys(v.evidence), pos = {};
    ids.forEach(function (id, k) {
      var col = k % 3, row = Math.floor(k / 3), cw = 340, ch = 190, x = 40 + col * 380 + (row ? 190 * (ids.length - 3 < 3 ? (3 - (ids.length - 3)) / 3 : 0) : 0), y = 268 + row * 250;
      var e = v.evidence[id], hov = hover === 'ev:' + id && !c.bdone, wrong = c.bwrong === id;
      g.save(); g.translate(x + cw / 2, y + ch / 2); g.rotate(((k * 37) % 5 - 2) * 0.012);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-cw / 2 + 6, -ch / 2 + 8, cw, ch);
      g.fillStyle = hov ? '#e9f1ff' : wrong ? '#ffe3df' : '#fffdf6'; g.fillRect(-cw / 2, -ch / 2, cw, ch);
      if (hov) { g.lineWidth = 6; g.strokeStyle = '#3c6ef0'; g.strokeRect(-cw / 2, -ch / 2, cw, ch); }
      g.fillStyle = '#6b6f7a'; g.font = '700 20px ' + FONT; g.fillText(T('EVIDENCE ') + id.slice(1), -cw / 2 + 20, -ch / 2 + 36);
      g.fillStyle = '#1b1d24'; g.font = '800 28px ' + FONT; g.fillText(lbl(e.title, 22), -cw / 2 + 20, -ch / 2 + 76);
      g.font = '500 22px ' + FONT; g.fillStyle = '#3d4150';
      wrapLines(g, e.text, cw - 40).slice(0, 3).forEach(function (l, j) { g.fillText(l, -cw / 2 + 20, -ch / 2 + 114 + j * 28); });
      g.restore();
      B.push({ id: 'ev:' + id, x: x, y: y, w: cw, h: ch });
      pos[id] = { x: x + cw / 2, y: y + 6 };
    });
    // red string from solved questions to their evidence
    g.strokeStyle = '#d4231b'; g.lineWidth = 5;
    notes.forEach(function (n, ni) {
      if (!n.upto) return; var p = pos[n.ans], live = ni === c.bq && sAnim;
      // the newest string is pulled across, tightens, then twangs
      var k = live ? Math.min(1, sAge / 0.35) : 1, sag = live ? (sAge < 0.35 ? 60 + (1 - k) * 120 : 60 + 26 * Math.sin((sAge - 0.35) * 40) * Math.exp(-(sAge - 0.35) * 6)) : 60;
      var x0 = n.x, y0 = n.y + 120, cx = (n.x + p.x) / 2 + 40, cy = (n.y + p.y) / 2 + sag;
      g.beginPath(); g.moveTo(x0, y0);
      for (var q = 1; q <= 24; q++) { var tt = q / 24 * k, a = (1 - tt) * (1 - tt), b2 = 2 * (1 - tt) * tt, d = tt * tt; g.lineTo(a * x0 + b2 * cx + d * p.x, a * y0 + b2 * cy + d * p.y); }
      g.stroke();
    });
    // the loose end of the string for the current question: pulse it, and follow the hand while it is being pulled
    var curN = notes[c.bq];
    if (curN && !c.bdone) {
      var sx = curN.x, sy = curN.y + 120;
      if (c.strEnd) {
        var ex = c.strEnd[0], ey = c.strEnd[1], mx = (sx + ex) / 2, my = (sy + ey) / 2 + 40;
        g.strokeStyle = '#d4231b'; g.lineWidth = 5; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
        g.fillStyle = '#d4231b'; g.beginPath(); g.arc(ex, ey, 9, 0, Math.PI * 2); g.fill();
      } else {
        g.strokeStyle = '#d4231b'; g.lineWidth = 5; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + 18, sy + 30, sx + 4, sy + 52); g.stroke();
        g.lineWidth = 3; g.strokeStyle = 'rgba(212,35,27,' + (0.7 - pulse * 0.15) + ')'; g.beginPath(); g.arc(sx + 4, sy + 52, 14 + pulse * 6, 0, Math.PI * 2); g.stroke();
      }
      g.fillStyle = '#d4231b'; g.beginPath(); g.arc(sx, sy, 10, 0, Math.PI * 2); g.fill();
    }
    ids.forEach(function (id) { var p = pos[id]; g.fillStyle = '#d4231b'; g.beginPath(); g.arc(p.x, p.y, 12, 0, Math.PI * 2); g.fill(); });
    notes.forEach(function (n) { g.fillStyle = '#2b6cd4'; g.beginPath(); g.arc(n.x, n.y, 12, 0, Math.PI * 2); g.fill(); });
    this.r.updateTexture(this.boardTex, this.boardCv);
  };

  /* ======================= info panel ======================= */
  Game.prototype._invDrawInfo = function (hoverBtn, hoverItem) {
    var c = this.cur, st = this.state, s = this.settings, self = this;
    var sig = ['inv', st, c.idx, c.lwrong, c.ldone, c.lies, c.magnify, c.hintMag, c.open, c.pinWrong, (c.unlocked || []).length, this.isDay(), c.found && c.found.length, c.tapped && c.tapped.length, c.note && c.note.text, c.hintItem, c.hintKey, c.bq, c.bdone, c.bwrong, c.si, c.sdone, c.swrong, c.pz && [c.pz.n, c.pz.wrong, c.pz.done].join(), c.iphase, c.toneWrong, JSON.stringify(c.tones || {}), (c.altUsed || []).join(), (c.testimony || []).join(), hoverBtn, hoverItem, s.sound, s.big, this.p.badges.length].join('|');
    if (sig === this.infoSig) return; this.infoSig = sig;
    var g = this.infoCv.getContext('2d'), W = INFO.cw, H = INFO.ch, B = this.infoButtons = [];
    g.clearRect(0, 0, W, H);
    rr(g, 6, 6, W - 12, H - 12, 40); g.fillStyle = 'rgba(16,18,26,0.92)'; g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,.14)'; g.stroke();
    g.textBaseline = 'alphabetic';
    var y = 84, x = 48, maxW = W - 96;
    function text(t, size, weight, color, lh) { g.font = weight + ' ' + size + 'px ' + FONT; g.fillStyle = color; wrapLines(g, t, maxW).forEach(function (l) { g.fillText(l, x, y); y += lh || size * 1.32; }); }
    function button(id, label, bx, by, bw, bh, primary, fsize, sub) {
      var hov = hoverBtn === id; rr(g, bx, by, bw, bh, 20);
      g.fillStyle = primary ? (hov ? '#ffe08a' : '#ffcc4d') : hov ? 'rgba(130,180,255,.42)' : 'rgba(255,255,255,.1)'; g.fill();
      if (hov) { g.lineWidth = 4; g.strokeStyle = '#bfe0ff'; g.stroke(); }
      g.fillStyle = primary ? '#2a1d00' : '#fff'; g.font = '700 ' + (fsize || (primary ? 36 : 28)) + 'px ' + FONT;
      if (sub) {
        g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(fit(g, label, bw - 44), bx + 22, by + bh / 2 - 15);
        g.font = '500 21px ' + FONT; g.fillStyle = primary ? '#5a4300' : '#aab3c5'; g.fillText(fit(g, sub, bw - 44), bx + 22, by + bh / 2 + 19);
      } else { g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(fit(g, label, bw - 30), bx + bw / 2, by + bh / 2 + 2); }
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      B.push({ id: id, x: bx, y: by, w: bw, h: bh });
    }
    function noteBox(n) {
      if (!n) return;
      var top = y; g.font = '600 25px ' + FONT; var ls = wrapLines(g, n.text, maxW - 30).slice(0, n.max || 3);
      rr(g, 40, top - 6, W - 80, 52 + ls.length * 32, 16); g.fillStyle = n.good ? 'rgba(60,200,120,.16)' : 'rgba(255,255,255,.08)'; g.fill();
      g.fillStyle = n.good ? '#5fe39b' : '#c7cdd9'; g.font = '800 26px ' + FONT; g.fillText((n.good ? '✓ ' : '✗ ') + n.title, 58, top + 28);
      g.fillStyle = '#e6ebf5'; g.font = '500 24px ' + FONT; ls.forEach(function (l, i) { g.fillText(l, 58, top + 62 + i * 32); });
      y = top + 66 + ls.length * 32;
    }
    if (st === 'menu') {
      text(T('Detective HQ'), 30, '600', '#93a4bd'); y += 4;
      var LS = root.I18N.languages(), nextL = LS[(LS.indexOf(root.I18N.lang) + 1) % LS.length];
      if (LS.length > 1) button('lang', 'A / अ  ' + root.I18N.langName(nextL), W - 264, 22, 220, 56, false, 24);
      button('theme', this.isDay() ? T('☾ Night look') : T('☀ Bright look'), W - 500, 22, 224, 56, false, 24);
      text(T('Choose your next case'), 46, '800', '#fff', 56); y += 6;
      var by = Math.max(y, 190), ih = INV.length > 3 ? 86 : 100;
      var grid = INV.length > 4, tw = grid ? (W - 96 - 12) / 2 : W - 96, th = grid ? 92 : ih;
      INV.forEach(function (v, i) {
        var done = self.p.invDone[v.id], cont = self.slots.inv && self.slots.inv.idx === i && self.slots.inv.stage !== 'closed' && self.slots.inv.stage !== 'brief';
        var firstOpen = INV.findIndex(function (w) { return !self.p.invDone[w.id]; });
        var tx = grid ? 48 + (i % 2) * (tw + 12) : 48, ty = grid ? by + Math.floor(i / 2) * (th + 10) : by;
        button('inv' + i, (i + 1) + '. ' + v.title, tx, ty, tw, th, i === firstOpen, grid ? 24 : 28,
          (v.real ? '★ ' + T('Real case') + '  ·  ' : v.type + '  ·  ') + (done ? T('Solved ') + '★★★'.slice(0, done) : cont ? T('Continue where you left off') : grid ? T('4 stages') : T('Crime scene → evidence → interrogation')));
        if (!grid) by += ih + 10;
      });
      if (grid) by += Math.ceil(INV.length / 2) * (th + 10);
      var sd = this.p.storyDone || 0;
      button('cases', T('Cyber case files'), 48, by, W - 96, 84, false, 28, sd + T(' of ') + C.STORIES.length + T(' quick cases solved')); by += 94;
      button('daily', T('Daily case'), 48, by, (W - 108) / 2, 84, false, 28); button('training', T('Training'), 48 + (W - 108) / 2 + 12, by, (W - 108) / 2, 84, false, 28);
    } else {
      var v = this.inv(), stageNo = { brief: 0, scene: 1, puzzle: 2, board: 2, lineup: 3, interro: 4, confess: 4, closed: 4, report: 4 }[st];
      var CP = this._culprit();
      var head = T('Investigation ') + (c.idx + 1) + (stageNo ? T('  ·  Stage ') + stageNo + T(' of 4') : '');
      text(head, 28, '600', '#93a4bd'); y += 4;
      if (st === 'brief') {
        text(v.title, 44, '800', '#fff', 54); y += 8;
        text(T('Your investigation has four stages:'), 29, '600', '#d7e3ff', 40); y += 4;
        text(T('1. Crime scene: inspect objects and collect evidence.'), 27, '500', '#d7e3ff', 37);
        text(T('2. Evidence room: connect clues on the board.'), 27, '500', '#d7e3ff', 37);
        text(T('3. Line-up: pick the culprit from three suspects.'), 27, '500', '#d7e3ff', 37);
        text(T('4. Interrogation: catch the suspect’s lies.'), 27, '500', '#d7e3ff', 37);
        button('toscene', T('Go to the crime scene ▶'), 48, 690, 520, 96, true, 32); button('read', T('Read aloud'), 592, 690, 200, 96);
      } else if (st === 'scene') {
        var total = Object.keys(v.evidence).length;
        text(T('Crime scene'), 44, '800', '#fff', 52);
        text(v.place, 26, '500', '#93a4bd', 34); y += 6;
        if (!c.open) text(hoverItem === 'magnifier' ? T('Magnifying glass: reveals tiny details') : hoverItem ? T('Inspect: ') + this._item(hoverItem).name : T('Touch or pinch an object on the table to inspect it.'), 29, '600', '#d7e3ff', 40);
        else text(T('Tap anything on the card that could be evidence.'), 29, '600', '#d7e3ff', 40);
        y += 6; noteBox(c.note); y += 10;
        g.fillStyle = '#ffd36b'; g.font = '800 28px ' + FONT; g.fillText(T('Evidence bag: ') + c.found.length + T(' of ') + total, x, y); y += 38;
        g.font = '500 24px ' + FONT; g.fillStyle = '#c7cdd9';
        c.found.slice(-4).forEach(function (e) { g.fillText('• ' + v.evidence[e].title, x + 6, y); y += 31; });
        if (c.hintItem && !c.open) { g.fillStyle = '#ffd36b'; g.font = '600 24px ' + FONT; g.fillText(T('Hint: check the glowing ') + this._item(c.hintItem).name.toLowerCase() + '.', x, Math.min(y + 4, 672)); }
        if (c.hintMag && !c.magnify) { g.fillStyle = '#ffd36b'; g.font = '600 24px ' + FONT; g.fillText(T('Hint: something here is too small to see. Try the magnifier.'), x, 660); }
        if (c.found.length >= total) button('toboard', T('Evidence room ▶'), 48, 690, 404, 96, true, 32);
        else {
          if (c.open) button('putback', T('Put it back'), 48, 690, 220, 96, false, 26); else button('tobrief', T('Case file'), 48, 690, 220, 96, false, 26);
          button('invhint', T('Hint (−10)'), 280, 690, 172, 96, false, 26);
        }
        button('magnify', c.magnify ? T('Magnifier ✓') : T('Magnifier'), 464, 690, 172, 96, !!c.magnify, 26);
        button('read', T('Read'), 648, 690, 144, 96, false, 26);
      } else if (st === 'puzzle') {
        var PZ = v.puzzle, pzs = c.pz || {};
        text(T('Evidence room  ·  Case puzzle'), 26, '600', '#ffd36b', 36); y += 4;
        text(PZ.title, 38, '800', '#fff', 47); y += 8;
        if (pzs.done) { noteBox({ good: true, title: T('Solved!'), text: PZ.lesson }); button('pznext', T('To the evidence board ▶'), 48, 690, 520, 96, true, 32); }
        else {
          text(PZ.intro, 27, '500', '#d7e3ff', 37); y += 10;
          if (pzs.wrong !== null && pzs.wrong !== undefined) noteBox({ good: false, title: T('Not that one'), text: PZ.type === 'match' ? T('Compare the slant and the underline again.') : T('That doesn’t come next. Try another piece.') });
        }
        button('read', T('Read aloud'), 592, 690, 200, 96);
      } else if (st === 'board') {
        var Q = v.board[c.bq];
        text(T('Evidence room  ·  Question ') + (c.bq + 1) + T(' of ') + v.board.length, 26, '600', '#ffd36b', 36); y += 4;
        text(Q.q, 38, '800', '#fff', 47); y += 10;
        if (c.bdone) { noteBox({ good: true, title: T('Connected!'), text: Q.why }); button('bnext', c.bq + 1 < v.board.length ? T('Next question ▶') : T('To the line-up ▶'), 48, 690, 520, 96, true, 32); }
        else {
          text(T('Pull the red string from the question to the evidence that answers it, or tap the card.'), 28, '500', '#d7e3ff', 38); y += 10;
          if (c.bwrong) noteBox({ good: false, title: T('Not that one'), text: v.evidence[c.bwrong].title + T(' doesn’t answer this. Try another card.') });
        }
        button('read', T('Read aloud'), 592, 690, 200, 96);
      } else if (st === 'lineup') {
        text(T('Line-up'), 44, '800', '#fff', 52);
        text(v.lineup.q, 32, '700', '#ffd36b', 40); y += 6;
        if (c.ldone) {
          noteBox({ good: true, title: T('Culprit identified!'), text: v.lineup.why });
          button('tointerro', T('Interrogate ') + CP.name.split(' ')[0] + ' ▶', 48, 690, 520, 96, true, 32); button('hear', T('Hear again'), 592, 690, 200, 96);
        } else {
          if (c.lwrong) noteBox({ good: false, title: this._person(c.lwrong).name + T(' is cleared'), text: v.lineup.alibis[c.lwrong].why });
          else text(T('Point at a suspect and pinch, or choose below. Use your evidence!'), 27, '500', '#d7e3ff', 37);
          var ly = Math.max(y + 8, 420), self2 = this;
          v.lineup.ids.forEach(function (id, i) {
            var pp = self2._person(id), cleared = c.lwrong === id;
            button('acc:' + id, T('No. ') + (i + 1) + ': ' + pp.name + (cleared ? T('  (cleared)') : ''), 48, ly, W - 96, 84, false, 27, pp.role);
            ly += 92;
          });
        }
      } else if (st === 'interro') {
        var sp = this._step(), stmt = sp.S, PX = this._person(sp.who), TN = sp.P.tone, steps = this._isteps(), first = PX.name.split(' ')[0];
        text(T('Interrogation: ') + PX.name, 34, '800', '#fff', 44);
        if (c.iphase === 'tone') {
          text(sp.P.intro, 24, '500', '#93a4bd', 32); y += 6;
          if (c.tones && c.tones[sp.who]) {
            noteBox({ good: true, title: T('Good read!'), text: T('{name} opens up. The right approach earned you 50 points.', { name: first }) });
            button('tonego', T('Start questioning ▶'), 48, 690, 520, 96, true, 32); button('hear', T('Hear again'), 592, 690, 200, 96);
          } else {
            if (c.toneWrong) noteBox({ good: false, title: T('Wrong approach'), text: T('{name} shuts down. Try the other way.', { name: first }) });
            else text(T('Watch them in the chair. How will you play it?'), 27, '600', '#ffd36b', 37);
            var ty = Math.max(y + 10, 560);
            button('tone:calm', (c.toneWrong === 'calm' ? '✗ ' : '') + T('Calm: build trust'), 48, ty, W - 96, 84, false, 28, T('Speak gently and let them talk'));
            button('tone:tough', (c.toneWrong === 'tough' ? '✗ ' : '') + T('Tough: apply pressure'), 48, ty + 94, W - 96, 84, false, 28, T('Stay firm and push for answers'));
          }
        } else if (c.iphase === 'ask') {
          text(T('Choose your question. Vague ones get dodged; sharp ones force a statement you can test.'), 25, '600', '#d7e3ff', 33); y += 4;
          if (c.altNote) noteBox({ good: false, title: T('Dodged!'), text: T('Too vague. Ask something that pins {name} down.', { name: first }) });
          var qy = Math.max(y + 8, 450), used = c.altUsed || [];
          this._askOpts().forEach(function (o, i) { button('ask:' + i, (used.indexOf(o.k) >= 0 ? '✗ ' : '') + o.q, 48, qy + i * 92, W - 96, 84, false, 26); });
        } else if (c.sdone) {
          noteBox({ good: true, title: stmt.truth ? (PX.look.female ? T('She was telling the truth') : T('He was telling the truth')) : T('Lie exposed!'), text: stmt.why + (stmt.truth && stmt.tag ? ' ' + T('Recorded as a testimony card.') : '') });
          var nx = steps[c.si + 1];
          button('snext', !nx ? T('Hear the confession ▶') : nx.who !== sp.who ? T('Bring in {name} ▶', { name: this._person(nx.who).name.split(' ')[0] }) : stmt.ask || nx.S.ask ? T('Next question ▶') : T('Next statement ▶'), 48, 690, 520, 96, true, 32);
          button('hear', T('Hear again'), 592, 690, 200, 96);
        } else {
          if (sp.n === 0 && !c.swrong && !TN) { text(sp.P.intro, 24, '500', '#93a4bd', 32); y += 6; }
          text(T('Slam an evidence card on the table to prove the lie, or slam “I believe you”. You can also choose here:'), 25, '600', '#d7e3ff', 33); y += 4;
          if (c.swrong) noteBox({ good: false, title: c.swrong === 'believe' ? (PX.look.female ? T('She’s lying!') : T('He’s lying!')) : T('That doesn’t disprove it'), text: c.swrong === 'believe' ? T('Your evidence says otherwise. Find the card that proves it.') : T('Think about what this statement claims. Try again.') });
          var self3 = this, oy = Math.max(y + 4, 300), opts = [['believe', PX.look.female ? T('Believe her') : T('Believe him')]].concat(this._evcList().filter(function (e) { return e !== 'believe'; }).map(function (e) { var I = self3._evInfo(e); return ['show:' + e, (I.testimony ? T('Show: ') + I.title.split(' ')[0] + ': ' + I.text : T('Show: ') + I.title)]; }));
          var oh = Math.min(70, Math.floor((800 - oy) / opts.length) - 8);
          opts.forEach(function (o, i) { button(o[0], o[1], 48, oy + i * (oh + 8), W - 96, oh, false, oh < 60 ? 22 : 26); });
        }
      } else if (st === 'confess') {
        text(T('Confession'), 44, '800', '#fff', 54); y += 6;
        text(CP.name + T(' breaks down and tells the truth.'), 29, '500', '#d7e3ff', 40); y += 10;
        text(T('Every lie exposed. Time to close the case.'), 28, '600', '#ffd36b', 38);
        button('charge', T('Close the case ▶'), 48, 690, 520, 96, true, 34); button('hear', T('Hear again'), 592, 690, 200, 96);
      } else if (st === 'report') {
        text(T('Report it'), 44, '800', '#fff', 54); y += 6;
        text(v.report === '112' ? T('In India, call 112 for police emergencies and crimes like theft.') : T('In India, call 1930 to report cyber crime, or use cybercrime.gov.in. Reporting fast can freeze the money.'), 28, '500', '#d7e3ff', 38); y += 10;
        text(T('Dial {n} on the phone keypad.', { n: v.report || '1930' }), 30, '700', '#ffd36b', 40);
        if (c.pinWrong) { y += 6; text(T('That’s not the right number. Try again.'), 26, '600', '#ff8a7a', 36); }
        button('skipreport', T('Skip'), 592, 690, 200, 96); button('read', T('Read aloud'), 48, 690, 300, 96);
      } else if (st === 'closed') {
        y += 14; text(T('Case closed!'), 50, '800', '#5fe39b', 60);
        text(T('You earned the “') + T(v.badge) + T('” badge.'), 30, '600', '#fff', 42); y += 6;
        text(T('Score: ') + c.points + T(' points  ·  ') + '★★★'.slice(0, c.stars || 1) + T('  (fewer mistakes, more stars)'), 26, '500', '#d7e3ff', 36); y += 8;
        if (v.real) { y += 4; noteBox({ good: true, title: T('Based on a real case'), text: v.real.text, max: 6 }); g.fillStyle = '#93a4bd'; g.font = '500 21px ' + FONT; g.fillText(T('Source: ') + v.real.source, 58, Math.min(y + 4, 676)); }
        else text(T('Real case? Report cyber crime at cybercrime.gov.in or call 1930. For other crimes, call 112.'), 25, '600', '#ffd36b', 34);
        button('menu', T('Back to HQ ▶'), 48, 690, 330, 96, true, 32); button('replayinv', T('Replay'), 390, 690, 190, 96); button('read', T('Read aloud'), 592, 690, 200, 96);
      }
    }
    var sys = [['menu', T('▤ Menu')], ['down', T('▼ Lower')], ['up', T('▲ Raise')], ['center', T('◎ Center')], ['sound', s.sound ? T('♪ On') : T('♪ Off')], ['big', s.big ? T('Aa ✓') : T('Aa Text')]];
    var bw = (W - 96 - 5 * 10) / 6;
    sys.forEach(function (d, i) { button(d[0], d[1], 48 + i * (bw + 10), 820, bw, 84, false, 24); });
    g.font = '500 22px ' + FONT; g.fillStyle = '#6f7f96'; g.textAlign = 'center'; g.fillText(T('All people, companies, numbers and places in this game are made up.'), W / 2, 950); g.textAlign = 'left';
    this.r.updateTexture(this.infoTex, this.infoCv);
  };
})(this);
