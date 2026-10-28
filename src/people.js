/* Scam Detective — life-size low-poly people: seated (interrogation) and standing (line-up),
 * with hairstyles, glasses, beards, blinking, moods, head reactions and lip movement while talking.
 * Person local space: y = 0 at table-top height, +z faces the player. */
(function (root) {
  'use strict';
  var M = root.M3;
  function P(x, y, z, rx, ry, rz, sx, sy, sz) { return M.trs(x, y, z, rx || 0, ry || 0, rz || 0, sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz); }
  function c4(c, a) { return [c[0], c[1], c[2], a === undefined ? 1 : a]; }
  function shade(c, k) { return [c[0] * k, c[1] * k, c[2] * k]; }
  /** Cylinder (unit, along Y) from point a to point b with diameter d. */
  function limb(a, b, d) {
    var v = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(v[0], v[1], v[2]) || 1e-4, y = [v[0] / len, v[1] / len, v[2] / len];
    var ref = Math.abs(y[0]) > 0.9 ? [0, 0, 1] : [1, 0, 0];
    var z = M.norm([y[1] * ref[2] - y[2] * ref[1], y[2] * ref[0] - y[0] * ref[2], y[0] * ref[1] - y[1] * ref[0]]);
    var x = [y[1] * z[2] - y[2] * z[1], y[2] * z[0] - y[0] * z[2], y[0] * z[1] - y[1] * z[0]];
    return new Float32Array([x[0] * d, x[1] * d, x[2] * d, 0, y[0] * len, y[1] * len, y[2] * len, 0, z[0] * d, z[1] * d, z[2] * d, 0,
      (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, 1]);
  }

  /** A hand: palm, four fingers and a thumb. at: wrist position, fwd: unit direction the fingers point, sd: -1 left / +1 right. */
  function hand(A, at, fwd, sd, skin, curl) {
    var up = [0, 1, 0], side = M.norm([fwd[2], 0, -fwd[0]]), c = curl || 0;
    function pt(f, s2, u) { return [at[0] + fwd[0] * f + side[0] * s2 + up[0] * u, at[1] + fwd[1] * f + up[1] * u, at[2] + fwd[2] * f + side[2] * s2]; }
    A('sphere', M.mul(M.trs(at[0] + fwd[0] * 0.035, at[1] + fwd[1] * 0.035, at[2] + fwd[2] * 0.035, 0, Math.atan2(fwd[0], fwd[2]), 0, 1), M.trs(0, 0, 0, 0, 0, 0, 0.07, 0.03, 0.075)), c4(skin));
    for (var i = 0; i < 4; i++) {
      var off = (i - 1.5) * 0.016, len = i === 0 || i === 3 ? 0.04 : 0.05;
      A('cyl', limb(pt(0.065, off, 0), pt(0.065 + len * (1 - c * 0.5), off, -len * c * 0.8), 0.014), c4(skin));
    }
    A('cyl', limb(pt(0.03, sd * -0.032, 0), pt(0.06, sd * -0.05, 0.012), 0.016), c4(skin));
  }
  /** A photo-scanned character model: breathing sway, a slight turn toward the player, reactions as whole-body motion. */
  function drawModelPerson(add, base, L, st) {
    var t = st.t, ph = st.phase || 0, h = L.height || 1.7, seated = st.pose !== 'standing';
    var sway = Math.sin(t * 0.8 + ph) * 0.012, breathe = 1 + Math.sin(t * 1.7 + ph) * 0.004, ry = sway, rz = Math.sin(t * 0.6 + ph * 2) * 0.006, lean = 0;
    if (st.viewer) { var lw = st.lookWide ? 1.0 : 0.25; ry += Math.max(-lw, Math.min(lw, Math.atan2(st.viewer[0] - base[12], st.viewer[2] - base[14]))) * (st.lookWide ? 0.75 : 0.35); }
    if (st.react) {
      var e = st.react.e, k = Math.max(0, 1 - e / 1.3);
      if (st.react.type === 'shake') ry += Math.sin(e * 16) * 0.12 * k;
      else if (st.react.type === 'nod') lean += Math.sin(e * 10) * 0.05 * k;
      else if (st.react.type === 'smirk') rz += Math.sin(e * 4) * 0.04 * k;
    }
    if (st.mood === 'sad') lean += 0.05;
    if (st.mood === 'nervous') rz += Math.sin(t * 7) * 0.004;
    if (st.talk) lean += Math.sin(t * 9) * 0.006 * st.talk;
    // seated characters are placed behind the table with their feet below the floor line so only the upper body shows
    var foot = seated ? 0.24 - h * 0.82 : -0.74;
    var m = M.mul(base, M.trs(0, foot, seated ? -0.04 : 0, lean, ry, rz, 1));
    root.Models.draw(add, M.mul(m, M.trs(0, 0, 0, 0, 0, 0, 1, breathe, 1)), L.model, h);
    if (st.placard) {
      add('box', M.mul(base, P(0, 0.3, 0.2, 0, 0, 0, 0.24, 0.14, 0.01)), c4([0.1, 0.1, 0.1]));
      add('quad', M.mul(base, P(0, 0.3, 0.206, 0, 0, 0, 0.22, 0.12, 1)), [1, 1, 1, 1], null, { tex: st.placard, unlit: 1 });
    }
  }
  /** Shaped torso (hips, waist, chest, sloping shoulders) in fabric. */
  function torso(A, L, y0, y1, slump, col, grow) {
    var k = grow || 1, F = root.Faces;
    A(L.female ? 'torsoF' : 'torsoM', M.mul(P(0, y0, -0.01 + slump * 0.02, slump * 0.12, 0, 0, 1), P(0, 0, 0, 0, 0, 0, k, (y1 - y0) * (k > 1 ? 1.01 : 1), k)), c4(col), null, F.fabric() ? { tex: F.fabric() } : null);
  }
  /** The semi-realistic head: sculpted mesh with painted skin, real eyes and lids, brows, hair, mouth. */
  function realHead(H, L, st, t, ph, mood, eyeX, eyeY) {
    var F = root.Faces, f = L.female ? 1 : 0, skin = L.skin, hair = L.hair, R = 0.0115;
    H(f ? 'headF' : 'headM', P(0, 0, 0, 0, 0, 0, 1), [1, 1, 1, 1], null, { tex: F.faceTex(L) });
    // ears
    [-1, 1].forEach(function (sd) {
      var e = F.facePoint(sd * 0.995, 0.02, f);
      H('sphere', P(e[0] + sd * 0.002, e[1] - 0.002, e[2] - 0.008, 0, sd * 0.35, sd * -0.08, 0.014, 0.047, 0.028), c4(shade(skin, 0.96)));
      H('sphere', P(e[0] + sd * 0.0065, e[1] - 0.002, e[2] - 0.006, 0, sd * 0.35, 0, 0.006, 0.028, 0.015), c4(shade(skin, 0.72)));
    });
    // eyes: white, textured iris that follows the player, a catch-light, and lids that blink and show mood
    var blink = ((t + ph * 3.1) % 3.9) < 0.12, wide = mood === 'nervous' ? 0.35 : mood === 'angry' ? -0.25 : mood === 'smug' ? -0.3 : mood === 'sad' ? -0.2 : 0;
    var eyes = [];
    [-1, 1].forEach(function (sd) {
      var s = F.facePoint(sd * 0.32, 0.165, f), c = [s[0], s[1], s[2] - 0.0058]; eyes.push(c);
      H('sphere', P(c[0], c[1], c[2], 0, 0, 0, R * 2), [0.94, 0.93, 0.9, 1]);
      var gx = eyeX * 1.3, gy = eyeY * 1.3, ic = [c[0] + gx, c[1] + gy, c[2] + R * 0.94];
      var ec = L.eyes || [0.26, 0.15, 0.08];
      H('sphere', P(ic[0], ic[1], ic[2] - 0.0006, 0, 0, 0, 0.0112, 0.0112, 0.003), [ec[0] * 0.6, ec[1] * 0.6, ec[2] * 0.6, 1]);   // iris rim
      H('sphere', P(ic[0], ic[1], ic[2] - 0.0002, 0, 0, 0, 0.0098, 0.0098, 0.003), [ec[0], ec[1], ec[2], 1]);                  // iris
      H('sphere', P(ic[0], ic[1], ic[2] + 0.0002, 0, 0, 0, 0.0045, 0.0045, 0.0025), [0.03, 0.02, 0.02, 1]);                    // pupil
      H('sphere', P(ic[0] - 0.0018, ic[1] + 0.0019, ic[2] + 0.0011, 0, 0, 0, 0.0016), [1, 1, 1, 1], null, { unlit: 1 });       // catch-light
      var up = blink ? 0.05 * R : R * (0.92 + wide * 0.6), lidCol = c4(shade(skin, 0.9));
      H('sphere', P(c[0], c[1] + up, c[2] + 0.0004, 0, 0, 0, R * 2.1), lidCol);                                       // upper lid
      H('sphere', P(c[0], c[1] + up * 0.5 + R * 0.02, c[2] + R * 0.88, 0, 0, sd * 0.05, R * 2.05, f ? 0.0018 : 0.0012, 0.004), [0.07, 0.05, 0.05, 1]);   // lash line
      H('sphere', P(c[0], c[1] - R * 1.0, c[2] + 0.0002, 0, 0, 0, R * 2.06), c4(shade(skin, 0.95)));                   // lower lid
      // eyebrow: a few soft dabs along an arch; the inner end lifts or drops with the mood
      var inner = mood === 'angry' ? -0.05 : mood === 'nervous' || mood === 'sad' ? 0.05 : mood === 'smug' ? -0.015 : 0;
      for (var k = 0; k < 8; k++) {
        var u = k / 7, bx = sd * (0.14 + 0.34 * u), by = 0.31 + Math.sin(u * Math.PI * 0.9) * 0.035 + inner * (1 - u) - u * 0.025, bp = F.facePoint(bx, by, f);
        H('sphere', P(bp[0], bp[1], bp[2] + 0.001, 0, 0, sd * (0.2 - u * 0.5) + sd * inner * -2 * (1 - u), 0.011, (f ? 0.0028 : 0.0042) * (1 - u * 0.45), 0.003), c4(shade(hair, 0.9), 0.92));
      }
    });
    // mouth opens while talking
    var talk = st.talk || 0, m = F.facePoint(0, -0.39, f);
    if (talk > 0.05) {
      H('disc', P(m[0], m[1] - 0.001, m[2] + 0.0018, Math.PI / 2 - 0.15, 0, 0, 0.033, 1, 0.004 + 0.014 * talk), [0.16, 0.05, 0.05, 1]);
      H('box', P(m[0], m[1] + 0.0012, m[2] + 0.0026, -0.15, 0, 0, 0.024, 0.0025, 0.001), [0.92, 0.9, 0.84, 1]);
    } else if (mood === 'smug' || mood === 'sad' || mood === 'nervous') {
      [-1, 1].forEach(function (sd) { var q = F.facePoint(sd * 0.17, -0.39 + (mood === 'smug' ? 0.012 : -0.012), f); H('sphere', P(q[0], q[1], q[2] + 0.0008, 0, 0, 0, 0.007, 0.003, 0.002), c4(shade(skin, 0.6))); });
    }
    // hair
    var hs = L.style || 'short', strand = { tex: F.strand() };
    if (hs === 'bald') H('hair_bald', P(0, 0, 0, 0, 0, 0, 1), c4(hair), null, strand);
    else if (hs === 'long') { H('hair_long', P(0, 0, 0, 0, 0, 0, 1), c4(hair), null, strand); H('hairFall', P(0, 0, 0, 0, 0, 0, 1), c4(hair), null, strand); }
    else H('hair_short', P(0, 0, 0, 0, 0, 0, 1), c4(hair), null, strand);
    if (hs === 'bun') { H('sphere', P(0, 0.09, -0.098, 0, 0, 0, 0.075, 0.07, 0.07), c4(hair), null, strand); H('cyl', P(0, 0.075, -0.085, 0.9, 0, 0, 0.07, 0.01, 0.07), c4(shade(hair, 0.6))); }
    return eyes;
  }

  /** Simple outfits drawn over the base body. */
  function outfit(A, L, seated, sh, breathe, slump) {
    var o = L.outfit;
    if (o === 'kurta') {
      var kc = L.shirt;
      if (!seated) { A('cyl', P(0, 0.08 + breathe, 0, 0, 0, 0, 0.36, 0.34, 0.24), c4(kc)); A('cyl', P(0, -0.05, 0, 0, 0, 0, 0.38, 0.08, 0.255), c4(shade(kc, 0.92))); }
      A('box', P(0, sh - 0.12, 0.112, 0, 0, 0, 0.022, 0.2, 0.004), c4(shade(kc, 0.75)));          // front placket
      A('cyl', P(0, sh + 0.035, 0, 0, 0, 0, 0.1, 0.04, 0.095), c4(shade(kc, 0.85)));             // mandarin collar
      [0, 1, 2].forEach(function (i) { A('sphere', P(0, sh - 0.05 - i * 0.05, 0.116, 0, 0, 0, 0.008), [0.85, 0.75, 0.4, 1]); });
    } else if (o === 'saree') {
      var sc = L.saree || [0.8, 0.2, 0.35], border = L.border || [0.95, 0.75, 0.3];
      if (!seated) {
        for (var q = 0; q < 14; q++) {   // a smoothly flaring skirt from the waist to the floor
          var yy = 0.32 - q * 0.073, rr2 = 0.34 + Math.pow(q / 13, 1.4) * 0.12;
          A('cyl', P(0, yy, 0, 0, 0, 0, rr2, 0.076, rr2 * 0.72), c4(sc));
        }
        for (var pl = -2; pl <= 2; pl++) A('box', P(pl * 0.035, -0.32, 0.145 + Math.abs(pl) * -0.006, 0.12, 0, 0, 0.006, 0.72, 0.004), c4(shade(sc, 0.8)));   // pleats
        A('cyl', P(0, -0.7, 0, 0, 0, 0, 0.465, 0.03, 0.335), c4(border));
      }
      // pallu: drape from the right hip across the chest and over the left shoulder
      A('box', M.mul(P(0.02, sh - 0.17, 0.118, 0, 0, -0.55, 1), P(0, 0, 0, 0, 0, 0, 0.12, 0.42, 0.012)), c4(sc));
      A('box', M.mul(P(0.02, sh - 0.17, 0.125, 0, 0, -0.55, 1), P(0.058, 0, 0, 0, 0, 0, 0.012, 0.42, 0.006)), c4(border));
      A('box', P(-0.13, sh - 0.15, -0.12, 0.08, 0, 0, 0.12, 0.42, 0.012), c4(sc));
      A('sphere', P(-0.13, sh, 0, 0, 0, 0, 0.11, 0.06, 0.14), c4(sc));
    } else if (o === 'jacket') {
      var jc = L.jacket || [0.2, 0.22, 0.28];
      if (root.Faces && root.Faces.ready()) torso(A, L, seated ? -0.29 : 0.1, sh + 0.06, slump, jc, 1.06);
      else {
        if (seated) A('cyl', P(0, -0.03 - slump * 0.025 + breathe, -0.008 + slump * 0.02, slump * 0.12, 0, 0, 0.36, 0.5 - slump * 0.05, 0.24), c4(jc));
        else A('cyl', P(0, 0.42 + breathe, -0.012, 0, 0, 0, 0.355, 0.62, 0.235), c4(jc));
        A('sphere', P(0, sh, -0.012, 0, 0, 0, 0.39, 0.135, 0.25), c4(jc));
      }
      var top = sh - 0.02, bot = seated ? -0.2 : 0.14;
      A('box', P(0, (top + bot) / 2, 0.118, 0, 0, 0, 0.06, top - bot, 0.01), c4(L.shirt));                               // shirt showing down the front
      [-1, 1].forEach(function (sd) { A('box', M.mul(P(sd * 0.045, sh - 0.075, 0.126, 0, 0, sd * 0.3, 1), P(0, 0, 0, 0, 0, 0, 0.035, 0.15, 0.012)), c4(shade(jc, 0.75))); });   // lapels
      A('sphere', P(0.0, bot + 0.06, 0.124, 0, 0, 0, 0.012), [0.15, 0.15, 0.16, 1]);
    }
  }

  /**
   * add(mesh, boardLocalMatrix, color, emissive, extra) — the scene's draw function.
   * base: board-local matrix of the person. look: appearance. st: state:
   *   { t, pose: 'seated'|'standing', talk: 0..1, mood: 'calm'|'nervous'|'angry'|'sad'|'smug', react: {type, e}, phase, sweat, placard: texture }
   */
  function drawPerson(add, base, L, st) {
    if (L.model && root.Models) { if (root.Models.has(L.model)) return drawModelPerson(add, base, L, st); root.Models.prepare(L.model); }
    var t = st.t, seated = st.pose !== 'standing', ph = st.phase || 0, REAL = !!(root.Faces && root.Faces.ready());
    function A(mesh, l, col, em, extra) { add(mesh, M.mul(base, l), col, em, extra); }
    var skin = L.skin, shirt = L.shirt, pants = L.pants || [0.16, 0.17, 0.2], hair = L.hair, breathe = Math.sin(t * 1.7 + ph) * 0.004;
    var slump = st.mood === 'sad' ? 1 : 0;
    var hy, sh; // head centre y, shoulder y
    if (seated) {
      A('box', P(0, -0.3, -0.02, 0, 0, 0, 0.44, 0.04, 0.42), c4([0.13, 0.13, 0.14]));
      A('box', P(0, -0.04, -0.23, 0, 0, 0, 0.44, 0.52, 0.04), c4([0.12, 0.12, 0.13]));
      sh = 0.2 + breathe - slump * 0.03; hy = 0.42 + breathe - slump * 0.06;
      if (REAL) torso(A, L, -0.29, sh + 0.075, slump, shirt);
      else {
        A('cyl', P(0, -0.03 - slump * 0.025 + breathe, -0.01 + slump * 0.02, slump * 0.12, 0, 0, 0.34, 0.5 - slump * 0.05, 0.22), c4(shirt));
        A('sphere', P(0, sh, -0.01, 0, 0, 0, 0.37, 0.12, 0.23), c4(shirt));
      }
      var talkA = Math.min(1, (st.talk || 0) * 3), sleeve = L.outfit === 'jacket' ? (L.jacket || shirt) : shirt;
      [-1, 1].forEach(function (sd) {
        var shoulder = [sd * 0.17, sh - 0.02, 0], elbow = [sd * 0.2, 0.05, 0.2], wrist = [sd * 0.09, 0.035, 0.36], fwd = [-sd * 0.35, 0, 0.94];
        if (st.react && st.react.type === 'fidget') wrist[2] += Math.sin(t * 9) * 0.01 * (sd > 0 ? 1 : 0);
        if (talkA > 0 && sd > 0) {   // the right hand lifts and gestures while they speak
          var gx = Math.sin(t * 3.1 + ph) * 0.04, gy = 0.09 + Math.sin(t * 4.3 + ph) * 0.035;
          wrist = [wrist[0] + (0.1 + gx) * talkA, wrist[1] + gy * talkA, wrist[2] - 0.06 * talkA]; elbow = [elbow[0] + 0.03 * talkA, elbow[1], elbow[2] - 0.02 * talkA];
          fwd = M.norm([-0.2, 0.35 * talkA, 0.9]);
        }
        A('cyl', limb(shoulder, elbow, 0.085), c4(sleeve));
        A('cyl', limb(elbow, wrist, 0.072), c4(sleeve));
        A('sphere', P(elbow[0], elbow[1], elbow[2], 0, 0, 0, 0.085), c4(sleeve));
        hand(A, wrist, fwd, sd, skin, sd > 0 && talkA > 0 ? 0.3 : 0.6);
      });
    } else {
      [-1, 1].forEach(function (sd) {
        A('cyl', limb([sd * 0.085, 0.14, 0], [sd * 0.09, -0.7, 0.02], 0.13), c4(pants));
        A('box', P(sd * 0.09, -0.715, 0.06, 0, 0, 0, 0.1, 0.05, 0.24), c4([0.08, 0.07, 0.07]));
      });
      sh = 0.7 + breathe; hy = 0.9 + breathe;
      if (REAL) torso(A, L, 0.1, sh + 0.075, 0, shirt);
      else { A('cyl', P(0, 0.42 + breathe, 0, 0, 0, 0, 0.34, 0.6, 0.22), c4(shirt)); A('sphere', P(0, sh, 0, 0, 0, 0, 0.37, 0.12, 0.23), c4(shirt)); }
      [-1, 1].forEach(function (sd) {
        var shoulder = [sd * 0.17, sh - 0.02, 0], elbow = [sd * 0.2, 0.45, 0.04], wrist = st.placard ? [sd * 0.09, 0.5, 0.17] : [sd * 0.2, 0.2, 0.06];
        var sl = L.outfit === 'jacket' ? (L.jacket || shirt) : shirt;
        A('cyl', limb(shoulder, elbow, 0.085), c4(sl));
        A('cyl', limb(elbow, wrist, 0.072), c4(sl));
        hand(A, wrist, st.placard ? [-sd * 0.9, 0, 0.3] : [0, -1, 0.05], sd, skin, st.placard ? 0.7 : 0.3);
      });
      if (st.placard) {
        A('box', P(0, 0.5, 0.19, 0, 0, 0, 0.24, 0.14, 0.01), c4([0.1, 0.1, 0.1]));
        A('quad', P(0, 0.5, 0.196, 0, 0, 0, 0.22, 0.12, 1), [1, 1, 1, 1], null, { tex: st.placard, unlit: 1 });
      }
    }
    if (L.scarf) {
      A('cyl', P(0, sh + 0.035, 0.0, 0.12, 0, 0, 0.2, 0.035, 0.15), c4(L.scarf), null, root.Faces && root.Faces.fabric() ? { tex: root.Faces.fabric() } : null);
      A('box', P(0.12, sh - 0.2, 0.108, 0.05, 0, 0.06, 0.085, 0.4, 0.02), c4(L.scarf));
      A('box', P(-0.12, sh - 0.2, -0.105, -0.05, 0, -0.06, 0.085, 0.4, 0.02), c4(L.scarf));
    }
    outfit(A, L, seated, sh, breathe, slump);
    A('cyl', P(0, sh + 0.07, 0.005, 0, 0, 0, REAL ? 0.082 : 0.075, REAL ? 0.12 : 0.1, REAL ? 0.08 : 0.075), c4(skin));
    A('box', P(0, sh + 0.03, 0.045, 0.3, 0, 0, 0.16, 0.03, 0.03), c4(shade(shirt, 0.8)));

    // head motion: idle look-around + reactions
    var rx = Math.sin(t * 0.7 + ph) * 0.04 + slump * 0.35, ry = Math.sin(t * 0.45 + ph * 2) * 0.12, rz = 0, eyeX = 0, eyeY = 0;
    if (st.viewer) {   // look at the player: turn the head part of the way, the eyes the rest
      var vx = st.viewer[0] - base[12], vy = st.viewer[1] - (base[13] + hy), vz = st.viewer[2] - base[14];
      var yaw = Math.max(-0.7, Math.min(0.7, Math.atan2(vx, vz))), pitch = Math.max(-0.4, Math.min(0.4, -Math.atan2(vy, Math.hypot(vx, vz))));
      var avoid = st.mood === 'nervous' ? 0.5 : 0;   // nervous suspects keep glancing away
      ry = ry * 0.4 + yaw * 0.55 + avoid * Math.sin(t * 0.9 + ph) * 0.35; rx = rx * 0.5 + pitch * 0.5 + slump * 0.2;
      eyeX = Math.max(-0.006, Math.min(0.006, yaw * 0.012)); eyeY = Math.max(-0.004, Math.min(0.004, -pitch * 0.01));
    }
    if (st.react) {
      var e = st.react.e, k = Math.max(0, 1 - e / 1.3);
      if (st.react.type === 'shake') ry += Math.sin(e * 20) * 0.4 * k;
      else if (st.react.type === 'nod') rx += Math.sin(e * 12) * 0.25 * k;
      else if (st.react.type === 'smirk') rz += Math.sin(e * 4) * 0.15 * k;
    }
    var head = M.mul(base, P(0, hy, slump * 0.04, rx, ry, rz, 1));
    function H(mesh, l, col, em, extra) { add(mesh, M.mul(head, l), col, em, extra); }
    if (REAL) {
      var eyesR = realHead(H, L, st, t, ph, st.mood || 'calm', eyeX, eyeY);
      if (L.female) [-1, 1].forEach(function (sd) { var ep = root.Faces.facePoint(sd * 0.99, -0.22, 1); H('sphere', P(ep[0] + sd * 0.006, ep[1] - 0.012, ep[2], 0, 0, 0, 0.012), [0.95, 0.75, 0.25, 1], [0.1, 0.07, 0]); });
      if (L.cap) { H('hair_short', P(0, 0.006, -0.002, 0, 0, 0, 1.06, 1.05, 1.05), c4(L.cap), null, { tex: root.Faces.fabric() }); H('box', P(0, 0.064, 0.1, -0.1, 0, 0, 0.12, 0.005, 0.06), c4(shade(L.cap, 0.8))); }
      if (L.bindi) { var bd = root.Faces.facePoint(0, 0.33, 1); H('sphere', P(bd[0], bd[1], bd[2] + 0.001, 0, 0, 0, 0.0075, 0.0075, 0.003), [0.75, 0.08, 0.1, 1]); }
      if (L.glasses) {
        eyesR.forEach(function (c, i) {
          var sd = i ? 1 : -1, z = c[2] + 0.022;
          H('box', P(c[0], c[1], z, 0, 0, 0, 0.046, 0.032, 0.002), [0.6, 0.7, 0.8, 0.22]);
          H('box', P(c[0], c[1] + 0.017, z, 0, 0, 0, 0.05, 0.004, 0.004), [0.07, 0.07, 0.08, 1]);
          H('box', P(c[0], c[1] - 0.017, z, 0, 0, 0, 0.05, 0.0025, 0.003), [0.07, 0.07, 0.08, 1]);
          [-1, 1].forEach(function (e) { H('box', P(c[0] + e * 0.025, c[1], z, 0, 0, 0, 0.003, 0.034, 0.003), [0.07, 0.07, 0.08, 1]); });
          H('box', P(c[0] + sd * 0.03, c[1] + 0.012, z - 0.045, 0, 0, 0, 0.003, 0.004, 0.09), [0.07, 0.07, 0.08, 1]);
        });
        H('box', P(0, eyesR[0][1] + 0.006, eyesR[0][2] + 0.023, 0, 0, 0, 0.02, 0.004, 0.004), [0.07, 0.07, 0.08, 1]);
      }
      if (st.sweat) { var dd = (t * 0.6 + ph) % 1, sp = root.Faces.facePoint(0.55, 0.3 - dd * 0.25, L.female ? 1 : 0); H('sphere', P(sp[0], sp[1], sp[2] + 0.003, 0, 0, 0, 0.007, 0.011, 0.005), [0.8, 0.92, 1, 0.75]); }
      return;
    }
    H('sphere', P(0, 0, 0, 0, 0, 0, 0.165, 0.225, 0.19), c4(skin));
    [-1, 1].forEach(function (sd) { H('sphere', P(sd * 0.084, 0, -0.005, 0, 0, 0, 0.03, 0.055, 0.035), c4(shade(skin, 0.95))); });
    // hair
    var hs = L.style || 'short';
    if (hs !== 'bald') {
      H('sphere', P(0, 0.06, -0.012, 0, 0, 0, 0.176, 0.135, 0.2), c4(hair));
      H('sphere', P(0, 0.015, -0.055, 0, 0, 0, 0.172, 0.18, 0.12), c4(hair));
    } else H('sphere', P(0, -0.005, -0.06, 0, 0, 0, 0.17, 0.12, 0.1), c4(hair));
    if (hs === 'long') {
      H('box', P(0, -0.12, -0.07, 0, 0, 0, 0.19, 0.3, 0.07), c4(hair));
      [-1, 1].forEach(function (sd) { H('box', P(sd * 0.086, -0.07, -0.005, 0, 0, 0, 0.035, 0.22, 0.09), c4(hair)); });
    }
    if (hs === 'bun') { H('sphere', P(0, 0.1, -0.115, 0, 0, 0, 0.1), c4(hair)); H('cyl', P(0, 0.075, -0.1, 0.9, 0, 0, 0.11, 0.012, 0.11), c4(shade(hair, 0.7))); }
    if (L.female) {
      // earrings and rosier lips
      [-1, 1].forEach(function (sd) {
        H('sphere', P(sd * 0.088, -0.045, 0.0, 0, 0, 0, 0.014), [0.95, 0.75, 0.25, 1]);
      });
    }
    if (L.cap) { H('sphere', P(0, 0.07, -0.01, 0, 0, 0, 0.182, 0.13, 0.205), c4(L.cap)); H('box', P(0, 0.06, 0.1, -0.12, 0, 0, 0.15, 0.008, 0.09), c4(shade(L.cap, 0.8))); }
    if (L.bindi) H('sphere', P(0, 0.045, 0.097, 0, 0, 0, 0.01, 0.01, 0.004), [0.75, 0.08, 0.1, 1]);
    // eyes (blink), brows (mood), nose, mouth (talk), beard, glasses
    var blink = ((t + ph * 3.1) % 3.9) < 0.13 ? 0.12 : 1;
    var mood = st.mood || 'calm', inner = mood === 'angry' ? -0.32 : mood === 'nervous' || mood === 'sad' ? 0.32 : mood === 'smug' ? -0.1 : 0;
    [-1, 1].forEach(function (sd) {
      var lookX = st.viewer ? eyeX : Math.sin(t * 0.45 + ph * 2) * -0.004;
      H('sphere', P(sd * 0.037, 0.022, 0.083, 0, 0, 0, 0.036, 0.024 * blink, 0.018), [0.97, 0.97, 0.96, 1]);
      H('sphere', P(sd * 0.037 + lookX, 0.022 + eyeY, 0.09, 0, 0, 0, 0.016, 0.016 * blink, 0.01), [0.12, 0.08, 0.06, 1]);
      H('sphere', P(sd * 0.037 + lookX + 0.004, 0.026 + eyeY, 0.0945, 0, 0, 0, 0.004, 0.004 * blink, 0.002), [1, 1, 1, 1], null, { unlit: 1 });   // catch-light
      H('box', P(sd * 0.038, 0.056 + (mood === 'nervous' ? 0.006 : 0), 0.088, 0, 0, -sd * inner, 0.046, 0.009, 0.01), c4(shade(hair, 0.9)));
    });
    H('sphere', P(0, -0.01, 0.094, 0, 0, 0, 0.025, 0.04, 0.03), c4(shade(skin, 0.93)));
    var talk = st.talk || 0, lip = L.female ? [0.62, 0.2, 0.24, 1] : [0.42, 0.16, 0.14, 1];
    if (talk > 0.05) {
      H('box', P(0, -0.062, 0.088, 0, 0, 0, 0.045, 0.008 + 0.03 * talk, 0.012), [0.2, 0.05, 0.05, 1]);
      H('box', P(0, -0.062 + 0.004 + 0.015 * talk, 0.092, 0, 0, 0, 0.05, 0.006, 0.006), lip);
    } else {
      var curve = mood === 'smug' ? 0.28 : mood === 'sad' || mood === 'nervous' ? -0.25 : mood === 'angry' ? -0.12 : 0.05;
      [-1, 1].forEach(function (sd) { H('box', P(sd * 0.013, -0.062, 0.09, 0, 0, sd * curve, 0.028, 0.008, 0.01), lip); });
    }
    if (L.beard) {
      H('sphere', P(0, -0.075, 0.035, 0, 0, 0, 0.15, 0.1, 0.13), c4(hair));
      [-1, 1].forEach(function (sd) { H('box', P(sd * 0.013, -0.04, 0.093, 0, 0, sd * 0.18, 0.03, 0.01, 0.012), c4(hair)); });
    }
    if (L.moustache) [-1, 1].forEach(function (sd) { H('box', P(sd * 0.013, -0.04, 0.093, 0, 0, sd * 0.18, 0.03, 0.01, 0.012), c4(hair)); });
    if (L.glasses) {
      [-1, 1].forEach(function (sd) {
        H('box', P(sd * 0.038, 0.022, 0.104, 0, 0, 0, 0.052, 0.036, 0.003), [0.55, 0.65, 0.75, 0.3]);
        H('box', P(sd * 0.038, 0.041, 0.105, 0, 0, 0, 0.054, 0.006, 0.006), [0.08, 0.08, 0.09, 1]);
        H('box', P(sd * 0.038, 0.003, 0.105, 0, 0, 0, 0.054, 0.004, 0.005), [0.08, 0.08, 0.09, 1]);
        H('box', P(sd * 0.073, 0.03, 0.06, 0, 0, 0, 0.004, 0.005, 0.09), [0.08, 0.08, 0.09, 1]);
      });
      H('box', P(0, 0.027, 0.106, 0, 0, 0, 0.022, 0.005, 0.005), [0.08, 0.08, 0.09, 1]);
    }
    if (st.sweat) {
      var d = (t * 0.6 + ph) % 1;
      H('sphere', P(0.07, 0.07 - d * 0.08, 0.075, 0, 0, 0, 0.012, 0.018, 0.012), [0.75, 0.9, 1, 0.8]);
    }
  }

  root.People = { drawPerson: drawPerson };
})(this);
