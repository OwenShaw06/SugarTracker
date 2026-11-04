/* The Today tab. */
(function () {
  'use strict';

  var CIRC = 2 * Math.PI * 52; // ring circumference (r = 52)
  var root;

  function greeting() {
    var h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }

  function weekTotal(key) {
    return Streak.weekKeys(key).reduce(function (sum, k) { return sum + Store.dayMinutes(k); }, 0);
  }

  function fastStatus() {
    var s = Store.settings();
    return Fasting.status(new Date(), s.fastStart, s.fastEnd);
  }

  function countdownHtml(ms) {
    var p = Fasting.parts(ms), mm = p.m < 10 && p.h ? '0' + p.m : p.m, ss = p.s < 10 ? '0' + p.s : p.s;
    return (p.h ? p.h + 'h ' : '') + mm + 'm <small>' + ss + 's</small>';
  }

  function ringOffset(st) { return CIRC * (1 - (st ? st.progress : 0)); }

  function fastingCard(key) {
    var s = Store.settings(), st = fastStatus();
    return '<section class="card" aria-labelledby="fast-title">' +
      '<p class="eyebrow">Fasting</p><h2 id="fast-title" class="card-title">Your daily fast</h2>' +
      '<div class="ring-wrap"><svg class="ring' + (st && !st.fasting ? ' eating' : '') + '" id="ring" viewBox="0 0 120 120" aria-hidden="true">' +
      '<circle class="ring-bg" cx="60" cy="60" r="52"/>' +
      '<circle class="ring-fg" id="ring-fg" cx="60" cy="60" r="52" transform="rotate(-90 60 60)" ' +
      'stroke-dasharray="' + CIRC.toFixed(2) + '" stroke-dashoffset="' + ringOffset(st).toFixed(2) + '"/></svg>' +
      '<div class="ring-center"><span id="fast-state" class="ring-state"></span></div></div>' +
      '<p id="fast-label" class="count-label"></p><p id="fast-count" class="count"></p>' +
      '<div class="sched"><div><span class="sched-label">Fast starts</span><b>' + Fasting.format12(s.fastStart) + '</b></div>' +
      '<div><span class="sched-label">Fast ends</span><b>' + Fasting.format12(s.fastEnd) + '</b></div></div>' +
      UI.fastToggle(key, 'I completed my fast today') + '</section>';
  }

  function render() {
    root = root || document.querySelector('#tab-today .tab-inner');
    var key = UI.todayKey(), days = Store.days();
    var streak = Streak.currentStreak(days, key), sugarDays = Streak.sugarDaysInWeek(days, key);

    root.innerHTML =
      '<header class="page-head"><p class="greet">' + greeting() + '</p><h1>' + UI.longDate(key) + '</h1></header>' +

      '<section class="card" aria-labelledby="sugar-title"><p class="eyebrow">Sugar</p>' +
      '<div id="sugar-title">' + UI.sugarChoice(key, 'Did you avoid sugar today?') + '</div>' +
      '<div class="streak"><span class="streak-num" id="streak-num">' + streak + '</span>' +
      '<span class="streak-label">day streak</span></div>' +
      '<p class="muted center' + (sugarDays > 1 ? ' warn' : '') + '">Sugar days this week: ' + sugarDays + ' of 1 allowed</p></section>' +

      '<section class="card" aria-labelledby="ex-title"><p class="eyebrow">Exercise</p>' +
      '<h2 id="ex-title" class="card-title">Move your body</h2>' +
      UI.exerciseBody(key, { weekTotal: weekTotal(key), empty: 'No exercise logged yet today.' }) + '</section>' +

      fastingCard(key);

    tick();
  }

  /** Called every second: updates the fasting text and ring in place (no re-render). */
  function tick() {
    var state = document.getElementById('fast-state');
    if (!state) return;
    var st = fastStatus(), label = document.getElementById('fast-label'), count = document.getElementById('fast-count');
    if (!st) {
      state.textContent = '—';
      label.textContent = 'Set your fasting times in Settings';
      count.innerHTML = '';
      return;
    }
    state.textContent = st.fasting ? 'Fasting' : 'Eating window';
    label.textContent = st.fasting ? 'Eating window opens in' : 'Next fast starts in';
    count.innerHTML = countdownHtml(st.remainingMs);
    document.getElementById('ring').classList.toggle('eating', !st.fasting);
    document.getElementById('ring-fg').setAttribute('stroke-dashoffset', ringOffset(st).toFixed(2));
  }

  /** Re-draws the ring from empty; used when the Today tab is shown. */
  function animateRing() {
    var fg = document.getElementById('ring-fg');
    if (!fg) return;
    fg.style.transition = 'none';
    fg.setAttribute('stroke-dashoffset', CIRC.toFixed(2));
    void fg.getBoundingClientRect();
    fg.style.transition = '';
    tick();
  }

  window.TodayUI = { render: render, tick: tick, animateRing: animateRing };
})();
