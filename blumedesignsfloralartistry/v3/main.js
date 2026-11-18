(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const lite = /[?&]lite\b/.test(location.search);
  if (lite) root.classList.add('lite');
  // Diagnostic flags (?t=a|b|c|d) used to find what crashes iPhone Safari
  const T = (location.search.match(/[?&]t=([a-z])/) || [])[1];
  const OFF = { a: ['no-intro'], b: ['no-intro', 'no-heroanim'], c: ['no-intro', 'no-heroanim', 'no-sticky'], d: ['no-sda'] }[T] || [];
  OFF.forEach(c => root.classList.add(c));
  const off = c => OFF.includes(c);
  const reduce = lite || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const sda = CSS.supports('(animation-timeline: view()) and (animation-range: entry)');

  /* ---------- 0. Intro curtain (once per visit) ---------- */
  let seen = false;
  try { seen = sessionStorage.getItem('blume-intro') === '1'; sessionStorage.setItem('blume-intro', '1'); } catch (e) {}
  if (!reduce && !seen && !off('no-intro')) {
    const intro = document.createElement('div');
    intro.className = 'intro';
    intro.setAttribute('aria-hidden', 'true');
    const p = document.createElement('p');
    [...'Blume'].forEach((ch, i) => { const s = document.createElement('span'); s.textContent = ch; s.style.setProperty('--i', i); p.append(s); });
    const small = document.createElement('small'); small.textContent = 'Floral artistry · Daniel Island';
    intro.append(p, small);
    document.body.append(intro);
    root.classList.add('has-intro');
    setTimeout(() => intro.remove(), 3000);
  }

  /* ---------- 1. Page colour follows the room you're in ---------- */
  const setTheme = t => { if (root.dataset.theme !== t) root.dataset.theme = t; };
  setTheme('noir');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setTheme(e.target.dataset.bg); }), { rootMargin: '-48% 0px -48% 0px' });
    document.querySelectorAll('[data-bg]').forEach(s => io.observe(s));
  }
  const onScrollNav = () => root.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScrollNav, { passive: true }); onScrollNav();

  /* ---------- 2. Hero: aim the dive at the stem of the “l” ---------- */
  const mask = document.querySelector('.hero__mask');
  const ell = document.querySelector('.js-l');
  const aim = () => {
    if (!mask || !ell) return;
    // Measure without the scroll transform applied
    const prev = mask.style.animation; mask.style.animation = 'none';
    const m = mask.getBoundingClientRect(), l = ell.getBoundingClientRect();
    mask.style.animation = prev;
    const ox = l.left + l.width * 0.5 - m.left;
    const oy = l.top + l.height * 0.56 - m.top;
    mask.style.setProperty('--ox', ox.toFixed(1) + 'px');
    mask.style.setProperty('--oy', oy.toFixed(1) + 'px');
  };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(aim);
  setTimeout(aim, 2400); setTimeout(aim, 4200);
  addEventListener('resize', () => { clearTimeout(aim.t); aim.t = setTimeout(aim, 150); });

  /* ---------- 3. Statement: split into words (keeps <em>) ---------- */
  const stmt = document.querySelector('.js-words');
  if (stmt && !reduce && (fine ? sda : true)) {
    stmt.setAttribute('aria-label', stmt.textContent.replace(/\s+/g, ' ').trim());
    const words = [];
    const walk = (node, into) => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { into.append(document.createTextNode(' ')); return; }
            const s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.textContent = part; into.append(s); words.push(s);
          });
        } else if (n.nodeType === 1) {
          const clone = n.cloneNode(false); into.append(clone); walk(n, clone);
        }
      });
    };
    const frag = document.createElement('div'); walk(stmt, frag);
    stmt.replaceChildren(...frag.childNodes);
    words.forEach((s, i) => {
      s.style.setProperty('--i', i);
      const a = 14 + (i / words.length) * 36;
      s.style.animationRange = `cover ${a.toFixed(1)}% cover ${(a + 9).toFixed(1)}%`;
    });
  }

  /* ---------- 4. Candlelight follows the cursor ---------- */
  const spot = document.querySelector('.spot');
  if (spot && fine && !reduce) {
    let tx = 50, ty = 42, x = 50, y = 42, raf = null;
    const tick = () => {
      x += (tx - x) * 0.09; y += (ty - y) * 0.09;
      spot.style.setProperty('--x', x.toFixed(2) + '%'); spot.style.setProperty('--y', y.toFixed(2) + '%');
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.05 ? requestAnimationFrame(tick) : null;
    };
    spot.addEventListener('pointermove', e => {
      const r = spot.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 100; ty = ((e.clientY - r.top) / r.height) * 100;
      if (!raf) raf = requestAnimationFrame(tick);
    });
  }

  /* ---------- 4b. Touch motion: JS equivalents of the desktop-only scroll effects ----------
     iPhone Safari crashed on some CSS scroll-timeline effects, so touch screens drive them here instead. */
  if (!fine && !reduce) {
    root.classList.add('touch-motion');
    const hero = document.querySelector('.hero');
    const img = document.querySelector('.hero__img');
    const fades = document.querySelectorAll('.hero__top, .hero__bottom');
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
    let ticking = false;
    const frame = () => {
      ticking = false;
      if (hero && mask && !off('no-heroanim') && !off('no-sticky')) {
        const r = hero.getBoundingClientRect();
        if (r.bottom > 0) {
          const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
          mask.style.opacity = (1 - smooth(0.18, 0.78, p)).toFixed(3);
          mask.style.transform = `scale(${(1 + 0.3 * p).toFixed(4)})`;
          if (img) img.style.transform = `scale(${(1.22 - 0.22 * p).toFixed(4)})`;
          const f = (1 - clamp(p / 0.14)).toFixed(3);
          fades.forEach(el => { el.style.opacity = f; });
        }
      }
      if (spot) {
        const r = spot.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight) {
          const p = smooth(0.15, 0.85, (innerHeight - r.top) / (innerHeight + r.height));
          // path: top-left → middle-right → lower-centre
          const x = p < 0.5 ? 25 + (70 - 25) * (p / 0.5) : 70 + (38 - 70) * ((p - 0.5) / 0.5);
          const y = p < 0.5 ? 22 + (48 - 22) * (p / 0.5) : 48 + (78 - 48) * ((p - 0.5) / 0.5);
          spot.style.setProperty('--x', x.toFixed(1) + '%');
          spot.style.setProperty('--y', y.toFixed(1) + '%');
        }
      }
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
    frame();
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.15 });
      document.querySelectorAll('.print, .foot__word, .unveil, .statement__text').forEach(el => io.observe(el));
    } else {
      document.querySelectorAll('.print, .foot__word, .unveil, .statement__text').forEach(el => el.classList.add('is-in'));
    }
  }

  /* ---------- 5. Custom cursor ---------- */
  if (fine && !reduce) {
    const c = document.createElement('div'); c.className = 'cursor'; c.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span'); c.append(label); document.body.append(c);
    root.classList.add('has-cursor');
    let cx = -100, cy = -100, px = -100, py = -100;
    addEventListener('pointermove', e => { cx = e.clientX; cy = e.clientY; }, { passive: true });
    const loop = () => { px += (cx - px) * 0.2; py += (cy - py) * 0.2; c.style.transform = `translate(${px}px, ${py}px)`; requestAnimationFrame(loop); };
    loop();
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor], a, button');
      c.classList.remove('is-big', 'is-link');
      if (!t) return;
      if (t.dataset.cursor) { label.textContent = t.dataset.cursor; c.classList.add('is-big'); }
      else c.classList.add('is-link');
    });
    document.addEventListener('pointerleave', () => { cx = cy = -100; });
  }

  /* ---------- 6. Smooth scrolling on desktop ---------- */
  let lenis = null;
  const startLenis = () => {
    if (!fine || reduce || !window.Lenis) return;
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  };
  if (document.readyState === 'complete') startLenis(); else addEventListener('load', startLenis);

  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); const t = id.length > 1 && document.querySelector(id);
    if (!t) return; e.preventDefault();
    if (lenis) lenis.scrollTo(t, { offset: -80, duration: 1.6 });
    else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  }));

  /* ---------- 7. Live studio hours (America/New_York) ---------- */
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
      if (today && now >= today[0] && now < today[1]) el.textContent = 'Open now · until ' + fmt(today[1]);
      else {
        let d = day, tries = 0, label;
        if (today && now < today[0]) label = 'today';
        else { do { d = (d + 1) % 7; tries++; } while (!HOURS[d] && tries < 7); label = tries === 1 ? 'tomorrow' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]; }
        el.textContent = 'Opens ' + label + ' ' + fmt(HOURS[d][0]);
        el.classList.add('is-closed');
      }
    }
    document.querySelectorAll('.hours [data-days]').forEach(r => { if (r.dataset.days.split(',').map(Number).includes(day)) r.classList.add('is-today'); });
  } catch (e) {}

  /* ---------- 8. Wedding inquiry (front-end only; wire to Netlify Forms) ---------- */
  const form = document.querySelector('.form');
  const sent = document.querySelector('.sent');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.name.value.trim() || !form.email.value || !form.email.checkValidity()) {
      form.classList.add('is-error'); (form.name.value.trim() ? form.email : form.name).focus(); return;
    }
    const first = form.name.value.trim().split(/\s|&|and/)[0];
    sent.querySelector('.js-name').textContent = first ? ', ' + first : '';
    const d = new Date(); let added = 0;
    while (added < 2) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) added++; }
    sent.querySelector('.js-day').textContent = d.toLocaleDateString('en-US', { weekday: 'long' });
    form.hidden = true; sent.hidden = false;
  });
})();
