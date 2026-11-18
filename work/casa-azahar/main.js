/* CASA AZAHAR — progressive enhancement only. Without this file, the page is complete and in Spanish. */
/* Swap in the studio’s real WhatsApp number here (country code + number, digits only). Every link and displayed number uses it. */
var WA_NUMBER = '5213300000000';

(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = 'https://wa.me/' + WA_NUMBER;
  var local = WA_NUMBER.slice(-10);
  var display = local.slice(0, 2) + ' ' + local.slice(2, 6) + ' ' + local.slice(6);
  document.querySelectorAll('.js-wa-display').forEach(function (el) { el.textContent = display; });
  var lang = 'es';

  /* ---------- i18n: Spanish is in the DOM, English in data-en ---------- */
  var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-en]'));
  nodes.forEach(function (el) { el._es = el.innerHTML; });
  var phs = Array.prototype.slice.call(document.querySelectorAll('[data-en-ph]'));
  phs.forEach(function (el) { el._es = el.getAttribute('placeholder'); });
  var arias = Array.prototype.slice.call(document.querySelectorAll('[data-en-aria]'));
  arias.forEach(function (el) { el._es = el.getAttribute('aria-label'); });
  var META = {
    es: { title: 'Casa Azahar — Estudio Floral, Guadalajara' },
    en: { title: 'Casa Azahar — Floral Studio, Guadalajara' }
  };

  function setLang(l) {
    lang = l;
    doc.lang = l === 'es' ? 'es-MX' : 'en';
    nodes.forEach(function (el) { el.innerHTML = l === 'es' ? el._es : el.getAttribute('data-en'); });
    phs.forEach(function (el) { el.setAttribute('placeholder', l === 'es' ? el._es : el.getAttribute('data-en-ph')); });
    arias.forEach(function (el) { el.setAttribute('aria-label', l === 'es' ? el._es : el.getAttribute('data-en-aria')); });
    document.querySelectorAll('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === l)); });
    document.title = META[l].title;
    document.querySelectorAll('[data-item], [data-wa]').forEach(function (x) { x.href = hrefFor(x); });
    updateStatus();
    try { localStorage.setItem('azahar-lang', l); } catch (e) {}
  }
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.dataset.lang); });
  });

  /* ---------- WhatsApp links, pre-filled in the current language ---------- */
  function waText(item, price) {
    if (item === 'custom') return lang === 'es' ? 'Hola Casa Azahar, quiero un arreglo a la medida. Mi presupuesto es de $' : 'Hi Casa Azahar, I’d like a custom arrangement. My budget is $';
    if (!item) return lang === 'es' ? 'Hola Casa Azahar, tengo una pregunta.' : 'Hi Casa Azahar, I have a question.';
    return lang === 'es'
      ? 'Hola Casa Azahar, quiero pedir: ' + item + ' ($' + price + ' MXN). ¿Lo tienen para hoy?'
      : 'Hi Casa Azahar, I’d like to order: ' + item + ' ($' + price + ' MXN). Is it available today?';
  }
  function hrefFor(el) {
    if (el.dataset.wa === 'custom') return WA + '?text=' + encodeURIComponent(waText('custom'));
    var item = lang === 'es' ? el.dataset.item : (el.dataset.itemEn || el.dataset.item);
    return WA + '?text=' + encodeURIComponent(waText(item, el.dataset.price));
  }
  document.querySelectorAll('[data-item], [data-wa]').forEach(function (a) {
    var sync = function () { a.href = hrefFor(a); };
    sync();
    a.addEventListener('pointerenter', sync);
    a.addEventListener('focus', sync);
    a.addEventListener('click', sync);
  });

  /* ---------- Live studio status (Guadalajara time) ---------- */
  function gdlNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      return { d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday), h: (+o.hour) % 24, m: +o.minute };
    } catch (e) { var n = new Date(); return { d: n.getDay(), h: n.getHours(), m: n.getMinutes() }; }
  }
  function updateStatus() {
    var t = gdlNow(), mins = t.h * 60 + t.m;
    var open = 0, close = 0;
    if (t.d >= 1 && t.d <= 5) { open = 600; close = 1140; } else if (t.d === 6) { open = 540; close = 900; }
    var isOpen = close && mins >= open && mins < close;
    var hh = String(t.h).padStart(2, '0') + ':' + String(t.m).padStart(2, '0');
    var es, en;
    if (isOpen) {
      var cutoff = mins < 780;
      var c = close === 1140 ? '7' : '3';
      es = hh + ' en Guadalajara · Abierto hasta las ' + c + (cutoff ? ' · Pide antes de la 1 y llega hoy' : ' · Lo que pidas hoy llega mañana');
      en = hh + ' in Guadalajara · Open until ' + c + ' pm' + (cutoff ? ' · Order before 1 for same-day' : ' · Orders now arrive tomorrow');
    } else {
      var next = (t.d === 6 && mins >= 900) || t.d === 0 ? 'el lunes a las 10' : (mins < open ? 'hoy a las ' + (open / 60) : 'mañana a las ' + (t.d === 5 ? '9' : '10'));
      var nextEn = (t.d === 6 && mins >= 900) || t.d === 0 ? 'Monday at 10' : (mins < open ? 'today at ' + (open / 60) : 'tomorrow at ' + (t.d === 5 ? '9' : '10'));
      es = hh + ' en Guadalajara · Cerrado, abrimos ' + next + ' · WhatsApp sí contesta';
      en = hh + ' in Guadalajara · Closed, back ' + nextEn + ' · WhatsApp still answers';
    }
    document.querySelectorAll('.js-status').forEach(function (s) {
      s.textContent = lang === 'es' ? es : en;
      s.parentNode.classList.toggle('is-closed', !isOpen);
    });
  }
  updateStatus();
  setInterval(updateStatus, 30000);

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.querySelector('.nav__menu'), links = document.getElementById('navlinks');
  menuBtn.addEventListener('click', function () {
    var o = links.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(o));
  });
  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  });

  /* ---------- Catalog tabs: each category is its own wall ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
  var stage = document.querySelector('.cat__stage');
  var bodas = document.getElementById('bodas');
  var COLORS = { rosa: '--rosa', ocre: '--ocre', verde: '--verde', buganvilia: '--buganvilia', tinta: '--tinta' };
  var current = 0;
  panels.forEach(function (p, i) { if (i) p.hidden = true; });
  function select(i, focus) {
    if (i === current) return;
    var prev = panels[current], next = panels[i];
    stage.style.background = 'var(' + COLORS[prev.dataset.wall] + ')';
    stage.style.minHeight = prev.offsetHeight + 'px';
    tabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    prev.hidden = true; next.hidden = false;
    bodas.style.setProperty('--prevbg', 'var(' + COLORS[next.dataset.wall] + ')');
    var dir = i > current ? 1 : -1;
    current = i;
    if (focus) tabs[i].focus();
    if (reduce || !next.animate) { stage.style.minHeight = ''; return; }
    next.animate([
      { clipPath: dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0 0 0)' }
    ], { duration: 750, easing: 'cubic-bezier(.75,0,.15,1)' }).onfinish = function () { stage.style.minHeight = ''; };
    var imgs = next.querySelectorAll('.win__frame img');
    imgs.forEach(function (img, k) {
      img.animate([{ transform: 'scale(1.12) translateX(' + (dir * 4) + '%)' }, { transform: 'none' }],
        { duration: 1100, delay: 80 * k, easing: 'cubic-bezier(.2,.7,.1,1)' });
    });
  }
  tabs.forEach(function (t, i) {
    t.tabIndex = i ? -1 : 0;
    t.addEventListener('click', function () { select(i); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); select((current + 1) % tabs.length, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); select((current - 1 + tabs.length) % tabs.length, true); }
    });
  });
  bodas.style.setProperty('--prevbg', 'var(--rosa)');

  /* ---------- Wedding quote form → WhatsApp ---------- */
  var form = document.getElementById('qform');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    var pres = form.querySelector('input[name=pres]:checked');
    var msg = lang === 'es'
      ? 'Hola Casa Azahar, queremos cotizar flores para boda.\nFecha: ' + (f.fecha.value || 'por definir') + '\nLugar: ' + (f.lugar.value || 'por definir') + '\nInvitados: ' + (f.invitados.value || '?') + '\nPresupuesto: ' + (pres ? pres.value : '?')
      : 'Hi Casa Azahar, we’d like a wedding flower quote.\nDate: ' + (f.fecha.value || 'TBD') + '\nVenue: ' + (f.lugar.value || 'TBD') + '\nGuests: ' + (f.invitados.value || '?') + '\nBudget: ' + (pres ? pres.value : '?');
    window.open(WA + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    form.querySelector('.qform__ok').hidden = false;
    form.querySelector('button[type=submit]').setAttribute('disabled', '');
  });

  try { var saved = localStorage.getItem('azahar-lang'); if (saved === 'en') setLang('en'); } catch (e) {}

  var fab = document.querySelector('.fab'), heroEl = document.querySelector('.hero');
  function fabCheck() { fab.classList.toggle('show', window.scrollY > heroEl.offsetHeight * 0.85); }
  window.addEventListener('scroll', fabCheck, { passive: true }); fabCheck();

  if (reduce) return;

  /* ---------- The sun + sliding walls, one rAF loop ---------- */
  var walls = Array.prototype.slice.call(document.querySelectorAll('.wall[data-prev] .plane'));
  var hero = document.querySelector('.hero');
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    var max = Math.max(1, doc.scrollHeight - vh);
    var sun = Math.min(1, Math.max(0, window.scrollY / max));
    doc.style.setProperty('--sun', (0.1 + sun * 0.85).toFixed(4));
    walls.forEach(function (pl) {
      var r = pl.parentNode.getBoundingClientRect();
      // wipe runs while the section top travels from 95% to 40% of the viewport
      var w = (vh * 0.95 - r.top) / (vh * 0.55);
      w = Math.min(1, Math.max(0, w));
      w = w < 0.5 ? 2 * w * w : 1 - Math.pow(-2 * w + 2, 2) / 2;
      pl.style.setProperty('--w', w.toFixed(4));
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();
})();
