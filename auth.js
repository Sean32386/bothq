// Shared passcode gate (2D + 3D)
window.bothqGate=function(onOk){
  const K='bothq_ok';const c=window.BOTHQ_CONFIG;
  if(localStorage.getItem(K)===c.passHash){onOk();return;}
  const d=document.createElement('div');d.id='gate';
  d.innerHTML='<div class="gbox"><h1>🏡 Bot HQ</h1><p>Enter passcode</p><input id="gp" type="password" inputmode="numeric" maxlength="6" autocomplete="off"><button id="gb">Enter</button><div id="ge"></div></div>';
  document.body.appendChild(d);
  const go=async()=>{const v=document.getElementById('gp').value.trim();
    const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('bothq:'+v));
    const h=[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
    if(h===c.passHash){localStorage.setItem(K,h);d.remove();onOk();}else{document.getElementById('ge').textContent='Wrong passcode';}};
  document.getElementById('gb').onclick=go;document.getElementById('gp').onkeydown=e=>{if(e.key==='Enter')go();};
  setTimeout(()=>document.getElementById('gp').focus(),50);
};
window.bothqFetchStatus=async function(base){const r=await fetch((base||'')+'status.json?t='+Date.now(),{cache:'no-store'});return r.json();};
window.BOTS_META={
 merlin:{name:'Merlin',role:'Orchestrator – routes work between bots',station:'Command Tower',color:0x6a4cff},
 jr:{name:'Jr',role:'Faith & study companion',station:'Chapel / Study',color:0xf2e6c9},
 jocko:{name:'Jocko',role:'Discipline & training coach',station:'Gym',color:0x111111},
 sage:{name:'Sage',role:'Wellness & mindfulness',station:'Wellness Room',color:0x3fae5a},
 mick:{name:'Mick',role:'Trainer & dietitian',station:'Gym & Kitchen',color:0xffffff},
 shoppy:{name:'Shoppy',role:'Groceries & shopping',station:'Grocery Store',color:0xff8a3d},
 scout:{name:'Scout',role:'Career & research lookout',station:'Lookout Tower',color:0x7a5a2f},
 quill:{name:'Quill',role:'Writer & editor',station:'Writing Desk',color:0x2f6fd6},
 ness:{name:'Ness',role:'Communication & executive-presence coach',station:'Speaking Studio',color:0xe0409a},
 manny:{name:'Manny',role:'Builder – apps, XR, robots',station:'Workshop',color:0xf2c230},
 pixel:{name:'Pixel',role:'Graphics & visual design artist (works with Manny)',station:'Art Studio',color:0x9b5de5}};
