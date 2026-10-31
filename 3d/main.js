import * as THREE from '../vendor/three.module.min.js';import {OrbitControls} from '../vendor/OrbitControls.js';
import {EffectComposer} from '../vendor/jsm/postprocessing/EffectComposer.js';import {RenderPass} from '../vendor/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '../vendor/jsm/postprocessing/UnrealBloomPass.js';import {OutputPass} from '../vendor/jsm/postprocessing/OutputPass.js';
import {RoomEnvironment} from '../vendor/jsm/RoomEnvironment.js';
const MOBILE=matchMedia('(pointer:coarse)').matches||innerWidth<700, PORTRAIT=()=>innerWidth<innerHeight;
const CY=0x22e6ff,MG=0xff3cc7,PU=0xa066ff;
// desk [x,z,yaw]
const DESK={merlin:[0,-9.2,0],jr:[-16.5,-8.6,0],jocko:[13.5,-7.4,0],sage:[-10,-2.5,Math.PI/2],scout:[-10,2.5,Math.PI/2],quill:[10,-2.5,-Math.PI/2],ness:[10,2.5,-Math.PI/2],shoppy:[7.5,8.6,0],mick:[3.5,8.6,0],manny:[-14,7.6,Math.PI/2]};
const STATION={merlin:'War Room',jr:'Prayer Corner',jocko:'Gym',sage:'Open Desks',scout:'Open Desks',quill:'Open Desks',ness:'Open Desks',shoppy:'Ops Desk',mick:'Ops Desk',manny:'Build Lab'};
const LOUNGE=[0,1.2];const IDS=Object.keys(DESK);
const BAR=i=>[11.6+i*.9,11.9];
const SC={working:0x3dff8a,waiting:0xffb020,idle:0x202838};
const TOUR=[[0,0,0],[0,1,-10],[-16,1,-10],[15,1,-9],[15,1,11],[0,1,1.2],[-14,1,9]];
let data=null;const bots={};
function fmt(t){try{return new Date(t).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'})}catch(e){return t}}
function ctex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function start(){
const r=new THREE.WebGLRenderer({antialias:!MOBILE,powerPreference:'high-performance'});const PR=Math.min(devicePixelRatio,MOBILE?1.25:1.75);r.setPixelRatio(PR);r.setSize(innerWidth,innerHeight);
r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.1;document.body.prepend(r.domElement);
const sc=new THREE.Scene();sc.background=new THREE.Color(0x07060f);
const pm=new THREE.PMREMGenerator(r);sc.environment=pm.fromScene(new RoomEnvironment(),.04).texture;
const cam=new THREE.PerspectiveCamera(PORTRAIT()?62:48,innerWidth/innerHeight,0.1,200);cam.position.set(0,27,33);if(PORTRAIT())cam.position.set(0,44,30);
const ctl=new OrbitControls(cam,r.domElement);ctl.enableDamping=true;ctl.dampingFactor=.06;ctl.maxPolarAngle=1.25;ctl.minDistance=6;ctl.maxDistance=60;ctl.autoRotate=true;ctl.autoRotateSpeed=.25;
const comp=new EffectComposer(r);comp.addPass(new RenderPass(sc,cam));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth/(MOBILE?2:1),innerHeight/(MOBILE?2:1)),.65,.4,.9);comp.addPass(bloom);comp.addPass(new OutputPass());
// lights
sc.add(new THREE.HemisphereLight(0x8a7cff,0x1a1022,.55));
const moon=new THREE.DirectionalLight(0xc8d4ff,1.1);moon.position.set(8,24,18);moon.castShadow=true;const s=moon.shadow.camera;s.left=-26;s.right=26;s.top=20;s.bottom=-20;s.far=80;moon.shadow.mapSize.set(MOBILE?1024:2048,MOBILE?1024:2048);moon.shadow.bias=-.0005;sc.add(moon);
const PL=(c,i,d,x,y,z)=>{const l=new THREE.PointLight(c,i,d,1.6);l.position.set(x,y,z);sc.add(l);return l;};
PL(PU,12,14,0,4,1.2);PL(0xffb070,4,9,15.5,3.2,12.6);PL(CY,10,12,0,3.5,-11);if(!MOBILE){PL(MG,8,12,15,3.5,-10);PL(CY,8,12,-15,3.5,10);}
const MC={};const M=(c,o={})=>{const k=c+JSON.stringify(o);if(MC[k])return MC[k];const {env,...oo}=o;const m=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.5,metalness:.1},oo));m.envMapIntensity=o.env??.6;return MC[k]=m;};
const N=c=>{const k='n'+c;if(MC[k])return MC[k];const m=new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(2.2),toneMapped:false});return MC[k]=m;};
const add=(geo,mat,x,y,z,parent=sc,sh=true)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=sh;parent.add(m);return m;};
const box=(w,h,d,c,x,y,z,o,p)=>add(new THREE.BoxGeometry(w,h,d),typeof c==='number'?M(c,o):c,x,y,z,p);
const neon=(w,h,d,c,x,y,z,p)=>add(new THREE.BoxGeometry(w,h,d),N(c),x,y,z,p||sc,false);
const plane=(w,h,mat,x,y,z,ry=0,p=sc)=>{const m=add(new THREE.PlaneGeometry(w,h),mat,x,y,z,p,false);m.rotation.y=ry;return m;};
// floor: dark polished tiles
const ft=ctex(256,256,(g)=>{g.fillStyle='#10111a';g.fillRect(0,0,256,256);g.strokeStyle='#22e6ff22';g.lineWidth=2;for(let i=0;i<=256;i+=64){g.beginPath();g.moveTo(i,0);g.lineTo(i,256);g.moveTo(0,i);g.lineTo(256,i);g.stroke();}});
ft.wrapS=ft.wrapT=THREE.RepeatWrapping;ft.repeat.set(10,7);
add(new THREE.PlaneGeometry(42,30),new THREE.MeshStandardMaterial({map:ft,roughness:.34,metalness:.45,envMapIntensity:.3}),0,0,0).rotation.x=-Math.PI/2;
// skyline
const sky=ctex(1024,320,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#0a0420');gr.addColorStop(.7,'#3a1050');gr.addColorStop(1,'#ff3cc755');g.fillStyle=gr;g.fillRect(0,0,w,h);
 let rnd=7;const R=()=>(rnd=(rnd*16807)%2147483647)/2147483647;
 for(let L=0;L<2;L++)for(let x=0;x<w;){const bw=20+R()*50,bh=(L?60:110)+R()*(L?120:170);g.fillStyle=L?'#120a26':'#1c1236';g.fillRect(x,h-bh,bw,bh);
  for(let wy=h-bh+6;wy<h-4;wy+=9)for(let wx=x+4;wx<x+bw-4;wx+=7)if(R()<.35){g.fillStyle=R()<.7?'#ffd99a':'#7fe9ff';g.fillRect(wx,wy,3,4);}
  if(L&&R()<.35){const cs=['#ff3cc7','#22e6ff','#a066ff','#ffe14d'];g.fillStyle=cs[Math.floor(R()*4)];g.shadowColor=g.fillStyle;g.shadowBlur=12;g.fillRect(x+3,h-bh+12,bw-6,8);g.shadowBlur=0;}x+=bw+2;}});
