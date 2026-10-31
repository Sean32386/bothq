import * as THREE from '../vendor/three.module.min.js';import {OrbitControls} from '../vendor/OrbitControls.js';
const MOBILE=matchMedia('(pointer:coarse)').matches||innerWidth<700;
// desk positions [x,z,facingYaw] ; zones
const DESK={merlin:[0,-9.2,0],jr:[-16.5,-9,0],jocko:[13.5,-8,Math.PI/2],sage:[-5,1,0],scout:[-1.7,1,0],quill:[1.7,1,0],ness:[5,1,0],shoppy:[10.5,8,-Math.PI/2],mick:[16,5.5,0],manny:[-14,8,Math.PI/2]};
const STATION={merlin:'War Room',jr:'Chapel Corner',jocko:'Gym Corner',sage:'Open Office',scout:'Open Office',quill:'Open Office',ness:'Open Office',shoppy:'Break Area',mick:'Kitchen',manny:'Workbench Lab'};
const BREAK=[[13,10.5],[15,11],[17,10.5],[14,12],[16,12.3]];
const SC={working:0x3dff8a,waiting:0xffb020,idle:0x2a3340};
const TOUR=[[0,0,0],[0,1,-10],[-16,1,-10],[15,1,-9],[14,1,9],[-14,1,9],[0,1,1]];
let data=null;const bots={};
function fmt(t){try{return new Date(t).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'})}catch(e){return t}}
function start(){
const r=new THREE.WebGLRenderer({antialias:!MOBILE,powerPreference:'high-performance'});r.setPixelRatio(Math.min(devicePixelRatio,MOBILE?1.5:2));r.setSize(innerWidth,innerHeight);
r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.05;r.outputColorSpace=THREE.SRGBColorSpace;document.body.prepend(r.domElement);
const sc=new THREE.Scene();sc.background=new THREE.Color(0x2a2320);
const cam=new THREE.PerspectiveCamera(MOBILE&&innerWidth<innerHeight?62:48,innerWidth/innerHeight,0.1,200);cam.position.set(0,24,28);if(innerWidth<innerHeight)cam.position.set(0,40,44);
const ctl=new OrbitControls(cam,r.domElement);ctl.enableDamping=true;ctl.dampingFactor=.06;ctl.maxPolarAngle=1.25;ctl.minDistance=6;ctl.maxDistance=50;ctl.autoRotate=true;ctl.autoRotateSpeed=.25;ctl.enablePan=true;
// lights
sc.add(new THREE.HemisphereLight(0xfff1dc,0x5a4636,.75));
const sun=new THREE.DirectionalLight(0xffe2b8,2.2);sun.position.set(-10,22,-26);sun.castShadow=true;const s=sun.shadow.camera;s.left=-26;s.right=26;s.top=20;s.bottom=-20;s.far=80;sun.shadow.mapSize.set(MOBILE?1024:2048,MOBILE?1024:2048);sun.shadow.bias=-.0005;sun.shadow.radius=4;sc.add(sun);
const fill=new THREE.DirectionalLight(0xbcd4ff,.35);fill.position.set(15,10,20);sc.add(fill);
const MC={};const M=(c,o={})=>{const k=c+JSON.stringify(o);return MC[k]||(MC[k]=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.75,metalness:0},o)));};
const add=(geo,mat,x,y,z,parent=sc,sh=true)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=sh;parent.add(m);return m;};
const box=(w,h,d,c,x,y,z,o,p)=>add(new THREE.BoxGeometry(w,h,d),typeof c==='number'?M(c,o):c,x,y,z,p);
// floor: wood planks texture
const cv=document.createElement('canvas');cv.width=cv.height=256;const g=cv.getContext('2d');
for(let i=0;i<8;i++){g.fillStyle=`hsl(30,${35+i%3*5}%,${52+((i*37)%9)}%)`;g.fillRect(0,i*32,256,32);g.fillStyle='#0002';g.fillRect(0,i*32,256,2);g.fillRect((i*97)%256,i*32,2,32);}
const ft=new THREE.CanvasTexture(cv);ft.wrapS=ft.wrapT=THREE.RepeatWrapping;ft.repeat.set(8,6);ft.colorSpace=THREE.SRGBColorSpace;
add(new THREE.PlaneGeometry(42,30),new THREE.MeshStandardMaterial({map:ft,roughness:.6}),0,0,0).rotation.x=-Math.PI/2;
// rugs
const rug=(w,d,c,x,z)=>box(w,.02,d,c,x,.01,z,{roughness:1});
rug(14,6,0x6b7f6a,0,1);rug(6,5,0x7a3b3b,-16.5,-9.5);rug(6,6,0x333a44,15.5,-9);
// walls: back wall with windows, left wall with windows; right/front low partitions for open view
const WALL=0xefe6d8,H=5;
const glassWin=new THREE.MeshStandardMaterial({color:0xcfe9ff,emissive:0xbfe0ff,emissiveIntensity:1.1,roughness:.1});
for(let x=-21;x<21;x+=6){box(2,H,.4,WALL,x+1,H/2,-15);box(4,1,.4,WALL,x+4,.5,-15);box(4,.8,.4,WALL,x+4,H-.4,-15);add(new THREE.PlaneGeometry(4,3.2),glassWin,x+4,2.6,-14.85,sc,false);box(.12,3.2,.12,0x8a6a4a,x+4,2.6,-14.8);}
for(let z=-15;z<15;z+=6){box(.4,H,2,WALL,-21,H/2,z+1);box(.4,1,4,WALL,-21,.5,z+4);box(.4,.8,4,WALL,-21,H-.4,z+4);const w=add(new THREE.PlaneGeometry(4,3.2),glassWin,-20.85,2.6,z+4,sc,false);w.rotation.y=Math.PI/2;}
box(.4,1.2,30,WALL,21,.6,0);box(42,.6,.3,WALL,0,.3,15);
// war room (glass)
const glass=new THREE.MeshStandardMaterial({color:0xaad8ff,transparent:true,opacity:.18,roughness:.05,metalness:.1,depthWrite:false});
const gw=(w,d,x,z)=>{const m=add(new THREE.BoxGeometry(w,3.4,d),glass,x,1.7,z,sc,false);box(w+.1,.12,d+.1,0x444a52,x,3.4,z,{metalness:.6,roughness:.3});};
gw(.1,7.5,-5.5,-11);gw(.1,7.5,5.5,-11);gw(4,.1,-3.5,-7.2);gw(4,.1,3.5,-7.2);
box(7,.15,2.6,0x5b3a26,0,1.05,-11.5,{roughness:.4});box(.4,1,.4,0x333,-2.8,.5,-11.5);box(.4,1,.4,0x333,2.8,.5,-11.5);
for(const x of[-2.2,-.7,.7,2.2])for(const z of[-12.9,-10.1]){box(.6,.5,.6,0x2d2f3a,x,.55,z);}
const wall=add(new THREE.PlaneGeometry(6,2.6),new THREE.MeshBasicMaterial({color:0x7a6cff}),0,2.4,-14.75,sc,false);
const wsC=document.createElement('canvas');wsC.width=512;wsC.height=220;const wsT=new THREE.CanvasTexture(wsC);wsT.colorSpace=THREE.SRGBColorSpace;wall.material=new THREE.MeshBasicMaterial({map:wsT,toneMapped:false});
// chapel corner — reverent: cross, altar, candles, pews, stained-glass-tinted window
box(.35,3.2,.2,0xc9a86a,-16.5,2.6,-14.6,{metalness:.5,roughness:.35});box(1.6,.35,.2,0xc9a86a,-16.5,3.4,-14.6,{metalness:.5,roughness:.35});
box(3,1,1,0xf4ecdc,-16.5,.5,-13.6);box(3.1,.05,1.1,0xffffff,-16.5,1.02,-13.6);
add(new THREE.BoxGeometry(.6,.1,.4),M(0x7a1f1f),-16.5,1.1,-13.6);// open bible
const candles=[];for(const dx of[-1.1,1.1]){box(.12,.5,.12,0xfff7e6,-16.5+dx,1.3,-13.6);const f=add(new THREE.SphereGeometry(.07,6,6),new THREE.MeshBasicMaterial({color:0xffc45a}),-16.5+dx,1.62,-13.6,sc,false);candles.push(f);}
const cl=new THREE.PointLight(0xffb85a,6,8,1.8);cl.position.set(-16.5,2,-12.8);sc.add(cl);
for(const z of[-11.4,-9.6])for(const x of[-18,-15]){box(2.2,.45,.6,0x6b4423,x,.45,z,{roughness:.5});box(2.2,.7,.12,0x6b4423,x,.9,z+.3,{roughness:.5});}
box(.12,3,6.5,0xd8cbb5,-13,1.5,-11.5);// partition
// gym corner
for(const x of[13.5,17.5])box(.2,2.6,.2,0x222,x,1.3,-12.5,{metalness:.7,roughness:.3});box(4.2,.1,.1,0x999,15.5,2.4,-12.5,{metalness:.9,roughness:.2});
box(2,.6,.9,0x1b1b1b,15.5,.3,-10.5);box(.1,.1,3,0xaaaaaa,15.5,1.4,-10.5,{metalness:.9,roughness:.2});
for(const dz of[-1.2,1.2])add(new THREE.CylinderGeometry(.45,.45,.15,16),M(0x111),15.5,1.4,-10.5+dz).rotation.x=Math.PI/2;
const bag=add(new THREE.CylinderGeometry(.4,.4,1.6,12),M(0x8b1a1a,{roughness:.5}),18.5,2.2,-6.5);box(.05,1.4,.05,0x333,18.5,3.7,-6.5);
for(let i=0;i<5;i++)box(.5,.25,.25,0x333,19.5,.15+i*.3,-12+i*.0,{metalness:.6});
// kitchen / break
box(8,1,1.2,0xf2f2f2,16,.5,13.9,{roughness:.3});box(8.2,.08,1.3,0x3d3d3d,16,1.04,13.9,{roughness:.2,metalness:.2});
box(1.3,2.6,1.2,0xc8ccd0,20.2,1.3,13.9,{metalness:.6,roughness:.3});
box(.5,.5,.5,0x2b2b2b,13,1.3,13.9);// coffee machine
add(new THREE.CylinderGeometry(1.4,1.4,.1,24),M(0xe8dcc8,{roughness:.4}),15,1,10.5);add(new THREE.CylinderGeometry(.12,.12,1,8),M(0x333),15,.5,10.5);
box(2.4,.7,.6,0x4b6a88,10.5,.35,12);// sofa
box(2.4,.7,.2,0x4b6a88,10.5,.8,12.3);
box(.12,1.6,6,0xd8cbb5,8.6,.8,10);
// lab workbench
box(5,.15,1.4,0x8a6a45,-17.5,1.05,12,{roughness:.6});for(const x of[-19.7,-15.3])box(.15,1,1.2,0x444,x,.5,12);
box(5,2.2,.1,0x55606e,-17.5,2.3,12.9);for(let i=0;i<6;i++)box(.1,.5,.1,[0xd33,0x3a3,0x33d,0xdd3,0x999,0xd70][i],-19.5+i*.8,2.6,12.8);
const arm=new THREE.Group();arm.position.set(-16,1.1,11.8);sc.add(arm);box(.3,.8,.3,0xf2a030,0,.4,0,{},arm);const arm2=box(.15,.8,.15,0xf2a030,0,.9,.2,{},arm);
const duck=add(new THREE.SphereGeometry(.22,10,8),M(0xffd640),-18.5,1.35,11.8);
box(.12,1.6,6,0xd8cbb5,-11.6,.8,10);
// plants
const plant=(x,z,sz=1)=>{add(new THREE.CylinderGeometry(.35*sz,.28*sz,.6*sz,10),M(0xd9d2c5),x,.3*sz,z);for(let i=0;i<5;i++){const l=add(new THREE.SphereGeometry(.38*sz,8,6),M(0x3f8f4a,{roughness:.9}),x+Math.sin(i*1.3)*.25*sz,(.8+i*.18)*sz,z+Math.cos(i*1.3)*.25*sz);l.scale.y=1.3;}};
[[-20,-1],[-20,4],[20,-2],[7,-13.8],[-7,-13.8],[-11,-13.8],[11,-13.8],[-8,5],[8,5],[20,8],[-10,13.5]].forEach(p=>plant(p[0],p[1],1.3));
// pendant lights (visual) + 2 warm point lights
for(const x of[-5,0,5]){add(new THREE.ConeGeometry(.5,.4,16,1,true),M(0x222),x,4.2,1,sc,false);add(new THREE.SphereGeometry(.18,8,8),new THREE.MeshBasicMaterial({color:0xfff0c0}),x,4,1,sc,false);}
const p1=new THREE.PointLight(0xffd8a0,14,16,1.6);p1.position.set(0,4,1);sc.add(p1);
const p2=new THREE.PointLight(0xffd8a0,10,14,1.6);p2.position.set(15,4,10);sc.add(p2);
// desks + bots
const scrGeo=new THREE.PlaneGeometry(1,.6);
for(const id in BOTS_META){const m=BOTS_META[id];const[dx,dz,yaw]=DESK[id];
 const desk=new THREE.Group();desk.position.set(dx,0,dz);desk.rotation.y=yaw;sc.add(desk);
 if(id!=='merlin'){box(1.9,.08,1,0xb98a5a,0,.95,0,{roughness:.45},desk);for(const sx of[-.85,.85])box(.08,.92,.9,0x3a3a3a,sx,.47,0,{metalness:.5},desk);}
 const deskY=id==='merlin'?1.13:.99,dzoff=id==='merlin'?-1.6+11.5-11.5:0;
 box(.08,.35,.08,0x222,0,deskY+.17,-.3+(id==='merlin'?-.9:0),{},desk);box(1.1,.7,.06,0x1a1a1a,0,deskY+.65,-.32+(id==='merlin'?-.9:0),{},desk);
 const scr=new THREE.Mesh(scrGeo,new THREE.MeshBasicMaterial({color:SC.idle,toneMapped:false}));scr.position.set(0,deskY+.65,-.285+(id==='merlin'?-.9:0));desk.add(scr);
 box(.5,.03,.18,0x333,0,deskY+.02,.1+(id==='merlin'?-.9:0),{},desk);
 const glow=new THREE.PointLight(SC.idle,0,2.5,2);glow.position.set(0,deskY+.7,0+(id==='merlin'?-.9:0));if(!MOBILE)desk.add(glow);
 // personal item on desk
 const pi={jr:[0x7a1f1f,'bk'],quill:[0xffffff,'pp'],scout:[0x333,'bn'],sage:[0x3fae5a,'pl'],ness:[0xe0409a,'mic'],shoppy:[0xc8a060,'bx'],mick:[0xffffff,'mug'],manny:[0xf2c230,'hat'],jocko:[0x222,'kb']}[id];
 if(pi)box(.25,.25,.25,pi[0],.7,deskY+.13,0,{},desk);
 if(id!=='merlin'){box(.6,.5,.6,0x2d2f3a,0,.5,.85,{},desk);box(.6,.6,.1,0x2d2f3a,0,1.05,1.15,{},desk);}
 // character
 const grp=new THREE.Group();
 const body=add(new THREE.CapsuleGeometry(.32,.55,4,10),M(m.color,{roughness:.5}),0,.75,0,grp);
 const head=add(new THREE.SphereGeometry(.3,14,12),M(id==='jocko'?0x8d5524:0xf1c27d,{roughness:.6}),0,1.5,0,grp);
 const ey=new THREE.MeshBasicMaterial({color:0x111});for(const ex of[-.1,.1])add(new THREE.SphereGeometry(.04,6,6),ey,ex,1.55,-.27,grp,false);
 const arms=[];for(const ax of[-.38,.38]){const a=add(new THREE.CapsuleGeometry(.08,.4,3,6),M(m.color,{roughness:.5}),ax,.85,-.1,grp);arms.push(a);}
 const k=(geo,c,x,y,z)=>add(geo,M(c),x,y,z,grp);
 if(id==='merlin')k(new THREE.ConeGeometry(.33,.7,12),0x6a4cff,0,2,0);
 if(id==='mick')k(new THREE.CylinderGeometry(.28,.24,.35,10),0xffffff,0,1.9,0);
 if(id==='manny')k(new THREE.SphereGeometry(.32,10,6,0,Math.PI*2,0,Math.PI/2),0xf2c230,0,1.58,0);
 if(id==='scout')k(new THREE.BoxGeometry(.36,.1,.12),0x333,0,1.58,-.28);
 if(id==='jocko')k(new THREE.TorusGeometry(.3,.04,6,16),0x111,0,1.62,0).rotation.x=Math.PI/2;
 if(id==='jr')k(new THREE.BoxGeometry(.06,.22,.03),0xc9a86a,0,1.05,-.33);
 if(id==='ness')k(new THREE.SphereGeometry(.08,6,6),0x222,.2,1.35,-.3);
 if(id==='sage')k(new THREE.SphereGeometry(.14,8,6),0x3fae5a,0,1.85,0);
 if(id==='quill')k(new THREE.ConeGeometry(.04,.5,4),0xffffff,.32,1.85,0).rotation.z=-.5;
 if(id==='shoppy')k(new THREE.BoxGeometry(.3,.25,.25),0xc8a060,0,.85,-.35);
 // seat world position
 const seat=new THREE.Vector3(0,0,id==='merlin'?.4:.85);if(id==='merlin')seat.set(0,0,-1.9+1.6);desk.localToWorld(seat);
 if(id==='merlin')seat.set(0,0,-10.1);
 grp.position.copy(seat);grp.rotation.y=yaw;sc.add(grp);
 const el=document.createElement('div');el.className='lbl';el.onclick=()=>card(id);el.innerHTML='<i></i>'+m.name;document.getElementById('labels').appendChild(el);
 el.onmouseenter=()=>hover=id;el.onmouseleave=()=>hover=null;
 bots[id]={grp,el,scr,glow,arms,body,head,seat:seat.clone(),yaw,tgt:seat.clone(),data:null,phase:Math.random()*6};}
