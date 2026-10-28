# Plays both investigations end-to-end with real mouse clicks on 3D objects and panels.
from playwright.sync_api import sync_playwright
import json, os
url = 'file:///home/claude/scam-detective/dist/index.html'
out = '/home/claude/scam-detective/tests/shots/'
PANEL = """(([name, px, py]) => { const g = game; const loc = name === 'card' ? g.cardLocal : name === 'info' ? g.infoLocal : g.boardLocal;
  const cw = name==='card'?720:name==='info'?840:1200, ch = name==='card'?900:name==='info'?1000:785;
  const wp = M3.point(g.boardMat, M3.point(loc, [px/cw - 0.5, 0.5 - py/ch, 0])); const vp = M3.mul(g.proj, g.view);
  const c = [0,1,2,3].map(r => vp[r]*wp[0]+vp[4+r]*wp[1]+vp[8+r]*wp[2]+vp[12+r]); const R = g.canvas.getBoundingClientRect();
  return [R.left + (c[0]/c[3]*0.5+0.5)*R.width, R.top + (0.5-c[1]/c[3]*0.5)*R.height]; })"""
PT = """(([x,y,z]) => { const g = game; const wp = M3.point(g.boardMat, [x,y,z]); const vp = M3.mul(g.proj, g.view);
  const c = [0,1,2,3].map(r => vp[r]*wp[0]+vp[4+r]*wp[1]+vp[8+r]*wp[2]+vp[12+r]); const R = g.canvas.getBoundingClientRect();
  return [R.left + (c[0]/c[3]*0.5+0.5)*R.width, R.top + (0.5-c[1]/c[3]*0.5)*R.height]; })"""
SLOTS = [[-0.25, -0.08], [-0.25, 0.13], [-0.06, 0.12], [0.07, 0.12], [0.19, 0.12], [0.32, 0.12]]
def click(pg, xy): pg.mouse.move(*xy); pg.wait_for_timeout(50); pg.mouse.down(); pg.mouse.up(); pg.wait_for_timeout(160)
def settle_panel(pg, panel):
    # wait until the panel texture has been redrawn and stopped changing, so button positions are current
    key = {'info': 'infoSig', 'card': 'cardSig', 'board': 'boardSig'}[panel]; last = None
    for _ in range(25):
        cur = pg.evaluate(f'[game.{key}, game.time]')
        if last and cur[0] == last[0] and cur[1] > last[1]: return
        last = cur; pg.wait_for_timeout(150)