const skyM=new THREE.MeshBasicMaterial({map:sky,toneMapped:false});
plane(90,26,skyM,0,9,-30);plane(70,26,skyM,-34,9,0,Math.PI/2);
// walls (back + left with big windows)
const WALL=0x161827,WH=6;const wm=M(WALL,{roughness:.35,metalness:.4});
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
box(7,.1,2.4,0x0c0c14,0,1.05,-11.5,{roughness:.1,metalness:.8,env:1.2});neon(7,.04,.04,PU,0,1.0,-10.3);neon(7,.04,.04,PU,0,1.0,-12.7);
box(.5,1,.5,0x222,-2.8,.5,-11.5,{metalness:.8});box(.5,1,.5,0x222,2.8,.5,-11.5,{metalness:.8});
for(const x of[-2.2,-.7,.7,2.2])box(.6,.5,.6,0x24203a,x,.55,-12.9);
const wsC=document.createElement('canvas');wsC.width=512;wsC.height=220;const wsT=new THREE.CanvasTexture(wsC);wsT.colorSpace=THREE.SRGBColorSpace;
plane(5.6,2.4,new THREE.MeshBasicMaterial({map:wsT,toneMapped:false}),0,3.1,-14.7);
// ---- prayer corner: warm, calm, no neon
const WOOD=0x8a5a34;
box(.25,4.2,7.6,WOOD,-12.6,2.1,-10.9,{roughness:.7});box(4.1,4.2,.25,WOOD,-18.7,2.1,-7.2,{roughness:.7});
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
box(9,1.05,1.1,0x15131f,15.9,.52,13.6,{roughness:.3,metalness:.5});box(9.2,.08,1.25,0x2a2740,15.9,1.09,13.55,{roughness:.12,metalness:.5,env:.8});
neon(9,.04,.04,CY,15.9,.08,13.0);neon(9.2,.03,.03,MG,15.9,1.04,12.93);
box(9,2.6,.3,0x1d1a2b,15.9,2.6,14.7,{roughness:.4});// back bar
for(let i=0;i<10;i++)box(.18,.35,.18,[0xff3cc7,0x22e6ff,0xffe14d,0xa066ff][i%4],12.2+i*.8,2.6,14.5,{emissive:[0xff3cc7,0x22e6ff,0xffe14d,0xa066ff][i%4],emissiveIntensity:.4});
// espresso machine
box(1.3,.8,.7,0x7a8090,13,1.53,13.7,{metalness:.8,roughness:.35,env:.4});box(1.3,.08,.72,0x222,13,1.97,13.7);neon(1.2,.04,.04,CY,13,1.2,13.34);
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
box(11,.03,8,0x1a1530,0,.015,LOUNGE[1],{roughness:.9});neon(11,.03,.05,PU,0,.03,LOUNGE[1]-4);neon(11,.03,.05,PU,0,.03,LOUNGE[1]+4);
const sofa=(x,z,ry,c)=>{const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;sc.add(g);box(3,.45,1,c,0,.3,0,{roughness:.6},g);box(3,.7,.25,c,0,.75,.45,{roughness:.6},g);box(.25,.6,1,c,-1.4,.55,0,{roughness:.6},g);box(.25,.6,1,c,1.4,.55,0,{roughness:.6},g);neon(3,.03,.03,CY,0,.06,-.5,g);};
sofa(-4.3,LOUNGE[1],Math.PI/2,0x3a2a66);sofa(4.3,LOUNGE[1],-Math.PI/2,0x3a2a66);sofa(0,LOUNGE[1]+3.6,0,0x5a2a5a);
for(const [x,z,c] of[[-3,-1.8,MG],[3,-1.8,CY],[-2.5,4.2,0xffe14d]]){const b=add(new THREE.SphereGeometry(.55,14,10),M(c,{roughness:.8}),x,.38,LOUNGE[1]+z*.6);b.scale.y=.65;}
box(1.6,.3,.8,0x0e0d18,-4.3+1.6,.15,LOUNGE[1],{roughness:.15,metalness:.6});box(1.6,.3,.8,0x0e0d18,4.3-1.6,.15,LOUNGE[1],{roughness:.15,metalness:.6});
// holo table
add(new THREE.CylinderGeometry(.9,1.1,.8,32),M(0x111018,{metalness:.8,roughness:.2}),0,.4,LOUNGE[1]);add(new THREE.CylinderGeometry(.92,.92,.04,32),new THREE.MeshBasicMaterial({color:0x0a6f80,toneMapped:false}),0,.82,LOUNGE[1],sc,false);
const holoM=new THREE.MeshBasicMaterial({color:CY,wireframe:true,transparent:true,opacity:.7,toneMapped:false,blending:THREE.AdditiveBlending});
const holo=add(new THREE.IcosahedronGeometry(.55,1),holoM,0,1.7,LOUNGE[1],sc,false);
const ring=add(new THREE.TorusGeometry(.8,.015,6,48),N(MG),0,1.3,LOUNGE[1],sc,false);ring.rotation.x=Math.PI/2;
const beam=add(new THREE.CylinderGeometry(.6,.9,1,24,1,true),new THREE.MeshBasicMaterial({color:CY,transparent:true,opacity:.04,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),0,1.3,LOUNGE[1],sc,false);
// neon ring pendants (replace black lamp shades)
const rings=[];for(const [x,z,c] of[[-3,LOUNGE[1],PU],[3,LOUNGE[1],CY],[0,-3.5,MG],[15.9,11,0x806020]]){const t=add(new THREE.TorusGeometry(.6,.04,8,40),N(c),x,4.6,z,sc,false);t.rotation.x=Math.PI/2;rings.push(t);}
// ---- build lab
box(5,.12,1.4,0x1a1d28,-17.5,1.05,12,{metalness:.6,roughness:.3});neon(5,.03,.03,CY,-17.5,.99,11.3);for(const x of[-19.7,-15.3])box(.15,1,1.2,0x333,x,.5,12,{metalness:.7});
box(5,2.2,.1,0x1a1d28,-17.5,2.3,12.9,{metalness:.4});neon(5,.04,.04,MG,-17.5,3.42,12.84);for(let i=0;i<6;i++)box(.1,.5,.1,[0xff3cc7,0x22e6ff,0xa066ff,0xffe14d,0x999999,0x3dff8a][i],-19.5+i*.8,2.6,12.8,{metalness:.6});
const arm=new THREE.Group();arm.position.set(-16,1.1,11.8);sc.add(arm);box(.3,.8,.3,0xdddde8,0,.4,0,{metalness:.8,roughness:.2},arm);const arm2=box(.15,.8,.15,0xdddde8,0,.9,.2,{metalness:.8,roughness:.2},arm);neon(.05,.05,.05,CY,0,1.3,.2,arm2.parent);
const duck=add(new THREE.SphereGeometry(.22,12,10),M(0xffd640,{roughness:.4}),-18.5,1.35,11.8);
box(.12,1.4,6,0x161827,-11.6,.7,10);neon(.04,.04,6,CY,-11.6,1.42,10);
// holo screens
const holos=[];const hs=(seed,c)=>ctex(256,160,(g,w,h)=>{g.strokeStyle=c;g.fillStyle=c;g.lineWidth=3;g.strokeRect(4,4,w-8,h-8);g.globalAlpha=.8;for(let i=0;i<8;i++){const hh=20+((seed*31+i*47)%90);g.fillRect(20+i*28,h-20-hh,16,hh);}g.beginPath();for(let i=0;i<10;i++)g.lineTo(16+i*25,40+((seed*13+i*29)%40));g.stroke();});
for(const [x,y,z,ry,c,sd] of[[-17.5,2.4,10.3,0,'#22e6ff',1],[-10,2.6,0,Math.PI/2,'#ff3cc7',2],[10,2.6,0,-Math.PI/2,'#22e6ff',3],[0,2.9,-6.2,0,'#a066ff',4],[16,2.6,-9,0,'#ff3cc7',5]]){
 const m=plane(1.8,1.12,new THREE.MeshBasicMaterial({map:hs(sd,c),transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),x,y,z,ry);m.userData.y=y;holos.push(m);}
// living plant walls
const leaf=ctex(256,256,(g,w,h)=>{g.fillStyle='#12301a';g.fillRect(0,0,w,h);let r=3;const R=()=>(r=(r*16807)%2147483647)/2147483647;for(let i=0;i<900;i++){g.fillStyle=`hsl(${95+R()*45},${45+R()*30}%,${18+R()*30}%)`;g.beginPath();g.ellipse(R()*w,R()*h,4+R()*8,2+R()*4,R()*3,0,7);g.fill();}});
leaf.wrapS=leaf.wrapT=THREE.RepeatWrapping;
const pw=(w,h,x,z,ry)=>{const t=leaf.clone();t.needsUpdate=true;t.repeat.set(w/2,h/2);const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;sc.add(g);
 box(w+.2,h+.2,.15,0x101018,0,h/2+.4,0,{metalness:.6},g);add(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,roughness:.9,emissive:0x1b5a24,emissiveIntensity:.12}),0,h/2+.4,.09,g,false);
 neon(w,.04,.06,0xc8ffd0,0,.35,.12,g);const up=ctex(8,128,(c)=>{const gr=c.createLinearGradient(0,128,0,0);gr.addColorStop(0,'rgba(190,255,200,.55)');gr.addColorStop(1,'rgba(190,255,200,0)');c.fillStyle=gr;c.fillRect(0,0,8,128);});add(new THREE.PlaneGeometry(w,h*.8),new THREE.MeshBasicMaterial({map:up,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}),0,h*.4+.4,.11,g,false);};
