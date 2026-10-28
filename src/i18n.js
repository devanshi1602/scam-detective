/* Scam Detective — languages.
 * UI text: T('English text') returns the translation for the current language (or the English text).
 * Game content (messages, case files, investigations) is translated by overlaying a language pack onto the
 * live data objects, so every screen, panel and the read-aloud voice switch language together.
 * Packs register with I18N.add(lang, { name, speech, ui: {...}, messages: {id: {...}}, stories: {id: {...}}, inv: {id: {...}} }). */
(function (root) {
  'use strict';
  var packs = {}, english = null, missing = {};
  var I18N = { lang: 'en', packs: packs, missing: missing };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function sources() {
    var C = root.Cases, out = { messages: {}, stories: {}, inv: {} };
    if (C) { C.MESSAGES.forEach(function (m) { out.messages[m.id] = m; }); (C.STORIES || []).forEach(function (s) { out.stories[s.id] = s; }); }
    (root.Investigations || []).forEach(function (v) { out.inv[v.id] = v; });
    return out;
  }
  // copy every string in `over` onto `target`, keeping structure (arrays by index, objects by key)
  function overlay(target, over) {
    Object.keys(over).forEach(function (k) {
      if (!(k in target) || k === 'badge' || k === 'id') return;
      var o = over[k];
      if (typeof o === 'string') { if (typeof target[k] === 'string') target[k] = o; }
      else if (o && typeof o === 'object' && target[k] && typeof target[k] === 'object') overlay(target[k], o);
    });
  }
  function restore(target, orig) {
    Object.keys(orig).forEach(function (k) {
      var o = orig[k];
      if (typeof o === 'string') target[k] = o;
      else if (o && typeof o === 'object' && target[k] && typeof target[k] === 'object') restore(target[k], o);
    });
  }

  I18N.add = function (lang, pack) {
    var p = packs[lang] = packs[lang] || { ui: {}, messages: {}, stories: {}, inv: {} };
    ['name', 'speech', 'font'].forEach(function (k) { if (pack[k]) p[k] = pack[k]; });
    ['ui', 'messages', 'stories', 'inv'].forEach(function (k) { if (pack[k]) for (var id in pack[k]) p[k][id] = pack[k][id]; });
  };
  I18N.T = function (s, vars) {
    var out = s;
    if (I18N.lang !== 'en') {
      var p = packs[I18N.lang], t = p && p.ui[s];
      if (t !== undefined) out = t; else if (s && /[A-Za-z]/.test(s)) missing[s] = 1;
    }
    if (vars) out = out.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
    return out;
  };
  I18N.setLang = function (lang) {
    if (lang !== 'en' && !packs[lang]) lang = 'en';
    var src = sources();
    if (!english) english = clone(src);
    ['messages', 'stories', 'inv'].forEach(function (kind) {
      for (var id in src[kind]) if (english[kind][id]) restore(src[kind][id], english[kind][id]);
    });
    if (lang !== 'en') {
      var p = packs[lang];
      ['messages', 'stories', 'inv'].forEach(function (kind) {
        for (var id in p[kind]) if (src[kind][id]) overlay(src[kind][id], p[kind][id]);
      });
    }
    I18N.lang = lang;
    if (root.document && root.document.documentElement) root.document.documentElement.lang = lang;
    return lang;
  };
  I18N.speechLang = function () { var p = packs[I18N.lang]; return (p && p.speech) || 'en-IN'; };
  I18N.languages = function () { return ['en'].concat(Object.keys(packs)); };
  I18N.langName = function (l) { return l === 'en' ? 'English' : (packs[l] && packs[l].name) || l; };
  I18N.english = function () { if (!english) english = clone(sources()); return english; };

  if (typeof module !== 'undefined' && module.exports) module.exports = I18N; else root.I18N = I18N;
})(this);
