const C = require('../src/cases.js'), INV = require('../src/investigations.js'), assert = require('assert');
INV.forEach(v => {
  const evIds = Object.keys(v.evidence), found = new Set(), slots = new Set();
  v.items.forEach(it => {
    assert(!slots.has(it.slot), v.id + ' dup slot'); slots.add(it.slot);
    const keys = C.segments(it.body).filter(s => s.key).map(s => s.key);
    keys.forEach(k => assert(it.clues[k], v.id + '/' + it.id + ' no clue ' + k));
    Object.keys(it.clues).forEach(k => assert(keys.includes(k), v.id + '/' + it.id + ' unused clue ' + k));
    Object.values(it.clues).forEach(c => { if (c.ev) { assert(v.evidence[c.ev], 'bad ev ' + c.ev); found.add(c.ev); } assert(c.note.length <= 95, it.id + ' note ' + c.note.length); });
  });
  assert.deepStrictEqual([...found].sort(), evIds.sort(), v.id + ' every evidence must be findable');
  v.board.forEach(b => { assert(v.evidence[b.answer]); assert(b.why.length <= 120, 'board why ' + b.why.length); assert(b.q.length <= 70, 'board q ' + b.q.length); });
  // interrogation: optional partner (two rooms) whose true statements become testimony cards P1, P2...
  const S = v.suspect, P = S.partner, tags = new Set();
  assert(['classic', 'questions', 'pair'].includes(S.style), v.id + ' style');
  [S, P].filter(Boolean).forEach(X => { assert(X.tone && ['calm', 'tough'].includes(X.tone.prefers) && X.tone.mood && X.tone.calm && X.tone.tough, v.id + ' tone ' + X.id); assert(v.people[X.id], 'person ' + X.id); });
  if (S.style === 'pair') { assert(P, v.id + ' pair needs partner'); P.statements.forEach(s => { if (s.truth) { assert(/^P\d$/.test(s.tag) && s.short && s.short.length <= 60, v.id + ' testimony ' + s.say); tags.add(s.tag); } }); }
  const all = (P ? P.statements : []).concat(S.statements);
  all.forEach((s, i) => {
    if (!s.truth) { assert(s.contradict.length, v.id + ' lie needs proof'); s.contradict.forEach(e => assert(v.evidence[e] || (tags.has(e) && i >= (P ? P.statements.length : 0)), v.id + ' bad proof ' + e)); }
    assert(s.say.length <= 80, 'say ' + s.say.length); assert(s.why.length <= 120, 'why ' + s.why.length);
    if (S.style === 'questions' && S.statements.includes(s)) { assert(s.ask && s.ask.length <= 60, v.id + ' ask ' + s.ask); assert(s.alts.length === 2 && s.alts.every(a => a.q.length <= 50 && a.a.length <= 80), v.id + ' alts'); }
  });
  tags.forEach(t => assert(S.statements.some(s => !s.truth && s.contradict.includes(t)), v.id + ' unused testimony ' + t));
  assert(S.statements.filter(s => !s.truth).length >= 3, v.id + ' needs at least 3 lies');
  const PZ = v.puzzle; assert(PZ && ['timeline', 'torn', 'money', 'match'].includes(PZ.type) && PZ.title && PZ.intro && PZ.lesson, v.id + ' puzzle');
  if (PZ.type === 'match') assert(PZ.options.length === 3 && PZ.options.some(o => o.id === PZ.answer) && PZ.sample, v.id + ' match puzzle');
  else { assert(PZ.pieces.length >= 3 && PZ.pieces.length <= 5, v.id + ' pieces'); assert(PZ.pieces.length + (PZ.decoys || []).length <= 7, v.id + ' too many options'); if (PZ.type === 'money') assert(PZ.start, v.id + ' money start'); }
  Object.values(v.evidence).forEach(e => { assert(e.title.length <= 26, 'ev title ' + e.title); assert(e.text.length <= 50, 'ev text ' + e.text.length + ' ' + e.text); });
  assert.strictEqual(v.lineup.ids.length, 3); assert(v.lineup.ids.includes(v.lineup.culprit)); assert.strictEqual(v.suspect.id, v.lineup.culprit);
  v.lineup.ids.forEach(id => { assert(v.people[id], 'person ' + id); if (id !== v.lineup.culprit) { assert(v.lineup.alibis[id].say.length <= 90, 'alibi say ' + id); assert(v.lineup.alibis[id].why.length <= 110, 'alibi why ' + id + ' ' + v.lineup.alibis[id].why.length); } });
    assert(v.brief.length <= 230, v.id + ' brief ' + v.brief.length);
  assert(v.ending.length <= 180, v.id + ' ending ' + v.ending.length);
});
console.log('OK', INV.map(v => v.title).join(' | '));
