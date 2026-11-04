/* All reading and writing of saved data. Everything lives in one localStorage key.
 *
 * { version: 1,
 *   settings: { fastStart: "19:00", fastEnd: "11:00" },
 *   days: { "YYYY-MM-DD": { sugar: "free"|"sugar"|null, fasted: bool, exercise: [{ id, minutes }] } } }
 */
(function () {
  'use strict';

  var KEY = 'pinkTracker';
  var VERSION = 1;
  var data = fresh();
  var saveOk = true;

  function fresh() {
    return { version: VERSION, settings: { fastStart: '19:00', fastEnd: '11:00' }, days: {} };
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function validTime(s) { return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s); }

  /** Rebuilds a clean structure from whatever was stored, dropping anything malformed. */
  function sanitize(raw) {
    var out = fresh();
    if (!raw || typeof raw !== 'object') return out;
    if (raw.settings) {
      if (validTime(raw.settings.fastStart)) out.settings.fastStart = raw.settings.fastStart;
      if (validTime(raw.settings.fastEnd)) out.settings.fastEnd = raw.settings.fastEnd;
    }
    var days = raw.days && typeof raw.days === 'object' ? raw.days : {};
    Object.keys(days).forEach(function (key) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
      var r = days[key] || {};
      var day = {
        sugar: r.sugar === 'free' || r.sugar === 'sugar' ? r.sugar : null,
        fasted: r.fasted === true,
        exercise: []
      };
      (Array.isArray(r.exercise) ? r.exercise : []).forEach(function (e) {
        var m = Math.round(Number(e && e.minutes));
        if (isFinite(m) && m > 0) day.exercise.push({ id: String((e && e.id) || newId()), minutes: m });
      });
      out.days[key] = day;
    });
    return out;
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) data = sanitize(JSON.parse(raw));
    } catch (e) {
      data = fresh();
      saveOk = false;
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      saveOk = true;
    } catch (e) {
      saveOk = false;
    }
    return saveOk;
  }

  function ensureDay(key) {
    if (!data.days[key]) data.days[key] = { sugar: null, fasted: false, exercise: [] };
    return data.days[key];
  }

  /** Drops a day that has nothing logged, so the saved data stays tidy. */
  function prune(key) {
    var d = data.days[key];
    if (d && !d.sugar && !d.fasted && !d.exercise.length) delete data.days[key];
  }

  window.Store = {
    load: load,
    saveOk: function () { return saveOk; },
    days: function () { return data.days; },
    settings: function () { return data.settings; },

    getDay: function (key) {
      return data.days[key] || { sugar: null, fasted: false, exercise: [] };
    },

    dayMinutes: function (key) {
      return this.getDay(key).exercise.reduce(function (sum, e) { return sum + e.minutes; }, 0);
    },

    setSugar: function (key, value) {
      ensureDay(key).sugar = value === 'free' || value === 'sugar' ? value : null;
      prune(key);
      return save();
    },

    setFasted: function (key, fasted) {
      ensureDay(key).fasted = !!fasted;
      prune(key);
      return save();
    },

    addExercise: function (key, minutes) {
      var id = newId();
      ensureDay(key).exercise.push({ id: id, minutes: Math.round(minutes) });
      save();
      return id;
    },

    removeExercise: function (key, id) {
      var d = data.days[key];
      if (!d) return;
      d.exercise = d.exercise.filter(function (e) { return e.id !== id; });
      prune(key);
      save();
    },

    setFastTimes: function (start, end) {
      data.settings.fastStart = start;
      data.settings.fastEnd = end;
      return save();
    },

    reset: function () {
      data = fresh();
      return save();
    }
  };
})();
