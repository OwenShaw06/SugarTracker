// Run with: node tests/streak.test.js
'use strict';
var assert = require('assert');
var S = require('../js/streak.js');

var passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { console.error('FAIL  ' + name + '\n      ' + e.message); process.exitCode = 1; }
}

// { '2026-11-02': 'free', ... } -> the app's days map
function days(map) {
  var out = {};
  Object.keys(map).forEach(function (k) { out[k] = { sugar: map[k], fasted: false, exercise: [] }; });
  return out;
}

// Calendar for the scenarios (2026-11-01 is a Sunday):
//   Oct 25 Sun | 26 Mon | 27 Tue | 28 Wed | 29 Thu | 30 Fri | 31 Sat
//   Nov  1 Sun |  2 Mon |  3 Tue |  4 Wed |  5 Thu |  6 Fri |  7 Sat

test('date helpers: weeks run Sunday to Saturday', function () {
  assert.strictEqual(S.weekday('2026-11-01'), 0);
  assert.strictEqual(S.weekStart('2026-11-04'), '2026-11-01');
  assert.strictEqual(S.weekStart('2026-11-01'), '2026-11-01');
  assert.strictEqual(S.weekStart('2026-11-07'), '2026-11-01');
  assert.strictEqual(S.weekStart('2026-10-31'), '2026-10-25');
  assert.deepStrictEqual(S.weekKeys('2026-11-03'),
    ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07']);
  assert.strictEqual(S.addDays('2026-12-31', 1), '2027-01-01');
  assert.strictEqual(S.addDays('2026-03-01', -1), '2026-02-28');
  assert.strictEqual(S.dateKey(new Date(2026, 10, 4, 23, 59)), '2026-11-04');
  assert.strictEqual(S.dateKey(new Date(2026, 10, 5, 0, 0)), '2026-11-05');
});

test('no sugar days: every sugar-free day adds one', function () {
  assert.strictEqual(S.currentStreak({}, '2026-11-04'), 0);
  assert.strictEqual(S.currentStreak(days({ '2026-11-04': 'free' }), '2026-11-04'), 1);
  assert.strictEqual(S.currentStreak(days({
    '2026-11-01': 'free', '2026-11-02': 'free', '2026-11-03': 'free', '2026-11-04': 'free'
  }), '2026-11-04'), 4);
});

test('one sugar day in a week: streak holds, does not add or reset', function () {
  var d = days({ '2026-11-01': 'free', '2026-11-02': 'free', '2026-11-03': 'sugar' });
  assert.strictEqual(S.currentStreak(d, '2026-11-03'), 2);
  d['2026-11-04'] = { sugar: 'free' };
  assert.strictEqual(S.currentStreak(d, '2026-11-04'), 3);
  // sugar as the very first logged day
  assert.strictEqual(S.currentStreak(days({ '2026-11-01': 'sugar' }), '2026-11-04'), 0);
  assert.strictEqual(S.sugarDaysInWeek(d, '2026-11-04'), 1);
});

test('two sugar days in a week: streak resets to 0, then restarts', function () {
  var d = days({ '2026-11-01': 'free', '2026-11-02': 'free', '2026-11-03': 'sugar', '2026-11-04': 'sugar' });
  assert.strictEqual(S.currentStreak(d, '2026-11-04'), 0);
  assert.strictEqual(S.sugarDaysInWeek(d, '2026-11-04'), 2);
  d['2026-11-05'] = { sugar: 'free' };
  assert.strictEqual(S.currentStreak(d, '2026-11-05'), 1);
  d['2026-11-06'] = { sugar: 'free' };
  assert.strictEqual(S.currentStreak(d, '2026-11-06'), 2);
});

test('reset across a week boundary: old sugar days do not carry over', function () {
  var d = days({
    '2026-10-26': 'free',
    '2026-10-27': 'sugar',   // first of that week: holds
    '2026-10-30': 'sugar',   // second of that week: reset
    '2026-10-31': 'free',    // 1
    '2026-11-01': 'free',    // 2 (new week)
    '2026-11-02': 'sugar',   // first sugar of the new week: holds at 2
    '2026-11-03': 'free'     // 3
  });
  assert.strictEqual(S.currentStreak(d, '2026-10-30'), 0);
  assert.strictEqual(S.currentStreak(d, '2026-10-31'), 1);
  assert.strictEqual(S.currentStreak(d, '2026-11-01'), 2);
  assert.strictEqual(S.currentStreak(d, '2026-11-02'), 2);
  assert.strictEqual(S.currentStreak(d, '2026-11-03'), 3);
});

test('sugar on Saturday and on the next Sunday are different weeks: no reset', function () {
  var d = days({ '2026-10-29': 'free', '2026-10-31': 'sugar', '2026-11-01': 'sugar', '2026-11-02': 'free' });
  assert.strictEqual(S.currentStreak(d, '2026-11-02'), 2);
});

test('unlogged days neither add nor break the streak', function () {
  var d = days({ '2026-11-01': 'free', '2026-11-03': 'free' }); // Monday unlogged
  assert.strictEqual(S.currentStreak(d, '2026-11-03'), 2);
  // today (Wed) not logged yet: streak unchanged
  assert.strictEqual(S.currentStreak(d, '2026-11-04'), 2);
  // null / missing sugar fields are treated as unlogged
  d['2026-11-02'] = { sugar: null, fasted: true, exercise: [{ id: 'a', minutes: 30 }] };
  assert.strictEqual(S.currentStreak(d, '2026-11-04'), 2);
  // unlogged days between a sugar day and a free day don't matter either
  var e = days({ '2026-11-01': 'free', '2026-11-02': 'sugar', '2026-11-04': 'free' });
  assert.strictEqual(S.currentStreak(e, '2026-11-04'), 2);
});

test('days after today are ignored', function () {
  var d = days({ '2026-11-03': 'free', '2026-11-05': 'free', '2026-11-06': 'sugar' });
  assert.strictEqual(S.currentStreak(d, '2026-11-04'), 1);
});

test('editing past days recomputes the streak', function () {
  var d = days({ '2026-11-01': 'free', '2026-11-02': 'sugar', '2026-11-03': 'sugar', '2026-11-04': 'free' });
  assert.strictEqual(S.currentStreak(d, '2026-11-04'), 1);          // reset on Tue, Wed counts 1

  d['2026-11-03'] = { sugar: 'free' };                              // fix Tuesday -> only one sugar day
  assert.strictEqual(S.currentStreak(d, '2026-11-04'), 3);          // Sun, Tue, Wed (Mon holds)

  d['2026-11-03'] = { sugar: 'sugar' };                             // back to two sugar days
  d['2026-11-02'] = { sugar: null };                                // forget Monday entirely
  assert.strictEqual(S.currentStreak(d, '2026-11-04'), 2);          // Sun, Wed (Tue holds)

  d['2026-11-02'] = { sugar: 'free' };                              // Monday was actually fine
  assert.strictEqual(S.currentStreak(d, '2026-11-04'), 3);

  // editing a day in an earlier week can change everything after it
  var e = days({
    '2026-10-26': 'sugar', '2026-10-27': 'sugar',                   // reset in week 1
    '2026-10-28': 'free', '2026-11-01': 'free', '2026-11-02': 'free'
  });
  assert.strictEqual(S.currentStreak(e, '2026-11-02'), 3);
  e['2026-10-27'] = { sugar: 'free' };                              // now just one sugar day that week
  assert.strictEqual(S.currentStreak(e, '2026-11-02'), 4);
});

console.log('\n' + passed + ' streak tests passed' + (process.exitCode ? ' (with failures)' : ''));
