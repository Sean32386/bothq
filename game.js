const TV=new URLSearchParams(location.search).get('tv')==='1';if(TV)document.body.classList.add('tv');
const W=1280,H=800;
// station positions (building center) & where the bot hangs out
const ST={merlin:[640,150],jr:[180,140],jocko:[1000,140],mick:[1160,330],sage:[170,420],shoppy:[1080,620],scout:[400,140],quill:[420,640],ness:[700,650],manny:[880,410],pixel:[860,560]};
let scene,bots={},statusData=null;
function px(g,map,pal,s){map.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.'){g.fillStyle(pal[c]);g.fillRect(x*s,y*s,s,s);}}));}
function hex(n){return n}
function makeChar(sc,id){const m=BOTS_META[id];const g=sc.make.graphics({add:false});
 const skin=0xf1c27d,body=m.color,dark=0x222222;
 const pal={s:skin,b:body,d:dark,e:0x111111,h:0x5a3a1a,w:0xffffff,y:0xf2c230,Y:0xffd60a,k:0x8b5a2b,g:0x3fae5a,r:0xc0392b,p:0x6a4cff,l:0x9b7ad8};
 let base=[
 '....hhhh....','...hhhhhh...','...ssssss...','...sesses...','...ssssss...','....ssss....',
 '..bbbbbbbb..','.sbbbbbbbbs.','.sbbbbbbbbs.','..bbbbbbbb..','..bbb..bbb..','..ddd..ddd..'];
 base=base.map(r=>r);
 const over={
  merlin:['.....pp.....','....pppp....','...pyppyp...','..pppppppp..'], // wizard hat
  mick:['...wwwwww...','...wwwwww...','..wwwwwwww..'],
  manny:['...YYYYYY...','..YYYYYYYY..'],
  jocko:['....dddd....','...dddddd...'],
  sage:['....gg......','...gggg.....'],
 };
 const top=over[id]||[];
 const map=[...top,...base];
 // pad to 16 rows
 while(map.length<16)map.unshift('............');
 if(id==='jocko'){for(let i=0;i<map.length;i++)map[i]=map[i].replace(/h/g,'d');}
 [0,1].forEach(f=>{g.clear();const mm=map.slice();
  if(f===1){mm[mm.length-1]='..ddd...ddd.';}
  px(g,mm,pal,3);
  // props
  const P=(c,x,y,w,h)=>{g.fillStyle(c);g.fillRect(x*3,y*3,w*3,h*3);};
  const R=mm.length-12;
  if(id==='jr'){P(0x5a2a10,9,R+7,3,4);P(0xf2c230,10,R+8,1,2);} // Bible w/ gold cross
  if(id==='manny'){P(0x777777,10,R+5,1,5);P(0x8b5a2b,10,R+9,1,2);P(0x999999,9,R+5,3,1);} // hammer
  if(id==='merlin'){P(0x8b5a2b,0,R+3,1,9);P(0x66ccff,0,R+2,1,1);} // staff
  if(id==='quill'){P(0xffffff,10,R+4,1,4);}
  if(id==='ness'){P(0x333333,10,R+5,1,3);P(0x999999,10,R+4,1,1);}
  if(id==='scout'){P(0x333333,3,R+3,6,1);}
  if(id==='shoppy'){P(0xc8a060,9,R+7,3,3);P(0x3fae5a,9,R+6,1,1);}
  if(id==='sage'){P(0x3fae5a,0,R+7,2,2);}
  g.generateTexture(id+'_'+f,36,48);});
}
function bld(g,x,y,w,h,wall,roof,label){g.fillStyle(0x000000,0.2);g.fillRect(x-w/2+6,y-h/2+6,w,h);
 g.fillStyle(wall);g.fillRect(x-w/2,y-h/2+24,w,h-24);g.fillStyle(roof);g.fillRect(x-w/2-8,y-h/2,w+16,30);
 for(let i=0;i<w+16;i+=12){g.fillStyle(0x000000,0.12);g.fillRect(x-w/2-8+i,y-h/2,6,30);}
 g.fillStyle(0x5b3d22);g.fillRect(x-10,y+h/2-30,20,30);g.fillStyle(0xbfe6ff);g.fillRect(x-w/2+12,y-h/2+40,18,16);g.fillRect(x+w/2-30,y-h/2+40,18,16);
 const t=scene.add.text(x,y-h/2-2,label,{fontFamily:'monospace',fontSize:TV?'18px':'14px',color:'#fff',backgroundColor:'#5b3d22cc',padding:{x:4,y:2}}).setOrigin(0.5,1).setDepth(2);}
function drawTown(sc){const g=sc.add.graphics();
 for(let y=0;y<H;y+=32)for(let x=0;x<W;x+=32){g.fillStyle(((x+y)/32)%2?0x7cc152:0x74b84c);g.fillRect(x,y,32,32);}
 g.fillStyle(0xd9b98a);g.fillRect(0,300,W,56);g.fillRect(600,0,64,H);g.fillRect(260,300,56,H-300);g.fillRect(980,300,56,H-300);
 g.fillStyle(0x4a90d9);g.fillEllipse(560,470,170,90);g.fillStyle(0x8fd0ff);g.fillEllipse(540,460,60,20);
 const rnd=new Phaser.Math.RandomDataGenerator(['bothq']);
 for(let i=0;i<70;i++){const x=rnd.between(0,W),y=rnd.between(0,H);if(Math.abs(y-328)<40||Math.abs(x-632)<45)continue;g.fillStyle([0xff6b6b,0xffe066,0xffffff,0xc77dff][i%4]);g.fillRect(x,y,4,4);}
 for(let i=0;i<22;i++){const x=rnd.between(0,W),y=rnd.between(0,H);if(Math.abs(y-328)<60||Math.abs(x-632)<60)continue;g.fillStyle(0x6b4a2b);g.fillRect(x-3,y,6,12);g.fillStyle(0x2f7d32);g.fillCircle(x,y-4,13);g.fillStyle(0x3d9a40);g.fillCircle(x-4,y-8,7);}
 const B=[['merlin',120,150,0x8a8fa8,0x4b3c8f,'Command Tower'],['jr',140,110,0xf2ead7,0x8b2e2e,'Chapel / Study'],['jocko',170,110,0x444444,0x111111,'Gym'],['mick',130,100,0xfff3e0,0xc0392b,'Kitchen'],['sage',150,110,0xdff5e1,0x3fae5a,'Wellness Room'],['shoppy',170,110,0xffe8c2,0xff8a3d,'Grocery Store'],['scout',70,170,0xa0784a,0x5a3a1a,'Lookout Tower'],['quill',130,90,0xe8e0ff,0x2f6fd6,'Writing Desk'],['manny',160,110,0xd6c09a,0x7a5a2f,'Workshop'],['pixel',130,80,0xf3eaff,0x9b5de5,'Art Studio']];
 B.forEach(([id,w,h,wa,ro,l])=>{const[x,y]=ST[id];bld(g,x,y-40,w,h,wa,ro,l);});
 if(true){const[x,y]=ST.merlin;g.fillStyle(0x66ccff);g.fillCircle(x,y-120,8);}
 // stage
 const[sx,sy]=ST.ness;g.fillStyle(0x7a3b2e);g.fillRect(sx-90,sy-60,180,60);g.fillStyle(0xe0409a);g.fillRect(sx-100,sy-110,20,110);g.fillRect(sx+80,sy-110,20,110);g.fillRect(sx-100,sy-116,200,14);
 scene.add.text(sx,sy+4,'Stage',{fontFamily:'monospace',fontSize:TV?'18px':'14px',color:'#fff',backgroundColor:'#5b3d22cc',padding:{x:4,y:2}}).setOrigin(0.5,0);
}
function fmt(t){try{return new Date(t).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'})}catch(e){return t}}
function showCard(id){const b=bots[id];if(!b)return;const d=b.data||{},m=BOTS_META[id];
 document.getElementById('cn').textContent=d.name||m.name;document.getElementById('cr').textContent=m.role;document.getElementById('cs').textContent=d.station||m.station;
 document.getElementById('ct').textContent=d.task||'—';const s=document.getElementById('cst');s.textContent=d.status||'idle';s.className='pill '+(d.status||'idle');
 document.getElementById('cu').textContent=d.updated?fmt(d.updated):'—';document.getElementById('card').style.display='block';}
function applyStatus(){if(!statusData)return;document.getElementById('upd').textContent='updated '+fmt(statusData.updated);
 statusData.bots.forEach(d=>{const b=bots[d.id];if(!b)return;b.data=d;const short=d.task.length>34?d.task.slice(0,33)+'…':d.task;
  b.bubble.setText(d.status==='idle'?'💤 '+short:(d.status==='waiting'?'⏳ ':'⚙️ ')+short);});}
async function poll(){try{statusData=await bothqFetchStatus('');applyStatus();}catch(e){document.getElementById('upd').textContent='status offline';}}
class Town extends Phaser.Scene{create(){scene=this;drawTown(this);
 Object.keys(BOTS_META).forEach(id=>{makeChar(this,id);const[x,y]=ST[id];const s=this.add.sprite(x,y+30,id+'_0').setScale(TV?1.6:1.3).setInteractive({useHandCursor:true}).setDepth(5);
  const nm=this.add.text(0,0,BOTS_META[id].name,{fontFamily:'monospace',fontSize:TV?'18px':'13px',color:'#fff',stroke:'#000',strokeThickness:3}).setOrigin(0.5,0).setDepth(6);
  const bub=this.add.text(0,0,'…',{fontFamily:'sans-serif',fontSize:TV?'20px':'13px',color:'#222',backgroundColor:'#ffffff',padding:{x:6,y:3},wordWrap:{width:TV?260:170}}).setOrigin(0.5,1).setDepth(7);
  const z=this.add.text(0,0,'z',{fontFamily:'monospace',fontSize:'18px',color:'#fff',stroke:'#335',strokeThickness:3}).setDepth(8);
  s.on('pointerdown',()=>showCard(id));bub.setInteractive().on('pointerdown',()=>showCard(id));
  bots[id]={s,nm,bubble:bub,z,home:[x,y+30],tx:x,ty:y+30,t:0,data:null};});
 this.time.addEvent({delay:300,loop:true,callback:()=>{Object.values(bots).forEach(b=>{const st=b.data?.status;b.t^=1;if(st==='working')b.s.setTexture(b.s.texture.key.split('_')[0]+'_'+b.t);});}});
 this.time.addEvent({delay:2500,loop:true,callback:()=>{Object.values(bots).forEach(b=>{if(b.data?.status==='idle')return;b.tx=b.home[0]+Phaser.Math.Between(-45,45);b.ty=b.home[1]+Phaser.Math.Between(-6,25);});}});
 const fit=()=>{const cam=this.cameras.main;cam.setBounds(0,0,W,H);};fit();
 poll();setInterval(poll,BOTHQ_CONFIG.pollMs);
 if(TV){let i=0;setInterval(()=>{const act=Object.keys(bots).filter(k=>bots[k].data&&bots[k].data.status!=='idle');const list=act.length?act:Object.keys(bots);const id=list[i++%list.length];const b=bots[id];
   this.cameras.main.pan(b.s.x,b.s.y,1200,'Sine.easeInOut');this.cameras.main.zoomTo(1.8,1200);showCard(id);},8000);
   document.body.addEventListener('click',()=>{document.documentElement.requestFullscreen?.().catch(()=>{});},{once:true});}
}
update(t,dt){Object.values(bots).forEach(b=>{const st=b.data?.status;if(st==='working'||st==='waiting'){const dx=b.tx-b.s.x,dy=b.ty-b.s.y,d=Math.hypot(dx,dy);if(d>2){const sp=(st==='working'?0.05:0.02)*dt;b.s.x+=dx/d*Math.min(sp,d);b.s.y+=dy/d*Math.min(sp,d);b.s.flipX=dx<0;}}
 b.s.angle=st==='idle'?8:0;b.nm.setPosition(b.s.x,b.s.y+b.s.displayHeight/2);b.bubble.setPosition(b.s.x,b.s.y-b.s.displayHeight/2-4);
 b.z.setVisible(st==='idle');if(st==='idle'){const p=(t/1500)%1;b.z.setPosition(b.s.x+14+p*10,b.s.y-20-p*24);b.z.setAlpha(1-p);b.z.setText(p<0.5?'z':'Z');}});}}
bothqGate(()=>new Phaser.Game({type:Phaser.AUTO,parent:'game',width:W,height:H,backgroundColor:'#74b84c',pixelArt:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:Town}));
