import * as THREE from '../vendor/three.module.min.js';import {OrbitControls} from '../vendor/OrbitControls.js';
import {EffectComposer} from '../vendor/jsm/postprocessing/EffectComposer.js';import {RenderPass} from '../vendor/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '../vendor/jsm/postprocessing/UnrealBloomPass.js';import {OutputPass} from '../vendor/jsm/postprocessing/OutputPass.js';
import {RoundedBoxGeometry} from '../vendor/jsm/RoundedBoxGeometry.js';import {RoomEnvironment} from '../vendor/jsm/RoomEnvironment.js';
const MOBILE=matchMedia('(pointer:coarse)').matches||innerWidth<700, PORTRAIT=()=>innerWidth<innerHeight;
const CY=0x3fb8a8,MG=0xc4688e,PU=0xffa24a;
// desk [x,z,yaw]
const DESK={merlin:[0,-9.2,0],jr:[-16.5,-8.6,0],jocko:[13.5,-7.4,0],sage:[-10,-2.5,Math.PI/2],scout:[-10,2.5,Math.PI/2],quill:[10,-2.5,-Math.PI/2],ness:[10,2.5,-Math.PI/2],shoppy:[7.5,8.6,0],mick:[3.5,8.6,0],manny:[-14,7.6,Math.PI/2]};
const STATION={merlin:'War Room',jr:'Prayer Corner',jocko:'Gym',sage:'Open Desks',scout:'Open Desks',quill:'Open Desks',ness:'Open Desks',shoppy:'Ops Desk',mick:'Ops Desk',manny:'Build Lab'};
const LOUNGE=[0,1.2];const IDS=Object.keys(DESK);
const BAR=i=>[11.6+i*.9,11.9];
const SC={working:0x3dff8a,waiting:0xffb020,idle:0x202838};
const TOUR=[[0,0,innerWidth<innerHeight?-4:0],[0,1,-10],[-16,1,-10],[15,1,-9],[15,1,11],[0,1,1.2],[-14,1,9]];
let data=null;const bots={};let eff=b=>b.data||{status:'idle',task:''};
function fmt(t){try{return new Date(t).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'})}catch(e){return t}}
function ctex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function start(){
const r=new THREE.WebGLRenderer({antialias:!MOBILE,powerPreference:'high-performance'});const PR=Math.min(devicePixelRatio,MOBILE?1.25:1.75);r.setPixelRatio(PR);r.setSize(innerWidth,innerHeight);
r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.1;document.body.prepend(r.domElement);
const sc=new THREE.Scene();sc.background=new THREE.Color(0x2a2026);sc.fog=new THREE.FogExp2(0x3a2c2a,.011);
const pm=new THREE.PMREMGenerator(r);sc.environment=pm.fromScene(new RoomEnvironment(),.04).texture;
const cam=new THREE.PerspectiveCamera(PORTRAIT()?62:48,innerWidth/innerHeight,0.1,200);cam.position.set(0,27,33);if(PORTRAIT())cam.position.set(0,40,18);
const ctl=new OrbitControls(cam,r.domElement);ctl.enableDamping=true;ctl.dampingFactor=.06;ctl.maxPolarAngle=1.25;ctl.minDistance=6;ctl.maxDistance=60;ctl.autoRotate=true;ctl.autoRotateSpeed=.25;
const comp=new EffectComposer(r);comp.addPass(new RenderPass(sc,cam));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth/(MOBILE?2:1),innerHeight/(MOBILE?2:1)),.28,.5,.95);comp.addPass(bloom);comp.addPass(new OutputPass());
// lights
sc.add(new THREE.HemisphereLight(0xffd9b0,0x3a2a20,.75));
const moon=new THREE.DirectionalLight(0xffc890,1.25);moon.position.set(-14,22,-20);moon.castShadow=true;const s=moon.shadow.camera;s.left=-26;s.right=26;s.top=20;s.bottom=-20;s.far=80;moon.shadow.mapSize.set(MOBILE?1024:2048,MOBILE?1024:2048);moon.shadow.bias=-.0005;sc.add(moon);
const PL=(c,i,d,x,y,z)=>{const l=new THREE.PointLight(c,i,d,1.6);l.position.set(x,y,z);sc.add(l);return l;};
PL(0xffb26a,14,15,0,4,1.2);PL(0xffb070,7,10,15.5,3.6,11.5);PL(0xffd0a0,6,11,0,3.5,-11);if(!MOBILE){PL(0xff9a60,6,11,15,3.5,-10);PL(0xffc080,6,11,-15,3.5,10);}
const MC={};const M=(c,o={})=>{const k=c+JSON.stringify(o);if(MC[k])return MC[k];const {env,...oo}=o;const m=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.5,metalness:.1},oo));m.envMapIntensity=o.env??.6;return MC[k]=m;};
const N=c=>{const k='n'+c;if(MC[k])return MC[k];const m=new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(1.25),toneMapped:false});return MC[k]=m;};
const add=(geo,mat,x,y,z,parent=sc,sh=true)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=sh;parent.add(m);return m;};
const GC={};const bgeo=(w,h,d)=>{const k=w+','+h+','+d;if(GC[k])return GC[k];const m=Math.min(w,h,d),X=Math.max(w,h,d);return GC[k]=(!MOBILE&&m>=.05&&X>=.25&&X<12)?new RoundedBoxGeometry(w,h,d,2,Math.min(.03,m*.3)):new THREE.BoxGeometry(w,h,d);};
const box=(w,h,d,c,x,y,z,o,p)=>add(bgeo(w,h,d),typeof c==='number'?M(c,o):c,x,y,z,p);
const blobT=ctex(64,64,(g)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,.75)');gr.addColorStop(.6,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);});
const blobM=new THREE.MeshBasicMaterial({map:blobT,color:0x000000,transparent:true,opacity:.55,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
const blob=(w,d,x,z,p=sc)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),blobM);m.rotation.x=-Math.PI/2;m.position.set(x,.015,z);m.renderOrder=1;p.add(m);return m;};
const neon=(w,h,d,c,x,y,z,p)=>add(new THREE.BoxGeometry(w,h,d),N(c),x,y,z,p||sc,false);
const plane=(w,h,mat,x,y,z,ry=0,p=sc)=>{const m=add(new THREE.PlaneGeometry(w,h),mat,x,y,z,p,false);m.rotation.y=ry;return m;};
// floor: dark polished tiles
let _r=11;const RN=()=>(_r=(_r*16807)%2147483647)/2147483647;
const wood=ctex(512,512,(g,w,h)=>{g.fillStyle='#7a5234';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=2){const v=Math.sin(y*.05+Math.sin(y*.013)*4)*.5+.5;g.fillStyle=`rgba(${60+v*50|0},${36+v*30|0},${20+v*14|0},.35)`;g.fillRect(0,y,w,2);}for(let i=0;i<14;i++){g.strokeStyle='rgba(40,22,10,.35)';g.beginPath();g.ellipse(RN()*w,RN()*h,8+RN()*10,3+RN()*4,0,0,7);g.stroke();}});
const concrete=ctex(512,512,(g,w,h)=>{g.fillStyle='#8a837a';g.fillRect(0,0,w,h);for(let i=0;i<9000;i++){const v=110+RN()*60|0;g.fillStyle=`rgba(${v},${v-6},${v-12},.18)`;g.fillRect(RN()*w,RN()*h,2+RN()*3,2+RN()*3);}for(let i=0;i<6;i++){g.fillStyle='rgba(60,55,50,.08)';g.beginPath();g.arc(RN()*w,RN()*h,40+RN()*90,0,7);g.fill();}});
const fabric=ctex(256,256,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);for(let i=0;i<w;i+=3){g.fillStyle=`rgba(0,0,0,${.05+RN()*.06})`;g.fillRect(i,0,1,h);g.fillRect(0,i,w,1);}});
const stone=ctex(512,512,(g,w,h)=>{g.fillStyle='#5a524a';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=64)for(let x=-(y/64%2)*48;x<w;x+=96){const v=100+RN()*50|0;g.fillStyle=`rgb(${v},${v-8},${v-16})`;g.fillRect(x+3,y+3,90,58);}});
[wood,concrete,fabric,stone].forEach(t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;});
const TM=(map,c,o={},rep=[1,1])=>{const t=map.clone();t.needsUpdate=true;t.repeat.set(...rep);return new THREE.MeshStandardMaterial(Object.assign({map:t,color:c,roughness:.7,metalness:0},o));};
const WOODM=TM(wood,0xffffff,{roughness:.55}),WOODD=TM(wood,0x9a8070,{roughness:.5}),CONC=TM(concrete,0xffffff,{roughness:.85},[3,1]),STONE=TM(stone,0xffffff,{roughness:.8},[2,2]);
const FAB=c=>TM(fabric,c,{roughness:.95});const TERRA=M(0xb0603c,{roughness:.8});
const ft0=ctex(256,256,(g)=>{g.fillStyle='#10111a';g.fillRect(0,0,256,256);g.strokeStyle='#22e6ff22';g.lineWidth=2;for(let i=0;i<=256;i+=64){g.beginPath();g.moveTo(i,0);g.lineTo(i,256);g.moveTo(0,i);g.lineTo(256,i);g.stroke();}});
const ft=concrete.clone();ft.needsUpdate=true;ft.repeat.set(8,6);add(new THREE.PlaneGeometry(42,30),new THREE.MeshStandardMaterial({map:ft,color:0x9a9088,roughness:.3,metalness:.05,envMapIntensity:.5}),0,0,0).rotation.x=-Math.PI/2;
// skyline
const sky=ctex(1024,320,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#2a2438');gr.addColorStop(.55,'#6a4a52');gr.addColorStop(1,'#d08a5a');g.fillStyle=gr;g.fillRect(0,0,w,h);
 let rnd=7;const R=()=>(rnd=(rnd*16807)%2147483647)/2147483647;
 for(let L=0;L<2;L++)for(let x=0;x<w;){const bw=20+R()*50,bh=(L?60:110)+R()*(L?120:170);g.fillStyle=L?'#120a26':'#1c1236';g.fillRect(x,h-bh,bw,bh);
  for(let wy=h-bh+6;wy<h-4;wy+=9)for(let wx=x+4;wx<x+bw-4;wx+=7)if(R()<.35){g.fillStyle=R()<.7?'#ffd99a':'#7fe9ff';g.fillRect(wx,wy,3,4);}
  if(L&&R()<.35){const cs=['#ff3cc7','#22e6ff','#a066ff','#ffe14d'];g.fillStyle=cs[Math.floor(R()*4)];g.shadowColor=g.fillStyle;g.shadowBlur=12;g.fillRect(x+3,h-bh+12,bw-6,8);g.shadowBlur=0;}x+=bw+2;}});
{const c=sky.image.getContext('2d');c.strokeStyle='rgba(220,220,235,.12)';c.lineWidth=1;for(let i=0;i<700;i++){const x=RN()*1024,y=RN()*320;c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y+14);c.stroke();}c.fillStyle='rgba(200,170,160,.18)';c.fillRect(0,0,1024,320);sky.needsUpdate=true;}
const skyM=new THREE.MeshBasicMaterial({map:sky,toneMapped:false,fog:false,color:0xd8c8c0});
plane(90,26,skyM,0,9,-30);plane(70,26,skyM,-34,9,0,Math.PI/2);
// walls (back + left with big windows)
const WH=6;const wm=CONC;
const tint=new THREE.MeshStandardMaterial({color:0x66d9ff,transparent:true,opacity:.06,roughness:0,metalness:0,depthWrite:false,side:THREE.DoubleSide});
for(let x=-21;x<21;x+=6){box(1.2,WH,.4,wm,x+.6,WH/2,-15);box(4.8,.7,.4,wm,x+3.6,.35,-15);box(4.8,1.4,.4,wm,x+3.6,WH-.7,-15);if(x>-14)plane(4.8,3.9,tint,x+3.6,2.65,-14.9);neon(4.8,.05,.06,CY,x+3.6,.72,-14.75);}
box(1.2,WH,.4,wm,20.4,WH/2,-15);
for(let z=-15;z<15;z+=6){box(.4,WH,1.2,wm,-21,WH/2,z+.6);box(.4,.7,4.8,wm,-21,.35,z+3.6);box(.4,1.4,4.8,wm,-21,WH-.7,z+3.6);plane(4.8,3.9,tint,-20.9,2.65,z+3.6,Math.PI/2);neon(.06,.05,4.8,MG,-20.75,.72,z+3.6);}
box(.4,1.2,30,wm,21,.6,0);box(42,.5,.3,wm,0,.25,15);neon(.06,.06,30,PU,20.78,1.22,0);neon(42,.06,.06,CY,0,.52,14.84);
// BOT HQ sign
const sign=ctex(1024,256,(g,w,h)=>{g.font='900 150px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.shadowBlur=30;g.shadowColor='#ff3cc7';g.strokeStyle='#ff9be6';g.lineWidth=6;g.strokeText('BOT HQ',w/2,h/2);g.fillStyle='#ffe6fa';g.fillText('BOT HQ',w/2,h/2);});
plane(7,1.75,new THREE.MeshBasicMaterial({map:sign,transparent:true,toneMapped:false,color:0xffffff}),0,5.3,-14.75);
// ---- war room: clear tinted glass + neon trim
const glass=new THREE.MeshStandardMaterial({color:0x22e6ff,transparent:true,opacity:.1,roughness:0,metalness:.2,depthWrite:false,side:THREE.DoubleSide,envMapIntensity:1.5});
const gw=(w,d,x,z)=>{const m=add(new THREE.PlaneGeometry(Math.max(w,d),3.2),glass,x,1.6,z,sc,false);if(d>w)m.rotation.y=Math.PI/2;neon(w||.05,.05,d||.05,CY,x,3.22,z);neon(w||.05,.05,d||.05,CY,x,.03,z);};
gw(0,7.6,-5.5,-11);gw(0,7.6,5.5,-11);gw(3.7,0,-3.65,-7.2);gw(3.7,0,3.65,-7.2);
for(const x of[-5.5,5.5])for(const z of[-14.8,-7.2])neon(.05,3.2,.05,CY,x,1.6,z);
neon(7,.04,.04,PU,0,1.0,-10.3);neon(7,.04,.04,PU,0,1.0,-12.7);
box(.5,1,.5,0x222,-2.8,.5,-11.5,{metalness:.8});box(.5,1,.5,0x222,2.8,.5,-11.5,{metalness:.8});
for(const x of[-2.2,-.7,.7,2.2])box(.55,.55,.55,FAB(0x6a4a3a),x,.45,-12.9);box(7,.1,2.4,WOODM,0,1.05,-11.5);
const wsC=document.createElement('canvas');wsC.width=512;wsC.height=220;const wsT=new THREE.CanvasTexture(wsC);wsT.colorSpace=THREE.SRGBColorSpace;
plane(5.6,2.4,new THREE.MeshBasicMaterial({map:wsT,toneMapped:false}),0,3.1,-14.7);
// ---- prayer corner: warm, calm, no neon
const WOOD=0x8a5a34;
box(.25,4.2,7.6,WOODM,-12.6,2.1,-10.9);box(4.1,4.2,.25,WOODM,-18.7,2.1,-7.2);box(8,.02,7.4,STONE,-16.8,.012,-10.9);
box(8.2,4.2,.15,0x3a2416,-16.8,2.1,-14.7,{roughness:.8});// warm wood back panel covers window
const sg=ctex(256,320,(g,w,h)=>{const cs=['#f5c46a','#e89a4a','#c75b3a','#f2dca0','#a8743a'];for(let y=0;y<h;y+=32)for(let x=0;x<w;x+=32){g.fillStyle=cs[(x/32*3+y/32*7)%5];g.fillRect(x+2,y+2,28,28);}g.globalAlpha=.6;g.fillStyle='#fff4d6';g.fillRect(w/2-14,30,28,h-60);g.fillRect(40,100,w-80,26);});
plane(2.4,3,new THREE.MeshStandardMaterial({map:sg,emissive:0xffffff,emissiveMap:sg,emissiveIntensity:.1}),-16.8,2.6,-14.6);
box(.28,2.6,.16,0xd6b36a,-16.8,2.4,-14.4,{metalness:.7,roughness:.3});box(1.3,.28,.16,0xd6b36a,-16.8,3.05,-14.4,{metalness:.7,roughness:.3});
box(3,1,1,0xf1e7d3,-16.8,.5,-13.4,{roughness:.8});box(3.1,.05,1.1,0xffffff,-16.8,1.02,-13.4,{roughness:.9});
add(new THREE.BoxGeometry(.6,.08,.42),M(0x7a1f1f),-16.8,1.09,-13.4);
const candles=[];for(const dx of[-1.15,1.15,-.8,.8]){const hgt=dx*dx>1?.5:.35;box(.12,hgt,.12,0xfff7e6,-16.8+dx,1.05+hgt/2,-13.4);
 const f=add(new THREE.SphereGeometry(.065,8,8),new THREE.MeshBasicMaterial({color:new THREE.Color(0xffb84a).multiplyScalar(1.6),toneMapped:false}),-16.8+dx,1.12+hgt,-13.4,sc,false);f.scale.y=1.6;candles.push(f);}
const cl=PL(0xffa850,6,8,-16.8,2,-12);
box(6,.02,5,0x5a1e1e,-16.8,.01,-10.2,{roughness:1});
for(const z of[-11.3,-9.4])for(const x of[-18.4,-15.2]){box(2.2,.45,.6,0x6b4423,x,.45,z,{roughness:.6});box(2.2,.7,.12,0x6b4423,x,.95,z+.3,{roughness:.6});}
// ---- gym
box(8,.03,7.6,0x15151b,16.5,.015,-10.9,{roughness:.9});
for(const x of[13.6,17.6]){box(.18,2.6,.18,0x1c1c22,x,1.3,-13.2,{metalness:.8,roughness:.25});neon(.04,2.6,.04,MG,x+.1,1.3,-13.1);}
box(4.3,.1,.1,0xbbbbbb,15.6,2.4,-13.2,{metalness:1,roughness:.2});
box(2,.55,.9,0x111116,15.6,.3,-11.2);box(.1,.1,3,0xcccccc,15.6,1.35,-11.2,{metalness:1,roughness:.2});
for(const dz of[-1.2,1.2])add(new THREE.CylinderGeometry(.45,.45,.15,20),M(0x111,{metalness:.5}),15.6,1.35,-11.2+dz).rotation.x=Math.PI/2;
const bag=add(new THREE.CylinderGeometry(.4,.4,1.6,16),M(0x5a0f3a,{roughness:.4}),19,2.2,-8);box(.05,1.4,.05,0x333,19,3.7,-8);
box(.5,1.6,2.4,0x1c1c22,20.2,.8,-12.6,{metalness:.6});for(let i=0;i<4;i++)add(new THREE.CylinderGeometry(.12,.12,.5,10),M(0x333,{metalness:.8}),20.1,.4+i*.38,-12.6).rotation.x=Math.PI/2;
const gs=ctex(512,128,(g,w,h)=>{g.font='800 80px system-ui';g.textAlign='center';g.textBaseline='middle';g.shadowBlur=20;g.shadowColor='#ff3cc7';g.fillStyle='#ffd0f2';g.fillText('TRAIN',w/2,h/2);});
plane(3,.75,new THREE.MeshBasicMaterial({map:gs,transparent:true,toneMapped:false}),16,4.4,-14.75);
// ---- coffee bar (front right)
box(9,1.05,1.1,WOODM,15.9,.52,13.6);box(9.2,.08,1.25,STONE,15.9,1.09,13.55);
neon(9,.04,.04,CY,15.9,.08,13.0);neon(9.2,.03,.03,MG,15.9,1.04,12.93);
box(9,2.6,.3,WOODD,15.9,2.6,14.7);// back bar
for(let i=0;i<10;i++)box(.18,.35,.18,[0x6a3a20,0x3a5a40,0x8a6a30,0x5a2a30][i%4],12.2+i*.8,2.6,14.5,{roughness:.15,metalness:.1});
// espresso machine
box(1.3,.8,.7,0x6e6a66,13,1.53,13.7,{metalness:.7,roughness:.45});box(1.3,.08,.72,0x2a2624,13,1.97,13.7,{roughness:.6});box(.9,.12,.05,0x3a3430,13,1.75,13.34,{roughness:.6});add(new THREE.CircleGeometry(.03,10),new THREE.MeshBasicMaterial({color:0xffa24a}),12.7,1.75,13.31,sc,false).rotation.y=Math.PI;
for(const dx of[-.3,.3]){box(.08,.2,.08,0x111,13+dx,1.25,13.3);}add(new THREE.SphereGeometry(.1,10,8),M(0xddddff,{metalness:1,roughness:.1}),13.45,1.75,13.33);
// display case w/ pastries
const caseG=new THREE.MeshStandardMaterial({color:0xbfeaff,transparent:true,opacity:.15,roughness:0,depthWrite:false,envMapIntensity:1.5});
add(new THREE.BoxGeometry(2.2,.6,.9),caseG,17.6,1.43,13.6,sc,false);neon(2.2,.03,.03,0xffd27a,17.6,1.72,13.18);
for(let i=0;i<6;i++){const d=add(new THREE.TorusGeometry(.12,.06,8,14),M([0xd99a5a,0xff7ab8,0x8a5a3a][i%3],{roughness:.6}),16.85+i*.3,1.22,13.6);d.rotation.x=Math.PI/2;}
for(let i=0;i<5;i++)add(new THREE.SphereGeometry(.13,10,8),M(0xe0a868,{roughness:.7}),16.9+i*.35,1.5,13.75).scale.y=.6;
// cups / drinks on counter
for(let i=0;i<5;i++){const x=14.2+i*.55,col=[0xffffff,0x22e6ff,0xff3cc7,0xffffff,0xa066ff][i];add(new THREE.CylinderGeometry(.09,.07,.22,12),M(col,{roughness:.3,emissive:i%2?col:0,emissiveIntensity:.3}),x,1.24,13.25);}
// stools
for(let i=0;i<5;i++){const x=12.05+i*1.8;add(new THREE.CylinderGeometry(.06,.06,.8,8),M(0x999,{metalness:1,roughness:.2}),x,.4,12.5);add(new THREE.CylinderGeometry(.3,.3,.08,16),M(0x2a1d40,{roughness:.4}),x,.82,12.5);neon(.5,.02,.02,CY,x,.05,12.5);}
// neon menu board
const menu=ctex(512,320,(g,w,h)=>{g.fillStyle='#0b0816';g.fillRect(0,0,w,h);g.strokeStyle='#22e6ff';g.lineWidth=6;g.shadowColor='#22e6ff';g.shadowBlur=14;g.strokeRect(8,8,w-16,h-16);
 g.font='900 62px system-ui';g.textAlign='center';g.fillStyle='#ff9be6';g.shadowColor='#ff3cc7';g.fillText('REFUEL',w/2,80);g.font='600 30px system-ui';g.textAlign='left';g.shadowBlur=8;g.shadowColor='#22e6ff';
 [['Espresso','3'],['Oat Latte','5'],['Cold Brew','4'],['Matcha','5'],['Croissant','3'],['Donut','2']].forEach(([n,p],i)=>{g.fillStyle='#d8f8ff';g.fillText(n,40+(i%2)*240,150+Math.floor(i/2)*55);g.fillStyle='#ffe14d';g.fillText('$'+p,190+(i%2)*240,150+Math.floor(i/2)*55);});});
plane(4,2.5,new THREE.MeshBasicMaterial({map:menu,toneMapped:false}),15.9,4.6,14.53,Math.PI);
// ---- center lounge
box(11,.03,8,FAB(0xb8a68a),0,.015,LOUNGE[1]);neon(11,.03,.05,PU,0,.03,LOUNGE[1]-4);neon(11,.03,.05,PU,0,.03,LOUNGE[1]+4);
const SOFAS=[];const sofa=(x,z,ry,c)=>{const g=new THREE.Group();SOFAS.push(g);blob(3.4,1.5,0,0,g);g.position.set(x,0,z);g.rotation.y=ry;sc.add(g);const F=FAB(c);box(3,.45,1,F,0,.3,0,null,g);box(3,.7,.25,c,0,.75,.45,{roughness:.6},g);box(.25,.6,1,c,-1.4,.55,0,{roughness:.6},g);box(.25,.6,1,c,1.4,.55,0,{roughness:.6},g);neon(3,.03,.03,CY,0,.06,-.5,g);};
sofa(-4.3,LOUNGE[1],-Math.PI/2,0x6a7a4a);sofa(4.3,LOUNGE[1],Math.PI/2,0x6a7a4a);sofa(0,LOUNGE[1]+3.6,0,0xa0583a);
for(const [x,z,c] of[[-3,-1.8,0xa0583a],[3,-1.8,0x7a8a5a],[-2.5,4.2,0xc09040]]){const b=add(new THREE.SphereGeometry(.55,18,12),FAB(c),x,.38,LOUNGE[1]+z*.6);b.scale.y=.65;}
box(1.6,.32,.8,WOODM,-4.3+1.6,.16,LOUNGE[1]);box(1.6,.32,.8,WOODM,4.3-1.6,.16,LOUNGE[1]);
// holo table
add(new THREE.CylinderGeometry(.9,1.1,.8,32),STONE,0,.4,LOUNGE[1]);add(new THREE.CylinderGeometry(.92,.92,.04,32),new THREE.MeshBasicMaterial({color:0x0a6f80,toneMapped:false}),0,.82,LOUNGE[1],sc,false);
const holoM=new THREE.MeshBasicMaterial({color:CY,wireframe:true,transparent:true,opacity:.7,toneMapped:false,blending:THREE.AdditiveBlending});
const holo=add(new THREE.IcosahedronGeometry(.55,1),holoM,0,1.7,LOUNGE[1],sc,false);
const ring=add(new THREE.TorusGeometry(.8,.015,6,48),N(MG),0,1.3,LOUNGE[1],sc,false);ring.rotation.x=Math.PI/2;
const beam=add(new THREE.CylinderGeometry(.6,.9,1,24,1,true),new THREE.MeshBasicMaterial({color:CY,transparent:true,opacity:.04,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),0,1.3,LOUNGE[1],sc,false);
// neon ring pendants (replace black lamp shades)
const rings=[];for(const [x,z,c] of[[-3,LOUNGE[1],PU],[3,LOUNGE[1],CY],[0,-3.5,MG],[15.9,11,0x806020]]){const t=add(new THREE.TorusGeometry(.6,.04,8,40),N(c),x,4.6,z,sc,false);t.rotation.x=Math.PI/2;rings.push(t);}
// ---- build lab
box(5,.12,1.4,WOODM,-17.5,1.05,12);neon(5,.03,.03,CY,-17.5,.99,11.3);for(const x of[-19.7,-15.3])box(.15,1,1.2,0x333,x,.5,12,{metalness:.7});
box(5,2.2,.1,WOODD,-17.5,2.3,12.9);neon(5,.04,.04,MG,-17.5,3.42,12.84);for(let i=0;i<6;i++)box(.1,.5,.1,[0xff3cc7,0x22e6ff,0xa066ff,0xffe14d,0x999999,0x3dff8a][i],-19.5+i*.8,2.6,12.8,{metalness:.6});
const arm=new THREE.Group();arm.position.set(-16,1.1,11.8);sc.add(arm);box(.3,.8,.3,0xdddde8,0,.4,0,{metalness:.8,roughness:.2},arm);const arm2=box(.15,.8,.15,0xdddde8,0,.9,.2,{metalness:.8,roughness:.2},arm);neon(.05,.05,.05,CY,0,1.3,.2,arm2.parent);
const duck=add(new THREE.SphereGeometry(.22,12,10),M(0xffd640,{roughness:.4}),-18.5,1.35,11.8);
box(.12,1.4,6,WOODD,-11.6,.7,10);neon(.04,.04,6,CY,-11.6,1.42,10);
// holo screens
const holos=[];const hs=(seed,c)=>ctex(256,160,(g,w,h)=>{g.strokeStyle=c;g.fillStyle=c;g.lineWidth=3;g.strokeRect(4,4,w-8,h-8);g.globalAlpha=.8;for(let i=0;i<8;i++){const hh=20+((seed*31+i*47)%90);g.fillRect(20+i*28,h-20-hh,16,hh);}g.beginPath();for(let i=0;i<10;i++)g.lineTo(16+i*25,40+((seed*13+i*29)%40));g.stroke();});
for(const [x,y,z,ry,c,sd] of[[-17.5,2.4,10.3,0,'#22e6ff',1],[-10,2.6,0,Math.PI/2,'#ff3cc7',2],[10,2.6,0,-Math.PI/2,'#22e6ff',3],[0,2.9,-6.2,0,'#a066ff',4],[16,2.6,-9,0,'#ff3cc7',5]]){
 const m=plane(1.8,1.12,new THREE.MeshBasicMaterial({map:hs(sd,c),transparent:true,opacity:.45,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),x,y,z,ry);m.userData.y=y;holos.push(m);}
// living plant walls
const leaf=ctex(256,256,(g,w,h)=>{g.fillStyle='#24331c';g.fillRect(0,0,w,h);let r=3;const R=()=>(r=(r*16807)%2147483647)/2147483647;for(let i=0;i<900;i++){g.fillStyle=`hsl(${80+R()*40},${30+R()*25}%,${20+R()*25}%)`;g.beginPath();g.ellipse(R()*w,R()*h,4+R()*8,2+R()*4,R()*3,0,7);g.fill();}});
leaf.wrapS=leaf.wrapT=THREE.RepeatWrapping;
const PWS=[];const pw=(w,h,x,z,ry)=>{PWS.push([w,h,x,z,ry]);const t=leaf.clone();t.needsUpdate=true;t.repeat.set(w/2,h/2);const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;sc.add(g);
 box(w+.2,h+.2,.15,0x101018,0,h/2+.4,0,{metalness:.6},g);add(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,roughness:.9,emissive:0x1b5a24,emissiveIntensity:.12}),0,h/2+.4,.09,g,false);
 neon(w,.04,.06,0xffc080,0,.35,.12,g);const up=ctex(8,128,(c)=>{const gr=c.createLinearGradient(0,128,0,0);gr.addColorStop(0,'rgba(255,200,140,.35)');gr.addColorStop(1,'rgba(255,200,140,0)');c.fillStyle=gr;c.fillRect(0,0,8,128);});add(new THREE.PlaneGeometry(w,h*.8),new THREE.MeshBasicMaterial({map:up,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}),0,h*.4+.4,.11,g,false);};
pw(5,3.6,-7.2,-14.7,0);pw(4,3.6,20.75,3,-Math.PI/2);pw(4,3,-20.75,1.5,Math.PI/2);pw(4.2,2.6,0,LOUNGE[1]+5.3,0);pw(3,3.2,8.5,-14.7,0);
// planters
// ---- leaves (instanced), plants, trees, hanging planters
const leafShape=new THREE.Shape();leafShape.moveTo(0,0);leafShape.quadraticCurveTo(.55,.4,0,1);leafShape.quadraticCurveTo(-.55,.4,0,0);
const leafGeo=new THREE.ShapeGeometry(leafShape,5);{const pa=leafGeo.attributes.position;for(let i=0;i<pa.count;i++){const y=pa.getY(i),x=pa.getX(i);pa.setZ(i,-.28*y*y+.25*x*x);}leafGeo.computeVertexNormals();}
const LEAFM=[0x4f7a3a,0x6a8f45,0x3d6a3a,0x7a9a4a].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.7,side:THREE.DoubleSide}));
const LV=[[],[],[],[]];const dm=new THREE.Object3D();
const lf=(x,y,z,sx,sy,rx,ry,c)=>{dm.position.set(x,y,z);dm.rotation.set(rx,ry,0,'YXZ');dm.scale.set(sx,sy,sx);dm.updateMatrix();LV[c%4].push(dm.matrix.clone());};
const LEAF=[M(0x4f7a3a,{roughness:.85}),M(0x6a8f45,{roughness:.85}),M(0x3d6a3a,{roughness:.85})];
const plant=(x,z,sz=1,type=0)=>{add(new THREE.CylinderGeometry(.36*sz,.26*sz,.62*sz,18),TERRA,x,.31*sz,z);add(new THREE.CylinderGeometry(.33*sz,.33*sz,.03,16),M(0x3a2a1c,{roughness:1}),x,.6*sz,z,sc,false);blob(1.1*sz,1.1*sz,x,z);
 const y0=.6*sz;if(type===1){for(let i=0;i<9;i++)lf(x+Math.sin(i*2.4)*.08,y0,z+Math.cos(i*2.4)*.08,.16*sz,(1+(i%3)*.25)*sz,.08+(i%3)*.08,i*2.4,i);}
 else for(let i=0;i<13;i++){const a=i*2.4;lf(x,y0+(i%3)*.06,z,(.3+(i%4)*.05)*sz,(.5+(i%3)*.12)*sz,.45+(i%4)*.18,a,i);}};
