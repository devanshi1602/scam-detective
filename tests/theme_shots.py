# Screenshots of every room in the bright and night looks.
import sys
from playwright.sync_api import sync_playwright
out = 'tests/shots/'
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file:///home/claude/scam-detective/dist/index.html'); pg.wait_for_timeout(400); pg.click('#btn-flat'); pg.wait_for_timeout(500)
    for theme in ['day', 'night']:
        pg.evaluate(f"game.settings.theme = '{theme}'; game.openMenu()"); pg.wait_for_timeout(700); pg.screenshot(path=out + f't_{theme}_menu.png')
        pg.evaluate('game.startInv(0, true)'); pg.wait_for_timeout(300)
        for st in ['scene', 'board', 'lineup', 'interro']:
            pg.evaluate(f"(()=>{{ const c = game.cur; c.ldone = true; c.si = 0; game._invStage('{st}'); }})()"); pg.wait_for_timeout(900)
            pg.screenshot(path=out + f't_{theme}_{st}.png')
        pg.evaluate('game.openDaily(false)'); pg.wait_for_timeout(900); pg.screenshot(path=out + f't_{theme}_daily.png')
    print('ERRORS', errs); b.close()
