(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Page colour follows the section you're in ---------- */
  const themed = [...document.querySelectorAll('[data-bg]')];
  const setTheme = t => { if (root.dataset.theme !== t) root.dataset.theme = t; };
  setTheme('porcelain');
  if ('IntersectionObserver' in window) {
    // A thin band across the middle of the screen decides the colour
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setTheme(e.target.dataset.bg); });
    }, { rootMargin: '-48% 0px -48% 0px' });
    themed.forEach(s => io.observe(s));
  }

  /* ---------- 2. Statement: split into words for the scroll reveal ---------- */
  const stmt = document.querySelector('.js-words');
  if (stmt && !reduce && CSS.supports('(animation-timeline: view()) and (animation-range: entry)')) {
    const words = stmt.textContent.trim().split(/\s+/);
    stmt.setAttribute('aria-label', stmt.textContent.trim());
    stmt.textContent = '';
    const n = words.length;
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = w;
      const a = 18 + (i / n) * 34;           // words light up across cover 18% → 56%
      s.style.animationRange = `cover ${a.toFixed(1)}% cover ${(a + 7).toFixed(1)}%`;
      stmt.append(s, document.createTextNode(i < n - 1 ? ' ' : ''));
    });
  }

  /* ---------- 3. Live studio hours (America/New_York) ---------- */
  const HOURS = { 1: [10, 16], 2: [10, 16], 3: [10, 16], 4: [10, 16], 5: [10, 16], 6: [9, 13] };
  const fmt = h => (h > 12 ? h - 12 : h) + (h >= 12 ? ' PM' : ' AM');
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    const now = (+get('hour') % 24) + (+get('minute')) / 60;
    const el = document.querySelector('.js-open');
    const today = HOURS[day];
    if (el) {
      if (today && now >= today[0] && now < today[1]) {
        el.textContent = 'Open now · until ' + fmt(today[1]);
      } else {
        let d = day, tries = 0, label;
        if (today && now < today[0]) label = 'today';
        else {
          do { d = (d + 1) % 7; tries++; } while (!HOURS[d] && tries < 7);
          label = tries === 1 ? 'tomorrow' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d];
        }
        el.textContent = 'Opens ' + label + ' ' + fmt(HOURS[d][0]);
        el.classList.add('is-closed');
      }
    }
    document.querySelectorAll('.hours [data-days]').forEach(r => {
      if (r.dataset.days.split(',').map(Number).includes(day)) r.classList.add('is-today');
    });
  } catch (e) { /* static hours stay visible */ }

  /* ---------- 4. Smooth in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); const t = id.length > 1 && document.querySelector(id);
    if (!t) return; e.preventDefault();
    t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  }));

  /* ---------- 5. Wedding inquiry (front-end only; wire to Netlify Forms) ---------- */
  const form = document.querySelector('.form');
  const sent = document.querySelector('.sent');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.name.value.trim() || !form.email.value || !form.email.checkValidity()) {
        form.classList.add('is-error');
        (form.name.value.trim() ? form.email : form.name).focus();
        return;
      }
      const first = form.name.value.trim().split(/\s|&|and/)[0];
      sent.querySelector('.js-name').textContent = first ? ', ' + first : '';
      const d = new Date(); let added = 0;
      while (added < 2) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) added++; }
      sent.querySelector('.js-day').textContent = d.toLocaleDateString('en-US', { weekday: 'long' });
      form.hidden = true; sent.hidden = false;
    });
  }
})();