const tree=(x,z)=>{add(new THREE.CylinderGeometry(.55,.42,.8,20),TERRA,x,.4,z);blob(1.6,1.6,x,z);add(new THREE.CylinderGeometry(.05,.09,2.1,8),M(0x5a4030,{roughness:.9}),x,1.85,z);
 for(let i=0;i<70;i++){const a=RN()*6.28,r=RN()*.75,h=2.5+RN()*1.1;lf(x+Math.cos(a)*r,h,z+Math.sin(a)*r,.2,.3,RN()*2-1,RN()*6.28,i);}};
const hang=(x,z,y=4.6)=>{add(new THREE.CylinderGeometry(.006,.006,7.2-y),M(0x222),x,(7.2+y)/2,z,sc,false);add(new THREE.SphereGeometry(.22,16,10,0,Math.PI*2,Math.PI/2,Math.PI/2),TERRA,x,y,z);
 for(let v=0;v<6;v++){const a=v*1.05;for(let j=0;j<8;j++){const rr=.2+j*.025;lf(x+Math.cos(a)*rr,y-.02-j*.15,z+Math.sin(a)*rr,.08,.14,Math.PI-.4+RN()*.8,a+RN(),v+j);}}};
[[-20,-4,0],[20,-3.5,1],[-11.5,-13.8,0],[11,-13.8,1],[-8,6.5,0],[8,6.5,1],[-10,13.5,1],[10.5,13.6,0],[-20,13.8,0],[6.8,-6.5,1],[-12,-6.6,1]].forEach(p=>plant(p[0],p[1],1.2,p[2]));
[[-8.8,-6.8],[7.6,12.5],[-20,8],[20,-0.5]].forEach(p=>tree(p[0],p[1]));
for(const z of[-3.5,5.5])box(30,.05,.05,0x2a2622,0,7.2,z,{metalness:.7,roughness:.4});
[[-6,-3.5],[-2,-3.5],[2,-3.5],[6,-3.5],[-8,5.5],[-3.5,5.5],[3.5,5.5],[8,5.5],[12,5.5],[-12,-3.5]].forEach((p,i)=>hang(p[0],p[1],4.4+(i%3)*.3));
// leaves protruding from plant walls
for(const [w,h,x,z,ry] of PWS)for(let i=0;i<(MOBILE?12:40);i++){const v=new THREE.Vector3((RN()-.5)*w,.5+RN()*h*.95,.12).applyAxisAngle(new THREE.Vector3(0,1,0),ry);lf(x+v.x,v.y,z+v.z,.12,.2,1.2+RN()*.6,ry+RN()*6.28,i);}
LV.forEach((arr,c)=>{if(!arr.length)return;const im=new THREE.InstancedMesh(leafGeo,LEAFM[c],arr.length);arr.forEach((m,i)=>im.setMatrixAt(i,m));im.castShadow=!MOBILE;im.receiveShadow=true;sc.add(im);});
// ---- whiteboard
{const g=new THREE.Group();g.position.set(-16.7,0,0);g.rotation.y=Math.PI/2;sc.add(g);const wb=ctex(512,300,(c,w,h)=>{c.fillStyle='#f4f1ea';c.fillRect(0,0,w,h);c.strokeStyle='#3a6a8a';c.lineWidth=4;c.strokeRect(40,40,120,60);c.strokeRect(220,40,120,60);c.strokeRect(130,170,140,60);c.beginPath();c.moveTo(160,70);c.lineTo(220,70);c.moveTo(280,100);c.lineTo(220,170);c.stroke();c.fillStyle='#a0503a';c.font='bold 26px system-ui';c.fillText('SPRINT',360,60);c.font='20px system-ui';c.fillStyle='#333';['- 3D HQ','- PD videos','- FaceTag'].forEach((s,i)=>c.fillText(s,360,100+i*30));});
 box(2.8,1.6,.06,0xd8d4cc,0,1.75,0,{roughness:.3},g);plane(2.7,1.5,new THREE.MeshStandardMaterial({map:wb,roughness:.25}),0,1.75,.035,0,g);for(const s of[-1.3,1.3])box(.05,1,.05,0x555,s,.5,0,{metalness:.8},g);box(1,.04,.12,0x777,0,.93,.06,{},g);}