pw(5,3.6,-7.2,-14.7,0);pw(4,3.6,20.75,3,-Math.PI/2);pw(4,3,-20.75,1.5,Math.PI/2);pw(4.2,2.6,0,LOUNGE[1]+5.3,0);pw(3,3.2,8.5,-14.7,0);
// planters
const plant=(x,z,sz=1)=>{add(new THREE.CylinderGeometry(.35*sz,.28*sz,.6*sz,14),M(0x1b1b26,{metalness:.6,roughness:.2}),x,.3*sz,z);neon(.5*sz,.02,.02,CY,x,.6*sz,z+.34*sz);for(let i=0;i<5;i++){const l=add(new THREE.SphereGeometry(.36*sz,8,6),M(0x2f8a45,{roughness:.9}),x+Math.sin(i*1.3)*.25*sz,(.8+i*.18)*sz,z+Math.cos(i*1.3)*.25*sz);l.scale.y=1.3;}};
[[-20,-4],[20,-3.5],[-11.5,-13.8],[11,-13.8],[-8,6.5],[8,6.5],[-10,13.5],[10.5,13.6]].forEach(p=>plant(p[0],p[1],1.25));
// desks + bots
const scrGeo=new THREE.PlaneGeometry(1,.6);
const bub=ctex(128,96,(g)=>{g.fillStyle='#0d0b1e';g.strokeStyle='#22e6ff';g.lineWidth=5;g.beginPath();g.roundRect(6,6,116,62,18);g.fill();g.stroke();g.beginPath();g.moveTo(40,66);g.lineTo(30,90);g.lineTo(62,66);g.fill();g.stroke();g.fillStyle='#ff9be6';for(const x of[38,64,90]){g.beginPath();g.arc(x,37,8,0,7);g.fill();}});
IDS.forEach((id,idx)=>{const m=BOTS_META[id];const[dx,dz,yaw]=DESK[id];
 const desk=new THREE.Group();desk.position.set(dx,0,dz);desk.rotation.y=yaw;sc.add(desk);const off=id==='merlin'?-.9:0,deskY=id==='merlin'?1.1:.99;
 if(id!=='merlin'){box(1.9,.07,1,0x1d1f2e,0,.95,0,{roughness:.15,metalness:.6,env:1.2},desk);neon(1.9,.025,.025,id==='jr'?0xffc070:CY,0,.91,.5,desk);for(const sx of[-.85,.85])box(.06,.92,.9,0x2a2a35,sx,.47,0,{metalness:.8},desk);}
 box(.06,.35,.06,0x222,0,deskY+.17,-.3+off,{metalness:.8},desk);box(1.1,.68,.05,0x0a0a10,0,deskY+.65,-.32+off,{metalness:.5},desk);
 const scr=new THREE.Mesh(scrGeo,new THREE.MeshBasicMaterial({color:SC.idle,toneMapped:false}));scr.position.set(0,deskY+.65,-.29+off);desk.add(scr);
 box(.5,.03,.18,0x222,0,deskY+.02,.1+off,{},desk);
 const glow=new THREE.PointLight(SC.idle,0,2.5,2);glow.position.set(0,deskY+.7,off);
 const pi={jr:0x7a1f1f,quill:0xffffff,scout:0x333,sage:0x3fae5a,ness:0xe0409a,shoppy:0xc8a060,mick:0xffffff,manny:0xf2c230,jocko:0x222}[id];if(pi!==undefined)box(.25,.25,.25,pi,.7,deskY+.13,0,{},desk);
 if(id!=='merlin'){box(.6,.5,.6,0x24203a,0,.5,.85,{},desk);box(.6,.6,.1,0x24203a,0,1.05,1.15,{},desk);}
 const grp=new THREE.Group();
 const body=add(new THREE.CapsuleGeometry(.32,.55,4,12),M(m.color,{roughness:.35,metalness:.1}),0,.75,0,grp);
 const head=add(new THREE.SphereGeometry(.3,16,12),M(id==='jocko'?0x8d5524:0xf1c27d,{roughness:.6}),0,1.5,0,grp);
 const ey=new THREE.MeshBasicMaterial({color:0x111});for(const ex of[-.1,.1])add(new THREE.SphereGeometry(.04,6,6),ey,ex,1.55,-.27,grp,false);
 const arms=[];for(const ax of[-.38,.38])arms.push(add(new THREE.CapsuleGeometry(.08,.4,3,6),M(m.color,{roughness:.4}),ax,.85,-.1,grp));
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
 const visor=neon(.42,.06,.02,id==='jr'?0xffc070:CY,0,1.57,-.29,grp);visor.visible=false;
 const bubble=new THREE.Sprite(new THREE.SpriteMaterial({map:bub,transparent:true,toneMapped:false,depthWrite:false}));bubble.scale.set(.6,.45,1);bubble.position.y=2.35;bubble.visible=false;grp.add(bubble);
 const seat=new THREE.Vector3(0,0,.85);desk.localToWorld(seat);if(id==='merlin')seat.set(0,0,-10.1);
 const a=idx/IDS.length*Math.PI*2,lounge=new THREE.Vector3(LOUNGE[0]+Math.sin(a)*2.3,0,LOUNGE[1]+Math.cos(a)*2.3);
 const [bx,bz]=BAR(idx),bar=new THREE.Vector3(bx,0,bz);
 grp.position.copy(seat);grp.rotation.y=yaw;sc.add(grp);
 const el=document.createElement('div');el.className='lbl';el.onclick=()=>card(id);el.innerHTML='<i></i>'+m.name;document.getElementById('labels').appendChild(el);
 el.onmouseenter=()=>hover=id;el.onmouseleave=()=>hover=null;
 bots[id]={grp,el,scr,glow,arms,body,head,bubble,seat,lounge,bar,yaw,tgt:seat.clone(),spot:'seat',data:null,phase:Math.random()*6};});
