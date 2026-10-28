# Plays the hands-on interactions with real mouse drags: highlighter swipe, pulling the red string, slamming evidence cards.
from playwright.sync_api import sync_playwright
import os
url = 'file:///home/claude/scam-detective/dist/index.html'; out = '/home/claude/scam-detective/tests/shots/'
src = open('/home/claude/scam-detective/tests/inv_play.py').read()
PANEL = src.split('PANEL = """')[1].split('"""')[0]; PT = src.split('PT = """')[1].split('"""')[0]
def drag(pg, pts, steps=6):
    pg.mouse.move(*pts[0]); pg.wait_for_timeout(60); pg.mouse.down()
    for a, b in zip(pts, pts[1:]):
        for k in range(1, steps + 1): pg.mouse.move(a[0] + (b[0] - a[0]) * k / steps, a[1] + (b[1] - a[1]) * k / steps); pg.wait_for_timeout(25)
    pg.wait_for_timeout(80); pg.mouse.up(); pg.wait_for_timeout(250)
def settle(pg):
    for _ in range(30):
        if pg.evaluate('game.anim.card >= 1'): break
        pg.wait_for_timeout(100)
    pg.wait_for_timeout(300)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(url); pg.wait_for_timeout(400)
    if os.environ.get('LANG_HI'): pg.click('#btn-lang')
    pg.click('#btn-flat'); pg.wait_for_timeout(400)
    pg.evaluate("game.startInv(1, true); game._invStage('scene')"); pg.wait_for_timeout(900)
    # 1. highlighter: open the CCTV printout and swipe across its first line
    pg.evaluate("game.invInspect('cctv')"); settle(pg)
    r = pg.evaluate("game.cardButtons.filter(b => b.id === 'blue')[0]")
    a = pg.evaluate(PANEL + f"(['card', {r['x'] + 10}, {r['y'] + r['h']/2}])"); z = pg.evaluate(PANEL + f"(['card', {r['x'] + r['w'] - 10}, {r['y'] + r['h']/2}])")
    drag(pg, [a, z])
    res1 = pg.evaluate("[game.cur.found.slice(), (game.cur.marks && game.cur.marks.cctv || []).length]")
    pg.screenshot(path=out + 'ho1_highlight.png'); print('highlighter ->', res1)
    assert 'E3' in res1[0] and res1[1] == 1
    # 2. string: on the board, pull the string from the question to the right evidence
    pg.evaluate("(() => { const c = game.cur, v = Investigations[1]; c.found = Object.keys(v.evidence); game._invStage('board'); })()"); pg.wait_for_timeout(1500)
    for _ in range(40):
        if pg.evaluate("!!(game.boardButtons && game.boardButtons.find(b => b.id === 'q'))"): break
        pg.wait_for_timeout(250)
    q = pg.evaluate("game.boardButtons.find(b => b.id === 'q')"); ans = pg.evaluate("Investigations[1].board[0].answer")
    e = pg.evaluate(f"game.boardButtons.find(b => b.id === 'ev:{ans}')")
    qa = pg.evaluate(PANEL + f"(['board', {q['x'] + 170}, {q['y'] + 120}])"); ea = pg.evaluate(PANEL + f"(['board', {e['x'] + e['w']/2}, {e['y'] + e['h']/2}])")
    mid = [(qa[0] + ea[0]) / 2 + 30, (qa[1] + ea[1]) / 2]
    pg.mouse.move(*qa); pg.mouse.down()
    for k in range(1, 7): pg.mouse.move(qa[0] + (mid[0] - qa[0]) * k / 6, qa[1] + (mid[1] - qa[1]) * k / 6); pg.wait_for_timeout(40)
    pg.wait_for_timeout(500); pg.screenshot(path=out + 'ho2_string_pull.png')
    for k in range(1, 7): pg.mouse.move(mid[0] + (ea[0] - mid[0]) * k / 6, mid[1] + (ea[1] - mid[1]) * k / 6); pg.wait_for_timeout(40)
    pg.mouse.up(); pg.wait_for_timeout(600)
    res2 = pg.evaluate("[game.cur.bdone, game.cur.strEnd]"); print('string ->', res2); assert res2[0] is True
    # 3. interrogation: slam cards
    pg.evaluate("(() => { const c = game.cur; c.ldone = true; c.si = 0; c.sdone = false; game._invStage('interro'); })()"); pg.wait_for_timeout(1500)
    pg.screenshot(path=out + 'ho3_cards.png')
    st = pg.evaluate("Investigations[1].suspect.statements.map(s => s.truth ? 'believe' : s.contradict[0])")
    for si, want in enumerate(st):
        pg.evaluate("(() => { if (game.cur.iphase === 'ask') game.invButton('ask:' + game._askOpts().findIndex(o => o.k === 'good')); })()"); pg.wait_for_timeout(600)
        s = pg.evaluate(f"game._evcSlot('{want}')")
        src_xy = pg.evaluate(PT + f"([{s[0]}, 0.006, {s[2]}])"); dst_xy = pg.evaluate(PT + f"([0, 0.06, -0.1])")
        drag(pg, [src_xy, dst_xy], 8); pg.wait_for_timeout(700)
        if si == 0: pg.screenshot(path=out + 'ho4_slam.png')
        print(' statement', si, want, '->', pg.evaluate('[game.cur.sdone, game.cur.swrong]'))
        assert pg.evaluate('game.cur.sdone') is True
        pg.evaluate("game.invButton('snext')"); pg.wait_for_timeout(900)
    print('state', pg.evaluate('game.state'))
    print('ERRORS', errs); b.close()
