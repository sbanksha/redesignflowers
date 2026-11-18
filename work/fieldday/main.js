(function(){
  var DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var SHORT=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var DELIVERS=[false,true,true,true,true,true,true]; // Mon–Sat
  var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function pad(n){return String(n).padStart(2,"0")}

  /* ---------- today bar + weekday hero ---------- */
  var msgEl=document.querySelector("[data-today-msg]"),
      dayEl=document.querySelector("[data-today-day]"),
      clockEl=document.querySelector("[data-today-clock]");
  var now0=new Date();
  var wd=document.querySelector("[data-weekday]"), art=document.querySelector("[data-article]");
  if(wd){wd.textContent=DAYS[now0.getDay()]; if(art) art.textContent="a";}
  var row=document.querySelector('.tt tr[data-d="'+now0.getDay()+'"]'); if(row) row.classList.add("is-today");

  function nextCutoff(now){
    for(var i=0;i<8;i++){
      var d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i,13,0,0);
      if(DELIVERS[d.getDay()] && d>now) return d;
    }
  }
  function tick(){
    var now=new Date(), cut=nextCutoff(now), today=now.getDay();
    var sameDay=cut.toDateString()===now.toDateString();
    var tmr=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1).toDateString()===cut.toDateString();
    dayEl.textContent=SHORT[today]+" "+pad(now.getMonth()+1)+"."+pad(now.getDate());
    var msg;
    if(sameDay) msg="It’s "+DAYS[today]+". Order by 1pm for delivery today.";
    else if(!DELIVERS[today]) msg="It’s "+DAYS[today]+". No drivers today. Order now, it shows up "+(tmr?"tomorrow":DAYS[cut.getDay()])+" afternoon.";
    else msg="Today’s cutoff has passed. Order now for delivery "+(tmr?"tomorrow":DAYS[cut.getDay()])+".";
    if(msgEl.textContent!==msg) msgEl.textContent=msg;
    var s=Math.max(0,Math.floor((cut-now)/1000));
    clockEl.textContent=(sameDay?"":SHORT[cut.getDay()]+" 1pm in ")+pad(Math.floor(s/3600))+":"+pad(Math.floor(s%3600/60))+":"+pad(s%60)+(sameDay?" left":"");
  }
  if(msgEl&&clockEl){tick(); setInterval(tick,1000);}

  /* ---------- hero load ---------- */
  var hero=document.querySelector(".hero");
  function go(){ requestAnimationFrame(function(){ hero.classList.add("is-in"); }); }
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(go); } else go();

  /* ---------- marquee ---------- */
  var mq=document.querySelector("[data-marquee]"), track=document.querySelector("[data-track]");
  if(mq && track){
    var list=track.firstElementChild;
    var clones=[];
    function fill(){
      clones.forEach(function(c){c.remove()}); clones=[];
      var w=list.offsetWidth||1, n=Math.ceil((window.innerWidth*2)/w)+1;
      for(var i=0;i<n;i++){var c=list.cloneNode(true);c.setAttribute("aria-hidden","true");track.appendChild(c);clones.push(c);}
    }
    fill();
    if(document.fonts) document.fonts.ready.then(fill);
    var x=0, vel=0, lastY=window.scrollY, sk=0, last=performance.now();
    window.addEventListener("resize",fill);
    if(!reduce){
      (function loop(t){
        var dt=Math.min(50,t-last); last=t;
        var y=window.scrollY, dy=y-lastY; lastY=y;
        vel+= (dy-vel)*0.12;
        var boost=Math.min(14,Math.abs(vel)*0.5);
        var dir=vel<-1?-1:1; // scrolling up reverses the ticker
        x-= (1.1+boost)*dir*(dt/16.7);
        var w=list.offsetWidth;
        if(x<=-w) x+=w; if(x>0) x-=w;
        sk+= (Math.max(-12,Math.min(12,-vel*0.35))-sk)*0.1;
        track.style.transform="translate3d("+x.toFixed(2)+"px,0,0) skewX("+sk.toFixed(2)+"deg)";
        requestAnimationFrame(loop);
      })(last);
    }
  }

  /* ---------- shop filters ---------- */
  var chips=document.querySelectorAll(".chip"), cards=document.querySelectorAll(".card");
  chips.forEach(function(ch){
    ch.addEventListener("click",function(){
      chips.forEach(function(c){c.classList.remove("is-on");c.setAttribute("aria-pressed","false")});
      ch.classList.add("is-on"); ch.setAttribute("aria-pressed","true");
      var f=ch.dataset.filter;
      cards.forEach(function(card){
        var on=f==="all"||(" "+card.dataset.tags+" ").indexOf(" "+f+" ")>-1;
        card.classList.toggle("is-out",!on);
        card.setAttribute("aria-hidden",on?"false":"true");
      });
    });
  });
  var toast=document.querySelector("[data-toast]"), tT;
  document.querySelectorAll('[data-note="links to existing checkout"]').forEach(function(a){
    a.addEventListener("click",function(e){
      e.preventDefault(); if(!toast) return;
      toast.innerHTML="<b>Concept demo</b>On the live site, this opens your existing checkout (BloomNation / Square). Nothing changes on your end.";
      toast.classList.add("is-on"); clearTimeout(tT);
      tT=setTimeout(function(){toast.classList.remove("is-on")},3500);
    });
  });
  document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&toast) toast.classList.remove("is-on"); });

  /* ---------- subscription odometer ---------- */
  var PRICES={weekly:{s:35,m:45,l:75},biweekly:{s:39,m:49,l:79},monthly:{s:45,m:55,l:89}};
  var PER={weekly:52/12,biweekly:26/12,monthly:1};
  var state={cadence:"weekly",size:"m"};
  var odo=document.querySelector("[data-odo]"), math=document.querySelector("[data-math]"), per=document.querySelector("[data-per]");
  function buildOdo(v){
    var str=String(v);
    if(odo.children.length!==str.length){
      odo.innerHTML="";
      for(var i=0;i<str.length;i++){
        var d=document.createElement("span"); d.className="d";
        var col=document.createElement("i");
        for(var k=0;k<10;k++){var b=document.createElement("b");b.textContent=k;col.appendChild(b);}
        d.appendChild(col); odo.appendChild(d);
      }
      odo.setAttribute("aria-label",v);
    }
    requestAnimationFrame(function(){
      Array.prototype.forEach.call(odo.children,function(d,i){
        d.firstChild.style.transform="translateY("+(-0.8*(+str[i]))+"em)";
        d.style.width=""; 
      });
    });
    odo.setAttribute("aria-label","$"+v);
  }
  function update(){
    var v=PRICES[state.cadence][state.size];
    buildOdo(v);
    var mo=Math.round(v*PER[state.cadence]);
    math.textContent=(state.cadence==="monthly"?"$"+v+" a month":"≈ $"+mo+" a month")+" · free delivery in Somerville";
    per.textContent="/ delivery";
  }
  document.querySelectorAll("[data-seg]").forEach(function(seg){
    var key=seg.dataset.seg;
    seg.querySelectorAll("button").forEach(function(b){
      b.addEventListener("click",function(){
        seg.querySelectorAll("button").forEach(function(o){o.classList.remove("is-on");o.setAttribute("aria-checked","false")});
        b.classList.add("is-on"); b.setAttribute("aria-checked","true");
        state[key]=b.dataset.v; update();
      });
    });
  });
  if(odo) update();

  /* ---------- footer wordmark: fit exactly to content width ---------- */
  var mark=document.querySelector(".foot__mark"), markIn=mark&&mark.firstElementChild;
  function fitMark(){
    if(!markIn) return;
    var target=mark.clientWidth, w=markIn.getBoundingClientRect().width;
    if(!w||!target) return;
    var fs=parseFloat(getComputedStyle(mark).fontSize);
    mark.style.fontSize=(fs*target/w*0.995)+"px";
  }
  fitMark(); if(document.fonts) document.fonts.ready.then(fitMark);
  window.addEventListener("resize",fitMark);

  /* ---------- anchor smooth scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    var id=a.getAttribute("href"); if(id.length<2) return;
    a.addEventListener("click",function(e){var t=document.querySelector(id); if(!t) return; e.preventDefault();
      window.scrollTo({top:t.getBoundingClientRect().top+window.scrollY-(id==="#top"?999:70),behavior:reduce?"auto":"smooth"});
      history.replaceState(null,"",id);});
  });

  /* ---------- newsletter ---------- */
  var news=document.querySelector("[data-news]");
  if(news) news.addEventListener("submit",function(e){
    e.preventDefault();
    var inp=news.querySelector("input");
    if(!inp.value||inp.value.indexOf("@")<1){inp.focus();inp.setAttribute("aria-invalid","true");inp.placeholder="Need an email for this one";return;}
    news.classList.add("is-done"); news.querySelector("[data-news-ok]").hidden=false;
  });
})();
