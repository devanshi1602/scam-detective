from playwright.sync_api import sync_playwright
url = 'file:///home/claude/scam-detective/dist/index.html'
out = '/home/claude/scam-detective/tests/shots/'
exec(open('tests/play.py').read().split('def click')[0].split("out = ")[1].split('\n',1)[1])  # JS_PANEL, JS_PT
def click(pg, xy): pg.mouse.move(*xy); pg.wait_for_timeout(40); pg.mouse.down(); pg.mouse.up(); pg.wait_for_timeout(150)
def info_btn(pg, bid):
    for _ in range(25):
        b = pg.evaluate(f"game.infoButtons.find(b => b.id === '{bid}')")
        if b: break
        pg.wait_for_timeout(120)
    assert b, 'no button ' + bid + ' in state ' + pg.evaluate('game.state')
    click(pg, pg.evaluate(JS_PANEL + f"(['info', {b['x'] + b['w']/2}, {b['y'] + b['h']/2}])"))
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(url); pg.wait_for_timeout(500); pg.click('#btn-flat'); pg.wait_for_timeout(700)
    info_btn(pg, 'cases'); pg.wait_for_timeout(900)
    print('after cases:', pg.evaluate("[game.state, game.cur.mode, game.cur.caseIdx]")); pg.screenshot(path=out + 's1_intro.png')
    info_btn(pg, 'begin'); pg.wait_for_timeout(900)
    for k in range(3):
        st = pg.evaluate("({id: game.msg.id, scam: game.msg.scam, flags: Object.keys(game.msg.clues).filter(k => game.msg.clues[k].flag), btns: game.cardButtons.map(b => [b.id, b.x + b.w/2, b.y + b.h/2])})")
        done = set()
        for bid, x, y in st['btns']:
            if bid in st['flags'] and bid not in done: click(pg, pg.evaluate(JS_PANEL + f"(['card', {x}, {y}])")); done.add(bid)
        click(pg, pg.evaluate(JS_PT + f"([{0.085 if st['scam'] else 0.185}, 0.092, 0.105])")); pg.wait_for_timeout(500)
        print(' evidence', st['id'], pg.evaluate("[game.state, game.lastRes.correct, game.lastRes.points]"))
        info_btn(pg, 'next'); pg.wait_for_timeout(1100)
    print('solve state:', pg.evaluate("game.state")); pg.screenshot(path=out + 's2_board.png')
    info_btn(pg, 'opt1'); pg.wait_for_timeout(400)   # wrong answer on purpose for Q1 (answer is 0)
    print('Q1 ->', pg.evaluate("[game.state, game.cur.answers]")); pg.screenshot(path=out + 's3_answered.png')
    info_btn(pg, 'qnext'); pg.wait_for_timeout(300)
    info_btn(pg, 'opt1'); pg.wait_for_timeout(300); info_btn(pg, 'qnext'); pg.wait_for_timeout(900)
    print('closed:', pg.evaluate("[game.state, game.p.storyDone, game.p.badges]")); pg.screenshot(path=out + 's4_closed.png')
    pg.reload(); pg.wait_for_timeout(700); print('reload ->', pg.evaluate("[game.state, game.cur.mode]"))
    pg.click('#btn-flat'); pg.wait_for_timeout(300)
    info_btn(pg, 'cases'); pg.wait_for_timeout(700); print('next case ->', pg.evaluate("[game.state, game.cur.caseIdx]"))
    info_btn(pg, 'menu'); pg.wait_for_timeout(500); info_btn(pg, 'daily'); pg.wait_for_timeout(700); print('daily ->', pg.evaluate("[game.state, game.cur.mode, game.cur.idx]"))
    info_btn(pg, 'menu'); pg.wait_for_timeout(500); info_btn(pg, 'cases'); pg.wait_for_timeout(700); print('cases again ->', pg.evaluate("[game.state, game.cur.caseIdx]"))
    print('ERRORS', errs)
    b.close()
