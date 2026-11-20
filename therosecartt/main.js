/* The Rose Cart preview.
   iPhone-safe motion: ONE passive scroll listener feeding ONE requestAnimationFrame update.
   IntersectionObserver switches scenes on/off and shows the booking dock. Only transform and
   opacity change. Everything is visible without JS; reduced motion gets the finished state. */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - t, 3);

  /* ---------- Reveals ---------- */
  const revealEls = $$('.rv');
  if (!hasIO || reduce) revealEls.forEach(el => el.classList.add('in'));
  else {
    const rio = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
    }), { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });
    revealEls.forEach(el => rio.observe(el));
  }

  /* ---------- Send this page to a client ---------- */
  const share = $('.js-share'), shareDone = $('.planner__done');
  if (share) share.addEventListener('click', async () => {
    const url = share.dataset.url || location.href;
    const data = { title: 'The Rose Cart', text: 'A build-your-own bouquet bar for your event. Take a look:', url };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(url);
      shareDone.textContent = 'Link copied. Paste it into your email to the client.';
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      shareDone.textContent = 'Copy this link: ' + url;
    }
  });

  /* ---------- Package buttons preselect the form ---------- */
  const pkgSel = $('#f-pkg');
  $$('.js-pkg').forEach(a => a.addEventListener('click', () => { if (pkgSel) pkgSel.value = a.dataset.pkg; }));

  /* ---------- Booking form (front-end only) ---------- */
  const form = $('#book-form'), sent = $('.sent'), err = $('.form__err');
  const date = $('#f-date');
  if (date) {
    const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    date.min = d.toISOString().slice(0, 10);
  }
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const need = [
        ['#f-name', v => v.trim().length > 1],
        ['#f-email', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())],
        ['#f-date', v => !!v],
        ['#f-type', v => !!v],
      ];
      let first = null;
      need.forEach(([sel, ok]) => {
        const el = $(sel), wrap = el.closest('.f'), good = ok(el.value);
        wrap.classList.toggle('bad', !good);
        el.setAttribute('aria-invalid', good ? 'false' : 'true');
        if (!good && !first) first = el;
      });
      if (first) { err.textContent = 'Just need your name, email, event date and event type.'; first.focus(); return; }
      err.textContent = '';
      const name = $('#f-name').value.trim().split(/\s+/)[0];
      $('.sent__name').textContent = name ? ', ' + name : '';
      const dv = date.value ? new Date(date.value + 'T12:00:00') : null;
      if (dv && !isNaN(dv)) {
        $('.sent__msg').textContent = 'Your request is in. We will reach out shortly about ' +
          dv.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + '.';
      }
      form.hidden = true;
      sent.hidden = false;
      requestAnimationFrame(() => sent.classList.add('in'));
      sent.focus({ preventScroll: true });
      sent.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
    form.addEventListener('input', e => {
      const w = e.target.closest('.f');
      if (w && w.classList.contains('bad')) { w.classList.remove('bad'); e.target.removeAttribute('aria-invalid'); }
    });
  }

  /* ---------- Booking dock (phones): after the hero, hidden near the form ---------- */
  const dock = $('.dock');
  if (dock && hasIO) {
    let pastHero = false, atBook = false;
    const set = () => dock.classList.toggle('on', pastHero && !atBook);
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; set(); }).observe($('.hero'));
    new IntersectionObserver(entries => { atBook = entries.some(e => e.isIntersecting); set(); }, { rootMargin: '0px 0px -10% 0px' })
      .observe($('.book'));
    const foot = $('.foot');
    new IntersectionObserver(([e]) => { dock.style.visibility = e.isIntersecting ? 'hidden' : ''; }).observe(foot);
  }

  if (reduce) return;

  /* ---------- Scenes ---------- */
  let vw = innerWidth, vh = innerHeight;
  const scenes = [];
  const scene = (el, update) => { if (el) scenes.push({ el, update, on: !hasIO }); };

  // A. Stems gather into a kraft-wrapped bouquet.
  const how = $('.how'), svg = $('.gather');
  if (svg) {
    const stems = $$('.st', svg).map(g => ({ g, dx: +g.dataset.dx, a: +g.dataset.a }));
    const buckets = $('.gather__buckets', svg), wrap = $('.gather__wrap', svg);
    let last = -1;
    const draw = p => {
      if (Math.abs(p - last) < 0.002) return;
      last = p;
      const t = ease(clamp(p / 0.62));
      stems.forEach(s => s.g.setAttribute('transform',
        `translate(${(s.dx * (1 - t)).toFixed(2)} ${(-14 * t).toFixed(2)}) rotate(${(s.a * t).toFixed(2)} 150 312)`));
      buckets.style.opacity = (1 - clamp(p / 0.45)).toFixed(3);
      const w = ease(clamp((p - 0.5) / 0.4));
      wrap.style.opacity = w.toFixed(3);
      wrap.setAttribute('transform', `translate(0 ${(46 * (1 - w)).toFixed(2)})`);
    };
    draw(0);
    scene(how, () => {
      let p;
      if (vw >= 900) {
        const r = how.getBoundingClientRect();
        p = clamp((vh * 0.55 - r.top) / (r.height * 0.55));
      } else {
        const r = svg.getBoundingClientRect();
        p = clamp((vh * 0.95 - r.top) / (vh * 0.7));
      }
      draw(p);
    });
  }

  // B. SIGNATURE: the umbrella fringe sways with scroll speed, then springs back.
  const fringes = $$('.awning').map(a => ({ el: a, i: $('.awning__fringe i', a), on: !hasIO }));
  let ang = 0, vel = 0, lastY = scrollY, swinging = false;
  if (hasIO) {
    const fio = new IntersectionObserver(entries => entries.forEach(e => {
      const f = fringes.find(x => x.el === e.target);
      if (!f) return;
      f.on = e.isIntersecting;
      f.i.style.willChange = f.on ? 'transform' : '';
    }));
    fringes.forEach(f => fio.observe(f.el));
  }
  const sway = () => {
    const y = scrollY, dy = y - lastY; lastY = y;
    const target = clamp(-dy * 0.5, -16, 16);
    vel += (target - ang) * 0.14;
    vel *= 0.8;
    ang += vel;
    if (Math.abs(ang) < 0.02 && Math.abs(vel) < 0.02 && dy === 0) { ang = 0; vel = 0; swinging = false; }
    else swinging = true;
    const tf = `skewX(${ang.toFixed(2)}deg)`;
    fringes.forEach(f => { if (f.on) f.i.style.transform = tf; });
  };

  if (hasIO) {
    const sio = new IntersectionObserver(entries => entries.forEach(e => {
      const s = scenes.find(x => x.el === e.target);
      if (!s) return;
      s.on = e.isIntersecting;
      if (s.on) s.update();
    }), { rootMargin: '15% 0px 15% 0px' });
    scenes.forEach(s => sio.observe(s.el));
  }

  /* ---------- One scroll listener, one rAF ---------- */
  let ticking = false;
  const tick = () => {
    ticking = false;
    for (const s of scenes) if (s.on) s.update();
    sway();
    if (swinging) request();
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } };
  addEventListener('scroll', request, { passive: true });
  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { vw = innerWidth; vh = innerHeight; request(); }, 120);
  }, { passive: true });
  request();
})();
