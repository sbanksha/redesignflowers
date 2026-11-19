/* Pétalos preview: one passive scroll listener + requestAnimationFrame.
   Only transform and opacity are written. No CSS scroll timelines. */
(function () {
  'use strict';
  window.__petalosReady = true;
  var d = document, html = d.documentElement;

  /* ---------- reveals ---------- */
  var reveals = d.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || !html.classList.contains('motion')) return;

  /* ---------- helpers ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function setT(el, s) { if (el._t !== s) { el._t = s; el.style.transform = s; } }
  function setO(el, o) { o = Math.round(o * 1000) / 1000; if (el._o !== o) { el._o = o; el.style.opacity = o; } }
  function docTop(el) { var r = el.getBoundingClientRect(); return r.top + window.pageYOffset; }

  var vh = 0, vw = 0;
  var parts = [];

  /* ---------- hero: arches rise faster than the page, word drifts ---------- */
  var hero = d.querySelector('.hero');
  var heroWord = d.querySelector('.js-hero-word');
  var arches = Array.prototype.slice.call(d.querySelectorAll('.js-hero-arch'));
  parts.push({
    el: hero,
    update: function (y) {
      if (y > this.h + 40) return;
      setT(heroWord, 'translate3d(0,' + (y * 0.28).toFixed(1) + 'px,0)');
      arches.forEach(function (a) {
        var s = parseFloat(a.getAttribute('data-speed')) || 0.2;
        setT(a, 'translate3d(0,' + (-y * s).toFixed(1) + 'px,0)');
      });
    }
  });

  /* ---------- stack: cards rise and pile up ---------- */
  var stack = d.querySelector('.js-stack');
  var cards = Array.prototype.slice.call(stack.querySelectorAll('.js-card'));
  var chips = Array.prototype.slice.call(stack.querySelectorAll('.js-ingredients li'));
  var rots = [-5, 4, -2.5, 6, -1];
  var offs = [[0, 0], [5, -2], [-6, -4], [4, -6], [-2, -8]]; /* % of card, x and y */
  var lastChips = -1;
  parts.push({
    el: stack,
    update: function (y) {
      var p = clamp((y - this.top) / (this.h - vh), 0, 1);
      var n = cards.length;
      var steps = p * (n - 1) * 1.1;
      for (var i = 1; i < n; i++) {
        var t = ease(clamp(steps - (i - 1), 0, 1));
        var ty = (1 - t) * vh * 1.05;
        var r = rots[i] + (1 - t) * 14 * (i % 2 ? 1 : -1);
        setT(cards[i], 'translate3d(' + offs[i][0] + '%,' + (ty).toFixed(1) + 'px,0) translateY(' + offs[i][1] + '%) rotate(' + r.toFixed(2) + 'deg)');
      }
      var on = Math.round(clamp(p * 1.15, 0, 1) * chips.length);
      if (on !== lastChips) {
        lastChips = on;
        chips.forEach(function (c, k) { c.classList.toggle('on', k < on); });
      }
    }
  });

  /* ---------- calendario: one track moves sideways ---------- */
  var cal = d.querySelector('.js-cal');
  var track = cal.querySelector('.js-track');
  var calBar = cal.querySelector('.js-cal-bar');
  var calDist = 0;
  parts.push({
    el: cal,
    measureBefore: function () {
      calDist = Math.max(0, track.scrollWidth - vw);
      cal.style.height = 'calc(100svh + ' + Math.round(calDist * 1.1) + 'px)';
    },
    update: function (y) {
      var p = this.h > vh ? clamp((y - this.top) / (this.h - vh), 0, 1) : 0;
      setT(track, 'translate3d(' + (-p * calDist).toFixed(1) + 'px,0,0)');
      setT(calBar, 'scaleX(' + p.toFixed(4) + ')');
    }
  });

  /* ---------- flores amarillas: background warms, sunburst turns ---------- */
  var sun = d.querySelector('.js-sun');
  var glow = sun.querySelector('.js-sun-glow');
  var burst = sun.querySelector('.js-sun-burst');
  parts.push({
    el: sun,
    update: function (y) {
      var enter = clamp((y + vh - this.top) / (vh * 0.7), 0, 1);
      setO(glow, enter);
      setO(burst, enter);
      setT(burst, 'rotate(' + ((y + vh - this.top) * 0.04).toFixed(2) + 'deg)');
    }
  });

  /* ---------- domicilio marquee ---------- */
  var deliver = d.querySelector('.js-deliver');
  var marquee = deliver.querySelector('.js-marquee');
  parts.push({
    el: deliver,
    update: function (y) {
      var w = marquee.scrollWidth / 3; /* text repeats 3 times */
      var x = ((y + vh - this.top) * 0.45) % w;
      setT(marquee, 'translate3d(' + (-x - w * 0.15).toFixed(1) + 'px,0,0)');
    }
  });

  /* ---------- engine ---------- */
  function measure() {
    vw = d.documentElement.clientWidth;
    var stage = d.querySelector('.stack__stage');
    vh = stage ? stage.offsetHeight : window.innerHeight; /* 100svh, stable on iOS */
    parts.forEach(function (pt) { if (pt.measureBefore) pt.measureBefore(); });
    parts.forEach(function (pt) {
      pt.top = docTop(pt.el);
      pt.h = pt.el.offsetHeight;
    });
  }

  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.pageYOffset;
    for (var i = 0; i < parts.length; i++) {
      var pt = parts[i];
      if (y + vh > pt.top - 200 && y < pt.top + pt.h + 200) pt.update(y);
    }
  }
  function request() { if (!ticking) { ticking = true; window.requestAnimationFrame(frame); } }

  var lastW = -1, lastH = -1;
  function onResize() {
    var w = d.documentElement.clientWidth, h = window.innerHeight;
    /* iOS toolbar show/hide changes height only a little; ignore it */
    if (w === lastW && Math.abs(h - lastH) < 120) return;
    lastW = w; lastH = h;
    measure();
    request();
  }

  onResize();
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('load', function () { lastW = -1; onResize(); });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { lastW = -1; onResize(); });

  reduce.addEventListener && reduce.addEventListener('change', function () { window.location.reload(); });
})();