// ---- wall art
const art=(seed)=>ctex(320,220,(c,w,h)=>{const cs=[['#e8c9a0','#c07040','#5a6a40','#2a3a30'],['#d8b890','#a05a3a','#6a8a6a','#3a2a24'],['#f0d8b0','#8a6a4a','#4a6a5a','#c08850']][seed];c.fillStyle=cs[0];c.fillRect(0,0,w,h);c.fillStyle=cs[1];c.beginPath();c.arc(w*.68,h*.38,42,0,7);c.fill();
 c.fillStyle=cs[2];c.beginPath();c.moveTo(0,h);c.quadraticCurveTo(w*.3,h*.4,w*.6,h*.75);c.quadraticCurveTo(w*.8,h*.55,w,h*.7);c.lineTo(w,h);c.fill();c.fillStyle=cs[3];c.fillRect(0,h*.88,w,h*.12);});
const pic=(x,y,z,ry,w,h,s)=>{const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;sc.add(g);box(w+.12,h+.12,.05,0x3a2a1c,0,0,0,{roughness:.6},g);plane(w,h,new THREE.MeshStandardMaterial({map:art(s),roughness:.8}),0,0,.03,0,g);};
pic(-9.6,5.25,-14.78,0,1.7,1.05,0);pic(9.6,5.25,-14.78,0,1.7,1.05,1);pic(-12.45,2.4,-10.5,Math.PI/2,2.2,1.4,2);
// ---- textured rugs
const kilim=ctex(256,256,(c,w,h)=>{c.fillStyle='#a8603e';c.fillRect(0,0,w,h);const cs=['#d8b88a','#5a3a2a','#6a7a5a'];for(let y=0;y<h;y+=32){c.fillStyle=cs[(y/32)%3];c.fillRect(0,y+12,w,6);for(let x=0;x<w;x+=32){c.beginPath();c.moveTo(x+16,y+4);c.lineTo(x+28,y+16);c.lineTo(x+16,y+28);c.lineTo(x+4,y+16);c.fill();}}for(let i=0;i<4000;i++){c.fillStyle=`rgba(0,0,0,${RN()*.08})`;c.fillRect(RN()*w,RN()*h,1,2);}});
kilim.wrapS=kilim.wrapT=THREE.RepeatWrapping;
const rug2=(w,d,x,z)=>{const t=kilim.clone();t.needsUpdate=true;t.repeat.set(w/2.5,d/2.5);add(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({map:t,roughness:1}),x,.012,z,sc,false).rotation.x=-Math.PI/2;};
rug2(3.4,8,-10,0);rug2(3.4,8,10,0);rug2(8.5,2.6,15.8,11.2);rug2(4,2.6,-16,10.6);
// ---- light shafts + dust motes
const shaftT=ctex(64,256,(c,w,h)=>{const gr=c.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,205,150,0)');gr.addColorStop(.12,'rgba(255,205,150,.55)');gr.addColorStop(1,'rgba(255,205,150,0)');c.fillStyle=gr;c.fillRect(0,0,w,h);});
const shaftM=new THREE.MeshBasicMaterial({map:shaftT,transparent:true,opacity:MOBILE?.1:.16,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
for(const x of[-17.4,-11.4,-5.4,.6,6.6,12.6]){const s=new THREE.Mesh(new THREE.CylinderGeometry(1.7,2.2,8.2,4,1,true),shaftM);s.position.set(x+1.2,2.1,-11.2);s.rotation.set(-1.05,Math.PI/4,0,'XYZ');s.renderOrder=5;sc.add(s);}
const DN=MOBILE?70:320,dpos=new Float32Array(DN*3);for(let i=0;i<DN;i++){dpos[i*3]=-18+RN()*36;dpos[i*3+1]=.3+RN()*4.5;dpos[i*3+2]=-14+RN()*27;}
const dgeo=new THREE.BufferGeometry();dgeo.setAttribute('position',new THREE.BufferAttribute(dpos,3));
const dustT=ctex(32,32,(c)=>{const gr=c.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(255,235,200,1)');gr.addColorStop(1,'rgba(255,235,200,0)');c.fillStyle=gr;c.fillRect(0,0,32,32);});
const dust=new THREE.Points(dgeo,new THREE.PointsMaterial({map:dustT,size:.05,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending,color:0xffe0b0}));sc.add(dust);

// desks + bots
const scrGeo=new THREE.PlaneGeometry(1,.6);
const bub=ctex(128,96,(g)=>{g.fillStyle='#0d0b1e';g.strokeStyle='#22e6ff';g.lineWidth=5;g.beginPath();g.roundRect(6,6,116,62,18);g.fill();g.stroke();g.beginPath();g.moveTo(40,66);g.lineTo(30,90);g.lineTo(62,66);g.fill();g.stroke();g.fillStyle='#ff9be6';for(const x of[38,64,90]){g.beginPath();g.arc(x,37,8,0,7);g.fill();}});
IDS.forEach((id,idx)=>{const m=BOTS_META[id];const[dx,dz,yaw]=DESK[id];
 const desk=new THREE.Group();desk.position.set(dx,0,dz);desk.rotation.y=yaw;sc.add(desk);const off=id==='merlin'?-.9:0,deskY=id==='merlin'?1.1:.99;
 if(id!=='merlin'){box(1.9,.06,1,WOODM,0,.95,0,null,desk);neon(1.9,.025,.025,id==='jr'?0xffc070:CY,0,.91,.5,desk);for(const sx of[-.85,.85])box(.06,.92,.9,0x2a2a35,sx,.47,0,{metalness:.8},desk);}
 box(.06,.35,.06,0x222,0,deskY+.17,-.3+off,{metalness:.8},desk);box(1.1,.68,.05,0x0a0a10,0,deskY+.65,-.32+off,{metalness:.5},desk);
 const scr=new THREE.Mesh(scrGeo,new THREE.MeshBasicMaterial({color:SC.idle,toneMapped:false}));scr.position.set(0,deskY+.65,-.29+off);desk.add(scr);
 box(.5,.025,.17,0x2a2826,0,deskY+.015,.1+off,{roughness:.5},desk);box(.46,.008,.13,0x4a4642,0,deskY+.03,.1+off,{roughness:.8},desk);add(new THREE.SphereGeometry(.035,10,8),M(0x2a2826),.38,deskY+.015,.12+off,desk).scale.set(1,.5,1.4);
 if(id!=='merlin'){blob(2.3,1.6,0,.2,desk);const mug=add(new THREE.CylinderGeometry(.045,.04,.1,14),M([0xd8d0c0,0xa0583a,0x5a7a5a][idx%3],{roughness:.4}),-.62,deskY+.05,.2,desk);add(new THREE.TorusGeometry(.03,.008,6,12),mug.material,-.575,deskY+.05,.2,desk).rotation.y=Math.PI/2;
  for(let j=0;j<2+idx%2;j++)box(.32,.05,.22,[0x7a3a2a,0x3a5a4a,0xc8a070][j],-.72,deskY+.03+j*.05,-.25,{roughness:.8},desk).rotation.y=j*.2;
  if(idx%2===0){add(new THREE.CylinderGeometry(.07,.08,.03,14),M(0x2a2826,{metalness:.6}),.78,deskY+.015,-.3,desk);const ar=add(new THREE.CylinderGeometry(.01,.01,.42,6),M(0x2a2826,{metalness:.6}),.74,deskY+.22,-.3,desk);ar.rotation.z=.25;
   const sh=add(new THREE.ConeGeometry(.09,.12,14,1,true),M(0x6a5a40,{side:THREE.DoubleSide,roughness:.5}),.66,deskY+.43,-.3,desk);sh.rotation.z=.5;add(new THREE.SphereGeometry(.03,8,6),new THREE.MeshBasicMaterial({color:0xffd9a0}),.65,deskY+.4,-.3,desk,false);}
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,deskY+.4,-.36),new THREE.Vector3(.05,deskY+.03,-.44),new THREE.Vector3(.4,deskY+.01,-.47),new THREE.Vector3(.5,.02,-.4),new THREE.Vector3(.7,.01,-.2)]),20,.01,5),M(0x1a1a1a,{roughness:.6}),0,0,0,desk,false);}
 const glow=new THREE.PointLight(SC.idle,0,2.5,2);glow.position.set(0,deskY+.7,off);
 const pi={jr:0x7a1f1f,quill:0xffffff,scout:0x333,sage:0x3fae5a,ness:0xe0409a,shoppy:0xc8a060,mick:0xffffff,manny:0xf2c230,jocko:0x222}[id];if(pi!==undefined)box(.25,.25,.25,pi,.7,deskY+.13,0,{},desk);
 if(id!=='merlin'){box(.55,.1,.55,FAB(0x5a5048),0,.72,.85,null,desk);box(.06,.67,.06,0x2a2a2a,0,.34,.85,{metalness:.8,roughness:.3},desk);box(.55,.6,.08,FAB(0x5a5048),0,1.07,1.12,null,desk);}
 const LOOK={merlin:[0x4a4f6a,0xffb35c,'hood'],jr:[0xe9e1cf,0xffc070,'cross'],jocko:[0x3a3d40,0xd0603a,'heavy'],sage:[0x7d9a6a,0x9fe0a0,'leaf'],scout:[0x8a6a48,0x5fd0c0,'dish'],quill:[0x5a7a96,0x8fd8ff,'pen'],ness:[0x9a5a6e,0xe890b8,'mic'],shoppy:[0xc07a48,0xffc070,'tote'],mick:[0xdcd6cc,0xff9a60,'chef'],manny:[0xb89a5a,0xffc040,'hard']}[id];
 const shell=M(LOOK[0],{roughness:.42,metalness:.35}),joint=M(0x2b2a2c,{roughness:.35,metalness:.85}),acc=new THREE.MeshStandardMaterial({color:LOOK[1],emissive:LOOK[1],emissiveIntensity:1.1,roughness:.3});
 const grp=new THREE.Group();const root=new THREE.Group();root.position.y=.92;grp.add(root);const W=LOOK[2]==='heavy'?1.2:1;
 const cap=(r,l,mat,x,y,z,p)=>add(new THREE.CapsuleGeometry(r,l,4,10),mat,x,y,z,p);
 const pelvis=add(new THREE.BoxGeometry(.34*W,.16,.22),joint,0,0,0,root);
 const torso=new THREE.Group();torso.position.y=.08;root.add(torso);
 const chest=cap(.19,.26,shell,0,.33,0,torso);chest.scale.set(1.3*W,1,.82);
 add(new THREE.CylinderGeometry(.13,.15,.16,14),joint,0,.06,0,torso);
 add(new THREE.CircleGeometry(.055,16),acc,0,.38,-.158,torso,false).rotation.y=Math.PI;
 add(new THREE.CylinderGeometry(.05,.06,.1,10),joint,0,.68,0,torso);
 const head=new THREE.Group();head.position.y=.84;torso.add(head);
 const skull=add(new THREE.SphereGeometry(.15,20,16),shell,0,0,0,head);skull.scale.set(1,1.12,1.05);
 const visor=add(new THREE.CapsuleGeometry(.045,.16,4,10),acc,0,.02,-.135,head,false);visor.rotation.z=Math.PI/2;visor.scale.z=.6;
 for(const s of[-1,1])add(new THREE.CylinderGeometry(.04,.04,.05,12),joint,s*.15,0,0,head).rotation.z=Math.PI/2;
 const arms=[],elbows=[],hips=[],knees=[];
 for(const s of[-1,1]){const sh=new THREE.Group();sh.position.set(s*.29*W,.56,0);torso.add(sh);add(new THREE.SphereGeometry(.075,12,10),joint,0,0,0,sh);
  cap(.055,.2,shell,0,-.15,0,sh);const el=new THREE.Group();el.position.y=-.3;sh.add(el);add(new THREE.SphereGeometry(.05,10,8),joint,0,0,0,el);
  cap(.045,.18,shell,0,-.13,0,el);add(new THREE.BoxGeometry(.07,.09,.05),joint,0,-.29,0,el);arms.push(sh);elbows.push(el);
  const hp=new THREE.Group();hp.position.set(s*.1,-.06,0);root.add(hp);add(new THREE.SphereGeometry(.07,10,8),joint,0,0,0,hp);
  cap(.068,.26,shell,0,-.2,0,hp);const kn=new THREE.Group();kn.position.y=-.42;hp.add(kn);add(new THREE.SphereGeometry(.06,10,8),joint,0,0,0,kn);
  cap(.058,.26,shell,0,-.2,0,kn);add(new THREE.BoxGeometry(.11,.06,.22),joint,0,-.44,-.04,kn);hips.push(hp);knees.push(kn);}
 const k=(geo,mat,x,y,z,p=head)=>add(geo,typeof mat==='number'?M(mat,{roughness:.6}):mat,x,y,z,p);
 const st=LOOK[2];
 if(st==='hood'){const h=k(new THREE.SphereGeometry(.19,16,12,0,Math.PI*2,0,Math.PI*.55),0x2e2a40,0,.02,.02);h.scale.set(1,1.15,1.1);k(new THREE.CylinderGeometry(.008,.008,.18),joint,0,.27,0);k(new THREE.SphereGeometry(.025,8,8),acc,0,.37,0);}
 if(st==='cross'){k(new THREE.BoxGeometry(.03,.12,.012),0xc9a86a,0,.38,-.165,torso);k(new THREE.BoxGeometry(.08,.03,.012),0xc9a86a,0,.4,-.165,torso);}
 if(st==='heavy'){k(new THREE.TorusGeometry(.155,.018,6,24),0x1a1a1a,0,.06,0).rotation.x=Math.PI/2;}
 if(st==='leaf'){const l=k(new THREE.SphereGeometry(.07,8,6),0x5f9a50,.05,.2,0);l.scale.set(.5,1,1.4);l.rotation.z=-.5;}
 if(st==='dish'){k(new THREE.CylinderGeometry(.008,.008,.14),joint,.08,.2,0);const d=k(new THREE.ConeGeometry(.06,.03,14,1,true),joint,.08,.28,0);d.rotation.x=Math.PI;}
 if(st==='pen')k(new THREE.CylinderGeometry(.01,.01,.16,6),0xf0f0f0,.155,.06,0).rotation.x=Math.PI/2;
 if(st==='mic'){const b=k(new THREE.TorusGeometry(.17,.012,6,20,Math.PI),joint,0,.03,0);b.rotation.y=Math.PI/2;k(new THREE.CylinderGeometry(.008,.008,.12),joint,-.14,-.07,-.07).rotation.x=1.2;}
 if(st==='tote')k(new THREE.BoxGeometry(.2,.22,.08),0x8a6a40,.34,.1,0,torso);
 if(st==='chef'){k(new THREE.CylinderGeometry(.13,.12,.16,16),0xf4f0e8,0,.2,0);k(new THREE.SphereGeometry(.15,14,10),0xf4f0e8,0,.3,0).scale.y=.6;}
 if(st==='hard'){k(new THREE.SphereGeometry(.17,16,10,0,Math.PI*2,0,Math.PI/2),0xe0a020,0,.04,0);k(new THREE.CylinderGeometry(.2,.2,.015,20),0xe0a020,0,.04,0);k(new THREE.BoxGeometry(.4,.05,.24),0x5a4026,0,-.04,0,torso);}
 const cup=add(new THREE.CylinderGeometry(.04,.032,.1,12),M(0xe8e0d0,{roughness:.4}),0,-.33,-.03,elbows[1]);cup.visible=false;
 grp.scale.setScalar(.95);
 const bc=document.createElement('canvas');bc.width=512;bc.height=112;const btex=new THREE.CanvasTexture(bc);btex.colorSpace=THREE.SRGBColorSpace;const bubble=new THREE.Sprite(new THREE.SpriteMaterial({map:btex,transparent:true,toneMapped:false,depthWrite:false,depthTest:false}));bubble.renderOrder=10;bubble.scale.set(1.9,.42,1);bubble.position.y=2.9;blob(.8,.8,0,0,grp);bubble.visible=false;grp.add(bubble);
 const seat=new THREE.Vector3(0,0,.85);desk.localToWorld(seat);if(id==='merlin')seat.set(0,0,-10.1);
 const a=idx/IDS.length*Math.PI*2,lounge=new THREE.Vector3(LOUNGE[0]+Math.sin(a)*2.3,0,LOUNGE[1]+Math.cos(a)*2.3);
 const [bx,bz]=BAR(idx),bar=new THREE.Vector3(bx,0,bz);
 grp.position.copy(seat);grp.rotation.y=yaw;sc.add(grp);
 const el=document.createElement('div');el.className='lbl';el.onclick=()=>card(id);el.innerHTML='<i></i>'+m.name;document.getElementById('labels').appendChild(el);
 el.onmouseenter=()=>hover=id;el.onmouseleave=()=>hover=null;
 const side=new THREE.Vector3(1.2,0,.45);desk.localToWorld(side);if(id==='merlin')side.set(2.2,0,-9.4);const mon=new THREE.Vector3(0,1.4,-.3+off);desk.localToWorld(mon);
 bots[id]={id,bc,btex,side,mon,path:[],until:0,sayUntil:0,laughUntil:0,grp,el,scr,glow,arms,elbows,hips,knees,root,torso,cup,head,bubble,seat,lounge,bar,yaw,tgt:seat.clone(),spot:'seat',data:null,phase:Math.random()*6};});