let hover=null;
const ray=new THREE.Raycaster(),mv=new THREE.Vector2();let lastUser=-99,tourOn=true;const clk=new THREE.Clock();
const btn=document.getElementById('tour');btn.onclick=()=>{tourOn=!tourOn;btn.textContent=tourOn?'⏸ Tour':'▶ Tour';ctl.autoRotate=tourOn;lastUser=-99;};
ctl.addEventListener('start',()=>{lastUser=clk.elapsedTime;ctl.autoRotate=false;});
const pick=e=>{mv.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(mv,cam);let best=null,bd=1e9;for(const id in bots){const h=ray.intersectObject(bots[id].grp,true);if(h.length&&h[0].distance<bd){bd=h[0].distance;best=id;}}return best;};
let down=null;r.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
r.domElement.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<6){const id=pick(e);if(id)card(id);}});
if(!MOBILE)r.domElement.addEventListener('pointermove',e=>{if(e.buttons)return;hover=pick(e);r.domElement.style.cursor=hover?'pointer':'';});
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();r.setSize(innerWidth,innerHeight);comp.setSize(innerWidth,innerHeight);});
function drawWall(){const c=wsC.getContext('2d');c.fillStyle='#0b0816';c.fillRect(0,0,512,220);c.strokeStyle='#22e6ff';c.lineWidth=4;c.strokeRect(3,3,506,214);c.fillStyle='#9ff3ff';c.font='bold 26px system-ui';c.fillText('⚡ MERLIN · WAR ROOM',16,38);
 let i=0;c.font='17px system-ui';for(const id in bots){const st=bots[id].data?.status||'idle';const col=st==='working'?'#3dff8a':st==='waiting'?'#ffb020':'#7a8290';
  const x=16+(i%2)*250,yy=70+Math.floor(i/2)*30;c.fillStyle=col;c.beginPath();c.arc(x+6,yy-6,6,0,7);c.fill();c.fillStyle='#e8e6ff';c.fillText(BOTS_META[id].name+' · '+st,x+18,yy);i++;}wsT.needsUpdate=true;}
