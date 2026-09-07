/* HARMOS FAILSAFE — if the engine dies, the door still opens */
setTimeout(function(){
  try{
    var pl=document.getElementById('preloader');
    var pct=document.getElementById('pct');
    if(pl && pct && pct.textContent.replace('%','').trim()==='0'){
      pl.style.transition='opacity .5s'; pl.style.opacity='0';
      setTimeout(function(){pl.remove()},600);
      var sc=document.querySelectorAll('.scene');
      if(sc.length){sc[0].classList.add('active');sc[0].style.visibility='visible';sc[0].style.opacity='1'}
      console.warn('Harmos failsafe opened the door — an engine error is in the Console above.');
    }
  }catch(e){}
},7000);