let hover=null;
const ray=new THREE.Raycaster(),mv=new THREE.Vector2();let lastUser=-99,tourOn=true;const clk=new THREE.Clock();
// ===== behaviour engine
const NODES=[[-17,-5.5],[-12,-5.5],[-7,-5.5],[-3,-5.5],[0,-5.5],[3,-5.5],[7,-5.5],[12,-5.5],[17,-5.5],
[-17,6.4],[-13,6.4],[-9.5,7.2],[-5,7.4],[0,7.4],[5.5,7.2],[9.8,7.2],[13,7.5],[17,7.5],
[-7.2,0],[7.2,0],[-17,0],[17,0],[0,-3.2],
[0,-6.5],[0,-8.3],[-4.5,-8.3],[-4.5,-13.7],[4.5,-8.3],[4.5,-13.7],
[-14.6,-6.3],[-13.4,-8.4],[-13.4,-10.4],[13,10.4],[17,10.4],[-14,9],[-15,0],[-3.2,-1.2],[3.2,-1.2]];
const EDGES=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,16],[16,17],
[2,18],[18,11],[18,12],[6,19],[19,15],[19,14],[0,20],[20,9],[8,21],[21,17],[22,4],[22,3],[22,5],[22,18],[22,19],
[4,23],[23,24],[24,25],[25,26],[24,27],[27,28],[26,28],[29,1],[29,0],[29,30],[30,31],[16,32],[17,33],[32,33],[10,34],[20,35],[1,35],[22,36],[22,37]];
const NV=NODES.map(n=>new THREE.Vector3(n[0],0,n[1])),ADJ=NODES.map(()=>[]);EDGES.forEach(([a,b])=>{ADJ[a].push(b);ADJ[b].push(a);});
const nearest=p=>{let bi=0,bd=1e9;NV.forEach((n,i)=>{const d=(n.x-p.x)**2+(n.z-p.z)**2;if(d<bd){bd=d;bi=i;}});return bi;};
function route(from,to){const f=new THREE.Vector3(from.x,0,from.z);if(f.distanceTo(to)<2)return[to.clone()];const s=nearest(f),g=nearest(to);
 const dist=NV.map(()=>1e9),prev=NV.map(()=>-1),done=new Set();dist[s]=0;
 for(;;){let u=-1,ud=1e9;dist.forEach((d,i)=>{if(!done.has(i)&&d<ud){ud=d;u=i;}});if(u<0||u===g)break;done.add(u);for(const w of ADJ[u]){const nd=dist[u]+NV[u].distanceTo(NV[w]);if(nd<dist[w]){dist[w]=nd;prev[w]=u;}}}
 const P=[];for(let u=g;u>=0;u=prev[u])P.unshift(NV[u].clone());
 if(P.length>1&&f.distanceTo(P[1])<P[0].distanceTo(P[1]))P.shift();
 if(P.length>1&&to.distanceTo(P[P.length-2])<P[P.length-1].distanceTo(P[P.length-2]))P.pop();
 P.push(to.clone());return P;}
