/* Pretty Flowers preview.
   iPhone-safe motion: ONE passive scroll listener feeding ONE requestAnimationFrame update,
   IntersectionObserver for reveals and for switching scenes on/off. Only transform, opacity
   and clip-path inset are touched. will-change is added only while a scene is on screen. */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasIO = 'IntersectionObserver' in window;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ---------- Hero words rise in once fonts are ready ---------- */
  const ready = () => root.classList.add('ready');
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(ready));
  setTimeout(ready, 1800);

  /* ---------- Reveals ---------- */
  const revealEls = $$('.rv, .lt');
  if (!hasIO || reduce) {
    revealEls.forEach(el => el.classList.add('in'));
  } else {
    const rio = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    revealEls.forEach(el => rio.observe(el));
  }

  /* ---------- Statement: split into words (keeps <em>) ---------- */
  const stmt = $('.js-words');
  let words = [];
  if (stmt && !reduce) {
    stmt.setAttribute('aria-label', stmt.textContent.replace(/\s+/g, ' ').trim());
    const walk = (node, into) => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { into.append(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.textContent = part;
            into.append(s); words.push(s);
          });
        } else if (n.nodeType === 1) {
          const clone = n.cloneNode(false); into.append(clone); walk(n, clone);
        }
      });
    };
    const frag = document.createElement('div');
    walk(stmt, frag);
    stmt.replaceChildren(...frag.childNodes);
    stmt.classList.add('split');
  }

  /* ---------- Nav state ---------- */
  let scrolled = null;
  let lastY = scrollY, hidden = false;
  const navState = () => {
    const y = scrollY;
    const s = y > innerHeight * 0.6;
    if (s !== scrolled) { scrolled = s; root.classList.toggle('scrolled', s); }
    // Tuck the nav away while scrolling down so it never sits on headings; bring it back on scroll up.
    const dy = y - lastY;
    if (Math.abs(dy) > 6) {
      const h = dy > 0 && y > innerHeight * 0.9;
      if (h !== hidden) { hidden = h; root.classList.toggle('nav-hide', h); }
      lastY = y;
    }
  };

  /* ---------- Custom cursor (mouse only) ---------- */
  if (fine && !reduce) {
    const c = $('.cursor');
    let x = -100, y = -100, cx = -100, cy = -100, raf = 0;
    const move = () => {
      cx += (x - cx) * 0.22; cy += (y - cy) * 0.22;
      c.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      raf = (Math.abs(x - cx) + Math.abs(y - cy) > 0.3) ? requestAnimationFrame(move) : 0;
    };
    addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY; c.classList.add('on');
      c.classList.toggle('big', !!e.target.closest('a, button, .tile, .lt__fig'));
      if (!raf) raf = requestAnimationFrame(move);
    }, { passive: true });
    document.addEventListener('pointerleave', () => c.classList.remove('on'));
  }

  if (reduce) { navState(); addEventListener('scroll', navState, { passive: true }); return; }

  /* ---------- Scenes ---------- */
  let vw = innerWidth, vh = innerHeight;
  const scenes = [];
  const scene = (el, update, live = []) => {
    if (!el) return;
    const s = { el, update, live, on: !hasIO };
    scenes.push(s);
    return s;
  };

  // 1. Hero: arch opens to full bleed, the two words part, caption lands.
  const hero = $('.hero');
  const frame = $('.hero__frame'), himg = $('.hero__img');
  const wA = $('.hero__word--a'), wB = $('.hero__word--b');
  const hLine = $('.hero__line'), hCue = $('.hero__cue'), hFly = $('.hero__fly');
  let heroEnd = false;
  scene(hero, () => {
    const r = hero.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - vh));
    const o = easeInOut(clamp(p / 0.62));
    const desk = vw >= 900;
    // arch geometry in px (matches the CSS starting arch)
    const t0 = vh * (desk ? 0.14 : 0.2), b0 = vh * (desk ? 0.08 : 0.15), x0 = vw * (desk ? 0.36 : 0.2);
    const rad = vw * (desk ? 0.14 : 0.3);
    const k = 1 - o;
    frame.style.clipPath = `inset(${(t0 * k).toFixed(1)}px ${(x0 * k).toFixed(1)}px ${(b0 * k).toFixed(1)}px ${(x0 * k).toFixed(1)}px round ${(rad * k).toFixed(1)}px ${(rad * k).toFixed(1)}px 0 0)`;
    himg.style.transform = `scale(${lerp(1.14, 1, o).toFixed(4)})`;
    const w = ease(clamp(p / 0.5));
    wA.style.transform = `translate3d(${(-w * vw * 0.35).toFixed(1)}px, 0, 0)`;
    wA.style.opacity = (1 - w).toFixed(3);
    wB.style.transform = `translate3d(${(w * vw * 0.35).toFixed(1)}px, 0, 0)`;
    wB.style.opacity = (1 - w).toFixed(3);
    const f = clamp(p / 0.25);
    hLine.style.opacity = hCue.style.opacity = hFly.style.opacity = (1 - f).toFixed(3);
    const end = p > 0.66;
    if (end !== heroEnd) { heroEnd = end; hero.classList.toggle('end', end); }
  }, [frame, himg, wA, wB]);

  // 2. Statement words light up as the paragraph crosses the screen.
  if (words.length) {
    let lit = -1;
    scene(stmt, () => {
      const r = stmt.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35));
      const n = Math.round(p * words.length);
      if (n === lit) return;
      lit = n;
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    });
  }

  // 3. Signature: pinned, three steps.
  const sig = $('.sig');
  const sigImgs = $$('.sig__img'), sigSteps = $$('.sig__steps li'), sigBar = $('.sig__bar i');
  let step = 0;
  scene(sig, () => {
    const r = sig.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - vh));
    sigBar.style.transform = `scaleX(${p.toFixed(4)})`;
    const s = Math.min(2, Math.floor(p * 3));
    if (s !== step) {
      step = s;
      sigImgs.forEach(el => el.classList.toggle('is-on', +el.dataset.i === s));
      sigSteps.forEach(el => el.classList.toggle('is-on', +el.dataset.i === s));
    }
  }, [sigBar]);

  // 5. Ribbon slides sideways with the scroll.
  const ribbon = $('.ribbon'), track = $('.ribbon__track');
  scene(ribbon, () => {
    const r = ribbon.getBoundingClientRect();
    const p = clamp((vh - r.top) / (r.height + vh));
    const span = Math.max(0, track.scrollWidth - vw * 1.1);
    track.style.transform = `translate3d(${(-p * span * 0.75).toFixed(1)}px, 0, 0)`;
  }, [track]);

  // 7. Gallery columns drift at different speeds.
  const colWrap = $('.cols'), cols = $$('.col');
  scene(colWrap, () => {
    const r = colWrap.getBoundingClientRect();
    const p = (vh - r.top) / (r.height + vh) - 0.5;
    const amp = vw >= 900 ? 1 : 0;
    cols.forEach((c, i) => {
      if (i === 2 && vw < 900) { c.style.transform = ''; return; }
      c.style.transform = `translate3d(0, ${(p * (+c.dataset.speed) * r.height * amp).toFixed(1)}px, 0)`;
    });
  }, cols);

  /* switch scenes on and off as they enter / leave the screen */
  if (hasIO) {
    const sio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const s = scenes.find(x => x.el === e.target);
        if (!s) return;
        s.on = e.isIntersecting;
        s.live.forEach(el => { el.style.willChange = s.on ? 'transform' : ''; });
        if (s.on) s.update();
      });
    }, { rootMargin: '10% 0px 10% 0px' });
    scenes.forEach(s => sio.observe(s.el));
  }

  /* ---------- One scroll listener, one rAF ---------- */
  let ticking = false;
  const frameTick = () => {
    ticking = false;
    navState();
    for (const s of scenes) if (s.on) s.update();
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frameTick); } };
  addEventListener('scroll', request, { passive: true });
  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { vw = innerWidth; vh = innerHeight; request(); }, 120);
  }, { passive: true });
  vw = innerWidth; vh = innerHeight;
  request();
})();