let hover=null;
// interactions
const ray=new THREE.Raycaster(),mv=new THREE.Vector2();let lastUser=-99,tourOn=true;const clk=new THREE.Clock();
const btn=document.getElementById('tour');btn.onclick=()=>{tourOn=!tourOn;btn.textContent=tourOn?'⏸ Tour':'▶ Tour';ctl.autoRotate=tourOn;lastUser=-99;};
ctl.addEventListener('start',()=>{lastUser=clk.elapsedTime;ctl.autoRotate=false;});
const pick=e=>{mv.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(mv,cam);let best=null,bd=1e9;for(const id in bots){const h=ray.intersectObject(bots[id].grp,true);if(h.length&&h[0].distance<bd){bd=h[0].distance;best=id;}}return best;};
let down=null;r.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
r.domElement.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<6){const id=pick(e);if(id)card(id);}});
if(!MOBILE)r.domElement.addEventListener('pointermove',e=>{if(e.buttons)return;hover=pick(e);r.domElement.style.cursor=hover?'pointer':'';});
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();r.setSize(innerWidth,innerHeight);});
// idle wandering to break area
let bi=0;setInterval(()=>{for(const id in bots){const b=bots[id],st=b.data?.status||'idle';
 if(st==='idle'){if(b.tgt.equals(b.seat)||Math.random()<.3){const p=BREAK[(bi++)%BREAK.length];b.tgt.set(p[0]+(Math.random()-.5),0,p[1]+(Math.random()-.5));}}else b.tgt.copy(b.seat);}},4000);
