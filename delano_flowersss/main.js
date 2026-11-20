/* Delano Flowers preview.
   iPhone-safe: ONE passive scroll listener feeding ONE requestAnimationFrame update,
   IntersectionObserver to switch scenes on and off, transform / opacity only.
   Every bit of content is in the HTML; this file only enhances it. */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- Dates: nothing in the past ---------- */
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  $$('input[type="date"]').forEach(i => { i.min = today; });

  /* ---------- Live satin ribbons (the signature) ---------- */
  // Shrink a ribbon's type when a long message would push it past its column.
  const fit = (ribbon) => {
    if (!ribbon) return;
    ribbon.style.fontSize = '';
    const box = ribbon.parentElement.clientWidth * (ribbon.classList.contains('ribbon--studio') ? 1.04 : 0.98);
    const t = ribbon.querySelector('.ribbon__txt');
    const cs = getComputedStyle(ribbon);
    const w = (t ? t.offsetWidth : ribbon.offsetWidth) + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    if (w > box) {
      const base = parseFloat(getComputedStyle(ribbon).fontSize);
      ribbon.style.fontSize = Math.max(13, base * box / w).toFixed(1) + 'px';
    }
  };
  const setRibbon = (txtEl, value) => {
    if (!txtEl) return;
    const v = (value || '').trim();
    txtEl.textContent = v || txtEl.dataset.default || '';
    fit(txtEl.closest('.ribbon'));
  };

  // Shop cards
  $$('input[data-ribbon]').forEach(inp => {
    const key = inp.dataset.ribbon;
    if (key === 'studio') return;
    const target = $(`[data-live="${key}"]`);
    inp.addEventListener('input', () => setRibbon(target, inp.value));
  });

  /* ---------- Ribbon Studio + order form ---------- */
  const form = $('#order-form');
  const studio = $('.studio');
  const sImg = $('.studio__img');
  const sRib = $('#studio-ribbon');
  const fBouquet = $('#f-bouquet');
  const fSize = $('#f-size');
  const fColor = $('#f-color');
  const fRib = $('#f-ribbon');
  const fDate = $('#f-date');
  const sumB = $('#sum-bouquet'), sumS = $('#sum-size'), sumG = $('#sum-get');

  const shortName = opt => opt.textContent.replace(/\s*\(.*\)$/, '');
  const syncBouquet = () => {
    const opt = fBouquet.selectedOptions[0];
    if (!opt) return;
    const src = opt.dataset.img;
    if (src) {
      studio.classList.remove('is-type');
      if (sImg.getAttribute('src') !== src) {
        if (reduce) { sImg.src = src; }
        else {
          sImg.style.opacity = '0';
          const pre = new Image();
          pre.onload = pre.onerror = () => { sImg.src = src; requestAnimationFrame(() => { sImg.style.opacity = ''; }); };
          pre.src = src;
        }
      }
    } else {
      studio.classList.add('is-type');
    }
    sRib.dataset.default = opt.dataset.ribbon || shortName(opt);
    fRib.placeholder = sRib.dataset.default;
    setRibbon(sRib, fRib.value);
    sumB.textContent = shortName(opt);
  };
  const syncSize = () => { sumS.textContent = fSize.value; };
  const syncGet = () => { const r = $('input[name="get"]:checked', form); sumG.textContent = r ? r.value : ''; };

  fBouquet.addEventListener('change', syncBouquet);
  fSize.addEventListener('change', syncSize);
  $$('input[name="get"]', form).forEach(r => r.addEventListener('change', syncGet));
  fRib.addEventListener('input', () => setRibbon(sRib, fRib.value));
  fRib.addEventListener('focus', () => studio.classList.add('typing'));
  fRib.addEventListener('blur', () => studio.classList.remove('typing'));

  // Carry a card's choices (or a seasonal pick) into the request form
  const setSize = (val) => {
    if (!val) return;
    let o = [...fSize.options].find(x => x.value === val);
    if (!o) { o = new Option(val, val); fSize.add(o, fSize.options[fSize.options.length - 1]); }
    fSize.value = val;
  };
  $$('.js-carry').forEach(a => a.addEventListener('click', () => {
    const id = a.dataset.bouquet;
    if ([...fBouquet.options].some(o => o.value === id)) fBouquet.value = id;
    const card = a.closest('.item');
    if (card) {
      const pick = name => { const r = $(`input[name="${id}-${name}"]:checked`, card); return r ? r.value : ''; };
      setSize(pick('size'));
      const color = pick('color'); if (color) fColor.value = color;
      const get = pick('get'); const gr = $(`input[name="get"][value="${get}"]`, form); if (gr) gr.checked = true;
      const rib = $('input[data-ribbon]', card); fRib.value = rib ? rib.value : '';
      const dt = $('input[type="date"]', card); if (dt && dt.value) fDate.value = dt.value;
    } else {
      fRib.value = '';
    }
    syncBouquet(); syncSize(); syncGet();
  }));

  // Submit (front end only)
  const err = $('#form-err'), done = $('#form-done');
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const need = ['#f-name', '#f-phone', '#f-date'].map(s => $(s));
    let bad = null;
    need.forEach(i => {
      const miss = !i.value.trim();
      i.setAttribute('aria-invalid', miss ? 'true' : 'false');
      if (miss && !bad) bad = i;
    });
    if (bad) { err.hidden = false; bad.focus(); return; }
    err.hidden = true;
    const opt = fBouquet.selectedOptions[0];
    const get = $('input[name="get"]:checked', form);
    const msg = fRib.value.trim() || sRib.dataset.default;
    const when = new Date(fDate.value + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    $('#done-name').textContent = $('#f-name').value.trim().split(/\s+/)[0];
    $('#done-sum').textContent = `${shortName(opt)}, ${fSize.value}${fColor.value.trim() ? ', ' + fColor.value.trim() : ''}. Ribbon: “${msg}”. ${get ? get.value : 'Pickup'} on ${when}.`;
    done.hidden = false;
    done.focus();
  });
  $('#form-again').addEventListener('click', () => { done.hidden = true; form.reset(); syncBouquet(); syncSize(); syncGet(); fBouquet.focus(); });
  $$('#f-name, #f-phone, #f-date').forEach(i => i.addEventListener('input', () => i.setAttribute('aria-invalid', 'false')));

  syncBouquet(); syncSize(); syncGet();
  const fitAll = () => $$('.ribbon--card, .ribbon--studio, .ribbon--about').forEach(fit);
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(fitAll);
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(fitAll, 150); }, { passive: true });

  /* ---------- Scroll scenes: hero dome settles, band drifts, dock appears ---------- */
  const hero = $('.hero'), dome = $('.hero__dome'), plate = $('.hero__rings');
  const band = $('.band'), track = $('.band__track');
  const dock = $('.dock'), order = $('#order');
  const on = { hero: true, band: false, order: false };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      const k = e.target === hero ? 'hero' : e.target === band ? 'band' : 'order';
      on[k] = e.isIntersecting;
      if (k !== 'order' && !reduce) {
        (k === 'hero' ? [dome, plate] : [track]).forEach(el => { el.style.willChange = e.isIntersecting ? 'transform' : ''; });
      }
      queue();
    }), { rootMargin: '80px 0px' });
    [hero, band, order].forEach(el => io.observe(el));
  }

  let ticking = false, dockShown = false;
  const update = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    if (!reduce && on.hero) {
      const p = clamp(y / (hero.offsetHeight || vh));
      dome.style.transform = `translate3d(0, ${(p * 34).toFixed(1)}px, 0) rotate(${(p * -10).toFixed(2)}deg) scale(${(1 - p * .05).toFixed(4)})`;
      plate.style.transform = `rotate(${(p * 24).toFixed(2)}deg)`;
    }
    if (!reduce && on.band) {
      const r = band.getBoundingClientRect();
      const half = track.scrollWidth / 2;
      const x = ((vh - r.top) * 0.45) % half;
      track.style.transform = `translate3d(${(-x).toFixed(1)}px, 0, 0)`;
    }
    const show = y > (hero.offsetHeight * 0.85) && !on.order && (innerHeight + y < document.body.scrollHeight - 140);
    if (show !== dockShown) { dockShown = show; dock.classList.toggle('show', show); }
  };
  const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', queue, { passive: true });
  queue();
})();