const V=(x,z)=>new THREE.Vector3(x,0,z);
const SLOT={bar:[],lounge:[],sofa:[],window:[],plant:[],pew:[],board:[],war:[]};
for(let i=0;i<8;i++)SLOT.bar.push({p:V(11.9+i,12.0),face:V(11.9+i,13.6)});
[[-1.3,-.6],[1.3,-.6],[0,-.95],[-1.7,2.6],[1.7,2.6]].forEach(([x,z])=>SLOT.lounge.push({p:V(x,z),face:V(0,1.2)}));
SOFAS.slice(0,2).forEach(g=>[-.9,0,.9].forEach(x=>{const p=new THREE.Vector3(x,0,-.1);g.localToWorld(p);p.y=0;SLOT.sofa.push({p,yaw:g.rotation.y,sit:.55});}));
SLOT.window.push({p:V(-19.5,-1.5),yaw:Math.PI/2},{p:V(-19.5,5),yaw:Math.PI/2});
SLOT.plant.push({p:V(-7.2,-13.3),yaw:0},{p:V(.9,7.5),yaw:0},{p:V(19.5,3),yaw:-Math.PI/2});
SLOT.pew.push({p:V(-15.6,-9.5),yaw:0,sit:.69},{p:V(-14.9,-11.4),yaw:0,sit:.69});
SLOT.board.push({p:V(-15.3,-.7),face:V(-16.7,0)},{p:V(-15.3,.7),face:V(-16.7,0)});
SLOT.war.push({p:V(-1.4,-13.7),yaw:0},{p:V(1.4,-13.7),yaw:0});
for(const k in SLOT)SLOT[k].forEach(s=>s.kind=k);
const release=b=>{if(b.slot){b.slot.by=null;b.slot=null;}};
const claim=(k,b)=>{const f=SLOT[k].filter(s=>!s.by);if(!f.length)return null;
 const occ=SLOT[k].filter(s=>s.by);let s=f[Math.floor(Math.random()*f.length)];if(occ.length){f.sort((a,c)=>Math.min(...occ.map(o=>o.p.distanceTo(a.p)))-Math.min(...occ.map(o=>o.p.distanceTo(c.p))));s=f[0];}
 s.by=b.id;b.slot=s;return s;};