// wall screen
function drawWall(t){const c=wsC.getContext('2d');c.fillStyle='#14122a';c.fillRect(0,0,512,220);c.fillStyle='#b9b0ff';c.font='bold 26px system-ui';c.fillText('⚡ MERLIN · WAR ROOM',16,36);
 let y=66,i=0;c.font='17px system-ui';for(const id in bots){const d=bots[id].data;const st=d?.status||'idle';const col=st==='working'?'#3dff8a':st==='waiting'?'#ffb020':'#7a8290';
  const x=16+(i%2)*250,yy=y+Math.floor(i/2)*30;c.fillStyle=col;c.beginPath();c.arc(x+6,yy-6,6,0,7);c.fill();c.fillStyle='#e8e6ff';c.fillText(BOTS_META[id].name+' · '+st,x+18,yy);i++;}
 wsT.needsUpdate=true;}
let wallT=0;
// tour
let ti=0,tNext=0;const tgtV=new THREE.Vector3();ctl.target.set(0,0,-1);
const v=new THREE.Vector3(),rects=[];let frame=0;
(function loop(){requestAnimationFrame(loop);const dt=Math.min(clk.getDelta(),.05),t=clk.elapsedTime;frame++;
 if(tourOn&&!ctl.autoRotate&&t-lastUser>20)ctl.autoRotate=true;
 if(tourOn&&ctl.autoRotate){if(t>tNext){ti=(ti+1)%TOUR.length;tNext=t+9;}tgtV.set(...TOUR[ti]);ctl.target.lerp(tgtV,.008);
  const wantD=(ti===0?34:16)*(innerWidth<innerHeight?1.6:1);const off=cam.position.clone().sub(ctl.target);const d=off.length();off.setLength(d+(wantD-d)*.01);cam.position.copy(ctl.target).add(off);}
 ctl.update();
 for(const f of candles)f.scale.setScalar(.85+Math.sin(t*13+f.position.x)*.12+Math.random()*.05);cl.intensity=5.5+Math.sin(t*9)*.5;
 arm.rotation.y=Math.sin(t*.8)*.8;arm2.rotation.x=Math.sin(t*1.3)*.4;duck.position.y=1.35+Math.abs(Math.sin(t*3))*.05;bag.rotation.z=Math.sin(t*2)*.05;
 if(t-wallT>2){drawWall(t);wallT=t;}
 for(const id in bots){const b=bots[id],st=b.data?.status||'idle',p=b.grp.position;
  const dx=b.tgt.x-p.x,dz=b.tgt.z-p.z,d=Math.hypot(dx,dz);const walking=d>.08;
  if(walking){const sp=Math.min(d,2.2*dt);p.x+=dx/d*sp;p.z+=dz/d*sp;b.grp.rotation.y=Math.atan2(-dx,-dz);p.y=Math.abs(Math.sin(t*10))*.06;b.arms[0].rotation.x=Math.sin(t*10)*.6;b.arms[1].rotation.x=-Math.sin(t*10)*.6;b.body.position.y=.75;}
  else{const atSeat=b.tgt.equals(b.seat);if(atSeat)b.grp.rotation.y=b.yaw;p.y=0;
   if(atSeat&&id!=='merlin'){b.body.position.y=.55;b.head.position.y=1.3;}else{b.body.position.y=.75;b.head.position.y=1.5;}
   if(st==='working'){const a=Math.sin(t*18+b.phase)*.25;b.arms[0].rotation.x=-1.2+a;b.arms[1].rotation.x=-1.2-a;}
   else if(st==='waiting'){b.arms[0].rotation.x=-.3;b.arms[1].rotation.x=-.3;b.head.rotation.z=Math.sin(t*1.5+b.phase)*.12;}
   else{b.arms[0].rotation.x=0;b.arms[1].rotation.x=-1.4;}}// idle: holding a mug
  // monitor
  const sc0=st==='working'?SC.working:st==='waiting'?SC.waiting:SC.idle;b.scr.material.color.setHex(sc0);
  if(st==='working')b.scr.material.color.multiplyScalar(.8+.2*Math.sin(t*6+b.phase));if(st==='waiting')b.scr.material.color.multiplyScalar(.7+.3*Math.abs(Math.sin(t*2)));
  b.glow.color.setHex(sc0);b.glow.intensity=st==='idle'?0:st==='working'?2.5:1.8;
  b.el.firstChild.style.background='#'+(st==='working'?'2ecc71':st==='waiting'?'f5a623':'9aa3ad');}
 // labels: screen-space de-confliction, nearest first; hovered always wins
 if(frame%2===0){const arr=[];for(const id in bots){const b=bots[id];v.set(b.grp.position.x,2.3,b.grp.position.z).project(cam);if(v.z>1||Math.abs(v.x)>1.05||Math.abs(v.y)>1.05){b.el.style.display='none';continue;}
   arr.push({id,b,x:(v.x+1)/2*innerWidth,y:(1-v.y)/2*innerHeight,z:v.z});}
  arr.sort((a,c)=>(a.id===hover?-1:c.id===hover?1:a.z-c.z));rects.length=0;
  for(const o of arr){const w=o.b.el.offsetWidth||70,h=22;const R=[o.x-w/2-3,o.y-h-3,o.x+w/2+3,o.y+3];
   const hit=rects.some(q=>R[0]<q[2]&&R[2]>q[0]&&R[1]<q[3]&&R[3]>q[1]);
   if(hit&&o.id!==hover){o.b.el.style.display='none';continue;}rects.push(R);o.b.el.style.display='block';o.b.el.style.transform=`translate(${o.x}px,${o.y}px) translate(-50%,-100%)`;}}
 r.render(sc,cam);})();
window.__bothq={bots,ctl,cam};
poll();setInterval(poll,BOTHQ_CONFIG.pollMs);}
function card(id){const d=bots[id].data||{},m=BOTS_META[id];const $=i=>document.getElementById(i);$('cn').textContent=d.name||m.name;$('cr').textContent=m.role;$('cs').textContent=STATION[id]+(d.station?' ('+d.station+')':'');$('ct').textContent=d.task||'—';$('cst').textContent=d.status||'idle';$('cst').className='pill '+(d.status||'idle');$('cu').textContent=d.updated?fmt(d.updated):'—';$('card').style.display='block';}
async function poll(){try{data=await bothqFetchStatus('../');document.getElementById('upd').textContent='updated '+fmt(data.updated);
 for(const d of data.bots){const b=bots[d.id];if(!b)continue;b.data=d;b.el.title=d.task||'';}}catch(e){document.getElementById('upd').textContent='status offline';}}
bothqGate(start);
