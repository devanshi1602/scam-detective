from playwright.sync_api import sync_playwright
url = 'file:///home/claude/scam-detective/dist/index.html'
out = '/home/claude/scam-detective/tests/shots/'
# project a panel's canvas-pixel point (or a board-local point) to screen coords
JS_PANEL = """(([name, px, py]) => { const g = game; const loc = name === 'card' ? g.cardLocal : g.infoLocal; const cw = name==='card'?720:840, ch = name==='card'?900:1000;
  const wp = M3.point(g.boardMat, M3.point(loc, [px/cw - 0.5, 0.5 - py/ch, 0])); const vp = M3.mul(g.proj, g.view);
  const c = [0,1,2,3].map(r => vp[r]*wp[0]+vp[4+r]*wp[1]+vp[8+r]*wp[2]+vp[12+r]); const R = g.canvas.getBoundingClientRect();
  return [R.left + (c[0]/c[3]*0.5+0.5)*R.width, R.top + (0.5-c[1]/c[3]*0.5)*R.height]; })"""
JS_PT = """(([x,y,z]) => { const g = game; const wp = M3.point(g.boardMat, [x,y,z]); const vp = M3.mul(g.proj, g.view);
  const c = [0,1,2,3].map(r => vp[r]*wp[0]+vp[4+r]*wp[1]+vp[8+r]*wp[2]+vp[12+r]); const R = g.canvas.getBoundingClientRect();
  return [R.left + (c[0]/c[3]*0.5+0.5)*R.width, R.top + (0.5-c[1]/c[3]*0.5)*R.height]; })"""
def click(pg, xy): pg.mouse.move(*xy); pg.wait_for_timeout(40); pg.mouse.down(); pg.mouse.up(); pg.wait_for_timeout(120)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(url); pg.wait_for_timeout(700); pg.screenshot(path=out + '0_landing.png')
    pg.click('#btn-flat'); pg.wait_for_timeout(300); pg.evaluate('game.openDaily()'); pg.wait_for_timeout(900); pg.screenshot(path=out + '1_tutorial.png')
    for step in range(9):
        st = pg.evaluate("({state: game.state, id: game.msg.id, scam: game.msg.scam, idx: game.cur.idx, flags: Object.keys(game.msg.clues).filter(k => game.msg.clues[k].flag), btns: game.cardButtons.map(b => [b.id, b.x + b.w/2, b.y + b.h/2])})")
        if st['state'] == 'summary': break
        # mark: all real flags except one, plus wrongly mark nothing
        done = set()
        for bid, x, y in st['btns']:
            if bid in st['flags'][:-1] and bid not in done:
                click(pg, pg.evaluate(JS_PANEL + f"(['card', {x}, {y}])")); done.add(bid)
        if step == 1: pg.screenshot(path=out + '2_marked.png')
        sel = pg.evaluate("game.cur.flagged.slice()")
        # stamp correct verdict except on step 2 (deliberate mistake)
        which = 'scam' if st['scam'] else 'safe'
        if step == 2: which = 'safe' if st['scam'] else 'scam'
        sx = 0.085 if which == 'scam' else 0.185
        click(pg, pg.evaluate(JS_PT + f"([{sx}, 0.092, 0.105])")); pg.wait_for_timeout(500)
        v = pg.evaluate("({state: game.state, res: game.lastRes && {c: game.lastRes.correct, p: game.lastRes.points}})")
        print(step, st['id'], 'scam' if st['scam'] else 'real', 'marked', sel, 'stamped', which, '->', v)
        if step in (0, 2): pg.screenshot(path=out + f'3_verdict_{step}.png')
        for _ in range(40):
            nb = pg.evaluate("(game.infoButtons || []).find(b => b.id === 'next')")
            if nb: break
            pg.wait_for_timeout(200)
        pg.wait_for_timeout(300)
        click(pg, pg.evaluate(JS_PANEL + f"(['info', {nb['x'] + nb['w']/2}, {nb['y'] + nb['h']/2}])")); pg.wait_for_timeout(1100)
    pg.screenshot(path=out + '4_summary.png')
    print('final', pg.evaluate("({state: game.state, p: game.p, results: game.cur.results.length})"))
    pg.reload(); pg.wait_for_timeout(600); print('after reload', pg.evaluate("game.state"))
    print('ERRORS', errs)
    b.close()
