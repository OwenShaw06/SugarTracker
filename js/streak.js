/* Pure date + streak logic. Works in the browser (window.Streak) and in Node (require).
 *
 * Day keys are local-time "YYYY-MM-DD" strings. Weeks run Sunday to Saturday.
 * Date maths is done on UTC timestamps built from the key, so DST never shifts a day.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Streak = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DAY_MS = 86400000;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function toMs(key) {
    var p = key.split('-');
    return Date.UTC(+p[0], +p[1] - 1, +p[2]);
  }

  function fromMs(ms) {
    var d = new Date(ms);
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }

  /** Local-time key for a Date object. */
  function dateKey(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function addDays(key, n) { return fromMs(toMs(key) + n * DAY_MS); }

  /** 0 = Sunday ... 6 = Saturday */
  function weekday(key) { return new Date(toMs(key)).getUTCDay(); }

  /** The Sunday that starts the week containing `key`. */
  function weekStart(key) { return addDays(key, -weekday(key)); }

  /** The 7 keys (Sunday..Saturday) of the week containing `key`. */
  function weekKeys(key) {
    var start = weekStart(key), out = [];
    for (var i = 0; i < 7; i++) out.push(addDays(start, i));
    return out;
  }

  function sugarOf(days, key) {
    var d = days[key];
    return d && (d.sugar === 'free' || d.sugar === 'sugar') ? d.sugar : null;
  }

  /** Number of "sugar" days in the week containing `key`. */
  function sugarDaysInWeek(days, key) {
    return weekKeys(key).filter(function (k) { return sugarOf(days, k) === 'sugar'; }).length;
  }

  /**
   * Current streak as of `todayKey`.
   * - "free" day: streak + 1
   * - first "sugar" day in a Sun-Sat week: streak holds
   * - second (or later) "sugar" day in the same week: streak resets to 0
   * - unlogged days (past or today) change nothing; days after today are ignored
   */
  function currentStreak(days, todayKey) {
    var keys = Object.keys(days)
      .filter(function (k) { return k <= todayKey && sugarOf(days, k); })
      .sort();
    var streak = 0, sugarSeen = {};
    keys.forEach(function (k) {
      if (sugarOf(days, k) === 'free') {
        streak++;
      } else {
        var w = weekStart(k);
        sugarSeen[w] = (sugarSeen[w] || 0) + 1;
        if (sugarSeen[w] >= 2) streak = 0;
      }
    });
    return streak;
  }

  return {
    dateKey: dateKey,
    addDays: addDays,
    weekday: weekday,
    weekStart: weekStart,
    weekKeys: weekKeys,
    sugarDaysInWeek: sugarDaysInWeek,
    currentStreak: currentStreak
  };
});
