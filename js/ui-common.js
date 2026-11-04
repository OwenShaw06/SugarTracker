/* Shared UI helpers: formatting, reusable day controls, dialogs, toast, confetti.
 *
 * `UI.anim` is set for the length of a single render so the control that just changed
 * can play its small animation ({ day, type: 'sugar'|'fast'|'ex', id }).
 */
(function () {
  'use strict';

  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'];

  var UI = window.UI = { anim: null, DAYS: DAYS, MONTHS: MONTHS };

  var CHECK = '<svg class="check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  UI.CHECK = CHECK;
  UI.CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  UI.todayKey = function () { return Streak.dateKey(new Date()); };

  function parts(key) { var p = key.split('-'); return { y: +p[0], m: +p[1] - 1, d: +p[2] }; }

  UI.dayName = function (key) { return DAYS[Streak.weekday(key)]; };
  UI.shortDay = function (key) { return DAYS[Streak.weekday(key)].slice(0, 3); };
  UI.shortDate = function (key) { var p = parts(key); return MONTHS[p.m].slice(0, 3) + ' ' + p.d; };
  UI.longDate = function (key) { var p = parts(key); return UI.dayName(key) + ', ' + MONTHS[p.m] + ' ' + p.d; };
  UI.year = function (key) { return parts(key).y; };

  UI.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  function animFor(key, type) { return UI.anim && UI.anim.day === key && UI.anim.type === type; }

  /* ---------- reusable controls (used on Today and in the day editor) ---------- */

  UI.sugarChoice = function (key, question) {
    var current = Store.getDay(key).sugar, animate = animFor(key, 'sugar');
    function btn(val, label) {
      var on = current === val;
      return '<button class="btn choice ' + val + (on ? ' is-on' : '') + '" data-act="sugar" data-day="' + key +
        '" data-val="' + val + '" aria-pressed="' + on + '">' +
        '<span class="choice-check' + (on && animate ? ' draw' : '') + '">' + CHECK + '</span>' +
        '<span>' + label + '</span></button>';
    }
    return '<h3 class="q">' + question + '</h3><div class="choice-row">' +
      btn('free', 'Sugar-free') + btn('sugar', 'Had sugar') + '</div>';
  };

  UI.fastToggle = function (key, label) {
    var on = Store.getDay(key).fasted, animate = animFor(key, 'fast');
    return '<button class="toggle-row' + (on ? ' is-on' : '') + '" role="switch" aria-checked="' + on +
      '" data-act="fast" data-day="' + key + '">' +
      '<span class="tick' + (on && animate ? ' draw' : '') + '">' + CHECK + '</span>' +
      '<span class="toggle-label">' + label + '</span></button>';
  };

  /** Totals, quick-add buttons and the list of entries for one day. */
  UI.exerciseBody = function (key, o) {
    o = o || {};
    var entries = Store.getDay(key).exercise;
    var html = '<div class="stats"><div class="stat"><span class="stat-num">' + Store.dayMinutes(key) +
      '</span><span class="stat-label">' + (o.dayLabel || 'minutes today') + '</span></div>';
    if (o.weekTotal !== undefined) {
      html += '<div class="stat"><span class="stat-num">' + o.weekTotal +
        '</span><span class="stat-label">minutes this week</span></div>';
    }
    html += '</div><div class="quick-row">';
    [15, 30, 45].forEach(function (m) {
      html += '<button class="btn quick" data-act="ex-add" data-day="' + key + '" data-min="' + m +
        '" aria-label="Add ' + m + ' minutes">+' + m + '</button>';
    });
    html += '</div><button class="btn outline wide" data-act="ex-custom" data-day="' + key + '">Add minutes</button>';

    if (entries.length) {
      html += '<ul class="entries">';
      entries.forEach(function (e) {
        var isNew = animFor(key, 'ex') && UI.anim.id === e.id;
        html += '<li class="entry' + (isNew ? ' is-new' : '') + '"><span>' + e.minutes + ' min</span>' +
          '<button class="icon-btn" data-act="ex-del" data-day="' + key + '" data-id="' + e.id +
          '" aria-label="Delete ' + e.minutes + ' minute entry">' + UI.CLOSE + '</button></li>';
      });
      html += '</ul>';
    } else {
      html += '<p class="muted center">' + (o.empty || 'Nothing logged yet.') + '</p>';
    }
    return html;
  };

  /* ---------- dialogs ---------- */

  function openDialog(inner) {
    var layer = document.getElementById('dialogs');
    var backdrop = document.createElement('div');
    backdrop.className = 'backdrop';
    backdrop.innerHTML = '<div class="dialog" role="dialog" aria-modal="true">' + inner + '</div>';
    layer.appendChild(backdrop);
    requestAnimationFrame(function () { backdrop.classList.add('show'); });
    return backdrop;
  }

  function closeDialog(backdrop) {
    backdrop.classList.remove('show');
    setTimeout(function () { backdrop.remove(); }, 220);
  }

  /** Resolves true when the confirm button is tapped, false otherwise. */
  UI.confirm = function (o) {
    return new Promise(function (resolve) {
      var b = openDialog('<h2>' + UI.esc(o.title) + '</h2><p>' + UI.esc(o.message) + '</p>' +
        '<div class="dialog-actions">' +
        '<button class="btn outline" data-r="0">' + UI.esc(o.cancelLabel || 'Cancel') + '</button>' +
        '<button class="btn ' + (o.danger ? 'danger' : 'primary') + '" data-r="1">' + UI.esc(o.confirmLabel || 'OK') + '</button>' +
        '</div>');
      b.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-r]');
        if (!btn && e.target !== b) return;
        closeDialog(b);
        resolve(!!btn && btn.dataset.r === '1');
      });
    });
  };

  /** Asks for a number of minutes. Resolves to a whole number 1-600, or null if cancelled. */
  UI.promptMinutes = function () {
    return new Promise(function (resolve) {
      var b = openDialog('<form novalidate><h2>How many minutes?</h2>' +
        '<input class="num-input" type="number" inputmode="numeric" pattern="[0-9]*" min="1" max="600" ' +
        'placeholder="e.g. 20" aria-label="Minutes of exercise" autocomplete="off">' +
        '<p class="field-error" aria-live="polite"></p>' +
        '<div class="dialog-actions"><button type="button" class="btn outline" data-r="0">Cancel</button>' +
        '<button type="submit" class="btn primary">Add</button></div></form>');
      var form = b.querySelector('form'), input = b.querySelector('input'), err = b.querySelector('.field-error');
      setTimeout(function () { input.focus(); }, 60);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var n = Math.round(Number(input.value));
        if (!input.value || !isFinite(n) || n < 1 || n > 600) {
          err.textContent = 'Please enter a number from 1 to 600.';
          return;
        }
        closeDialog(b);
        resolve(n);
      });
      b.addEventListener('click', function (e) {
        if (e.target === b || e.target.closest('[data-r]')) { closeDialog(b); resolve(null); }
      });
    });
  };

  /* ---------- toast ---------- */

  var toastTimer;
  UI.toast = function (msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  };

  /* ---------- celebration ---------- */

  UI.burst = function (container) {
    var colors = ['#FF4D8D', '#FF7AA8', '#FFD6E5', '#5ED6A8', '#FFC24D'];
    for (var i = 0; i < 16; i++) {
      var dot = document.createElement('i');
      var angle = (i / 16) * Math.PI * 2 + Math.random() * 0.4;
      var dist = 46 + Math.random() * 34;
      dot.className = 'confetti';
      dot.style.setProperty('--dx', Math.round(Math.cos(angle) * dist) + 'px');
      dot.style.setProperty('--dy', Math.round(Math.sin(angle) * dist) + 'px');
      dot.style.background = colors[i % colors.length];
      container.appendChild(dot);
      setTimeout(dot.remove.bind(dot), 700);
    }
  };

  /* ---------- bottom sheet (day editor) ---------- */

  var sheetEl, sheetPanel, sheetOpen = false;

  UI.sheetShow = function (html) {
    sheetEl = sheetEl || document.getElementById('sheet');
    sheetPanel = sheetPanel || sheetEl.querySelector('.sheet-panel');
    var scroll = sheetPanel.scrollTop;
    sheetPanel.innerHTML = html;
    sheetPanel.scrollTop = scroll;
    if (!sheetOpen) {
      sheetOpen = true;
      sheetEl.hidden = false;
      void sheetEl.offsetWidth;
      sheetEl.classList.add('show');
    }
  };

  UI.sheetHide = function () {
    if (!sheetOpen) return;
    sheetOpen = false;
    sheetEl.classList.remove('show');
    setTimeout(function () { if (!sheetOpen) sheetEl.hidden = true; }, 260);
  };
})();
