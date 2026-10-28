/* Scam Detective — generated spatial sound effects and a soft rain ambience. No audio files. */
(function (root) {
  'use strict';
  function Sound() { this.ctx = null; this.enabled = true; }

  Sound.prototype.unlock = function () {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    var AC = root.AudioContext || root.webkitAudioContext; if (!AC) return;
    var ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = this.enabled ? 0.9 : 0;
    var comp = ctx.createDynamicsCompressor(); this.master.connect(comp); comp.connect(ctx.destination);
    // rain ambience: looping filtered noise with a slow swell
    var len = ctx.sampleRate * 3, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch), last = 0;
      for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3 + (Math.random() < 0.0004 ? (Math.random() - 0.5) * 0.6 : 0); }
    }
    var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    this.rain = ctx.createGain(); this.rain.gain.value = 0;
    src.connect(lp); lp.connect(this.rain); this.rain.connect(this.master); src.start();
    this.rain.gain.setTargetAtTime(0.16, ctx.currentTime, 2);
    // fluorescent hum: mains buzz with harmonics, low-passed
    this.hum = ctx.createGain(); this.hum.gain.value = 0;
    var hlp = ctx.createBiquadFilter(); hlp.type = 'lowpass'; hlp.frequency.value = 520;
    [[100, 'sawtooth', 0.5], [200, 'square', 0.12], [50, 'sine', 0.6]].forEach(function (h) {
      var o = ctx.createOscillator(), g = ctx.createGain(); o.type = h[1]; o.frequency.value = h[0]; g.gain.value = h[2]; o.connect(g); g.connect(hlp); o.start();
    });
    hlp.connect(this.hum); this.hum.connect(this.master);
    // wall clock: two-second loop, tick then tock
    var cl = ctx.sampleRate * 2, cb = ctx.createBuffer(1, cl, ctx.sampleRate), cd = cb.getChannelData(0);
    [[0, 3800], [ctx.sampleRate, 2600]].forEach(function (k) {
      for (var j = 0; j < 900; j++) cd[k[0] + j] = Math.sin(j * 2 * Math.PI * k[1] / ctx.sampleRate) * Math.exp(-j / 120) * 0.9 + (Math.random() - 0.5) * Math.exp(-j / 60) * 0.5;
    });
    var cs = ctx.createBufferSource(); cs.buffer = cb; cs.loop = true;
    this.tick = ctx.createGain(); this.tick.gain.value = 0;
    cs.connect(this.tick); this.tick.connect(this.master); cs.start();
    // distant street: very low rumble with the odd horn
    var sl = ctx.sampleRate * 7, sb = ctx.createBuffer(1, sl, ctx.sampleRate), sd = sb.getChannelData(0), lv = 0;
    for (var q = 0; q < sl; q++) { lv = (lv + 0.01 * (Math.random() * 2 - 1)) / 1.01; sd[q] = lv * 5; }
    [[1.3, 410], [4.6, 370]].forEach(function (hn) {
      var st0 = Math.floor(hn[0] * ctx.sampleRate), hl = Math.floor(0.35 * ctx.sampleRate);
      for (var j = 0; j < hl; j++) sd[st0 + j] += 0.05 * Math.sin(j * 2 * Math.PI * hn[1] / ctx.sampleRate) * Math.sin(Math.PI * j / hl);
    });
    var ss = ctx.createBufferSource(); ss.buffer = sb; ss.loop = true;
    var slp = ctx.createBiquadFilter(); slp.type = 'lowpass'; slp.frequency.value = 700;
    this.street = ctx.createGain(); this.street.gain.value = 0;
    ss.connect(slp); slp.connect(this.street); this.street.connect(this.master); ss.start();
    if (this.room) { var r0 = this.room; this.room = null; this.setRoom(r0); }
  };
  // room ambience mix: [rain, hum, clock, street]
  var ROOMS = { desk: [0.16, 0, 0, 0], home: [0.1, 0, 0.05, 0.05], office: [0.08, 0.006, 0.035, 0], lineup: [0.02, 0.02, 0, 0], interro: [0.025, 0.026, 0.03, 0],
    party: [0.03, 0, 0.02, 0.12], street: [0.03, 0.01, 0, 0.2], empty: [0.07, 0.03, 0, 0], kitchen: [0.05, 0.004, 0.04, 0.07] };
  Sound.prototype.setRoom = function (name) {
    if (this.room === name) return; this.room = name;
    if (!this.ctx || !this.hum) return;
    var m = ROOMS[name] || ROOMS.desk, t = this.ctx.currentTime;
    this.rain.gain.setTargetAtTime(m[0], t, 0.8); this.hum.gain.setTargetAtTime(m[1], t, 0.8);
    this.tick.gain.setTargetAtTime(m[2], t, 0.5); this.street.gain.setTargetAtTime(m[3], t, 0.8);
  };
  Sound.prototype.setEnabled = function (on) { this.enabled = on; if (this.ctx) this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05); };
  Sound.prototype.suspend = function () { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); };
  Sound.prototype.resume = function () { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); };
  Sound.prototype.listener = function (pos, fwd, up) {
    if (!this.ctx) return; var L = this.ctx.listener, t = this.ctx.currentTime;
    if (L.positionX) { L.positionX.setValueAtTime(pos[0], t); L.positionY.setValueAtTime(pos[1], t); L.positionZ.setValueAtTime(pos[2], t);
      L.forwardX.setValueAtTime(fwd[0], t); L.forwardY.setValueAtTime(fwd[1], t); L.forwardZ.setValueAtTime(fwd[2], t);
      L.upX.setValueAtTime(up[0], t); L.upY.setValueAtTime(up[1], t); L.upZ.setValueAtTime(up[2], t); }
    else if (L.setPosition) { L.setPosition(pos[0], pos[1], pos[2]); L.setOrientation(fwd[0], fwd[1], fwd[2], up[0], up[1], up[2]); }
  };
  Sound.prototype._out = function (pos) {
    var ctx = this.ctx, g = ctx.createGain();
    if (pos) { var p = ctx.createPanner(); p.panningModel = 'HRTF'; p.refDistance = 0.4; p.rolloffFactor = 0.6;
      if (p.positionX) { p.positionX.value = pos[0]; p.positionY.value = pos[1]; p.positionZ.value = pos[2]; } else p.setPosition(pos[0], pos[1], pos[2]);
      g.connect(p); p.connect(this.master); } else g.connect(this.master);
    return g;
  };
  Sound.prototype._tone = function (f, type, at, dur, vol, pos, f2) {
    var ctx = this.ctx, o = ctx.createOscillator(), g = this._out(pos);
    o.type = type; o.frequency.setValueAtTime(f, at); if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + dur);
    o.connect(g); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.start(at); o.stop(at + dur + 0.05);
  };
  Sound.prototype._noise = function (at, dur, freq, q, vol, pos) {
    var ctx = this.ctx, n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    var s = ctx.createBufferSource(); s.buffer = b; var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    var g = this._out(pos); g.gain.value = vol; s.connect(f); f.connect(g); s.start(at);
  };
  function ok(self) { return self.ctx && self.enabled; }
  Sound.prototype.paper = function (pos) { if (!ok(this)) return; var t = this.ctx.currentTime; this._noise(t, 0.28, 2600, 0.7, 0.5, pos); };
  Sound.prototype.mark = function (pos) { if (!ok(this)) return; var t = this.ctx.currentTime; this._noise(t, 0.05, 4200, 2, 0.6, pos); this._tone(1320, 'sine', t, 0.12, 0.08, pos); };
  Sound.prototype.unmark = function (pos) { if (!ok(this)) return; var t = this.ctx.currentTime; this._tone(700, 'sine', t, 0.1, 0.06, pos, 500); };
  Sound.prototype.stamp = function (pos) { if (!ok(this)) return; var t = this.ctx.currentTime; this._tone(140, 'sine', t, 0.22, 0.5, pos, 55); this._noise(t, 0.09, 900, 1.2, 0.9, pos); };
  Sound.prototype.correct = function () { if (!ok(this)) return; var t = this.ctx.currentTime + 0.18, self = this; [0, 4, 7, 12].forEach(function (s, i) { self._tone(523.25 * Math.pow(2, s / 12), 'triangle', t + i * 0.07, 0.6, 0.14); }); };
  Sound.prototype.wrong = function () { if (!ok(this)) return; var t = this.ctx.currentTime + 0.18; this._tone(330, 'triangle', t, 0.3, 0.12, null); this._tone(262, 'triangle', t + 0.18, 0.45, 0.12, null); };
  Sound.prototype.closed = function () { if (!ok(this)) return; var t = this.ctx.currentTime, self = this; [0, 4, 7, 12, 16, 19, 24].forEach(function (s, i) { self._tone(392 * Math.pow(2, s / 12), 'sine', t + i * 0.09, 1.4, 0.12); }); };
  // a taut string being plucked
  Sound.prototype.twang = function () { if (!ok(this)) return; var t = this.ctx.currentTime + 0.25; this._tone(196, 'triangle', t, 0.5, 0.16, null, 185); this._tone(392, 'sine', t, 0.3, 0.05, null, 370); };
  // two-tone police siren, fading in and out
  Sound.prototype.siren = function (dur) {
    if (!ok(this)) return; var ctx = this.ctx, t = ctx.currentTime, d = dur || 3, o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = 'sawtooth'; lp.type = 'lowpass'; lp.frequency.value = 1800;
    for (var i = 0; i < d / 0.5; i++) o.frequency.setValueAtTime(i % 2 ? 640 : 820, t + i * 0.5);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.6); g.gain.setValueAtTime(0.05, t + d - 0.8); g.gain.linearRampToValueAtTime(0, t + d);
    o.connect(lp); lp.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + 0.1);
  };
  // soft air whoosh for room transitions
  Sound.prototype.whoosh = function () { if (!ok(this)) return; var t = this.ctx.currentTime; this._noise(t, 0.45, 700, 0.6, 0.25, null); };
  // bright metallic chime for a medal
  Sound.prototype.medal = function () { if (!ok(this)) return; var t = this.ctx.currentTime + 0.3, self = this; [0, 7, 12, 19].forEach(function (s2, i) { self._tone(659 * Math.pow(2, s2 / 12), 'sine', t + i * 0.05, 1.6, 0.07); }); };
  Sound.prototype.ui = function () { if (!ok(this)) return; var t = this.ctx.currentTime; this._tone(880, 'sine', t, 0.07, 0.07); };
  root.Sound = Sound;
})(this);
