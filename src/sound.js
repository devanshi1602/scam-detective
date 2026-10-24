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
  Sound.prototype.ui = function () { if (!ok(this)) return; var t = this.ctx.currentTime; this._tone(880, 'sine', t, 0.07, 0.07); };
  root.Sound = Sound;
})(this);
