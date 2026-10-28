# Switches to Hindi and walks through screens, reporting untranslated UI strings and errors.
import json, sys
from playwright.sync_api import sync_playwright
url = 'file:///home/claude/scam-detective/dist/index.html'; out = 'tests/shots/'
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    # record every string drawn on a canvas so we can spot English left over in Hindi mode
    pg.add_init_script("""window.__drawn = new Set(); const f = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (s, x, y, m) { try { window.__drawn.add(String(s)); } catch (e) {} return f.call(this, s, x, y, m); };""")
    pg.goto(url); pg.wait_for_timeout(500)
    pg.click('#btn-lang'); pg.wait_for_timeout(300); pg.evaluate('window.__drawn.clear()')
    print('lang', pg.evaluate('[I18N.lang, document.getElementById("btn-flat").textContent]'))
    pg.screenshot(path=out + 'h0_landing.png')
    pg.click('#btn-flat'); pg.wait_for_timeout(800); pg.screenshot(path=out + 'h1_menu.png')
    shots = []
    for i in range(pg.evaluate('Investigations.length')):
        pg.evaluate(f'game.startInv({i}, true)'); pg.wait_for_timeout(500)
        if i == 0: pg.screenshot(path=out + 'h2_brief.png')
        for st in ['scene', 'board', 'lineup', 'interro', 'confess', 'report', 'closed']:
            pg.evaluate(f"(()=>{{ const c = game.cur, v = Investigations[{i}]; c.found = Object.keys(v.evidence); c.ldone = st_ldone = true; c.si = 0; if ('{st}' === 'scene') c.open = v.items[1].id; game._invStage('{st}'); }})()".replace('st_ldone = ', ''))
            pg.wait_for_timeout(500)
            if i in (0, 2, 4, 5): pg.screenshot(path=out + f'h3_{i}_{st}.png')
    pg.evaluate('game.openCases()'); pg.wait_for_timeout(500); pg.screenshot(path=out + 'h4_story.png')
    pg.evaluate('game.openDaily(false)'); pg.wait_for_timeout(600); pg.screenshot(path=out + 'h5_daily.png')
    pg.evaluate('game.training()'); pg.wait_for_timeout(500)
    drawn = pg.evaluate('[...window.__drawn]')
    import re
    eng = sorted(set(s for s in drawn if re.search(r'[A-Za-z]{3,}', s) and not re.search(r'[ऀ-ॿ]', s)))
    print('MISSING UI', json.dumps(pg.evaluate('Object.keys(I18N.missing)'), ensure_ascii=False))
    print('ENGLISH-ONLY DRAWN', len(eng)); [print('  ', repr(s)) for s in eng[:80]]
    print('ERRORS', errs)
    b.close()