const go=(b,pos,o={})=>{b.goal=Object.assign({pos:pos.clone(),pose:'stand',anim:'idle'},o);b.path=route(b.grp.position,pos);};
// demo
const DEMO=[{merlin:'working',jr:'working',jocko:'working',sage:'working',scout:'working',quill:'working',ness:'waiting',shoppy:'waiting',mick:'working',manny:'working'},
{merlin:'working',jr:'idle',jocko:'idle',sage:'idle',scout:'idle',quill:'idle',ness:'idle',shoppy:'idle',mick:'idle',manny:'waiting'},
{merlin:'working',jr:'idle',jocko:'working',sage:'waiting',scout:'working',quill:'idle',ness:'working',shoppy:'idle',mick:'waiting',manny:'working'}];
const DTASK={merlin:"Routing today's tasks",jr:'Preparing morning devotion',jocko:'Planning 5am workout',sage:'Breathing exercise plan',scout:'Researching FDE roles',quill:'Drafting PD video script',ness:'Rehearsing slide talk',shoppy:'Building grocery list',mick:'Meal prep for the week',manny:'Wiring Bot HQ 3D'};
let demo=false,demoPhase=0,demoNext=0;
eff=b=>demo?{status:DEMO[demoPhase][b.id],task:DTASK[b.id],name:BOTS_META[b.id].name,demo:true}:(b.data||{status:'idle',task:''});
const snip=s=>{s=(s||'').trim();return s.length>30?s.slice(0,29)+'…':s;};
function say(b,text,dur,t){const c=b.bc.getContext('2d');c.clearRect(0,0,512,112);c.font='600 30px system-ui,sans-serif';const w=Math.min(500,c.measureText(text).width+44),x=(512-w)/2;
 c.fillStyle='rgba(42,34,30,.92)';c.strokeStyle='#e0a060';c.lineWidth=3;c.beginPath();c.roundRect(x,6,w,72,22);c.fill();c.stroke();c.beginPath();c.moveTo(236,77);c.lineTo(256,104);c.lineTo(276,77);c.fill();
 c.fillStyle='#f6e8d2';c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,43);b.btex.needsUpdate=true;b.sayUntil=t+dur;}
