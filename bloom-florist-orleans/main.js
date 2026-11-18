/* Bloom — small, progressive enhancements. Page is complete without this file. */
(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- live open / closed, Cape Cod time ---- */
  var HOURS = {0:[10,15],1:[10,16],2:[10,16],3:[10,16],4:[10,16],5:[10,16],6:[10,15]};
  function capeNow(){
    try{
      var parts = new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date());
      var o={}; parts.forEach(function(p){o[p.type]=p.value});
      var day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(o.weekday);
      return {day:day, h:(+o.hour%24)+(+o.minute)/60};
    }catch(e){ var d=new Date(); return {day:d.getDay(), h:d.getHours()+d.getMinutes()/60}; }
  }
  function fmt(h){ var ap=h>=12?'pm':'am'; var x=h%12||12; return x+' '+ap; }
  var n = capeNow(), today = HOURS[n.day], st = document.querySelector('[data-status]'), dot = document.querySelector('[data-dot]');
  if (st){
    if (n.h>=today[0] && n.h<today[1]) st.textContent = 'Open now · until '+fmt(today[1])+' today';
    else if (n.h<today[0]) { st.textContent = 'Opens today at '+fmt(today[0]); dot && dot.classList.add('closed'); }
    else { st.textContent = 'Closed now · opens tomorrow at '+fmt(HOURS[(n.day+1)%7][0]); dot && dot.classList.add('closed'); }
  }
  var row = document.querySelector('[data-hours] [data-day="'+n.day+'"]'); if (row) row.classList.add('today');

  /* ---- the number: digits roll in once ---- */
  var num = document.querySelector('.number');
  if (num){
    num.querySelectorAll('.bignum .d').forEach(function(d,i){ d.style.transitionDelay = (i*45)+'ms'; });
    if (reduce || !('IntersectionObserver' in window)) num.classList.add('in');
    else new IntersectionObserver(function(es,ob){ es.forEach(function(e){ if(e.isIntersecting){ num.classList.add('in'); ob.disconnect(); } }); },{threshold:.35}).observe(num);
  }

  /* ---- map: viewBox crop on phones, coastline draws with scroll ---- */
  var svg = document.querySelector('[data-map]'), land = document.querySelector('[data-land]');
  if (svg && land){
    var mq = matchMedia('(max-width: 860px)');
    function vb(){ svg.setAttribute('viewBox', mq.matches ? '228 0 520 600' : '40 0 720 600'); }
    vb(); mq.addEventListener ? mq.addEventListener('change',vb) : mq.addListener(vb);
    var len = land.getTotalLength(); land.style.setProperty('--len', len);
    function draw(){
      var r = svg.getBoundingClientRect(), vh = innerHeight;
      var p = Math.min(1, Math.max(0, (vh - r.top) / (vh*0.55 + r.height*0.35)));
      land.style.setProperty('--off', (len*(1-p)).toFixed(1));
      land.style.setProperty('--fill', Math.max(0,(p-.75)/.25).toFixed(2));
    }
    if (!reduce){ draw(); addEventListener('scroll', draw, {passive:true}); addEventListener('resize', draw); }

    var items = document.querySelectorAll('[data-towns] li');
    function hl(name,on){
      document.querySelectorAll('[data-t="'+name+'"]').forEach(function(el){ el.classList.toggle('hl',on); });
    }
    items.forEach(function(li){
      li.addEventListener('mouseenter',function(){hl(li.dataset.t,true)});
      li.addEventListener('mouseleave',function(){hl(li.dataset.t,false)});
    });
  }

  /* ---- Netlify form: AJAX submit with a real success state ---- */
  document.querySelectorAll('form[data-netlify]').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var box = f.closest('[data-form-wrap]'), btn = f.querySelector('button');
      btn && (btn.disabled = true, btn.textContent = 'Sending…');
      var body = new URLSearchParams(new FormData(f)).toString();
      fetch('/', {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:body})
        .catch(function(){})
        .then(function(){ box && box.classList.add('sent'); box && box.scrollIntoView({behavior: reduce?'auto':'smooth', block:'start'}); });
    });
  });
})();
