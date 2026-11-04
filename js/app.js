/* Wires everything together: tabs, tap handling, the 1-second clock, the service worker. */
(function () {
  'use strict';

  var TABS = ['today', 'week', 'settings'];
  var activeTab = 'today';
  var shownDay = null;

  function showTab(name) {
    if (TABS.indexOf(name) < 0) return;
    var changed = name !== activeTab;
    activeTab = name;
    TABS.forEach(function (t) {
      var section = document.getElementById('tab-' + t), on = t === name;
      section.hidden = !on;
      var btn = document.querySelector('.tabbar [data-tab="' + t + '"]');
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on);
      if (on && changed) {
        section.classList.remove('enter');
        void section.offsetWidth;
        section.classList.add('enter');
      }
    });
    if (changed) {
      WeekUI.closeSheet();
      if (name === 'today') TodayUI.animateRing();
      if (name === 'week') WeekUI.render();
      document.getElementById('tab-' + name).scrollTop = 0;
    }
  }

  /** Re-draws the tabs that show logged data. `anim` names the control that just changed. */
  function refresh(anim) {
    UI.anim = anim || null;
    TodayUI.render();
    WeekUI.render();
    UI.anim = null;
    shownDay = UI.todayKey();
    if (!Store.saveOk()) UI.toast('This phone isn’t letting the app save. Changes may be lost.');
  }

  function celebrate() {
    var num = document.getElementById('streak-num');
    if (!num || activeTab !== 'today') return;
    num.classList.add('bump');
    UI.burst(num.parentNode);
  }

  /** Runs a change and plays the streak celebration if the streak went up. */
  function change(day, anim, mutate) {
    var before = Streak.currentStreak(Store.days(), UI.todayKey());
    mutate();
    refresh(anim);
    if (Streak.currentStreak(Store.days(), UI.todayKey()) > before) celebrate();
  }

  function addMinutes(day, minutes) {
    var id = Store.addExercise(day, minutes);
    refresh({ day: day, type: 'ex', id: id });
  }

  function handle(el) {
    var act = el.dataset.act, day = el.dataset.day;
    switch (act) {
      case 'tab':
        showTab(el.dataset.tab);
        break;
      case 'sugar':
        if (Store.getDay(day).sugar === el.dataset.val) return;
        change(day, { day: day, type: 'sugar' }, function () { Store.setSugar(day, el.dataset.val); });
        break;
      case 'fast':
        change(day, { day: day, type: 'fast' }, function () { Store.setFasted(day, !Store.getDay(day).fasted); });
        break;
      case 'ex-add':
        addMinutes(day, Number(el.dataset.min));
        break;
      case 'ex-custom':
        UI.promptMinutes().then(function (m) { if (m) addMinutes(day, m); });
        break;
      case 'ex-del':
        UI.confirm({
          title: 'Delete this entry?',
          message: 'This removes ' + el.getAttribute('aria-label').replace(/^Delete /, '').replace(/ minute entry$/, ' minutes') + ' from your log.',
          confirmLabel: 'Delete', cancelLabel: 'Keep it', danger: true
        }).then(function (ok) {
          if (ok) { Store.removeExercise(day, el.dataset.id); refresh(); }
        });
        break;
      case 'week-prev': WeekUI.shift(-1); break;
      case 'week-next': WeekUI.shift(1); break;
      case 'day-open': WeekUI.openDay(day); break;
      case 'sheet-close': WeekUI.closeSheet(); break;
      case 'reset':
        UI.confirm({
          title: 'Erase everything?',
          message: 'This deletes all your sugar days, exercise and fasting history on this phone. It can’t be undone.',
          confirmLabel: 'Erase everything', cancelLabel: 'Keep my data', danger: true
        }).then(function (ok) {
          if (!ok) return;
          Store.reset();
          WeekUI.resetView();
          SettingsUI.render();
          refresh();
          showTab('today');
          UI.toast('All data erased.');
        });
        break;
    }
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (el && !el.disabled) handle(el);
  });

  document.addEventListener('animationend', function (e) {
    if (e.target.classList.contains('tab')) e.target.classList.remove('enter');
    if (e.target.classList.contains('bump')) e.target.classList.remove('bump');
  });

  function clock() {
    if (UI.todayKey() !== shownDay) refresh(); // midnight passed while the app was open
    TodayUI.tick();
  }

  function registerWorker() {
    if (!('serviceWorker' in navigator)) return;
    var hadController = !!navigator.serviceWorker.controller, reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hadController || reloading) return; // first install: nothing to swap
      reloading = true;
      location.reload();                       // a newer version just took over
    });
    navigator.serviceWorker.register('./service-worker.js').then(function (reg) {
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) reg.update().catch(function () {});
      });
    }).catch(function () {});
  }

  Store.load();
  SettingsUI.render();
  refresh();
  showTab('today');
  setInterval(clock, 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) clock(); });
  registerWorker();
})();