const CONV=[];
function conv(members,t,dur,mode){CONV.push({members,until:t+dur,mode,i:0,next:t+1.5});}
const CHAT=['Haha, so true','Coffee run?','This latte is good','How was your week?','Love this plant wall','Ha! Classic','Needed this break','Rain looks nice tonight','Same, honestly','Try the oat latte'];
const pickW=opts=>{let s=opts.reduce((a,o)=>a+o[1],0)*Math.random();for(const o of opts){if((s-=o[1])<=0)return o[0];}return opts[0][0];};
function plan(b,t){const st=eff(b).status;release(b);b.job=null;
 if(st==='working'){go(b,b.seat,{pose:b.id==='merlin'?'stand':'sit',sit:.78,yaw:b.yaw,anim:'type'});b.until=t+1e9;return;}
 if(st==='waiting'){go(b,b.side,{face:b.mon,anim:'wait'});b.until=t+1e9;return;}
 const opts=[['bar',3],['sofa',3],['lounge',2],['window',1],['plant',1]];if(b.id==='jr')opts.push(['pew',4]);
 let k=pickW(opts),s=claim(k,b)||claim('bar',b)||claim('lounge',b);
 if(!s){go(b,b.side,{anim:'social'});b.until=t+10;return;}
 go(b,s.p,{pose:s.sit?'sit':'stand',sit:s.sit,yaw:s.yaw,face:s.face,anim:k==='pew'?'pray':(k==='window'||k==='plant')?'look':'social',kind:k});b.until=t+(k==='pew'?30:18)+Math.random()*14;}
const arrived=b=>!b.path.length;
let dirNext=3,chatNext=2;
function director(t){
 if(demo&&t>demoNext){demoPhase=(demoPhase+1)%DEMO.length;demoNext=t+40;}
 for(const id of IDS){const b=bots[id],st=eff(b).status;if(st!==b.lastSt){b.lastSt=st;b.job=null;b.until=0;}
  if(b.job&&t>b.job.until){b.job=null;b.until=0;}
  if(!b.job&&t>b.until)plan(b,t);}
 if(t>dirNext){dirNext=t+7;
  const W=IDS.map(i=>bots[i]).filter(b=>b.id!=='merlin'&&eff(b).status==='working'&&!b.job&&arrived(b));
  if(W.length>=2&&Math.random()<.8){W.sort(()=>Math.random()-.5);const a=W[0],h=W[1],dur=16;let mode=['desk','desk','board','war'][Math.floor(Math.random()*4)];if(mode!=='desk'&&SLOT[mode].some(sl=>IDS.some(i=>bots[i].grp.position.distanceTo(sl.p)<1.2||bots[i].goal&&bots[i].goal.pos.distanceTo(sl.p)<.5)))mode='desk';
   a.job={until:t+dur};h.job={until:t+dur};
   if(mode==='desk'){go(a,h.side,{face:h.mon,anim:'collab'});go(h,h.seat,{pose:'sit',sit:.78,yaw:h.yaw,anim:'collab'});}
   else{const S=SLOT[mode];[a,h].forEach((b,i)=>{release(b);const s=S[i];go(b,s.p,{yaw:s.yaw,face:s.face,anim:'collab',point:true});});}
   conv([a,h],t+1,dur-1,'task');}
  const m=bots.merlin;if(eff(m).status==='working'&&!m.job&&t>(m.nextCheck||8)){const tg=IDS.map(i=>bots[i]).filter(b=>b!==m&&eff(b).status==='working'&&!b.job&&arrived(b));
   if(tg.length){const h=tg[Math.floor(Math.random()*tg.length)];m.job={until:t+15};h.job={until:t+15};go(m,h.side,{face:h.mon,anim:'collab'});go(h,h.seat,{pose:'sit',sit:.78,yaw:h.yaw,anim:'collab'});conv([m,h],t+3,12,'check');}
   m.nextCheck=t+24+Math.random()*10;}}
 for(let i=CONV.length-1;i>=0;i--){const c=CONV[i];if(t>c.until){CONV.splice(i,1);continue;}
  if(t>c.next&&c.members.every(arrived)){const sp=c.members[c.i%2],ot=c.members[(c.i+1)%2],ts=snip(eff(sp).task);
   let line;if(c.mode==='check')line=c.i%2===0?'Checking in: '+snip(eff(ot).task)+'?':'On track: '+ts;
   else line=c.i===0?'Looking at: '+ts:c.i===1?'Nice. Mine: '+ts:['Ship it?','Let me check','Good call','Pushing now','Looks right'][c.i%5];
   say(sp,line,2.4,t);c.i++;c.next=t+2.8;}}
 if(t>chatNext){chatNext=t+2.6;const S=IDS.map(i=>bots[i]).filter(b=>b.goal&&b.goal.anim==='social'&&arrived(b)&&t>b.sayUntil);
  for(const b of S){const nb=S.filter(o=>o!==b&&o.grp.position.distanceTo(b.grp.position)<3.2);
   if(nb.length){if(b.goal.pose!=='sit'){const c=new THREE.Vector3();nb.forEach(o=>c.add(o.grp.position));c.divideScalar(nb.length);b.goal.face=c;b.goal.yaw=undefined;}
    if(Math.random()<.35){say(b,CHAT[Math.floor(Math.random()*CHAT.length)],2.2,t);if(Math.random()<.6)nb.forEach(o=>o.laughUntil=t+2.6+Math.random());break;}}}}}
const Lr=(o,v,k=.18)=>{o.rotation.x+=(v-o.rotation.x)*k;};
const turn=(b,ty,k)=>{let dy=ty-b.grp.rotation.y;dy=Math.atan2(Math.sin(dy),Math.cos(dy));b.grp.rotation.y+=dy*k;};
function animate(b,t,dt){const p=b.grp.position;let walking=false;b.head.rotation.y*=.9;
 if(b.path.length){const wp=b.path[0],dx=wp.x-p.x,dz=wp.z-p.z,d=Math.hypot(dx,dz);
  if(d<(b.path.length>1?.3:.03))b.path.shift();else{walking=true;let sx=0,sz=0;
   for(const id of IDS){const o=bots[id];if(o===b)continue;const ox=p.x-o.grp.position.x,oz=p.z-o.grp.position.z,od=Math.hypot(ox,oz);if(od<.6&&od>1e-3&&b.path.length>1){sx+=ox/od*(.6-od);sz+=oz/od*(.6-od);}}
   const sp=Math.min(d,1.35*dt*SPEED);p.x+=dx/d*sp+sx*dt*2;p.z+=dz/d*sp+sz*dt*2;turn(b,Math.atan2(-dx,-dz),.15);}}
 b.bubble.visible=t<b.sayUntil;b.cup.visible=false;
 if(walking){b.wp=(b.wp||0)+dt*6.5*SPEED;const w=Math.sin(b.wp);Lr(b.hips[0],w*.5,.3);Lr(b.hips[1],-w*.5,.3);Lr(b.knees[0],-Math.max(0,-Math.cos(b.wp))*.9,.3);Lr(b.knees[1],-Math.max(0,Math.cos(b.wp))*.9,.3);
  Lr(b.arms[0],-w*.4);Lr(b.arms[1],w*.4);Lr(b.elbows[0],.3);Lr(b.elbows[1],.3);b.root.position.y+=(.92+Math.abs(Math.cos(b.wp))*.025-b.root.position.y)*.3;b.torso.rotation.x=.05;b.head.rotation.x*=.8;b.head.rotation.z*=.8;return;}
 const g=b.goal||{pose:'stand',anim:'idle'};
 if(g.yaw!==undefined)turn(b,g.yaw,.1);else if(g.face)turn(b,Math.atan2(-(g.face.x-p.x),-(g.face.z-p.z)),.1);
 const sit=g.pose==='sit',laugh=t<b.laughUntil;let ry=(sit?g.sit:.92)+(laugh?Math.abs(Math.sin(t*13))*.04:0);b.root.position.y+=(ry-b.root.position.y)*.25;
 b.torso.rotation.x=sit?.08:laugh?-.12:0;for(let i=0;i<2;i++){Lr(b.hips[i],sit?1.5:0);Lr(b.knees[i],sit?-1.5:0);}
 const speaking=t<b.sayUntil;b.head.rotation.z=0;let hx=0;
 switch(g.anim){
  case 'type':if(b.id==='merlin'){Lr(b.arms[0],.5);Lr(b.elbows[0],.6);Lr(b.arms[1],1.2+Math.sin(t*.7)*.1);Lr(b.elbows[1],.15);hx=.1;}
   else{const a=Math.sin(t*14+b.phase)*.08;Lr(b.arms[0],.75+a,.4);Lr(b.arms[1],.75-a,.4);Lr(b.elbows[0],.75,.4);Lr(b.elbows[1],.75,.4);hx=.12;}break;
  case 'collab':if(speaking){Lr(b.arms[1],(g.point?1.25:.9)+Math.sin(t*4)*.1,.15);Lr(b.elbows[1],g.point?.1:.6,.15);Lr(b.arms[0],sit?.6:.1);Lr(b.elbows[0],sit?.7:.2);hx=Math.sin(t*3)*.05;}
   else{hx=.1+Math.max(0,Math.sin(t*5))*.15;if(sit){Lr(b.arms[0],.7);Lr(b.arms[1],.7);Lr(b.elbows[0],.7);Lr(b.elbows[1],.7);}else{Lr(b.arms[0],.1);Lr(b.arms[1],.25);Lr(b.elbows[0],.2);Lr(b.elbows[1],1.3);}}break;
  case 'wait':{const ph=(t+b.phase*3)%7;if(ph<2.6){Lr(b.arms[0],1.0);Lr(b.elbows[0],1.75);hx=.38;b.head.rotation.y+=(-.25-b.head.rotation.y)*.1;}else{Lr(b.arms[0],.05);Lr(b.elbows[0],.2);Lr(b.knees[1],-Math.abs(Math.sin(t*7))*.35,.5);hx=Math.sin(t*.8)*.05;}Lr(b.arms[1],.05);Lr(b.elbows[1],.2);break;}
  case 'social':{const bar=g.kind==='bar'||(g.kind==='sofa'&&b.phase>3);b.cup.visible=bar;const sip=bar&&Math.sin(t*.6+b.phase)>.85;
   if(speaking){Lr(b.arms[0],.5+Math.sin(t*3.5)*.25,.12);Lr(b.elbows[0],1);}else{Lr(b.arms[0],sit?.4:.05);Lr(b.elbows[0],sit?.5:.2);}
   Lr(b.arms[1],bar?(sip?.9:.35):sit?.4:.05,.08);Lr(b.elbows[1],bar?(sip?2:1.4):sit?.5:.2,.08);hx=sip?-.15:laugh?-.2:0;b.head.rotation.z=speaking?Math.sin(t*3)*.06:0;break;}
  case 'pray':Lr(b.arms[0],.55);Lr(b.arms[1],.55);Lr(b.elbows[0],1.3);Lr(b.elbows[1],1.3);hx=.42;break;
  case 'look':Lr(b.arms[0],.05);Lr(b.arms[1],.05);Lr(b.elbows[0],.2);Lr(b.elbows[1],.2);hx=-.08;b.head.rotation.y=Math.sin(t*.35+b.phase)*.35;break;
  default:Lr(b.arms[0],.05);Lr(b.arms[1],.05);Lr(b.elbows[0],.2);Lr(b.elbows[1],.2);}
 b.head.rotation.x+=(hx-b.head.rotation.x)*.12;}
