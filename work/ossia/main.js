(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- 1. Weddings index: floating image that trails the cursor ---------- */
  const float = document.querySelector('.float');
  const floatImg = float && float.querySelector('img');
  const rows = document.querySelectorAll('.index__row');
  if (float && fine && window.innerWidth > 760) {
    // x trails the cursor; y parks the photo just above (or below) the hovered row so it never covers that row's text
    let x = 0, y = 0, tx = 0, ty = 0, raf = null, on = false, active = null, mx = 0;
    const place = () => {
      if (!active) return;
      const r = active.getBoundingClientRect(), h = float.offsetHeight, w = float.offsetWidth;
      ty = r.top - h - 14 > 70 ? r.top - h - 14 : r.bottom + 14;
      tx = Math.min(Math.max(mx - w / 2, 16), innerWidth - w - 140);
    };
    const tick = () => {
      x += (tx - x) * (reduce ? 1 : 0.14);
      y += (ty - y) * (reduce ? 1 : 0.14);
      const tilt = reduce ? 0 : Math.max(-5, Math.min(5, (tx - x) * 0.03));
      float.style.transform = `translate(${x}px, ${y}px) rotate(${tilt}deg)`;
      raf = on || Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : null;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const idx = document.querySelector('.index');
    idx.addEventListener('mousemove', e => { mx = e.clientX; place(); kick(); });
    window.addEventListener('scroll', () => { if (on) { place(); kick(); } }, { passive: true });
    rows.forEach(row => {
      row.addEventListener('mouseenter', e => {
        const src = row.dataset.img;
        if (!floatImg.src.endsWith(src)) floatImg.src = src;
        active = row; mx = e.clientX; place();
        if (!on) { x = tx; y = ty; }
        on = true; float.classList.add('is-on'); kick();
      });
    });
    idx.addEventListener('mouseleave', () => { on = false; active = null; float.classList.remove('is-on'); });
    rows.forEach(r => { const i = new Image(); i.src = r.dataset.img; });
  }

  /* ---------- 2. Installations: pinned horizontal scroll ---------- */
  const track = document.querySelector('.install__track');
  const count = document.querySelector('.js-count');
  const plates = track ? [...track.querySelectorAll('figure.plate')] : [];
  let pinProg = null;
  const setCount = () => {
    // nearest card to the centre of the visible track area (right of the sticky heading on desktop)
    const head = document.querySelector('.install__head').getBoundingClientRect();
    const left = head.right > 0 && head.right < innerWidth * 0.5 && head.top < innerHeight * 0.5 ? head.right : 0;
    const mid = (left + innerWidth) / 2;
    let idx = 0, best = Infinity;
    plates.forEach((p, i) => { const r = p.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - mid); if (d < best) { best = d; idx = i; } });
    if (pinProg !== null) { if (pinProg < 0.03) idx = 0; else if (pinProg > 0.97) idx = plates.length - 1; }
    if (count) count.textContent = String(idx + 1).padStart(2, '0');
  };
  if (track) track.addEventListener('scroll', setCount, { passive: true });

  const initGsap = () => {
    if (!window.gsap || !window.ScrollTrigger || reduce) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add('(min-width: 761px)', () => {
      document.documentElement.classList.add('is-pinned');
      track.style.overflow = 'visible';
      const dist = () => Math.max(0, track.scrollWidth - track.clientWidth);
      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        onUpdate() { pinProg = this.progress(); setCount(); },
        scrollTrigger: {
          trigger: '.install',
          pin: '.install__pin',
          start: 'top top',
          end: () => '+=' + dist(),
          scrub: 0.6,
          invalidateOnRefresh: true,
        }
      });
      return () => { track.style.overflow = ''; document.documentElement.classList.remove('is-pinned'); tween.kill(); };
    });
    window.addEventListener('load', () => ScrollTrigger.refresh());
  };
  if (document.readyState === 'complete') initGsap(); else window.addEventListener('load', initGsap);

  /* ---------- smooth anchors (JS only, so programmatic scroll stays instant) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); const t = id.length > 1 && document.querySelector(id);
    if (!t) return; e.preventDefault();
    t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  }));

  /* ---------- 3. Inquiry form ---------- */
  const form = document.querySelector('.form');
  const sent = document.querySelector('.sent');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.name.value.trim() || !form.email.checkValidity() || !form.email.value) {
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
      sent.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
  }
})();
