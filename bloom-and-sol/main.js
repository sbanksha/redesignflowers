(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  requestAnimationFrame(function () { setTimeout(function () { document.querySelector('.hero').classList.add('is-ready'); }, 150); });

  /* ---------- Central-time clock ---------- */
  function central() {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { d: days[o.weekday], h: (+o.hour % 24) + (+o.minute) / 60, y: +o.year, m: +o.month, day: +o.day };
  }
  // studio hours (Square business hours), 24h
  var HOURS = { 0: [13, 19], 1: [10, 17], 2: [10, 17], 3: [10, 17], 4: [10, 17], 5: [10, 17], 6: [9, 19] };
  var NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function fmt(h) { var hh = Math.floor(h), ap = hh >= 12 ? 'PM' : 'AM'; hh = hh % 12 || 12; return hh + ' ' + ap; }
  function status() {
    var t = central(), today = HOURS[t.d], el = document.getElementById('openText'), wrap = document.getElementById('openState');
    var row = document.querySelector('#hours tr[data-d="' + t.d + '"]');
    if (row) row.classList.add('is-today');
    if (t.h >= today[0] && t.h < today[1]) {
      wrap.classList.add('is-open');
      el.textContent = 'Open now · until ' + fmt(today[1]);
    } else {
      wrap.classList.remove('is-open');
      var nd = t.d, open;
      if (t.h < today[0]) { open = 'today at ' + fmt(today[0]); }
      else { nd = (t.d + 1) % 7; open = (nd === (t.d + 1) % 7 ? 'tomorrow' : NAMES[nd]) + ' at ' + fmt(HOURS[nd][0]); }
      el.textContent = 'Closed · opens ' + open;
    }
  }
  try { status(); setInterval(status, 60000); } catch (e) {}

  /* ---------- Shop: budget + category ---------- */
  var range = document.getElementById('budgetRange'), out = document.getElementById('budgetOut'),
      count = document.getElementById('budgetCount'), cards = [].slice.call(document.querySelectorAll('.card-p')),
      chips = [].slice.call(document.querySelectorAll('.chip')), empty = document.getElementById('gridEmpty'), cat = 'all';
  var grid = document.getElementById('grid'), moreWrap = document.getElementById('moreWrap'), capped = true;
  var CAP = window.matchMedia('(max-width:640px)').matches ? 9 : 12;
  cards.forEach(function (c, i) { if (i >= CAP) c.classList.add('is-extra'); });
  function setCap(on) { capped = on; grid.classList.toggle('is-capped', on); moreWrap.hidden = !on; }
  if (grid) { setCap(true); document.getElementById('moreBtn').addEventListener('click', function () { setCap(false); cards[CAP].querySelector('a').focus({ preventScroll: true }); }); }
  function apply() {
    var max = +range.value, n = 0;
    if (capped && !(cat === 'all' && max >= +range.max)) setCap(false);
    range.style.setProperty('--p', ((max - range.min) / (range.max - range.min) * 100) + '%');
    cards.forEach(function (c) {
      var ok = (cat === 'all' || c.dataset.cat === cat) && +c.dataset.low <= max;
      c.hidden = !ok; if (ok) n++;
    });
    var any = max >= +range.max;
    out.textContent = any ? 'Any' : '$' + max;
    count.textContent = any ? (cat === 'all' ? 'Showing everything. Slide to see what fits.' : n + ' designs in this style.')
      : n + (n === 1 ? ' design starts' : ' designs start') + ' at $' + max + ' or less.';
    empty.hidden = n > 0;
  }
  if (range) {
    range.addEventListener('input', apply); apply();
    chips.forEach(function (ch) {
      ch.addEventListener('click', function () {
        chips.forEach(function (x) { x.classList.remove('is-on'); x.setAttribute('aria-pressed', 'false'); });
        ch.classList.add('is-on'); ch.setAttribute('aria-pressed', 'true'); cat = ch.dataset.cat; apply();
      });
    });
  }

  /* ---------- Events index: swap stage image ---------- */
  var rows = [].slice.call(document.querySelectorAll('.svc__row')), stage = document.getElementById('svcImg');
  function show(r) {
    if (r.classList.contains('is-on')) return;
    rows.forEach(function (x) { x.classList.remove('is-on'); });
    r.classList.add('is-on');
    stage.classList.add('fade');
    setTimeout(function () { stage.src = r.dataset.img; stage.alt = r.dataset.alt; }, 160);
  }
  stage && stage.addEventListener('load', function () { stage.classList.remove('fade'); });
  rows.forEach(function (r) { r.addEventListener('mouseenter', function () { show(r); }); r.tabIndex = 0; r.addEventListener('focus', function () { show(r); }); });

  /* ---------- Workshop countdown ---------- */
  try {
    var t = central(), target = Date.UTC(2026, 10, 25), now = Date.UTC(t.y, t.m - 1, t.day), days = Math.round((target - now) / 864e5);
    var wc = document.getElementById('wsCount');
    if (days > 1) wc.textContent = days + ' days out · spaces are limited';
    else if (days === 1) wc.textContent = 'Tomorrow night · last spots';
    else if (days === 0) wc.textContent = 'Tonight at 6';
    else { wc.textContent = 'This one’s done. Ask about the next.'; var b = document.getElementById('wsBtn'); b.textContent = 'Ask about the next one'; b.href = '#inquire'; b.removeAttribute('target'); }
  } catch (e) {}

  /* ---------- Inquiry: live party card ---------- */
  var form = document.getElementById('form');
  if (!form) return;
  var $ = function (id) { return document.getElementById(id); };
  var guestOut = $('guestOut');
  function niceDate(v) {
    if (!v) return 'Pick a date';
    var p = v.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    var s = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    var t = central(), diff = Math.round((Date.UTC(+p[0], +p[1] - 1, +p[2]) - Date.UTC(t.y, t.m - 1, t.day)) / 864e5);
    return diff >= 0 ? s + ' · ' + (diff === 0 ? 'today!' : diff + ' days away') : s;
  }
  function sync() {
    var f = form.elements;
    $('cOcc').textContent = f.occasion.value || 'Something good';
    $('cName').textContent = f.name.value || '—';
    $('cDate').textContent = niceDate(f.date.value);
    $('cVenue').textContent = f.venue.value || '—';
    $('cGuests').textContent = f.guests.value + (+f.guests.value >= 400 ? '+' : '');
    guestOut.textContent = $('cGuests').textContent;
    var svc = [].slice.call(form.querySelectorAll('input[name="services[]"]:checked')).map(function (i) { return i.value; });
    $('cSvc').textContent = svc.length ? svc.join(', ') : '—';
    var b = form.querySelector('input[name="budget"]:checked'); $('cBudget').textContent = b ? b.value : '—';
  }
  form.addEventListener('input', sync); form.addEventListener('change', sync); sync();

  // buttons that preselect a service
  [].forEach.call(document.querySelectorAll('[data-service]'), function (a) {
    a.addEventListener('click', function () {
      var box = form.querySelector('input[value="' + a.dataset.service + '"]'); if (box) { box.checked = true; sync(); }
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var done = function () { $('inquire').classList.add('is-sent'); var d = $('done'); d.hidden = false; d.focus(); d.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
    if (location.protocol === 'file:') return done();
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() })
      .then(done, done);
  });
})();
