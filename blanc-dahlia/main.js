/* Blanc Dahlia demo — progressive enhancement only; every link works without this file. */
(() => {
  const WA = '523338749589';
  const TEL = '+526144412538';
  const TAIL = '\n\nFecha de entrega: \nColonia / zona: ';
  const root = document.documentElement;
  const money = n => '$' + Number(n).toLocaleString('en-US');
  const waHref = msg => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- per-product message ---------- */
  function orderMsg(btn) {
    if (btn.dataset.msg) return btn.dataset.msg;
    const name = btn.dataset.name, v = btn.dataset.variant, p = money(btn.dataset.price);
    return `Hola Blancdahlia 🌼, quiero el arreglo *${name}${v ? ' – ' + v : ''} (${p})*.` + TAIL;
  }

  /* ---------- branch switch: GDL (WhatsApp) / CUU (phone) ---------- */
  const waLinks = [...document.querySelectorAll('a.wa')];
  waLinks.forEach(a => { a.dataset.label = a.querySelector('.wa__label')?.textContent || ''; });

  function paint(a) {
    const label = a.querySelector('.wa__label');
    if (root.dataset.branch === 'cuu') {
      a.href = 'tel:' + TEL;
      a.removeAttribute('target');
      a.classList.add('is-tel');
      if (label) label.textContent = a.classList.contains('btn-order') ? 'Llamar para pedir'
        : (a.classList.contains('nav__cta') || a.classList.contains('fab')) ? 'Llamar' : a.dataset.label;
      if (a.classList.contains('fab')) a.setAttribute('aria-label', 'Llamar a Chihuahua');
    } else {
      a.href = waHref(orderMsg(a));
      a.target = '_blank';
      a.classList.remove('is-tel');
      if (label) label.textContent = a.dataset.label;
      if (a.classList.contains('fab')) a.setAttribute('aria-label', 'Pedir por WhatsApp');
    }
  }
  function setBranch(b, save = true) {
    root.dataset.branch = b;
    document.querySelectorAll('.switch [data-set-branch]').forEach(x => x.setAttribute('aria-checked', String(x.dataset.setBranch === b)));
    waLinks.forEach(paint);
    if (save) store.set('bd-branch', b);
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-set-branch]');
    if (t) setBranch(t.dataset.setBranch);
  });
  const qs = new URLSearchParams(location.search).get('sucursal');
  setBranch(qs === 'cuu' || qs === 'chihuahua' ? 'cuu' : qs === 'gdl' ? 'gdl' : (store.get('bd-branch') || 'gdl'), false);

  /* ---------- size chips: re-price + re-write message ---------- */
  document.querySelectorAll('.variants').forEach(group => {
    const card = group.closest('.card');
    const priceEl = card.querySelector('.price__n');
    const btn = card.querySelector('.btn-order');
    const img = card.querySelector('.card__img');
    group.addEventListener('click', e => {
      const v = e.target.closest('button'); if (!v) return;
      group.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', String(x === v)));
      priceEl.textContent = money(v.dataset.price);
      priceEl.classList.remove('tick'); void priceEl.offsetWidth; priceEl.classList.add('tick');
      btn.dataset.variant = v.dataset.label; btn.dataset.price = v.dataset.price;
      if (v.dataset.img && img) img.src = v.dataset.img;
      paint(btn);
    });
    group.addEventListener('keydown', e => {
      if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
      const bs = [...group.querySelectorAll('button')];
      const i = bs.indexOf(document.activeElement); if (i < 0) return;
      const n = bs[(i + (e.key === 'ArrowRight' ? 1 : bs.length - 1)) % bs.length];
      n.focus(); n.click(); e.preventDefault();
    });
  });

  /* ---------- filters ---------- */
  const cards = [...document.querySelectorAll('#grid .card')];
  const empty = document.querySelector('.grid__empty');
  function filter(f) {
    document.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === f)));
    let shown = 0;
    cards.forEach(c => {
      const cats = c.dataset.cat.split(' ');
      const ok = f === 'all' || (f === 'under1000' ? +c.dataset.min > 0 && +c.dataset.min <= 1000 : cats.includes(f));
      c.hidden = !ok; if (ok) shown++;
    });
    empty.hidden = shown > 0;
  }
  document.querySelectorAll('[data-filter]').forEach(c => c.addEventListener('click', () => filter(c.dataset.filter)));

  /* ---------- mobile menu ---------- */
  const menuBtn = document.querySelector('.nav__menu'), drawer = document.getElementById('drawer');
  menuBtn?.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.setAttribute('aria-expanded', String(!open)); drawer.hidden = open;
    menuBtn.textContent = open ? 'Menú' : 'Cerrar';
  });
  drawer?.addEventListener('click', e => { if (e.target.closest('a')) { drawer.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.textContent = 'Menú'; } });

  /* ---------- window light follows scroll; FAB hides over the catalog buttons' footer ---------- */
  const lights = [...document.querySelectorAll('.light')];
  const fab = document.querySelector('.fab');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ticking = false;
  function onScroll() {
    const y = scrollY;
    if (!reduce) lights.forEach(l => {
      const r = l.parentElement.getBoundingClientRect();
      l.style.setProperty('--lx', ((r.top) * -0.12).toFixed(1) + 'px');
    });
    if (fab) fab.classList.toggle('is-hidden', y < 500 || (innerHeight + y) > document.body.scrollHeight - 220);
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();
})();