def btn(pg, panel, bid):
    if panel != 'board': settle_panel(pg, panel)
    arr = 'infoButtons' if panel == 'info' else 'boardButtons' if panel == 'board' else 'cardButtons'
    for _ in range(20):
        b = pg.evaluate(f"(game.{arr} || []).find(b => b.id === {json.dumps(bid)})")
        if b: break
        pg.wait_for_timeout(150)
    assert b, f'no {panel} button {bid} in state ' + pg.evaluate('game.state')
    if panel == 'card':   # let the card finish sliding in, so its on-screen position is final
        for _ in range(30):
            if pg.evaluate('game.anim.card >= 1'): break
            pg.wait_for_timeout(100)
        pg.wait_for_timeout(250)
    click(pg, pg.evaluate(PANEL + f"(['{panel}', {b['x'] + b['w']/2}, {b['y'] + b['h']/2}])"))
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(url); pg.wait_for_timeout(500)
    if os.environ.get('LANG_HI'): pg.click('#btn-lang'); pg.wait_for_timeout(200); out = out + 'hi_'
    pg.click('#btn-flat'); pg.wait_for_timeout(800)
    print('start:', pg.evaluate('[game.state, game.cur.mode]')); pg.screenshot(path=out + 'i0_menu.png')
    for n in ([int(os.environ['INV_ONLY'])] if os.environ.get('INV_ONLY') else range(len(pg.evaluate('Investigations.map(v => v.id)')))):
        btn(pg, 'info', f'inv{n}'); pg.wait_for_timeout(700)
        if n == 0: pg.screenshot(path=out + 'i1_brief.png')
        btn(pg, 'info', 'toscene'); pg.wait_for_timeout(700)
        if n == 0: pg.screenshot(path=out + 'i2_scene.png')
        items = pg.evaluate("Investigations[game.cur.idx].items.map(it => { const seen = {}; return {id: it.id, lock: it.lock || null, slot: it.slot, kind: it.kind, ev: Object.keys(it.clues).filter(k => it.clues[k].ev && !seen[it.clues[k].ev] && (seen[it.clues[k].ev] = 1)), dead: Object.keys(it.clues).filter(k => !it.clues[k].ev && k.indexOf('h_') !== 0)}; })")
        for k, it in enumerate(items):
            sx, sz = SLOTS[it['slot']]
            click(pg, pg.evaluate(PT + f"([{sx}, 0.02, {sz}])")); pg.wait_for_timeout(600)
            opened = pg.evaluate('game.cur.open')
            assert opened == it['id'], f"clicked {it['id']} but opened {opened}"
            if it.get('lock'):
                pg.wait_for_timeout(500)
                if not os.environ.get('LANG_HI'): pg.screenshot(path=out + f'i3c_locked_{n}.png')
                for d in it['lock']: btn(pg, 'card', 'k' + d); pg.wait_for_timeout(60)
                btn(pg, 'card', 'kok'); pg.wait_for_timeout(400)
                assert it['id'] in pg.evaluate('game.cur.unlocked || []')
            if k == 0 and it['dead']: btn(pg, 'card', it['dead'][0])   # one dead end on purpose
            for key in it['ev']:
                if key.startswith('h_'):
                    # use the magnifying glass on the table (3D click), then tap the revealed clue
                    click(pg, pg.evaluate(PT + "([-0.345, 0.01, 0.2])")); pg.wait_for_timeout(300)
                    if n == 0: pg.screenshot(path=out + 'i3b_magnifier.png')
                    btn(pg, 'card', key); btn(pg, 'info', 'magnify')
                else: btn(pg, 'card', key)
                if os.environ.get('INV_ONLY'): print('   ', it['id'], key, pg.evaluate('[game.cur.found.join(","), game.cur.magnify, game.cur.open, game.state]'))
            if n == 0 and k == 1: pg.screenshot(path=out + 'i3_inspect.png')
        print(f' inv{n} evidence:', pg.evaluate('[game.cur.found.length, game.cur.points]'))
        btn(pg, 'info', 'toboard'); pg.wait_for_timeout(900)
        # the case puzzle: one wrong piece first, then every piece in order
        assert pg.evaluate('game.state') == 'puzzle', pg.evaluate('game.state')
        reals = pg.evaluate('game._pzOptions().map(o => o.real)')
        wrong = [k for k, r in enumerate(reals) if r != 0][0]; btn(pg, 'board', f'pz:{wrong}'); pg.wait_for_timeout(400)
        if n in (0, 1, 3, 4): pg.screenshot(path=out + f'i3p_puzzle_{n}.png')
        while not pg.evaluate('game.cur.pz.done'):
            k = reals.index(pg.evaluate('game.cur.pz.n')); btn(pg, 'board', f'pz:{k}'); pg.wait_for_timeout(300)
        print(f' inv{n} puzzle:', pg.evaluate('[game.cur.pz.done, game.cur.points]'))
        btn(pg, 'info', 'pznext'); pg.wait_for_timeout(700)
        board = pg.evaluate("Investigations[game.cur.idx].board.map(q => q.answer)")
        wrong_done = False
        for qi, ans in enumerate(board):
            if not wrong_done:
                other = [e for e in ['E1','E2','E3','E4','E5'] if e != ans][0]; btn(pg, 'board', 'ev:' + other); wrong_done = True
                if n == 0: pg.screenshot(path=out + 'i4_board_wrong.png')
            btn(pg, 'board', 'ev:' + ans); pg.wait_for_timeout(200)
            if n == 0 and qi == 1: pg.screenshot(path=out + 'i5_board.png')
            btn(pg, 'info', 'bnext'); pg.wait_for_timeout(500)
        print(f' inv{n} after board:', pg.evaluate('[game.state, game.cur.points]'))
        lu = pg.evaluate("(() => { const v = Investigations[game.cur.idx]; return {ids: v.lineup.ids, culprit: v.lineup.culprit}; })()")
        wrong = [i for i in lu['ids'] if i != lu['culprit']][0]
        if n == 0: pg.screenshot(path=out + 'i5b_lineup.png')
        # accuse by pointing at the 3D person (mouse ray), first the wrong one
        k = lu['ids'].index(wrong); click(pg, pg.evaluate(PT + f"([{[-0.5, 0, 0.5][k]}, 0.55, -1.3])")); pg.wait_for_timeout(500)
        print(f' inv{n} wrong accuse ->', pg.evaluate('[game.state, game.cur.lwrong, game.cur.ldone]'))
        if n == 0: pg.screenshot(path=out + 'i5c_lineup_wrong.png')
        btn(pg, 'info', 'acc:' + lu['culprit']); pg.wait_for_timeout(500)
        print(f' inv{n} right accuse ->', pg.evaluate('[game.state, game.cur.ldone]'))
        if n == 1: pg.screenshot(path=out + 'i5d_lineup_right.png')
        if n >= 2: pg.screenshot(path=out + f'i5e_lineup_{n}.png')
        btn(pg, 'info', 'tointerro'); pg.wait_for_timeout(700)
        steps = pg.evaluate("game._isteps().map(x => ({who: x.who, ask: !!x.S.ask, a: x.S.truth ? 'believe' : 'show:' + x.S.contradict[x.S.contradict.length - 1]}))")
        for si, stp in enumerate(steps):
            ph = pg.evaluate('game.cur.iphase')
            if ph == 'tone':
                pr = pg.evaluate('game._step().P.tone.prefers')
                if si == 0: btn(pg, 'info', 'tone:' + ('calm' if pr == 'tough' else 'tough')); pg.wait_for_timeout(300)   # wrong approach first
                if n == 0 and si == 0: pg.screenshot(path=out + 'i6a_tone.png')
                btn(pg, 'info', 'tone:' + pr); pg.wait_for_timeout(300); btn(pg, 'info', 'tonego'); pg.wait_for_timeout(400)
            if pg.evaluate('game.cur.iphase') == 'ask':
                if si == 0:   # a vague question first: it gets dodged
                    k = pg.evaluate("game._askOpts().findIndex(o => o.k !== 'good')"); btn(pg, 'info', f'ask:{k}'); pg.wait_for_timeout(300)
                    if n == 1: pg.screenshot(path=out + 'i6b_dodged.png')
                k = pg.evaluate("game._askOpts().findIndex(o => o.k === 'good')"); btn(pg, 'info', f'ask:{k}'); pg.wait_for_timeout(400)
            a = stp['a']
            if si == 0 and a != 'believe': btn(pg, 'info', 'believe'); pg.wait_for_timeout(300)
            btn(pg, 'info', a); pg.wait_for_timeout(500)
            if os.environ.get('INV_ONLY'): print('   stmt', si, stp['who'], a, pg.evaluate('[game.cur.sdone, game.cur.swrong, game.state, game.cur.iphase]'))
            assert pg.evaluate('game.cur.sdone') is True, f'statement {si} not resolved'
            if n == 0 and si == 0: pg.screenshot(path=out + 'i6_interro.png')
            if n >= 2 and si == len(steps) - 2: pg.screenshot(path=out + f'i6e_interro_{n}.png')
            btn(pg, 'info', 'snext'); pg.wait_for_timeout(600)
        print(f' inv{n} state:', pg.evaluate('game.state')); 
        if n == 1: pg.screenshot(path=out + 'i7_confess.png')
        btn(pg, 'info', 'charge'); pg.wait_for_timeout(800)
        assert pg.evaluate('game.state') == 'report', pg.evaluate('game.state')
        num = pg.evaluate("Investigations[game.cur.idx].report || '1930'")
        for d in '99': btn(pg, 'card', 'k' + d)
        btn(pg, 'card', 'kok'); pg.wait_for_timeout(200)
        assert pg.evaluate('game.cur.pinWrong') is True
        for d in num: btn(pg, 'card', 'k' + d); pg.wait_for_timeout(60)
        if n == 0: pg.screenshot(path=out + 'i7b_report.png')
        btn(pg, 'card', 'kok'); pg.wait_for_timeout(800)
        print(f' inv{n} closed:', pg.evaluate('[game.state, game.cur.points, game.cur.stars, game.p.badges]'))
        pg.screenshot(path=out + f'i8_closed_{n}.png')
        btn(pg, 'info', 'menu'); pg.wait_for_timeout(600)
    pg.screenshot(path=out + 'i9_menu_after.png')
    # other modes still reachable from the menu
    btn(pg, 'info', 'daily'); pg.wait_for_timeout(700); print('daily ->', pg.evaluate('[game.state, game.cur.mode]'))
    btn(pg, 'info', 'menu'); pg.wait_for_timeout(500); btn(pg, 'info', 'cases'); pg.wait_for_timeout(700); print('cases ->', pg.evaluate('[game.state, game.cur.mode]'))
    pg.reload(); pg.wait_for_timeout(600); print('reload ->', pg.evaluate('[game.state, game.p.invDone]'))
    print('ERRORS', errs)
    b.close()
