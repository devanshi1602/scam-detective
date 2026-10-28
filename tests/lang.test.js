// Checks the Hindi language pack: every translated entry matches the English structure, clue keys line up,
// nothing is left untranslated, and switching languages back and forth restores the English data exactly.
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
['math.js', 'cases.js', 'stories.js', 'investigations.js', 'i18n.js', 'lang/hi-ui.js', 'lang/hi-cases.js', 'lang/hi-stories.js', 'lang/hi-inv.js']
  .forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', f), 'utf8').replace(/typeof module !== 'undefined' && module\.exports/g, 'false'), ctx, { filename: f }));
const { I18N, Cases: C, Investigations: INV } = ctx;
const pack = I18N.packs.hi;
const keysOf = body => (body.match(/\[\[[^\]]*?\|([^\]]+)\]\]/g) || []).map(m => m.replace(/.*\|/, '').replace(']]', '')).sort().join(',');
// fields that stay as they are (numbers, ids, times, brand-like sender IDs)
const KEEP = new Set(['look', 'scene', 'hand', 'type', 'tag', 'prefers', 'style', 'source', 'report', 'lock', 'id', 'time', 'kind', 'slot', 'initial', 'badge', 'avatar', 'amount', 'type_', 'answer', 'culprit', 'ids', 'contradict', 'evidence_ids']);
let problems = [], untranslated = [];
function walk(en, hi, where, kind) {
  if (hi === undefined) return;
  if (typeof en === 'string') {
    if (typeof hi !== 'string') problems.push(where + ': expected string');
    else if (/\[\[/.test(en) && keysOf(en) !== keysOf(hi)) problems.push(where + ': clue keys differ ' + keysOf(en) + ' vs ' + keysOf(hi));
    return;
  }
  if (Array.isArray(en)) { if (!Array.isArray(hi)) problems.push(where + ': expected array'); else if (hi.length > en.length) problems.push(where + ': too many entries'); }
  Object.keys(hi).forEach(k => { if (!(k in en)) problems.push(where + '.' + k + ': not in English'); else walk(en[k], hi[k], where + '.' + k, kind); });
}
function coverage(en, hi, where, skip) {
  if (typeof en === 'string') { if ((hi === undefined || hi === null) && /[A-Za-z]{2,}/.test(en) && !skip(where, en)) untranslated.push(where); return; }
  if (en && typeof en === 'object') Object.keys(en).forEach(k => { if (!KEEP.has(k) && !(Array.isArray(en) && typeof en[k] === 'string' && where.endsWith('.evidence'))) coverage(en[k], hi && hi[k], where + '.' + k, skip); });
}
const SAME_OK = (where, s) => /^[a-z._]+$/.test(s) || /\.from$/.test(where) && /^[A-Za-z._]+$/.test(s) || /^[A-Za-z]+ <[^>]+>$/.test(s) || /^(\+?\d[\d ]*|[A-Z]{2,}-[A-Z]+|https?:\/\/\S+|[\w.-]+@[\w.-]+|AX-\w+|VM-\w+|JD-\w+)$/.test(s) || /\.(from|lost)$/.test(where) && /^[₹\d,+ ]+$/.test(s);
INV.forEach(v => { const h = pack.inv[v.id]; assert(h, 'missing hi inv ' + v.id); walk(v, h, v.id, 'inv'); coverage(v, h, v.id, SAME_OK); });
C.STORIES.forEach(s => { const h = pack.stories[s.id]; if (h) { walk(s, h, s.id, 'story'); coverage(s, h, s.id, SAME_OK); } else untranslated.push('story ' + s.id); });
C.MESSAGES.forEach(m => { const h = pack.messages[m.id]; if (h) { walk(m, h, m.id, 'msg'); coverage(m, h, m.id, SAME_OK); } else untranslated.push('message ' + m.id); });
Object.keys(pack.inv).forEach(id => assert(INV.some(v => v.id === id), 'unknown inv ' + id));
Object.keys(pack.stories).forEach(id => assert(C.STORIES.some(v => v.id === id), 'unknown story ' + id));
Object.keys(pack.messages).forEach(id => assert(C.BY_ID[id], 'unknown message ' + id));
// round trip
const before = JSON.stringify([C.MESSAGES, C.STORIES, INV]);
I18N.setLang('hi'); assert.strictEqual(INV[0].title, pack.inv.inv1.title); assert.strictEqual(C.segments(INV[0].items[0].body).filter(s => s.key).length, 5);
I18N.setLang('en'); assert.strictEqual(JSON.stringify([C.MESSAGES, C.STORIES, INV]), before, 'English restored exactly');
if (problems.length) { console.log('PROBLEMS\n ' + problems.join('\n ')); process.exit(1); }
if (untranslated.length) { console.log('UNTRANSLATED ' + untranslated.length + '\n ' + untranslated.slice(0, 60).join('\n ')); if (process.argv[2] !== '--loose') process.exit(1); }
console.log('OK hi pack', Object.keys(pack.ui).length, 'ui strings,', Object.keys(pack.messages).length, 'messages,', Object.keys(pack.stories).length, 'stories,', Object.keys(pack.inv).length, 'investigations');
