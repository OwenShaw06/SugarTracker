/* Pure fasting-window logic. Works in the browser (window.Fasting) and in Node (require).
 *
 * The fast repeats daily from `start` to `end` ("HH:MM", 24h). If end is earlier than
 * start the fast crosses midnight (e.g. 19:00 -> 11:00).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Fasting = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function toMinutes(t) {
    var p = t.split(':');
    return +p[0] * 60 + +p[1];
  }

  /** Length of the fast in minutes, or 0 when start === end (not a valid schedule). */
  function durationMinutes(start, end) {
    return (toMinutes(end) - toMinutes(start) + 1440) % 1440;
  }

  /** Wall-clock time `minutes` after midnight on the day (base + dayOffset). */
  function at(base, dayOffset, minutes) {
    return new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset, 0, minutes);
  }

  /**
   * Where `now` sits in the daily cycle.
   * Returns null for an invalid schedule, otherwise:
   *   fasting      true while inside the fast
   *   from, to     the current phase boundaries (Dates)
   *   remainingMs  time until the phase changes
   *   progress     0..1 through the current phase
   */
  function status(now, start, end) {
    var dur = durationMinutes(start, end);
    if (!dur) return null;
    var sm = toMinutes(start), prevEnd = null, nextStart = null;

    for (var off = -1; off <= 1; off++) {
      var s = at(now, off, sm), e = at(now, off, sm + dur);
      if (now >= s && now < e) {
        return { fasting: true, from: s, to: e, remainingMs: e - now, progress: (now - s) / (e - s) };
      }
      if (e <= now && (!prevEnd || e > prevEnd)) prevEnd = e;
      if (s > now && (!nextStart || s < nextStart)) nextStart = s;
    }
    return {
      fasting: false,
      from: prevEnd,
      to: nextStart,
      remainingMs: nextStart - now,
      progress: (now - prevEnd) / (nextStart - prevEnd)
    };
  }

  /** Splits a duration into whole hours / minutes / seconds (rounded up to the next second). */
  function parts(ms) {
    var total = Math.max(0, Math.ceil(ms / 1000));
    return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
  }

  /** "7:00 PM" from "19:00". */
  function format12(t) {
    var m = toMinutes(t), h = Math.floor(m / 60), min = m % 60;
    return (h % 12 || 12) + ':' + (min < 10 ? '0' + min : min) + ' ' + (h < 12 ? 'AM' : 'PM');
  }

  return { durationMinutes: durationMinutes, status: status, parts: parts, format12: format12 };
});
