const C = require('../src/cases.js'), assert = require('assert');
C.MESSAGES.forEach(m => {
  const segKeys = C.segments(m.body).filter(s => s.key).map(s => s.key);
  const keys = C.clueKeys(m);
  segKeys.forEach(k => assert(m.clues[k], m.id + ' body key without clue: ' + k));
  keys.forEach(k => assert(k === 'from' || (k === 'action' && m.action) || segKeys.includes(k), m.id + ' clue not in body: ' + k));
  assert(m.clues.from || m.type === 'upi', m.id + ' needs a from clue');
  if (m.scam) assert(C.redFlags(m).length >= 2, m.id + ' scam needs 2+ flags');
  else assert.strictEqual(C.redFlags(m).length, 0, m.id + ' legit has flags');
  if (m.scam) assert(keys.length - C.redFlags(m).length >= 0);
  Object.values(m.clues).forEach(c => assert(c.note.length <= 110, m.id + ' note too long: ' + c.note.length));
  assert(m.why.length <= 120, m.id + ' why too long ' + m.why.length); assert(m.tip.length <= 100, m.id + ' tip too long ' + m.tip.length);
});
// scams should usually include at least one non-flag clue so tapping isn't a giveaway
const allFlag = C.MESSAGES.filter(m => m.scam && !m.tutorial && C.clueKeys(m).every(k => m.clues[k].flag)).map(m => m.id);
console.log('scams where every clue is a flag:', allFlag.join(','));
for (let i = 0; i < 400; i++) {
  const d = new Date(2026, 9, 1 + i), c = C.dailyCase(C.dateKey(d));
  assert.strictEqual(c.ids.length, 8); assert.strictEqual(new Set(c.ids).size, 8);
  assert.strictEqual(c.ids.filter(id => C.BY_ID[id].scam).length, 5); assert(C.BY_ID[c.ids[0]].scam);
}
assert.deepStrictEqual(C.dailyCase('2026-10-22'), C.dailyCase('2026-10-22'));
const t = C.dailyCase('2026-10-22', true); assert.strictEqual(t.ids[0], 'T1'); assert.strictEqual(t.ids.length, 8);
const s = C.score(C.BY_ID.S1, true, ['link', 'greet']); assert.strictEqual(s.points, 100 + 25 - 10); assert.deepStrictEqual(s.missed, ['from', 'urgent']);
assert.strictEqual(C.score(C.BY_ID.L1, true, []).correct, false);
assert.strictEqual(C.rank(0).name, 'Rookie'); assert.strictEqual(C.rank(26).name, 'Detective');
console.log('OK', C.MESSAGES.length, 'messages;', C.dailyCase('2026-10-22').ids.join(' '));
