/* The Week tab and its day editor sheet. */
(function () {
  'use strict';

  var offset = 0;        // 0 = this week, -1 = last week, ...
  var sheetKey = null;   // day currently open in the editor
  var root;

  function startKey() {
    return Streak.addDays(Streak.weekStart(UI.todayKey()), offset * 7);
  }

  function rangeTitle(keys) {
    var a = keys[0], b = keys[6];
    var ya = UI.year(a), yb = UI.year(b), now = UI.year(UI.todayKey());
    var left = UI.shortDate(a) + (ya !== yb ? ', ' + ya : '');
    var right = (a.slice(5, 7) === b.slice(5, 7) && ya === yb) ? b.slice(8).replace(/^0/, '') : UI.shortDate(b);
    return left + ' – ' + right + (yb !== now || ya !== yb ? ', ' + yb : '');
  }

  function sugarPill(sugar) {
    if (sugar === 'free') return '<span class="pill free">Sugar-free</span>';
    if (sugar === 'sugar') return '<span class="pill sugar">Had sugar</span>';
    return '<span class="pill none">Not logged</span>';
  }

  function dayRow(key, today) {
    var day = Store.getDay(key), future = key > today, isToday = key === today;
    var mins = Store.dayMinutes(key);
    return '<button class="day-row' + (isToday ? ' is-today' : '') + (future ? ' is-future' : '') +
      '" data-act="day-open" data-day="' + key + '"' + (future ? ' disabled' : '') +
      ' aria-label="' + UI.longDate(key) + (isToday ? ', today' : '') + '">' +
      '<span class="dn"><b>' + UI.shortDay(key) + '</b><i>' + (isToday ? 'Today' : UI.shortDate(key)) + '</i></span>' +
      sugarPill(day.sugar) +
      '<span class="fast-dot' + (day.fasted ? ' on' : '') + '">' + (day.fasted ? UI.CHECK : '') + '</span>' +
      '<span class="mins">' + (mins ? '<b>' + mins + '</b><i>min</i>' : '<i>–</i>') + '</span></button>';
  }

  function render() {
    root = root || document.querySelector('#tab-week .tab-inner');
    var today = UI.todayKey(), keys = Streak.weekKeys(startKey()), days = Store.days();
    var minutes = 0, freeDays = 0, fasts = 0;
    keys.forEach(function (k) {
      if (k > today) return;
      minutes += Store.dayMinutes(k);
      if (Store.getDay(k).sugar === 'free') freeDays++;
      if (Store.getDay(k).fasted) fasts++;
    });
    var sub = offset === 0 ? 'This week' : offset === -1 ? 'Last week' : -offset + ' weeks ago';

    root.innerHTML =
      '<header class="week-nav"><button class="icon-btn big" data-act="week-prev" aria-label="Previous week">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<div class="week-title"><h1>' + rangeTitle(keys) + '</h1><p>' + sub + '</p></div>' +
      '<button class="icon-btn big" data-act="week-next" aria-label="Next week"' + (offset === 0 ? ' disabled' : '') + '>' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></header>' +

      '<section class="card tight"><div class="day-cols" aria-hidden="true"><span>Day</span><span>Sugar</span><span>Fast</span><span>Exercise</span></div>' +
      keys.map(function (k) { return dayRow(k, today); }).join('') +
      '</section><p class="muted center">Tap a day to add or change what you logged.</p>' +

      '<section class="card"><p class="eyebrow">' + sub + ' summary</p><div class="summary">' +
      tile(minutes, 'exercise minutes') + tile(freeDays, 'sugar-free days') +
      tile(fasts, 'fasts completed') + tile(Streak.currentStreak(days, today), 'day streak now') +
      '</div></section>';

    if (sheetKey) UI.sheetShow(sheetHtml(sheetKey));
  }

  function tile(n, label) {
    return '<div class="tile"><span class="tile-num">' + n + '</span><span class="tile-label">' + label + '</span></div>';
  }

  function sheetHtml(key) {
    var when = key === UI.todayKey() ? 'today' : 'that day';
    return '<div class="sheet-grab" aria-hidden="true"></div>' +
      '<div class="sheet-head"><div><p class="eyebrow">Editing</p><h2>' + UI.longDate(key) + '</h2></div>' +
      '<button class="btn primary small" data-act="sheet-close">Done</button></div>' +
      '<section class="sheet-block">' + UI.sugarChoice(key, 'Did you avoid sugar ' + when + '?') + '</section>' +
      '<section class="sheet-block"><h3 class="q">Fasting</h3>' + UI.fastToggle(key, 'I completed my fast') + '</section>' +
      '<section class="sheet-block"><h3 class="q">Exercise</h3>' +
      UI.exerciseBody(key, { dayLabel: 'minutes ' + when, empty: 'No exercise logged.' }) + '</section>';
  }

  function openDay(key) {
    if (key > UI.todayKey()) return;
    sheetKey = key;
    UI.sheetShow(sheetHtml(key));
  }

  function closeSheet() {
    sheetKey = null;
    UI.sheetHide();
  }

  function shift(delta) {
    offset = Math.min(0, offset + delta);
    render();
  }

  window.WeekUI = {
    render: render,
    shift: shift,
    openDay: openDay,
    closeSheet: closeSheet,
    resetView: function () { offset = 0; closeSheet(); }
  };
})();