let wallT=-9,ti=0,tNext=0;const tgtV=new THREE.Vector3();ctl.target.set(0,0,0);
const v=new THREE.Vector3(),rects=[];let frame=0;
(function loop(){requestAnimationFrame(loop);const dt=Math.min(clk.getDelta(),.05),t=clk.elapsedTime;frame++;
 if(tourOn&&!ctl.autoRotate&&t-lastUser>20)ctl.autoRotate=true;
 if(tourOn&&ctl.autoRotate){if(t>tNext){ti=(ti+1)%TOUR.length;tNext=t+(ti===0?12:9);}tgtV.set(...TOUR[ti]);ctl.target.lerp(tgtV,.008);
  const wantD=(ti===0?40:17)*(PORTRAIT()?1.35:1);const off=cam.position.clone().sub(ctl.target);const d=off.length();off.setLength(d+(wantD-d)*.01);cam.position.copy(ctl.target).add(off);}
 ctl.update();
 candles.forEach((f,i)=>f.scale.set(1,1.5+Math.sin(t*11+i*2)*.15,1));cl.intensity=5.5+Math.sin(t*7)*.5+Math.sin(t*13)*.3;
 arm.rotation.y=Math.sin(t*.8)*.8;arm2.rotation.x=Math.sin(t*1.3)*.4;duck.position.y=1.35+Math.abs(Math.sin(t*3))*.05;bag.rotation.z=Math.sin(t*2)*.05;
 holo.rotation.y=t*.6;holo.rotation.x=t*.3;ring.position.y=1.3+Math.sin(t*1.5)*.25;holoM.opacity=.55+Math.sin(t*3)*.15;
 holos.forEach((h,i)=>h.position.y=h.userData.y+Math.sin(t*.9+i)*.08);
 if(t-wallT>2){drawWall();wallT=t;}
 for(const id in bots){const b=bots[id],st=b.data?.status||'idle',p=b.grp.position;
  const want=st==='working'?'seat':st==='waiting'?'lounge':'bar';if(b.spot!==want){b.spot=want;b.tgt.copy(b[want]);}
  const dx=b.tgt.x-p.x,dz=b.tgt.z-p.z,d=Math.hypot(dx,dz);const walking=d>.06;
  b.bubble.visible=false;
  if(walking){const sp=Math.min(d,2.4*dt);p.x+=dx/d*sp;p.z+=dz/d*sp;b.grp.rotation.y=Math.atan2(-dx,-dz);p.y=Math.abs(Math.sin(t*10))*.06;b.arms[0].rotation.x=Math.sin(t*10)*.6;b.arms[1].rotation.x=-Math.sin(t*10)*.6;b.body.position.y=.75;b.head.position.y=1.5;}
  else{p.y=0;const sit=b.spot==='seat'&&id!=='merlin';b.body.position.y=sit?.55:.75;b.head.position.y=sit?1.3:1.5;
   if(b.spot==='seat'){b.grp.rotation.y=b.yaw;const a=Math.sin(t*18+b.phase)*.25;b.arms[0].rotation.x=-1.2+a;b.arms[1].rotation.x=-1.2-a;}
   else if(b.spot==='lounge'){b.grp.rotation.y=Math.atan2(-(LOUNGE[0]-p.x),-(LOUNGE[1]-p.z));const talk=Math.sin(t*1.1+b.phase*1.7)>.2;b.bubble.visible=talk;b.bubble.material.opacity=.7+Math.sin(t*6)*.3;
    b.head.rotation.z=talk?Math.sin(t*4)*.08:0;b.arms[0].rotation.x=talk?-.6+Math.sin(t*5)*.3:0;b.arms[1].rotation.x=0;}
   else{b.grp.rotation.y=Math.PI;b.arms[0].rotation.x=0;b.arms[1].rotation.x=-1.3+Math.sin(t*.7+b.phase)*.15;}}
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
window.__bothq={bots,ctl,cam};
poll();setInterval(poll,BOTHQ_CONFIG.pollMs);}
function card(id){const d=bots[id].data||{},m=BOTS_META[id];const $=i=>document.getElementById(i);$('cn').textContent=d.name||m.name;$('cr').textContent=m.role;$('cs').textContent=STATION[id];$('ct').textContent=d.task||'—';$('cst').textContent=d.status||'idle';$('cst').className='pill '+(d.status||'idle');$('cu').textContent=d.updated?fmt(d.updated):'—';$('card').style.display='block';}
async function poll(){try{data=await bothqFetchStatus('../');document.getElementById('upd').textContent='updated '+fmt(data.updated);
 for(const d of data.bots){const b=bots[d.id];if(!b)continue;b.data=d;b.el.title=d.task||'';}}catch(e){document.getElementById('upd').textContent='status offline';}}
bothqGate(start);
