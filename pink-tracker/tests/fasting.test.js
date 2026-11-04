// Run with: node tests/fasting.test.js
'use strict';
var assert = require('assert');
var F = require('../js/fasting.js');

var passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { console.error('FAIL  ' + name + '\n      ' + e.message); process.exitCode = 1; }
}
var HOUR = 3600000;
function d(day, h, m) { return new Date(2026, 10, day, h, m || 0, 0); }

test('duration: crossing midnight, same day, invalid', function () {
  assert.strictEqual(F.durationMinutes('19:00', '11:00'), 16 * 60);
  assert.strictEqual(F.durationMinutes('08:00', '12:00'), 4 * 60);
  assert.strictEqual(F.durationMinutes('09:00', '09:00'), 0);
  assert.strictEqual(F.status(d(4, 12), '09:00', '09:00'), null);
});

test('midnight-crossing fast (19:00 -> 11:00): evening', function () {
  var s = F.status(d(4, 20), '19:00', '11:00');
  assert.strictEqual(s.fasting, true);
  assert.strictEqual(s.remainingMs, 15 * HOUR);
  assert.deepStrictEqual(s.to, d(5, 11));
  assert.ok(Math.abs(s.progress - 1 / 16) < 1e-9);
});

test('midnight-crossing fast: after midnight', function () {
  var s = F.status(d(5, 2), '19:00', '11:00');
  assert.strictEqual(s.fasting, true);
  assert.strictEqual(s.remainingMs, 9 * HOUR);
  assert.deepStrictEqual(s.from, d(4, 19));
});

test('midnight-crossing fast: exactly at the boundaries', function () {
  var atEnd = F.status(d(5, 11), '19:00', '11:00');
  assert.strictEqual(atEnd.fasting, false);
  assert.strictEqual(atEnd.remainingMs, 8 * HOUR);
  assert.strictEqual(atEnd.progress, 0);
  var atStart = F.status(d(4, 19), '19:00', '11:00');
  assert.strictEqual(atStart.fasting, true);
  assert.strictEqual(atStart.remainingMs, 16 * HOUR);
});

test('midnight-crossing fast: eating window', function () {
  var s = F.status(d(4, 14, 30), '19:00', '11:00');
  assert.strictEqual(s.fasting, false);
  assert.strictEqual(s.remainingMs, 4.5 * HOUR);
  assert.deepStrictEqual(s.to, d(4, 19));
});

test('same-day fast (08:00 -> 12:00)', function () {
  var a = F.status(d(4, 10), '08:00', '12:00');
  assert.strictEqual(a.fasting, true);
  assert.strictEqual(a.remainingMs, 2 * HOUR);
  var b = F.status(d(4, 13), '08:00', '12:00');
  assert.strictEqual(b.fasting, false);
  assert.strictEqual(b.remainingMs, 19 * HOUR);          // until 08:00 tomorrow
  var c = F.status(d(4, 3), '08:00', '12:00');
  assert.strictEqual(c.fasting, false);
  assert.strictEqual(c.remainingMs, 5 * HOUR);           // until 08:00 today
});

test('formatting', function () {
  assert.deepStrictEqual(F.parts(3 * HOUR + 12 * 60000 + 5000), { h: 3, m: 12, s: 5 });
  assert.deepStrictEqual(F.parts(0), { h: 0, m: 0, s: 0 });
  assert.deepStrictEqual(F.parts(-5), { h: 0, m: 0, s: 0 });
  assert.strictEqual(F.format12('19:00'), '7:00 PM');
  assert.strictEqual(F.format12('11:00'), '11:00 AM');
  assert.strictEqual(F.format12('00:05'), '12:05 AM');
  assert.strictEqual(F.format12('12:30'), '12:30 PM');
});

console.log('\n' + passed + ' fasting tests passed' + (process.exitCode ? ' (with failures)' : ''));
