const C = require('../src/cases.js'), S = require('../src/stories.js'), assert = require('assert');
assert.strictEqual(S.length, 5);
S.forEach(s => {
  assert(s.evidence.length >= 3);
  s.evidence.forEach(id => {
    const m = C.BY_ID[id]; assert(m, id); assert(m.story);
    const seg = C.segments(m.body).filter(x => x.key).map(x => x.key);
    seg.forEach(k => assert(m.clues[k], id + ' missing clue ' + k));
    Object.keys(m.clues).forEach(k => assert(k === 'from' || (k === 'action' && m.action) || seg.includes(k), id + ' clue not in body ' + k));
    if (m.scam) assert(C.redFlags(m).length >= 2, id); else assert.strictEqual(C.redFlags(m).length, 0, id);
    Object.values(m.clues).forEach(c => assert(c.note.length <= 110, id + ' note ' + c.note.length));
    assert(m.why.length <= 120 && m.tip.length <= 100, id + ' why/tip long');
  });
  assert(s.evidence.some(id => C.BY_ID[id].scam) && s.evidence.some(id => !C.BY_ID[id].scam), s.id + ' needs both kinds');
  s.questions.forEach(q => { assert.strictEqual(q.options.length, 3); assert(q.answer >= 0 && q.answer < 3); assert(q.why.length <= 140, s.id + ' qwhy ' + q.why.length); q.options.forEach(o => assert(o.length <= 95, s.id + ' option long ' + o.length)); });
  assert(s.story.length <= 260, s.id + ' story ' + s.story.length); assert(s.ending.length <= 200, s.id + ' ending ' + s.ending.length);
});
// story evidence must never appear in daily cases
for (let i = 0; i < 400; i++) C.dailyCase(C.dateKey(new Date(2026, 9, 1 + i))).ids.forEach(id => assert(!C.BY_ID[id].story));
for (let i = 0; i < 300; i++) assert(!C.BY_ID[C.trainingPick([], i * 7919 + 1)].story);
console.log('OK stories', S.map(s => s.title).join(' | '));
