/* Hudson Florist — enhancements only; the page works without this file. */
(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Hours from the shop's own site (Sat per their hours widget). [d]=[open,close], null = closed
  var H = {0:null,1:[9,16],2:[9,17],3:[9,17],4:[9,17],5:[9,17],6:[9,15]};
  function now(){
    try{
      var o={}; new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date()).forEach(function(p){o[p.type]=p.value});
      return {d:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(o.weekday), h:(+o.hour%24)+(+o.minute)/60};
    }catch(e){var x=new Date();return {d:x.getDay(),h:x.getHours()+x.getMinutes()/60};}
  }
  function f(h){return (h%12||12)+(h>=12?' pm':' am')}
  function next(d){for(var i=1;i<8;i++){var k=(d+i)%7;if(H[k])return {k:k,o:H[k][0]};}}
  var n=now(), t=H[n.d], sign=document.querySelector('[data-sign]'), st=document.querySelector('[data-status]');
  var names=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  if(sign&&st){
    if(t&&n.h>=t[0]&&n.h<t[1]){sign.textContent='Open';st.textContent='Until '+f(t[1])+' today';}
    else{
      sign.textContent='Closed';sign.classList.add('closed');
      if(t&&n.h<t[0]) st.textContent='Opens today at '+f(t[0]);
      else{var x=next(n.d);st.textContent='Opens '+(x.k===(n.d+1)%7?'tomorrow':names[x.k])+' at '+f(x.o);}
    }
  }
  var row=document.querySelector('[data-hours] [data-day="'+n.d+'"]'); if(row) row.classList.add('today');

  // Zip checker — zip list taken from the shop's own About text, area names added for clarity
  var Z={'07302':'Downtown Jersey City','07304':'Jersey City','07305':'Jersey City','07306':'Jersey City, our home zip','07307':'Jersey City','07308':'Jersey City','07310':'Jersey City','07311':'Jersey City','07303':'Jersey City','07395':'Jersey City','07399':'Jersey City','07097':'Jersey City','07030':'Hoboken','07032':'Kearny','07047':'North Bergen','07094':'Secaucus','07086':'Weehawken','07002':'Bayonne','07029':'Harrison','07093':'West New York'};
  var zf=document.querySelector('[data-zip]');
  if(zf){
    var inp=zf.querySelector('input'), out=zf.querySelector('output');
    zf.addEventListener('submit',function(e){
      e.preventDefault(); var z=(inp.value||'').replace(/\D/g,'').slice(0,5);
      if(z.length<5){out.textContent='That’s not a full zip code. Five digits, please.';return;}
      if(Z[z]) out.innerHTML='<b>Yes, we deliver to '+z+'.</b> '+Z[z]+'. Order online or call for same-day.';
      else out.innerHTML='<b>'+z+' isn’t on our usual list.</b> Call (201) 433-2868 and we’ll see what we can do.';
    });
  }

  // Netlify form: AJAX submit + success state
  document.querySelectorAll('form[data-netlify]').forEach(function(fm){
    fm.addEventListener('submit',function(e){
      e.preventDefault(); var w=fm.closest('[data-form-wrap]'), b=fm.querySelector('button'); if(b){b.disabled=true;b.textContent='Sending…';}
      fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(fm)).toString()})
        .catch(function(){}).then(function(){ if(w){w.classList.add('sent');} });
    });
  });
  if(reduce){var tk=document.querySelector('.tick-in'); if(tk) tk.style.animation='none';}
})();
