(function(){
  document.documentElement.classList.add('js');
  var VIBER_ID='61cc43ca-c9b2-11f0-8bd4-f6bb9438032d';
  var VIBER_WEB='https://connect.viber.com/en/business/'+VIBER_ID;
  var VIBER_APP='viber://business/chat?account='+VIBER_ID;
  var isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  /* ---------- open / closed, Manila time (open daily 8:00–19:00) ---------- */
  function manilaNow(){
    var q=location.search.match(/[?&]h=(\d+)/); // ?h=10 to preview a time
    var p=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Manila',hour:'numeric',minute:'numeric',weekday:'long',hour12:false}).formatToParts(new Date());
    var o={};p.forEach(function(x){o[x.type]=x.value});
    var h=+o.hour%24, m=+o.minute;
    if(q){h=+q[1];m=0}
    return {h:h,m:m,day:o.weekday};
  }
  var t=manilaNow(), open=t.h>=8 && t.h<19;
  document.querySelectorAll('[data-status]').forEach(function(el){
    el.classList.add(open?'is-open':'is-closed');
    var txt=el.querySelector('em');
    if(!txt) return;
    if(open){
      var left=(19*60)-(t.h*60+t.m);
      txt.textContent= left<=60 ? 'Open now · closing at 7 PM' : 'Open now · until 7 PM today';
    } else {
      txt.textContent='Closed now · opens 8 AM' + (t.h>=19?' tomorrow':'') ;
    }
  });
  document.querySelectorAll('.hours tr[data-day]').forEach(function(tr){ if(tr.getAttribute('data-day')===t.day) tr.classList.add('today') });

  /* ---------- mobile menu ---------- */
  var menu=document.querySelector('.menu');
  document.querySelectorAll('[data-menu]').forEach(function(b){
    b.addEventListener('click',function(){
      var o=!menu.classList.contains('open');
      menu.classList.toggle('open',o);
      document.body.style.overflow=o?'hidden':'';
      document.querySelectorAll('[data-menu]').forEach(function(x){x.setAttribute('aria-expanded',o)});
    });
  });

  /* ---------- hover-follow image on the index list ---------- */
  var fl=document.querySelector('.float-img');
  if(fl && matchMedia('(hover:hover) and (min-width:900px)').matches){
    var fimg=fl.querySelector('img'), x=0,y=0,cx=0,cy=0,raf;
    function loop(){cx+=(x-cx)*.16;cy+=(y-cy)*.16;fl.style.left=cx+'px';fl.style.top=cy+'px';raf=requestAnimationFrame(loop)}
    document.querySelectorAll('.line[data-img]').forEach(function(a){
      a.addEventListener('mouseenter',function(e){fimg.src=a.getAttribute('data-img');cx=x=e.clientX;cy=y=e.clientY;fl.classList.add('on');cancelAnimationFrame(raf);loop()});
      a.addEventListener('mousemove',function(e){x=e.clientX+150;y=e.clientY});
      a.addEventListener('mouseleave',function(){fl.classList.remove('on');setTimeout(function(){cancelAnimationFrame(raf)},300)});
    });
  }

  /* ---------- filter chips ---------- */
  document.querySelectorAll('.chips').forEach(function(group){
    var target=document.querySelector(group.getAttribute('data-target'));
    group.addEventListener('click',function(e){
      var b=e.target.closest('.chip'); if(!b) return;
      group.querySelectorAll('.chip').forEach(function(c){c.setAttribute('aria-pressed',c===b)});
      var f=b.getAttribute('data-filter');
      target.querySelectorAll('[data-tags]').forEach(function(it){
        it.hidden = f!=='all' && it.getAttribute('data-tags').split(' ').indexOf(f)<0;
      });
    });
  });

  /* ---------- Viber hand-off ---------- */
  var toast=document.createElement('div');toast.className='toast';toast.setAttribute('role','status');document.body.appendChild(toast);
  function say(m){toast.textContent=m;toast.classList.add('on');clearTimeout(say.t);say.t=setTimeout(function(){toast.classList.remove('on')},4200)}
  function copy(text){
    try{ if(navigator.clipboard&&window.isSecureContext){return navigator.clipboard.writeText(text).then(function(){return true},function(){return legacy(text)})} }catch(e){}
    return Promise.resolve(legacy(text));
  }
  function legacy(text){var ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();var ok=false;try{ok=document.execCommand('copy')}catch(e){}ta.remove();return ok}
  function openViber(){
    if(!isMobile){ window.open(VIBER_WEB,'_blank','noopener'); return; }
    var start=Date.now();
    var timer=setTimeout(function(){ if(document.visibilityState==='visible' && Date.now()-start<3200) location.href=VIBER_WEB; },1500);
    document.addEventListener('visibilitychange',function v(){ if(document.hidden){clearTimeout(timer);document.removeEventListener('visibilitychange',v)} });
    location.href=VIBER_APP;
  }
  function handoff(text){
    copy(text).then(function(ok){
      say(ok?'Order note copied. Paste it into the Viber chat.':'Opening Viber…');
      setTimeout(openViber, ok?650:0);
    });
  }
  window.FB_handoff=handoff;

  /* ---------- order sheet ---------- */
  var scrim=document.querySelector('.sheet-scrim'), sheet=document.querySelector('.sheet');
  var cur={};
  function fmtDate(v){ if(!v) return ''; var d=new Date(v+'T12:00:00'); return d.toLocaleDateString('en-PH',{weekday:'short',month:'short',day:'numeric'}); }
  function buildMsg(){
    var f=sheet.querySelector('form');
    var how=(f.querySelector('[name=how]:checked')||{}).value||'';
    var lines=['Hi Flori Blooms! I’d like to order:', '• '+cur.item+(cur.price?' ('+cur.price+')':'')];
    if(f.date.value) lines.push('• For: '+fmtDate(f.date.value));
    if(how) lines.push('• '+how);
    if(f.card.value.trim()) lines.push('• Card: “'+f.card.value.trim()+'”');
    if(cur.ref) lines.push('(Seen on your website: '+cur.ref+')');
    return lines.join('\n');
  }
  function refresh(){ sheet.querySelector('.preview').textContent=buildMsg(); }
  function openSheet(d){
    cur=d;
    sheet.querySelector('.sheet-item h3').textContent=d.item;
    sheet.querySelector('.sheet-item .num').textContent=d.price||'Message for price';
    var im=sheet.querySelector('.sheet-item img');
    if(d.img){im.src=d.img;im.style.visibility='visible'}else{im.removeAttribute('src');im.style.visibility='hidden'}
    refresh();
    sheet.classList.add('open');scrim.classList.add('open');sheet.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    setTimeout(function(){sheet.querySelector('.sheet-head button').focus()},50);
  }
  function closeSheet(){sheet.classList.remove('open');scrim.classList.remove('open');sheet.setAttribute('aria-hidden','true');document.body.style.overflow='';}
  if(sheet){
    sheet.querySelector('form').addEventListener('input',refresh);
    sheet.querySelector('form').addEventListener('change',refresh);
    sheet.querySelector('form').addEventListener('submit',function(e){e.preventDefault();handoff(buildMsg());closeSheet()});
    sheet.querySelector('.sheet-head button').addEventListener('click',closeSheet);
    scrim.addEventListener('click',closeSheet);
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeSheet()});
    var dt=sheet.querySelector('[name=date]'); if(dt){var n=new Date();dt.min=n.toISOString().slice(0,10)}
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest('[data-order]');
    if(!a) return;
    e.preventDefault();
    if(!sheet){ handoff('Hi Flori Blooms! I’d like to order '+a.getAttribute('data-order')); return; }
    openSheet({item:a.getAttribute('data-order'),price:a.getAttribute('data-price'),img:a.getAttribute('data-img'),ref:a.getAttribute('data-ref')});
  });
  document.addEventListener('click',function(e){
    var a=e.target.closest('[data-viber]');
    if(!a) return;
    e.preventDefault();
    handoff(a.getAttribute('data-viber')||'Hi Flori Blooms! I’d like to ask about an order.');
  });

  /* ---------- inquiry forms (events / wholesale) -> Viber ---------- */
  document.querySelectorAll('form[data-inquiry]').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var lines=[f.getAttribute('data-inquiry')];
      f.querySelectorAll('[data-q]').forEach(function(el){
        var v='';
        if(el.tagName==='FIELDSET'){var c=el.querySelector('input:checked');v=c?c.value:''}
        else v=(el.type==='date'&&el.value)?fmtDate(el.value):el.value.trim();
        if(v) lines.push('• '+el.getAttribute('data-q')+': '+v);
      });
      handoff(lines.join('\n'));
    });
  });

  /* ---------- a few deliberate reveals ---------- */
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}})},{rootMargin:'0px 0px -10% 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
  } else document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in')});
})();
