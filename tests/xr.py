from playwright.sync_api import sync_playwright
url = 'file:///home/claude/scam-detective/dist/index.html'
CARDPT = """((px, py) => M3.point(game.boardMat, M3.point(game.cardLocal, [px/720 - 0.5, 0.5 - py/900, 0])))"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.add_init_script(path='/home/claude/scam-detective/tests/xrmock.js')
    pg.goto(url); pg.wait_for_timeout(500)
    for btn in ['#btn-ar', '#btn-vr']:
        pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(400)
        pg.click(btn); pg.wait_for_timeout(300); pg.evaluate("__xr.step(3)"); pg.evaluate('game.openDaily()'); pg.wait_for_timeout(700); pg.evaluate("__xr.step(2)")
        r = pg.evaluate("""(() => { const P = """ + CARDPT + """;
          const bt = game.cardButtons.find(b => b.id === 'link'); const cx = bt.x + bt.w/2, cy = bt.y + bt.h/2;
          // poke: approach from in front of the card, then push through
          const front = M3.point(game.boardMat, M3.point(game.cardLocal, [cx/720-0.5, 0.5-cy/900, 0.05]));
          const back = M3.point(game.boardMat, M3.point(game.cardLocal, [cx/720-0.5, 0.5-cy/900, -0.005]));
          __xr.hands.right.pos['index-finger-tip'] = front; __xr.step(2);
          __xr.hands.right.pos['index-finger-tip'] = back; __xr.step(2);
          const flagged = game.cur.flagged.slice();
          __xr.hands.right.pos['index-finger-tip'] = [0.3, -0.1, -0.1]; __xr.step(2);
          // poke the SCAM stamp knob from above
          const top = M3.point(game.boardMat, [0.085, 0.2, 0.105]), knob = M3.point(game.boardMat, [0.085, 0.09, 0.105]);
          __xr.hands.right.pos['index-finger-tip'] = top; __xr.step(2); __xr.hands.right.pos['index-finger-tip'] = knob; __xr.step(2);
          return { flagged, mode: game.xr.mode }; })()""")
        pg.wait_for_timeout(400); pg.evaluate("__xr.step(2)")
        st = pg.evaluate("({state: game.state, correct: game.lastRes && game.lastRes.correct})")
        # pinch-ray at the Next button
        r2 = pg.evaluate("""(() => { const nb = game.infoButtons.find(b => b.id === 'next'); const u = (nb.x+nb.w/2)/840-0.5, v = 0.5-(nb.y+nb.h/2)/1000;
          const target = M3.point(game.boardMat, M3.point(game.infoLocal, [u, v, 0]));
          __xr.hands.right.pos['index-finger-tip'] = [0.3, -0.1, -0.1];
          __xr.ray.left = M3.invert(M3.lookAt([-0.15, -0.2, -0.05], target, [0,1,0])); __xr.hands.left.pos['index-finger-tip'] = [-0.15,-0.2,-0.05];
          __xr.step(2); const hit = game.pointers['left-hand'].hit; __xr.fire('select', 'left');
          return hit && JSON.stringify({type: hit.type, panel: hit.panel, box: hit.box, b: hit.button && hit.button.id, t: hit.t}); })()""")
        pg.wait_for_timeout(1300); pg.evaluate("__xr.step(3)")
        print(btn, r, st, 'ray->', r2, 'now idx', pg.evaluate("[game.cur.idx, game.msg.id, game.state]"))
        r3 = pg.evaluate("""(async () => { const g = game, w = ms => new Promise(r => setTimeout(r, ms));
          g.startInv(0, true); g.invButton('toscene'); __xr.step(3);
          const s = [-0.25, 0.13];  // phone in slot 1
          __xr.hands.right.pos['index-finger-tip'] = M3.point(g.boardMat, [s[0], 0.1, s[1]]); __xr.step(2);
          __xr.hands.right.pos['index-finger-tip'] = M3.point(g.boardMat, [s[0], 0.008, s[1]]); __xr.step(2);
          __xr.hands.right.pos['index-finger-tip'] = [0.3, -0.1, -0.1]; __xr.step(2);
          const opened = g.cur.open; await w(700); __xr.step(3);
          const poke = async id => { const b = g.cardButtons.find(x => x.id === id); const px = (b.x + b.w/2)/720-0.5, py = 0.5-(b.y + b.h/2)/900;
            __xr.hands.right.pos['index-finger-tip'] = M3.point(g.boardMat, M3.point(g.cardLocal, [px, py, 0.05])); __xr.step(2);
            __xr.hands.right.pos['index-finger-tip'] = M3.point(g.boardMat, M3.point(g.cardLocal, [px, py, -0.005])); __xr.step(2);
            __xr.hands.right.pos['index-finger-tip'] = M3.point(g.boardMat, M3.point(g.cardLocal, [px, py, 0.05])); __xr.step(2); await w(80); __xr.step(1); };
          const locked = g._isLocked(g._item('phone'));
          for (const k of ['k1', 'k6', 'k0', 'k8', 'kok']) await poke(k);
          const unlockedByFinger = !g._isLocked(g._item('phone')); await w(300); __xr.step(3);
          const bt = g.cardButtons.find(b => b.id === 'arrest'); const cx = bt.x + bt.w/2, cy = bt.y + bt.h/2;
          __xr.hands.right.pos['index-finger-tip'] = M3.point(g.boardMat, M3.point(g.cardLocal, [cx/720-0.5, 0.5-cy/900, 0.05])); __xr.step(2);
          __xr.hands.right.pos['index-finger-tip'] = M3.point(g.boardMat, M3.point(g.cardLocal, [cx/720-0.5, 0.5-cy/900, -0.005])); __xr.step(2);
          return {opened, locked, unlockedByFinger, found: g.cur.found}; })()""")
        print('  investigation poke ->', r3)
        r4 = pg.evaluate("""(async () => { const g = game, w = ms => new Promise(r => setTimeout(r, ms)), H = __xr.hands.right.pos;
          const s = [0.19, 0.12];  // notebook (slot 4)
          const P = (x, y, z) => M3.point(g.boardMat, [x, y, z]);
          H['index-finger-tip'] = P(s[0] + 0.006, 0.03, s[1]); H['thumb-tip'] = P(s[0] - 0.006, 0.03, s[1]); __xr.step(3);
          const heldWhilePinching = g.cur.held, openNow = g.cur.open;
          H['index-finger-tip'] = P(s[0] + 0.006, 0.2, s[1] - 0.1); H['thumb-tip'] = P(s[0] - 0.006, 0.2, s[1] - 0.1); __xr.step(3);
          const followY = g._held && +g._held.pos[1].toFixed(2);
          H['thumb-tip'] = P(s[0] - 0.08, 0.2, s[1] - 0.1); __xr.step(2);   // open fingers = release
          const afterRelease = [g.cur.held];
          // pinch the magnifying glass
          H['index-finger-tip'] = P(-0.345 + 0.006, 0.02, 0.2); H['thumb-tip'] = P(-0.345 - 0.006, 0.02, 0.2); __xr.step(3);
          const mag = g.cur.magnify; H['thumb-tip'] = P(-0.42, 0.1, 0.2); __xr.step(2);
          return {heldWhilePinching, openNow, followY, afterRelease, magWhileHeld: mag, magAfter: g.cur.magnify}; })()""")
        print('  pinch-grab ->', r4)
        # hands-on: swipe a document like a highlighter, pull the board string, pinch-and-slam an evidence card
        r5 = pg.evaluate("""(async () => { const g = game, w = ms => new Promise(r => setTimeout(r, ms)), H = __xr.hands.right.pos;
          const P = (x, y, z) => M3.point(g.boardMat, [x, y, z]);
          const onPanel = (loc, cw, ch, px, py, z) => M3.point(g.boardMat, M3.point(loc, [px / cw - 0.5, 0.5 - py / ch, z]));
          H['thumb-tip'] = P(0.3, 0.3, 0.3);
          g.startInv(1, true); g._invStage('scene'); __xr.step(2); g.invInspect('cctv'); await w(700); __xr.step(3);
          const b = g.cardButtons.find(x => x.id === 'blue');
          H['index-finger-tip'] = onPanel(g.cardLocal, 720, 900, b.x + 10, b.y + 25, 0.04); __xr.step(2);
          for (let k = 0; k <= 8; k++) { H['index-finger-tip'] = onPanel(g.cardLocal, 720, 900, b.x + 10 + (b.w - 20) * k / 8, b.y + 25, -0.004); __xr.step(1); }
          H['index-finger-tip'] = onPanel(g.cardLocal, 720, 900, b.x + b.w - 10, b.y + 25, 0.05); __xr.step(2);
          const swipe = [g.cur.found.slice(), (g.cur.marks && g.cur.marks.cctv || []).length];
          const v = Investigations[1]; g.cur.found = Object.keys(v.evidence); g._invStage('board'); await w(400); __xr.step(3);
          const q = g.boardButtons.find(x => x.id === 'q'), e = g.boardButtons.find(x => x.id === 'ev:' + v.board[0].answer);
          H['index-finger-tip'] = onPanel(g.boardLocal, 1200, 785, q.x + 170, q.y + 120, 0.04); __xr.step(2);
          for (let k = 0; k <= 8; k++) { const t = k / 8; H['index-finger-tip'] = onPanel(g.boardLocal, 1200, 785, q.x + 170 + (e.x + e.w / 2 - q.x - 170) * t, q.y + 120 + (e.y + e.h / 2 - q.y - 120) * t, -0.004); __xr.step(1); }
          const pulling = !!g.cur.strEnd;
          H['index-finger-tip'] = onPanel(g.boardLocal, 1200, 785, e.x + e.w / 2, e.y + e.h / 2, 0.05); __xr.step(2);
          const string = [pulling, g.cur.bdone];
          g.cur.ldone = true; g.cur.si = 0; g.cur.sdone = false; g._invStage('interro'); await w(300); __xr.step(3);
          const want = v.suspect.statements[0].contradict[0], s0 = g._evcSlot(want);
          H['index-finger-tip'] = P(s0[0] + 0.006, 0.02, s0[2]); H['thumb-tip'] = P(s0[0] - 0.006, 0.02, s0[2]); __xr.step(3);
          const carrying = g.cur.carry && g.cur.carry.id;
          H['index-finger-tip'] = P(0.006, 0.1, -0.1); H['thumb-tip'] = P(-0.006, 0.1, -0.1); __xr.step(3);
          H['thumb-tip'] = P(-0.09, 0.15, -0.1); __xr.step(2); await w(450); __xr.step(3);
          return { swipe, string, carrying, slammed: g.cur.sdone }; })()""")
        print('  hands-on ->', r5)
        pg.screenshot(path=f'/home/claude/scam-detective/tests/shots/xr_{btn[5:]}.png')
        pg.evaluate("game.xr.session.end()")
    print('ERRORS', errs)
    b.close()