let SPEED=1;
const dbtn=document.getElementById('demo');dbtn.onclick=()=>{demo=!demo;demoPhase=0;demoNext=clk.elapsedTime+40;dbtn.textContent=demo?'■ Demo on':'▶ Demo';dbtn.classList.toggle('on',demo);};
const btn=document.getElementById('tour');btn.onclick=()=>{tourOn=!tourOn;btn.textContent=tourOn?'⏸ Tour':'▶ Tour';ctl.autoRotate=tourOn;lastUser=-99;};
ctl.addEventListener('start',()=>{lastUser=clk.elapsedTime;ctl.autoRotate=false;});
const pick=e=>{mv.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(mv,cam);let best=null,bd=1e9;for(const id in bots){const h=ray.intersectObject(bots[id].grp,true);if(h.length&&h[0].distance<bd){bd=h[0].distance;best=id;}}return best;};
let down=null;r.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
r.domElement.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<6){const id=pick(e);if(id)card(id);}});
if(!MOBILE)r.domElement.addEventListener('pointermove',e=>{if(e.buttons)return;hover=pick(e);r.domElement.style.cursor=hover?'pointer':'';});
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();r.setSize(innerWidth,innerHeight);comp.setSize(innerWidth,innerHeight);});
function drawWall(){const c=wsC.getContext('2d');c.fillStyle='#0b0816';c.fillRect(0,0,512,220);c.strokeStyle='#22e6ff';c.lineWidth=4;c.strokeRect(3,3,506,214);c.fillStyle='#9ff3ff';c.font='bold 26px system-ui';c.fillText('⚡ MERLIN · WAR ROOM',16,38);
 let i=0;c.font='17px system-ui';for(const id in bots){const st=eff(bots[id]).status;const col=st==='working'?'#3dff8a':st==='waiting'?'#ffb020':'#7a8290';
  const x=16+(i%2)*250,yy=70+Math.floor(i/2)*30;c.fillStyle=col;c.beginPath();c.arc(x+6,yy-6,6,0,7);c.fill();c.fillStyle='#e8e6ff';c.fillText(BOTS_META[id].name+' · '+st,x+18,yy);i++;}wsT.needsUpdate=true;}
let wallT=-9,ti=0,tNext=0;const tgtV=new THREE.Vector3();ctl.target.set(0,0,PORTRAIT()?-4:0);
const v=new THREE.Vector3(),rects=[];let frame=0;
(function loop(){requestAnimationFrame(loop);const dt=Math.min(clk.getDelta(),.05),t=clk.elapsedTime;frame++;
 if(tourOn&&!ctl.autoRotate&&t-lastUser>20)ctl.autoRotate=true;
 if(tourOn&&ctl.autoRotate){if(t>tNext){ti=(ti+1)%TOUR.length;tNext=t+(ti===0?12:9);}tgtV.set(...TOUR[ti]);ctl.target.lerp(tgtV,.008);
  const wantD=(ti===0?40:17)*(PORTRAIT()?1.35:1);const off=cam.position.clone().sub(ctl.target);const d=off.length();off.setLength(d+(wantD-d)*.01);cam.position.copy(ctl.target).add(off);}
 ctl.update();
 candles.forEach((f,i)=>f.scale.set(1,1.5+Math.sin(t*11+i*2)*.15,1));cl.intensity=5.5+Math.sin(t*7)*.5+Math.sin(t*13)*.3;
 arm.rotation.y=Math.sin(t*.8)*.8;arm2.rotation.x=Math.sin(t*1.3)*.4;duck.position.y=1.35+Math.abs(Math.sin(t*3))*.05;bag.rotation.z=Math.sin(t*2)*.05;
 holo.rotation.y=t*.6;holo.rotation.x=t*.3;ring.position.y=1.3+Math.sin(t*1.5)*.25;holoM.opacity=.55+Math.sin(t*3)*.15;
if(frame%2===0){const pa=dgeo.attributes.position.array;for(let i=0;i<DN;i++){pa[i*3]+=.003;pa[i*3+1]+=Math.sin(t*.5+i)*.002;if(pa[i*3]>18)pa[i*3]=-18;}dgeo.attributes.position.needsUpdate=true;}
 holos.forEach((h,i)=>h.position.y=h.userData.y+Math.sin(t*.9+i)*.08);
 if(t-wallT>2){drawWall();wallT=t;}
 director(t);
 for(const id in bots){const b=bots[id],st=eff(b).status;animate(b,t,dt);
  const sc0=st==='working'?SC.working:st==='waiting'?SC.waiting:SC.idle;b.scr.material.color.setHex(sc0);
  if(st==='working')b.scr.material.color.multiplyScalar(1.1+.3*Math.sin(t*6+b.phase));if(st==='waiting')b.scr.material.color.multiplyScalar(.7+.4*Math.abs(Math.sin(t*2)));
  
  b.el.firstChild.style.background=b.el.firstChild.style.color='#'+(st==='working'?'2ecc71':st==='waiting'?'f5a623':'9aa3ad');}
 if(frame%2===0){const arr=[];for(const id in bots){const b=bots[id];v.set(b.grp.position.x,2.3,b.grp.position.z).project(cam);if(v.z>1||Math.abs(v.x)>1.15||Math.abs(v.y)>1.05){b.el.style.display='none';continue;}
   arr.push({id,b,x:(v.x+1)/2*innerWidth,y:(1-v.y)/2*innerHeight,z:v.z});}
  arr.sort((a,c)=>(a.id===hover?-1:c.id===hover?1:a.z-c.z));rects.length=0;
  for(const o of arr){const w=o.b.el.offsetWidth||70,h=22;const x=Math.max(w/2+4,Math.min(innerWidth-w/2-4,o.x)),y=Math.max(h+40,o.y);const R=[x-w/2-3,y-h-3,x+w/2+3,y+3];
   if(rects.some(q=>R[0]<q[2]&&R[2]>q[0]&&R[1]<q[3]&&R[3]>q[1])&&o.id!==hover){o.b.el.style.display='none';continue;}
   rects.push(R);o.b.el.style.display='block';o.b.el.style.transform=`translate(${x-w/2}px,${y-h}px)`;}}
 comp.render();})();
window.__bothq={bots,ctl,cam,setDemo:(on,ph=0)=>{demo=on;demoPhase=ph;demoNext=clk.elapsedTime+1e6;},speed:v=>SPEED=v,settle:()=>{for(const id in bots){const b=bots[id];if(b.path.length){const e=b.path[b.path.length-1];b.grp.position.set(e.x,0,e.z);b.path=[];}}}};
poll();setInterval(poll,BOTHQ_CONFIG.pollMs);}
function card(id){const d=eff(bots[id]),m=BOTS_META[id];const $=i=>document.getElementById(i);$('cn').textContent=d.name||m.name;$('cr').textContent=m.role;$('cs').textContent=STATION[id];$('ct').textContent=d.task||'—';$('cst').textContent=(d.status||'idle')+(d.demo?' (demo)':'');$('cst').className='pill '+(d.status||'idle');$('cu').textContent=d.updated?fmt(d.updated):'—';$('card').style.display='block';}
async function poll(){try{data=await bothqFetchStatus('../');document.getElementById('upd').textContent='updated '+fmt(data.updated);
 for(const d of data.bots){const b=bots[d.id];if(!b)continue;b.data=d;b.el.title=d.task||'';}}catch(e){document.getElementById('upd').textContent='status offline';}}
bothqGate(start);
