(function () {
  function central() {
    var o = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false, year: 'numeric', month: 'numeric', day: 'numeric' })
      .formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
    return { d: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday], h: (+o.hour % 24) + (+o.minute) / 60, y: +o.year, m: +o.month, day: +o.day };
  }
  var HOURS = { 0: null, 1: [9, 17], 2: [9, 17], 3: [9, 17], 4: [9, 17], 5: [9, 17], 6: [10, 14] };
  var NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function fmt(h) { var a = h >= 12 ? 'PM' : 'AM'; return (h % 12 || 12) + ' ' + a; }
  function status() {
    var t = central(), today = HOURS[t.d], el = document.getElementById('openText'), w = document.getElementById('openState');
    var row = document.querySelector('#hours tr[data-d="' + t.d + '"]'); if (row) row.classList.add('is-today');
    if (today && t.h >= today[0] && t.h < today[1]) { w.classList.add('is-open'); el.textContent = 'Open now · until ' + fmt(today[1]); return; }
    w.classList.remove('is-open');
    if (today && t.h < today[0]) { el.textContent = 'Closed · opens today at ' + fmt(today[0]); return; }
    for (var i = 1; i < 8; i++) { var d = (t.d + i) % 7; if (HOURS[d]) { el.textContent = 'Closed · opens ' + (i === 1 ? 'tomorrow' : NAMES[d]) + ' at ' + fmt(HOURS[d][0]); return; } }
  }
  try { status(); setInterval(status, 60000); } catch (e) {}

  // doors: open on hover / focus (desktop)
  var doors = [].slice.call(document.querySelectorAll('.door'));
  function open(d) { doors.forEach(function (x) { x.classList.toggle('is-open', x === d); }); }
  doors.forEach(function (d) { d.addEventListener('mouseenter', function () { open(d); }); d.addEventListener('focus', function () { open(d); }); });

  // class calendar: strike past, count down to upcoming
  try {
    var t = central(), now = Date.UTC(t.y, t.m - 1, t.day), first = true;
    [].forEach.call(document.querySelectorAll('.ev'), function (ev) {
      var p = ev.dataset.date.split('-'), days = Math.round((Date.UTC(+p[0], +p[1] - 1, +p[2]) - now) / 864e5), w = ev.querySelector('.ev__when');
      if (days < 0) { ev.classList.add('is-past'); w.textContent = 'Done for this year'; return; }
      w.textContent = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : 'In ' + days + ' days';
      if (first) { w.textContent += ' · next up'; first = false; }
    });
  } catch (e) {}
})();
