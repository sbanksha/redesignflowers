document.documentElement.classList.add('js');

/* 1. The rose counter: pick a stem count, the bouquet fills to that size */
(function () {
  const tiers = document.querySelectorAll('.tiers button');
  if (!tiers.length) return;
  const roses = document.querySelectorAll('.bouquet .r');
  const nOut = document.querySelector('.bouquet__n b');
  const note = document.querySelector('.tier-note');
  const notes = {
    12: '<b>XS · 12 stems.</b> The classic dozen. Our smallest size.',
    25: '<b>S · 25 stems.</b> Two dozen and then some.',
    35: '<b>M · 35 stems.</b> The middle size, still a full armful.',
    50: '<b>L · 50 stems.</b> Big enough to need two hands.',
    75: '<b>XL · 75 stems.</b> Our largest size: $515–$630 for the premium varieties below.',
    100: '<b>100 roses — $320.</b> The bouquet from our Instagram. Call or DM to order it.'
  };
  function set(n) {
    tiers.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.n === n)));
    roses.forEach((r, i) => r.classList.toggle('off', i >= n));
    if (nOut) nOut.textContent = n;
    if (note) note.innerHTML = notes[n];
  }
  tiers.forEach(b => b.addEventListener('click', () => set(+b.dataset.n)));
})();

/* 2. Shop filters */
(function () {
  const btns = document.querySelectorAll('.filters button');
  const cards = document.querySelectorAll('.grid .card');
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const f = b.dataset.f;
    cards.forEach(c => { c.hidden = !(f === 'all' || c.dataset.cat.split(' ').includes(f)); });
  }));
})();

/* 3. Valentine's countdown (Feb 14, local time) */
(function () {
  const el = document.querySelector('.clock');
  if (!el) return;
  const d = el.querySelector('[data-u=d]'), h = el.querySelector('[data-u=h]'), m = el.querySelector('[data-u=m]');
  function target() {
    const now = new Date();
    let t = new Date(now.getFullYear(), 1, 14);
    if (now > new Date(now.getFullYear(), 1, 15)) t = new Date(now.getFullYear() + 1, 1, 14);
    return t;
  }
  function tick() {
    const ms = Math.max(0, target() - new Date());
    d.textContent = Math.floor(ms / 864e5);
    h.textContent = String(Math.floor(ms / 36e5) % 24).padStart(2, '0');
    m.textContent = String(Math.floor(ms / 6e4) % 60).padStart(2, '0');
  }
  tick(); setInterval(tick, 15000);
})();
