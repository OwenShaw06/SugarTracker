/* The Settings tab. */
(function () {
  'use strict';

  var root;

  function summary() {
    var s = Store.settings(), hours = Fasting.durationMinutes(s.fastStart, s.fastEnd) / 60;
    var h = Math.round(hours * 10) / 10;
    return h + '-hour fast · ' + Fasting.format12(s.fastStart) + ' to ' + Fasting.format12(s.fastEnd);
  }

  function render() {
    root = root || document.querySelector('#tab-settings .tab-inner');
    var s = Store.settings();
    root.innerHTML =
      '<header class="page-head"><h1>Settings</h1></header>' +

      '<section class="card"><p class="eyebrow">Fasting</p><h2 class="card-title">Daily fasting schedule</h2>' +
      '<label class="field"><span>Fast starts</span><input type="time" id="fast-start" value="' + s.fastStart + '" step="60"></label>' +
      '<label class="field"><span>Fast ends</span><input type="time" id="fast-end" value="' + s.fastEnd + '" step="60"></label>' +
      '<p class="muted center" id="fast-summary">' + summary() + '</p>' +
      '<p class="muted center">The same times every day.</p></section>' +

      '<section class="card"><p class="eyebrow">Sugar</p><h2 class="card-title">Weekly sugar allowance: 1 day</h2>' +
      '<p class="body">Weeks run Sunday to Saturday. Your first sugar day each week is forgiven and your streak holds. ' +
      'A second sugar day in the same week starts the streak over.</p></section>' +

      '<section class="card"><p class="eyebrow">Help</p><h2 class="card-title">How to install</h2>' +
      '<ol class="steps"><li>Open this page in <b>Safari</b>.</li>' +
      '<li>Tap the <b>Share</b> button (the square with an arrow).</li>' +
      '<li>Tap <b>Add to Home Screen</b>, then <b>Add</b>.</li></ol></section>' +

      '<section class="card"><p class="eyebrow">Your data</p><h2 class="card-title">Stored only on this phone</h2>' +
      '<p class="body">Nothing is sent anywhere. If you clear Safari data or delete the app, your history is erased.</p>' +
      '<button class="btn danger wide" data-act="reset">Reset all data</button></section>';

    root.querySelector('.card').addEventListener('change', onTimeChange);
  }

  function onTimeChange() {
    var start = document.getElementById('fast-start'), end = document.getElementById('fast-end');
    if (!start.value || !end.value) { // time picker was cleared: put the saved values back
      start.value = Store.settings().fastStart;
      end.value = Store.settings().fastEnd;
      return;
    }
    if (start.value === end.value) {
      UI.toast('Start and end can’t be the same time.');
      start.value = Store.settings().fastStart;
      end.value = Store.settings().fastEnd;
      return;
    }
    Store.setFastTimes(start.value, end.value);
    document.getElementById('fast-summary').textContent = summary();
    TodayUI.render();
  }

  window.SettingsUI = { render: render };
})();
