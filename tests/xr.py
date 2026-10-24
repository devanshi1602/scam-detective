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
        pg.click(btn); pg.wait_for_timeout(300); pg.evaluate("__xr.step(3)"); pg.wait_for_timeout(700); pg.evaluate("__xr.step(2)")
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
        pg.screenshot(path=f'/home/claude/scam-detective/tests/shots/xr_{btn[5:]}.png')
        pg.evaluate("game.xr.session.end()")
    print('ERRORS', errs)
    b.close()
