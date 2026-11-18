(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Smooth anchor scrolling (JS so screenshots and reduced-motion stay instant) */
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const el = document.querySelector(id); if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', id);
  }));

  /* BEFORE / AFTER slider */
  const stage = document.querySelector('.compare-stage');
  const handle = stage && stage.querySelector('.handle');
  if (stage) {
    let pos = 50, dragging = false, touched = false;
    const set = (p) => {
      pos = Math.max(0, Math.min(100, p));
      stage.style.setProperty('--pos', pos + '%');
      handle.setAttribute('aria-valuenow', Math.round(pos));
    };
    const fromEvent = (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      set((x / r.width) * 100);
    };
    stage.addEventListener('pointerdown', (e) => { dragging = true; touched = true; stage.classList.add('drag'); stage.setPointerCapture(e.pointerId); fromEvent(e); });
    stage.addEventListener('pointermove', (e) => { if (dragging) fromEvent(e); });
    const end = () => { dragging = false; stage.classList.remove('drag'); };
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    handle.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { set(pos - 5); touched = true; e.preventDefault(); }
      if (e.key === 'ArrowRight') { set(pos + 5); touched = true; e.preventDefault(); }
    });
    set(50);

    // Auto-demo: sweep once when it enters view, until the visitor touches it
    if (!reduce && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting || touched) return;
        io.disconnect();
        const keys = [[0, 50], [900, 84], [1900, 16], [2900, 50]];
        const t0 = performance.now();
        const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const tick = (now) => {
          if (touched) return;
          const t = now - t0;
          let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
          const [ta, pa] = keys[i], [tb, pb] = keys[i + 1];
          const k = Math.min(1, Math.max(0, (t - ta) / (tb - ta)));
          set(pa + (pb - pa) * ease(k));
          if (t < keys[keys.length - 1][0]) requestAnimationFrame(tick);
        };
        setTimeout(() => requestAnimationFrame(tick), 500);
      }, { threshold: .55 });
      io.observe(stage);
    }
  }

  /* Recolor the page per case study */
  const cases = [...document.querySelectorAll('.case')];
  const body = document.body;
  if ('IntersectionObserver' in window) {
    const themeIO = new IntersectionObserver(() => {
      const mid = innerHeight / 2;
      let theme = 'paper';
      for (const c of cases) {
        const r = c.getBoundingClientRect();
        if (r.top < mid && r.bottom > mid) theme = c.dataset.theme;
      }
      body.dataset.theme = theme;
    }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
    cases.forEach((c) => themeIO.observe(c));
  }

  /* Scroll each screenshot inside its device as the case passes through */
  const screens = [...document.querySelectorAll('.device .screen')];
  const measure = () => screens.forEach((s) => {
    const img = s.querySelector('img');
    const travel = Math.max(0, img.getBoundingClientRect().height - s.clientHeight);
    s.style.setProperty('--travel', travel + 'px');
  });
  screens.forEach((s) => { const img = s.querySelector('img'); if (img.complete) measure(); else img.addEventListener('load', measure); });
  addEventListener('resize', measure);
  if (!reduce) {
    let ticking = false;
    const update = () => {
      ticking = false;
      for (const c of cases) {
        const r = c.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (r.height + innerHeight)));
        // ease so the top of the site holds a moment before scrolling
        const e = Math.min(1, Math.max(0, (p - .18) / .64));
        c.querySelectorAll('.screen').forEach((s) => s.style.setProperty('--p', e.toFixed(4)));
      }
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }
})();
