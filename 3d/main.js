import * as THREE from '../vendor/three.module.min.js';import {OrbitControls} from '../vendor/OrbitControls.js';
import {EffectComposer} from '../vendor/jsm/postprocessing/EffectComposer.js';import {RenderPass} from '../vendor/jsm/postprocessing/RenderPass.js';
import {SMAAPass} from '../vendor/jsm/postprocessing/SMAAPass.js';import {UnrealBloomPass} from '../vendor/jsm/postprocessing/UnrealBloomPass.js';import {OutputPass} from '../vendor/jsm/postprocessing/OutputPass.js';
import {RGBELoader} from '../vendor/jsm/loaders/RGBELoader.js';import {GLTFLoader} from '../vendor/jsm/loaders/GLTFLoader.js';import {LightProbeGenerator} from '../vendor/jsm/loaders/LightProbeGenerator.js';import {MeshoptDecoder} from '../vendor/jsm/libs_meshopt_decoder.module.js';import {GTAOPass} from '../vendor/jsm/postprocessing/GTAOPass.js';import {ShaderPass} from '../vendor/jsm/postprocessing/ShaderPass.js';
import {RoundedBoxGeometry} from '../vendor/jsm/RoundedBoxGeometry.js';import {RoomEnvironment} from '../vendor/jsm/RoomEnvironment.js';
const MOBILE=matchMedia('(pointer:coarse)').matches||innerWidth<700, PORTRAIT=()=>innerWidth<innerHeight;
const CY=0x3fb8a8,MG=0xc4688e,PU=0xffa24a;
// desk [x,z,yaw]
const DESK={merlin:[0,-9.2,0],jr:[-16.5,-8.6,0],jocko:[13.5,-7.4,0],sage:[-10,-2.5,Math.PI/2],scout:[-10,2.5,Math.PI/2],quill:[10,-2.5,-Math.PI/2],ness:[10,2.5,-Math.PI/2],shoppy:[7.5,8.6,0],mick:[3.5,8.6,0],manny:[-14,7.6,Math.PI/2],pixel:[-14,4.4,Math.PI/2]};
const STATION={merlin:'War Room',jr:'Prayer Corner',jocko:'Gym',sage:'Open Desks',scout:'Open Desks',quill:'Open Desks',ness:'Open Desks',shoppy:'Ops Desk',mick:'Ops Desk',manny:'Build Lab',pixel:'Art Station'};
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
const pm=new THREE.PMREMGenerator(r);sc.environment=pm.fromScene(new RoomEnvironment(),.04).texture;new RGBELoader().load('../assets/hdri/lounge_1k.hdr',h=>{sc.environment=pm.fromEquirectangular(h).texture;h.dispose();});
const cam=new THREE.PerspectiveCamera(PORTRAIT()?62:48,innerWidth/innerHeight,0.1,200);cam.position.set(0,27,33);if(PORTRAIT())cam.position.set(0,46,11);
const ctl=new OrbitControls(cam,r.domElement);ctl.enableDamping=true;ctl.dampingFactor=.06;ctl.maxPolarAngle=1.25;ctl.minDistance=6;ctl.maxDistance=60;ctl.autoRotate=true;ctl.autoRotateSpeed=.25;{const q=new URLSearchParams(location.search).get('cam');if(q){ctl.minDistance=.2;cam.near=.01;cam.updateProjectionMatrix();ctl.maxPolarAngle=Math.PI*.95;const v=q.split(',').map(Number);cam.position.set(v[0],v[1],v[2]);ctl.target.set(v[3],v[4],v[5]);ctl.autoRotate=false;window.__camLock=1;}}window.__cam=cam;window.__ctl=ctl;
const comp=new EffectComposer(r);comp.addPass(new RenderPass(sc,cam));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth/(MOBILE?2:1),innerHeight/(MOBILE?2:1)),MOBILE?.18:.1,.35,1.15);if(!MOBILE){const ao=new GTAOPass(sc,cam,innerWidth,innerHeight);ao.output=GTAOPass.OUTPUT.Default;window.__ao=ao;if(/noao/.test(location.search))ao.enabled=false;ao.updateGtaoMaterial({radius:.5,distanceExponent:1,thickness:1,scale:1.1,samples:12});ao.blendIntensity=.85;comp.addPass(ao);window.__ao=ao;}
comp.addPass(bloom);comp.addPass(new OutputPass());if(!MOBILE&&!/nosmaa/.test(location.search)){const sm=new SMAAPass(innerWidth*PR,innerHeight*PR);comp.addPass(sm);window.__smaa=sm;}
const fin=new ShaderPass({uniforms:{tDiffuse:{value:null},t:{value:0},amt:{value:MOBILE?.025:.035},vig:{value:.32}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform sampler2D tDiffuse;uniform float t,amt,vig;varying vec2 vUv;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233))+t)*43758.5453);}void main(){vec4 c=texture2D(tDiffuse,vUv);vec2 d=vUv-.5;c.rgb*=1.-vig*smoothstep(.25,.85,length(d)*1.25);c.rgb+=(h(vUv*713.)-.5)*amt;gl_FragColor=c;}'});comp.addPass(fin);window.__fin=fin;
// lights
sc.add(new THREE.HemisphereLight(0xf2e6da,0x5a3a26,.6));{const f=new THREE.DirectionalLight(0x9ab8e8,.75);f.position.set(-6,9,-30);sc.add(f);const f2=new THREE.DirectionalLight(0x9ab8e8,.4);f2.position.set(-30,8,4);sc.add(f2);}
const moon=new THREE.DirectionalLight(0xffc890,1.25);moon.position.set(-14,22,-20);moon.castShadow=true;const s=moon.shadow.camera;s.left=-26;s.right=26;s.top=20;s.bottom=-20;s.far=80;moon.shadow.mapSize.set(MOBILE?1024:4096,MOBILE?1024:4096);moon.shadow.bias=-.0003;moon.shadow.normalBias=.02;sc.add(moon);
const PL=(c,i,d,x,y,z)=>{const l=new THREE.PointLight(c,i*1.9,d*1.6,2);l.position.set(x,y,z);sc.add(l);return l;};
PL(0xffb26a,14,15,0,4,1.2);PL(0xffb070,7,10,15.5,3.6,11.5);PL(0xffd0a0,6,11,0,3.5,-11);if(!MOBILE){PL(0xff9a60,6,11,15,3.5,-10);PL(0xffc080,6,11,-15,3.5,10);}
const MC={};const M=(c,o={})=>{const k=c+JSON.stringify(o);if(MC[k])return MC[k];const {env,...oo}=o;const m=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.5,metalness:.1},oo));m.envMapIntensity=o.env??.6;return MC[k]=m;};
const N=c=>{const k='n'+c;if(MC[k])return MC[k];const m=new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(1.25),toneMapped:false});return MC[k]=m;};
const add=(geo,mat,x,y,z,parent=sc,sh=true)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=sh;parent.add(m);return m;};
const GC={};const bgeo=(w,h,d)=>{const k=w+','+h+','+d;if(GC[k])return GC[k];const m=Math.min(w,h,d),X=Math.max(w,h,d);return GC[k]=(!MOBILE&&m>=.05&&X>=.25&&X<12)?new RoundedBoxGeometry(w,h,d,2,Math.min(.03,m*.3)):new THREE.BoxGeometry(w,h,d);};
const WGC={};const wgeo=(w,h,d,t)=>{const k=w+','+h+','+d+','+t;if(WGC[k])return WGC[k];const g=bgeo(w,h,d).clone();const P=g.attributes.position,Nn=g.attributes.normal,U=g.attributes.uv;
 for(let i=0;i<P.count;i++){const nx=Math.abs(Nn.getX(i)),ny=Math.abs(Nn.getY(i)),nz=Math.abs(Nn.getZ(i));const x=P.getX(i),y=P.getY(i),z=P.getZ(i);if(nx>=ny&&nx>=nz)U.setXY(i,z/t,y/t);else if(ny>=nz)U.setXY(i,x/t,z/t);else U.setXY(i,x/t,y/t);}U.needsUpdate=true;return WGC[k]=g;};
const box=(w,h,d,c,x,y,z,o,p)=>{const m=typeof c==='number'?M(c,o):c;return add(m.userData&&m.userData.tile?wgeo(w,h,d,m.userData.tile):bgeo(w,h,d),m,x,y,z,p);};
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
const TL=new THREE.TextureLoader(),TC={};const SFX=MOBILE?'_m':'';
const tx=(n,srgb,rep)=>{const u=`../assets/tex/${n}${SFX}.webp`;if(!TC[u]){TC[u]=TL.load(u,()=>{TC[u].__u.forEach(c=>{c.needsUpdate=true;});});TC[u].__u=[];}const c=new THREE.Texture();c.source=TC[u].source;if(TC[u].image)c.needsUpdate=true;else TC[u].__u.push(c);c.wrapS=c.wrapT=THREE.RepeatWrapping;c.repeat.set(...rep);c.anisotropy=MOBILE?2:8;if(srgb)c.colorSpace=THREE.SRGBColorSpace;return c;};
const PBR=(n,rep=[1,1],o={},ao=true)=>{const {env,...oo}=o;const m=new THREE.MeshStandardMaterial(Object.assign({map:tx(n+'_diff',1,rep),roughnessMap:tx(n+'_rough',0,rep),normalMap:tx(n+'_nor',0,rep),roughness:1,metalness:0},oo));if(ao&&!MOBILE){m.aoMap=tx(n+'_ao',0,rep);m.aoMapIntensity=.8;}m.envMapIntensity=env??.7;return m;};
const BOTN=MOBILE?null:tx('metal_nor',0,[1,1]),BOTR=MOBILE?null:tx('metal_rough',0,[1,1]);const WOODM=PBR('wood',[1,1],{color:0xe8d2b8}),WOODD=PBR('wood',[1,1],{color:0x8a6a54}),CONC=PBR('cwall',[1,1],{color:0xe4dcd2,env:.5}),STONE=PBR('stone',[2,2],{color:0xe0d8cc});
CONC.userData.tile=2.4;WOODM.userData.tile=1.2;WOODD.userData.tile=1.2;const MARB=PBR('marb',[1,1],{color:0xf2ece4,env:1.0});MARB.userData.tile=1.6;const PLAS=PBR('plas',[1,1],{color:0xd8cfc4,env:.5});PLAS.userData.tile=3;
const FC={};const FAB=c=>FC[c]||(FC[c]=PBR('linen',[2,2],{color:c,normalScale:new THREE.Vector2(1.2,1.2)}));const TERRA=PBR('clay',[1,1],{color:0xd08060});const METAL=PBR('metal',[.5,.5],{color:0x8a8a90,metalness:.85,env:1.1});const LEATH=PBR('leather',[1,1],{color:0x9a6a48});const LINEN=c=>PBR('linen',[1.5,1.5],{color:c});
const ft0=ctex(256,256,(g)=>{g.fillStyle='#10111a';g.fillRect(0,0,256,256);g.strokeStyle='#22e6ff22';g.lineWidth=2;for(let i=0;i<=256;i+=64){g.beginPath();g.moveTo(i,0);g.lineTo(i,256);g.moveTo(0,i);g.lineTo(256,i);g.stroke();}});
const FLOORM=PBR('parq',[40,28],{color:0x9c9894,env:.45});FLOORM.normalScale=new THREE.Vector2(.8,.8);add(new THREE.PlaneGeometry(42,30),FLOORM,0,0,0).rotation.x=-Math.PI/2;
// skyline
const sky=ctex(1024,320,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#2a2438');gr.addColorStop(.55,'#6a4a52');gr.addColorStop(1,'#d08a5a');g.fillStyle=gr;g.fillRect(0,0,w,h);
 let rnd=7;const R=()=>(rnd=(rnd*16807)%2147483647)/2147483647;
 for(let L=0;L<2;L++)for(let x=0;x<w;){const bw=20+R()*50,bh=(L?60:110)+R()*(L?120:170);g.fillStyle=L?'#120a26':'#1c1236';g.fillRect(x,h-bh,bw,bh);
  for(let wy=h-bh+6;wy<h-4;wy+=9)for(let wx=x+4;wx<x+bw-4;wx+=7)if(R()<.35){g.fillStyle=R()<.7?'#ffd99a':'#7fe9ff';g.fillRect(wx,wy,3,4);}
  if(L&&R()<.35){const cs=['#ff3cc7','#22e6ff','#a066ff','#ffe14d'];g.fillStyle=cs[Math.floor(R()*4)];g.shadowColor=g.fillStyle;g.shadowBlur=12;g.fillRect(x+3,h-bh+12,bw-6,8);g.shadowBlur=0;}x+=bw+2;}});
{const c=sky.image.getContext('2d');c.strokeStyle='rgba(220,220,235,.12)';c.lineWidth=1;for(let i=0;i<700;i++){const x=RN()*1024,y=RN()*320;c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y+14);c.stroke();}c.fillStyle='rgba(200,170,160,.18)';c.fillRect(0,0,1024,320);sky.needsUpdate=true;}
const skyM=new THREE.MeshBasicMaterial({map:sky,toneMapped:false,fog:false,color:0xd8c8c0});
{const bp=TL.load(`../assets/hdri/city_backplate${SFX}.webp`);bp.colorSpace=THREE.SRGBColorSpace;const cy=new THREE.Mesh(new THREE.CylinderGeometry(46,46,57,72,1,true),new THREE.MeshBasicMaterial({map:bp,side:THREE.BackSide,toneMapped:false,fog:false,color:0xb0a8b8}));cy.position.y=9.5;cy.rotation.y=-Math.PI/2;sc.add(cy);}
const skyL=(seed,dark,lit,minH,maxH,haze)=>ctex(1024,320,(g,w,h)=>{let rnd=seed;const R=()=>(rnd=(rnd*16807)%2147483647)/2147483647;
 for(let x=0;x<w;){const bw=24+R()*60,bh=minH+R()*(maxH-minH);g.fillStyle=dark;g.fillRect(x,h-bh,bw,bh);if(R()<.3){g.fillRect(x+bw*.4,h-bh-14,3,14);}
  for(let wy=h-bh+6;wy<h-4;wy+=8)for(let wx=x+4;wx<x+bw-4;wx+=6)if(R()<lit){g.fillStyle=R()<.85?'#ffd59a':'#cfe6ff';g.globalAlpha=.55+R()*.45;g.fillRect(wx,wy,3,4);g.globalAlpha=1;}
  g.fillStyle=dark;x+=bw+R()*14;}
 if(haze){const gr=g.createLinearGradient(0,h*.5,0,h);gr.addColorStop(0,'rgba(120,90,100,0)');gr.addColorStop(1,haze);g.fillStyle=gr;g.fillRect(0,0,w,h);}});
const SKYL=[[skyL(31,'#3a2e44',.18,40,160,'rgba(150,110,110,.5)'),-29,-33,.75],[skyL(57,'#1e1828',.3,70,220,'rgba(90,60,70,.35)'),-23,-27,.9],[skyL(91,'#0e0b14',.4,120,300,null),-18.5,-22.5,1]];

// walls (back + left with big windows)
const WH=6;const wm=CONC;
const tint=new THREE.MeshStandardMaterial({color:0x66d9ff,transparent:true,opacity:.06,roughness:0,metalness:0,depthWrite:false,side:THREE.DoubleSide});
for(let x=-21;x<21;x+=6){box(1.2,WH,.4,wm,x+.6,WH/2,-15);box(4.8,.7,.4,wm,x+3.6,.35,-15);box(4.8,1.4,.4,PLAS,x+3.6,WH-.7,-15);if(x>-14)plane(4.8,3.9,tint,x+3.6,2.65,-14.9);box(4.9,.05,.5,WOODD,x+3.6,.72,-14.85);box(4.8,.04,.03,WOODD,x+3.6,.25,-14.79);box(4.8,.06,.06,WOODD,x+3.6,WH-1.42,-14.79);}
box(1.2,WH,.4,wm,20.4,WH/2,-15);
for(let z=-15;z<15;z+=6){box(.4,WH,1.2,wm,-21,WH/2,z+.6);box(.4,.7,4.8,wm,-21,.35,z+3.6);box(.4,1.4,4.8,PLAS,-21,WH-.7,z+3.6);plane(4.8,3.9,tint,-20.9,2.65,z+3.6,Math.PI/2);box(.5,.05,4.9,WOODD,-20.85,.72,z+3.6);box(.03,.04,4.8,WOODD,-20.79,.25,z+3.6);box(.06,.06,4.8,WOODD,-20.79,WH-1.42,z+3.6);}
box(.4,1.2,30,wm,21,.6,0);box(42,.5,.3,wm,0,.25,15);box(.06,.06,30,WOODD,20.78,1.22,0);box(.05,.05,30,WOODD,20.78,.3,0);box(42,.06,.06,WOODD,0,.52,14.84);
// BOT HQ sign
const sign=ctex(1024,256,(g,w,h)=>{g.font='900 150px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.shadowBlur=30;g.shadowColor='#ff3cc7';g.strokeStyle='#ff9be6';g.lineWidth=6;g.strokeText('BOT HQ',w/2,h/2);g.fillStyle='#ffe6fa';g.fillText('BOT HQ',w/2,h/2);});
{const sg2=ctex(1024,256,(g,w,h)=>{g.font='800 150px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#fff';g.fillText('BOT HQ',w/2,h/2+6);});
 const halo=ctex(1024,256,(g,w,h)=>{g.font='800 150px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.shadowColor='#ffb870';g.shadowBlur=40;g.fillStyle='#ffb870';for(let i=0;i<3;i++)g.fillText('BOT HQ',w/2,h/2+6);});
 plane(7.4,1.85,new THREE.MeshBasicMaterial({map:halo,transparent:true,opacity:.55,toneMapped:false,depthWrite:false,blending:THREE.AdditiveBlending}),0,5.3,-14.79);
 box(7.4,1.3,.06,WOODD,0,5.3,-14.76);plane(6.6,1.65,new THREE.MeshStandardMaterial({alphaMap:sg2,transparent:true,color:0x2a1a10,metalness:.6,roughness:.35}),0,5.3,-14.66);}
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
box(.25,4.2,7.6,WOODM,-12.6,2.1,-10.9);box(4.1,4.2,.25,WOODM,-18.7,2.1,-7.2);box(8,.02,7.4,PBR('stone',[5,5],{color:0xd8ccbc}),-16.8,.012,-10.9);
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
box(9,1.05,1.1,WOODM,15.9,.52,13.6);box(9.2,.08,1.25,MARB,15.9,1.09,13.55);
for(let i=0;i<10;i++)box(.82,.78,.03,WOODD,11.85+i*.9,.52,13.03);box(9,.08,.06,WOODD,15.9,.06,13.02);box(9,.05,.05,0xb08850,15.9,.98,13.02,{metalness:.9,roughness:.3});
box(9,2.6,.3,WOODD,15.9,2.6,14.7);// back bar
for(let i=0;i<10;i++)box(.18,.35,.18,[0x6a3a20,0x3a5a40,0x8a6a30,0x5a2a30][i%4],12.2+i*.8,2.6,14.5,{roughness:.15,metalness:.1});
// espresso machine (procedural fallback on phones / ?noph)
const ESPP=!MOBILE&&!/noph/.test(location.search);if(!ESPP){
box(1.3,.8,.7,METAL,13,1.53,13.7);for(const gx of[12.6,13.4]){add(new THREE.CylinderGeometry(.05,.05,.12,16),METAL,gx,1.2,13.3);box(.05,.05,.3,0x1a1a1a,gx,1.2,13.15,{roughness:.6});}box(1.3,.08,.72,0x2a2624,13,1.97,13.7,{roughness:.6});box(.9,.12,.05,0x3a3430,13,1.75,13.34,{roughness:.6});add(new THREE.CircleGeometry(.03,10),new THREE.MeshBasicMaterial({color:0xffa24a}),12.7,1.75,13.31,sc,false).rotation.y=Math.PI;
for(const dx of[-.3,.3]){box(.08,.2,.08,0x111,13+dx,1.25,13.3);}add(new THREE.SphereGeometry(.1,10,8),M(0xddddff,{metalness:1,roughness:.1}),13.45,1.75,13.33);
}
// display case w/ pastries
const caseG=new THREE.MeshStandardMaterial({color:0xbfeaff,transparent:true,opacity:.15,roughness:0,depthWrite:false,envMapIntensity:1.5});
add(new THREE.BoxGeometry(2.2,.6,.9),caseG,17.6,1.43,13.6,sc,false);neon(2.2,.03,.03,0xffd27a,17.6,1.72,13.18);
for(let i=0;i<6;i++){const d=add(new THREE.TorusGeometry(.12,.06,8,14),M([0xd99a5a,0xff7ab8,0x8a5a3a][i%3],{roughness:.6}),16.85+i*.3,1.22,13.6);d.rotation.x=Math.PI/2;}
for(let i=0;i<5;i++)add(new THREE.SphereGeometry(.13,10,8),M(0xe0a868,{roughness:.7}),16.9+i*.35,1.5,13.75).scale.y=.6;
// cups / drinks on counter
for(let i=0;i<5;i++){const x=14.2+i*.55,col=[0xffffff,0x22e6ff,0xff3cc7,0xffffff,0xa066ff][i];add(new THREE.CylinderGeometry(.09,.07,.22,12),M(col,{roughness:.3,emissive:i%2?col:0,emissiveIntensity:.3}),x,1.24,13.25);}
// stools
for(let i=0;i<5;i++){const x=12.05+i*1.8;if(!MOBILE)continue;add(new THREE.CylinderGeometry(.06,.06,.8,8),M(0x999,{metalness:1,roughness:.2}),x,.4,12.5);add(new THREE.CylinderGeometry(.3,.3,.08,24),LEATH,x,.82,12.5);neon(.5,.02,.02,CY,x,.05,12.5);}
// neon menu board
const menu=ctex(512,320,(g,w,h)=>{g.fillStyle='#0b0816';g.fillRect(0,0,w,h);g.strokeStyle='#22e6ff';g.lineWidth=6;g.shadowColor='#22e6ff';g.shadowBlur=14;g.strokeRect(8,8,w-16,h-16);
 g.font='900 62px system-ui';g.textAlign='center';g.fillStyle='#ff9be6';g.shadowColor='#ff3cc7';g.fillText('REFUEL',w/2,80);g.font='600 30px system-ui';g.textAlign='left';g.shadowBlur=8;g.shadowColor='#22e6ff';
 [['Espresso','3'],['Oat Latte','5'],['Cold Brew','4'],['Matcha','5'],['Croissant','3'],['Donut','2']].forEach(([n,p],i)=>{g.fillStyle='#d8f8ff';g.fillText(n,40+(i%2)*240,150+Math.floor(i/2)*55);g.fillStyle='#ffe14d';g.fillText('$'+p,190+(i%2)*240,150+Math.floor(i/2)*55);});});
plane(4,2.5,new THREE.MeshBasicMaterial({map:menu,toneMapped:false}),15.9,4.6,14.53,Math.PI);
// ---- center lounge
box(11,.03,8,FAB(0xb8a68a),0,.015,LOUNGE[1]);neon(11,.03,.05,PU,0,.03,LOUNGE[1]-4);neon(11,.03,.05,PU,0,.03,LOUNGE[1]+4);
const SOFAS=[],LAMPS=[],CHAIRS=[];const sofa=(x,z,ry,c)=>{const g=new THREE.Group();SOFAS.push(g);blob(3.4,1.5,0,0,g);g.position.set(x,0,z);g.rotation.y=ry;sc.add(g);const F=FAB(c);box(3,.45,1,F,0,.3,0,null,g);box(3,.7,.25,c,0,.75,.45,{roughness:.6},g);box(.25,.6,1,c,-1.4,.55,0,{roughness:.6},g);box(.25,.6,1,c,1.4,.55,0,{roughness:.6},g);neon(3,.03,.03,CY,0,.06,-.5,g);};
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
const rings=[];for(const [x,z,c] of[[-3,LOUNGE[1],PU],[3,LOUNGE[1],CY],[0,-3.5,MG],[15.9,11,0x806020]]){const t=add(new THREE.TorusGeometry(.6,.04,8,40),N(c),x,4.6,z,sc,false);t.rotation.x=Math.PI/2;rings.push(t);t.visible=false;}
// ---- build lab
box(5,.12,1.4,WOODM,-17.5,1.05,12);neon(5,.03,.03,CY,-17.5,.99,11.3);for(const x of[-19.7,-15.3])box(.15,1,1.2,0x333,x,.5,12,{metalness:.7});
box(5,2.2,.1,WOODD,-17.5,2.3,12.9);neon(5,.04,.04,MG,-17.5,3.42,12.84);for(let i=0;i<6;i++)box(.1,.5,.1,[0xff3cc7,0x22e6ff,0xa066ff,0xffe14d,0x999999,0x3dff8a][i],-19.5+i*.8,2.6,12.8,{metalness:.6});
const arm=new THREE.Group();arm.position.set(-16,1.1,11.8);sc.add(arm);box(.3,.8,.3,0xdddde8,0,.4,0,{metalness:.8,roughness:.2},arm);const arm2=box(.15,.8,.15,0xdddde8,0,.9,.2,{metalness:.8,roughness:.2},arm);neon(.05,.05,.05,CY,0,1.3,.2,arm2.parent);
const duck=add(new THREE.SphereGeometry(.22,12,10),M(0xffd640,{roughness:.4}),-18.5,1.35,11.8);
box(.12,1.4,6,WOODD,-11.6,.7,10);neon(.04,.04,6,CY,-11.6,1.42,10);
// holo screens
const holos=[];const hs=(seed,c)=>ctex(256,160,(g,w,h)=>{g.strokeStyle=c;g.fillStyle=c;g.lineWidth=3;g.strokeRect(4,4,w-8,h-8);g.globalAlpha=.8;for(let i=0;i<8;i++){const hh=20+((seed*31+i*47)%90);g.fillRect(20+i*28,h-20-hh,16,hh);}g.beginPath();for(let i=0;i<10;i++)g.lineTo(16+i*25,40+((seed*13+i*29)%40));g.stroke();});
for(const [x,y,z,ry,c,sd] of[[-17.5,2.4,10.3,0,'#22e6ff',1],[-10,2.6,0,Math.PI/2,'#ff3cc7',2],[10,2.6,0,-Math.PI/2,'#22e6ff',3],[0,2.9,-6.2,0,'#a066ff',4],[16,2.6,-9,0,'#ff3cc7',5]]){
 const m=plane(1.8,1.12,new THREE.MeshBasicMaterial({map:hs(sd,c),transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),x,y,z,ry);m.userData.y=y;holos.push(m);}
// living plant walls
const leaf=ctex(256,256,(g,w,h)=>{g.fillStyle='#24331c';g.fillRect(0,0,w,h);let r=3;const R=()=>(r=(r*16807)%2147483647)/2147483647;for(let i=0;i<900;i++){g.fillStyle=`hsl(${80+R()*40},${30+R()*25}%,${20+R()*25}%)`;g.beginPath();g.ellipse(R()*w,R()*h,4+R()*8,2+R()*4,R()*3,0,7);g.fill();}});
leaf.wrapS=leaf.wrapT=THREE.RepeatWrapping;
const PWS=[];const pw=(w,h,x,z,ry)=>{PWS.push([w,h,x,z,ry]);const t=leaf.clone();t.needsUpdate=true;t.repeat.set(w/2,h/2);const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;sc.add(g);
 box(w+.2,h+.2,.15,0x101018,0,h/2+.4,0,{metalness:.6},g);add(new THREE.PlaneGeometry(w,h),MOBILE?new THREE.MeshStandardMaterial({map:t,roughness:.9,emissive:0x1b5a24,emissiveIntensity:.12}):PBR('moss',[w/1.2,h/1.2],{color:0xc8d8b0,normalScale:new THREE.Vector2(1.6,1.6),env:.4}),0,h/2+.4,.09,g,false);
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
const PLQ=[];const plant=(x,z,sz=1,type=0)=>{if(!MOBILE&&!/noph/.test(location.search)){PLQ.push([x,z,sz,type]);blob(1.1*sz,1.1*sz,x,z);if(type===1){add(new THREE.CylinderGeometry(.36*sz,.26*sz,.62*sz,24),TERRA,x,.31*sz,z);add(new THREE.CylinderGeometry(.33*sz,.33*sz,.03,16),M(0x3a2a1c,{roughness:1}),x,.6*sz,z,sc,false);}return;}add(new THREE.CylinderGeometry(.36*sz,.26*sz,.62*sz,18),TERRA,x,.31*sz,z);add(new THREE.CylinderGeometry(.33*sz,.33*sz,.03,16),M(0x3a2a1c,{roughness:1}),x,.6*sz,z,sc,false);blob(1.1*sz,1.1*sz,x,z);
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
const GL=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);const gm=(n,f)=>{if(!MOBILE)GL.load(`../assets/models/opt/${n}.glb`,g=>{g.scene.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;if(o.material)o.material.envMapIntensity=.8;}});f(g.scene);});};
const put=(src,x,y,z,ry=0,s=1,p=sc)=>{const c=src.clone();c.position.set(x,y,z);c.rotation.y=ry;c.scale.setScalar(s);p.add(c);return c;};
gm('sofa_03',m=>{SOFAS.slice(0,2).forEach(g=>{g.children.forEach(c=>{if(c.material!==blobM)c.visible=false;});put(m,0,0,0,Math.PI,1.05,g);});});
gm('sofa_02',m=>{SOFAS.slice(2).forEach(g=>{g.children.forEach(c=>{if(c.material!==blobM)c.visible=false;});put(m,0,0,0,Math.PI,1.5,g);});});
gm('mid_century_lounge_chair',m=>{put(m,-18.6,0,2,Math.PI/2+.3);blob(1.2,1.4,-18.6,2);put(m,18.7,0,-2.6,-Math.PI/2-.3);blob(1.2,1.4,18.7,-2.6);});
gm('modern_arm_chair_01',m=>{put(m,18.6,0,9,-Math.PI/2-.4,1.1);put(m,-11.3,0,12.9,Math.PI*.85,1.1);blob(1.1,1.1,18.6,9);blob(1.1,1.1,-11.3,12.9);});
gm('side_table_01',m=>{put(m,-18.7,0,3.3,0);put(m,18.7,0,-1.2,0);});
gm('wooden_bookshelf_worn',m=>{put(m,-19.6,0,11.5,Math.PI/2);put(m,19.6,0,5.6,-Math.PI/2);blob(1.6,.8,-19.6,11.5);blob(1.6,.8,19.6,5.6);});
gm('vintage_electric_kettle',m=>{put(m,13.0,1.12,13.45,.4,1);});
if(new URLSearchParams(location.search).has('nosr'))gm('dining_chair_02',m=>{CHAIRS.forEach(d=>put(m,0,0,.95,Math.PI,1,d));});
gm('brass_pot_01',m=>{put(m,-19.6,1.05,11.3,0,1);});gm('ceramic_pot',m=>{put(m,19.6,.02,5.6,0,.8);});gm('book_encyclopedia_set_01',m=>{put(m,-19.55,1.47,11.2,Math.PI/2,1);put(m,19.55,1.47,5.9,-Math.PI/2,1);});
gm('desk_lamp_arm_01',m=>{LAMPS.forEach(([d,y])=>put(m,.75,y,-.3,-2.4,.7,d));});
gm('potted_plant_02',m=>{[[-17.6,-13.6],[17.6,13.6],[-5.2,13.5],[12.4,-13.5]].forEach(([x,z],i)=>{put(m,x,0,z,i*1.3,1.7);blob(1.4,1.4,x,z);});});
if(!MOBILE)GL.load('../assets/models/opt/potted_plant_04.glb',g=>{const src=g.scene;src.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;}});const bb=new THREE.Box3().setFromObject(src),hgt=bb.max.y-bb.min.y;
 [[-3.2,-6.8,1.5],[3.6,-6.9,1.4],[-12.6,13.4,1.6],[19.4,-9.5,1.5],[-19.5,-12.8,1.3],[1.7,13.4,1.5]].forEach(([x,z,H],i)=>{const c=src.clone();c.scale.setScalar(H/hgt);c.position.set(x,0,z);c.rotation.y=i*1.7;sc.add(c);blob(1.2,1.2,x,z);});});
// Poly Haven CC0 scanned models replacing procedural plants / stools / pendants (desktop)
{const fit=(src,H)=>{const bb=new THREE.Box3().setFromObject(src);return H/(bb.max.y-bb.min.y);};
 gm('potted_plant_01',m=>{const k=fit(m,1);PLQ.filter(p=>p[3]!==1).forEach(([x,z,sz],i)=>put(m,x,0,z,i*1.9,k*1.9*sz));});
 gm('fern_02',m=>{const k=fit(m,1);PLQ.filter(p=>p[3]===1).forEach(([x,z,sz],i)=>put(m,x,.6*sz,z,i*2.3,k*.75*sz));});
 gm('metal_stool_02',m=>{const k=fit(m,.82);for(let i=0;i<5;i++)put(m,12.05+i*1.8,0,12.5,i*.7,k);});
 gm('hanging_industrial_lamp',m=>{const bb=new THREE.Box3().setFromObject(m),h=bb.max.y-bb.min.y,k=1.6/h;for(let i=0;i<4;i++){const x=12.6+i*2.3;put(m,x,7.2-bb.max.y*k,13.5,0,k);}});}
if(ESPP)gm('espresso_2group',m=>put(m,13,1.13,13.75,0,1.4));
// NVIDIA SimReady props (CC-BY-4.0, converted USD->glTF by us; see ../CREDITS.md). Desktop only, lazy/progressive: loaded one by one after first frames; phones keep the simple versions.
if(!MOBILE&&!new URLSearchParams(location.search).has('nosr')){
 const SRL=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);const Q=[];let busy=0;
 const sr=(n,f)=>Q.push([n,f]);
 const next=()=>{if(busy||!Q.length)return;busy=1;const [n,f]=Q.shift();SRL.load(`../assets/models/opt/sr_${n}.glb`,g=>{const src=g.scene;src.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;if(o.material)o.material.envMapIntensity=.9;}});try{f(src);}catch(e){console.warn("sr",n,e);}window.SRN=(window.SRN||0)+1;busy=0;setTimeout(next,60);},undefined,()=>{busy=0;next();});};
 const SRO=window.SRO=[];const P=(src,x,y,z,ry=0,s=1,p=sc)=>{const c=src.clone(true);SRO.push(c);c.position.set(x,y,z);c.rotation.y=ry;c.scale.setScalar(s);p.add(c);return c;};
 const D=()=>window.SRD.filter(d=>d.id!=='merlin');
 // desk hero props first (closest to camera on tour)
 sr('computer_keyboard_a01',o=>{for(const d of window.SRD){d.kb.forEach(m=>m.visible=false);P(o,0,d.deskY+.002,.1+d.off,0,1.05,d.desk);}});
 sr('computer_mouse_office_b01',o=>{for(const d of window.SRD){if(d.ms)d.ms.visible=false;P(o,.42,d.deskY+.002,.12+d.off,0,.9,d.desk);}});
 sr('dishware_mug_coffee_a01',o=>{for(const d of D()){if(d.mug)d.mug.forEach(m=>m.visible=false);P(o,-.62,d.deskY,.2,2.4,1.1,d.desk);}});
 sr('chair_office_fabric_manager_a01',o=>{CHAIRS.forEach(d=>P(o,0,0,.95,Math.PI,1,d));});
 sr('computer_monitor_office_a01',o=>{for(const d of D())P(o,.74,d.deskY,-.3,-.5,1,d.desk);});
 sr('misc_notebook_a01',o=>{for(const d of D())if(d.idx%2)P(o,.45,d.deskY,.32,.3,1,d.desk);});
 sr('food_beverage_coffeeCup_a01',o=>{for(const d of D())if(d.idx%3===1)P(o,-.42,d.deskY,.32,1,1,d.desk);});
 sr('lamp_table_bedside_a01',o=>{for(const d of D())if(d.idx%2)P(o,.82,d.deskY,-.05,0,1,d.desk);});
 sr('bin_waste_a01',o=>{for(const d of D())P(o,1.1,0,-.1,0,.8,d.desk);});
 sr('book_open_a01',o=>{const q=window.SRD.find(d=>d.id==='quill');if(q)P(o,-.3,q.deskY,.38,.2,1,q.desk);P(o,0,.83,LOUNGE[1]+.55,.4,1);});
 sr('decor_candle_a01',o=>{const j=window.SRD.find(d=>d.id==='jr');if(j){P(o,.55,j.deskY,.3,0,1,j.desk);P(o,.65,j.deskY,.22,0,.8,j.desk);}});
 sr('measurement_clock_alarm_a01',o=>{const m=window.SRD.find(d=>d.id==='merlin');if(m)P(o,-.55,m.deskY,-.2+m.off,.4,.8,m.desk);});
 // coffee bar + kitchen
 sr('appliance_toaster_a01',o=>P(o,17.6,1.12,13.45,Math.PI,1));
 sr('dishware_glass_tumbler_a01',o=>{for(let i=0;i<4;i++)P(o,14.6+i*.14,1.12,13.35,0,1);});
 sr('dishware_bowl_a01',o=>P(o,16.4,1.12,13.4,0,.9));
 sr('misc_glass_vase_a01',o=>P(o,11.4,1.12,13.4,0,1));
 sr('refrigerator_a01',o=>P(o,19.9,0,13.4,-Math.PI/2,1));
 // lounge + gym + lab
 sr('furniture_table_coffee_low_a01',o=>{P(o,-2.4,0,LOUNGE[1]+2.6,Math.PI/2,1);});
 sr('sofa_soft_b01',o=>{P(o,-3.6,0,LOUNGE[1]+2.6,Math.PI/2+.3,1.1);P(o,-1.2,0,LOUNGE[1]+2.6,-Math.PI/2-.3,1.1);});
 sr('TV_a01',o=>P(o,17.4,1.1,-14.2,-Math.PI/2,1.3));
 sr('kitchenware_kettle_a01',o=>P(o,-19.9,1.05,4.0,0,1));sr('misc_glass_vase_a01',o=>P(o,-19.9,.62,4.5,0,1));sr('dishware_bowl_a01',o=>P(o,-19.9,1.05,4.6,0,1));sr('misc_notebook_a01',o=>P(o,-19.9,.62,3.9,0,1));
 sr('storage_shelf_basic_a01',o=>P(o,-19.9,0,4.2,Math.PI,.9));
 sr('sofa_visitor_a01',o=>P(o,-7,0,13.6,Math.PI/2,1));
 window.SRQ=Q;window.SRT=Q.length;setTimeout(next,2500);}
// ---- whiteboard
{const g=new THREE.Group();g.position.set(-16.7,0,0);g.rotation.y=Math.PI/2;sc.add(g);const wb=ctex(512,300,(c,w,h)=>{c.fillStyle='#f4f1ea';c.fillRect(0,0,w,h);c.strokeStyle='#3a6a8a';c.lineWidth=4;c.strokeRect(40,40,120,60);c.strokeRect(220,40,120,60);c.strokeRect(130,170,140,60);c.beginPath();c.moveTo(160,70);c.lineTo(220,70);c.moveTo(280,100);c.lineTo(220,170);c.stroke();c.fillStyle='#a0503a';c.font='bold 26px system-ui';c.fillText('SPRINT',360,60);c.font='20px system-ui';c.fillStyle='#333';['- 3D HQ','- PD videos','- FaceTag'].forEach((s,i)=>c.fillText(s,360,100+i*30));});
 box(2.8,1.6,.06,0xd8d4cc,0,1.75,0,{roughness:.3},g);plane(2.7,1.5,new THREE.MeshStandardMaterial({map:wb,roughness:.25}),0,1.75,.035,0,g);for(const s of[-1.3,1.3])box(.05,1,.05,0x555,s,.5,0,{metalness:.8},g);box(1,.04,.12,0x777,0,.93,.06,{},g);}
// ---- wall art
const art=(seed)=>ctex(320,220,(c,w,h)=>{const cs=[['#e8c9a0','#c07040','#5a6a40','#2a3a30'],['#d8b890','#a05a3a','#6a8a6a','#3a2a24'],['#f0d8b0','#8a6a4a','#4a6a5a','#c08850']][seed];c.fillStyle=cs[0];c.fillRect(0,0,w,h);c.fillStyle=cs[1];c.beginPath();c.arc(w*.68,h*.38,42,0,7);c.fill();
 c.fillStyle=cs[2];c.beginPath();c.moveTo(0,h);c.quadraticCurveTo(w*.3,h*.4,w*.6,h*.75);c.quadraticCurveTo(w*.8,h*.55,w,h*.7);c.lineTo(w,h);c.fill();c.fillStyle=cs[3];c.fillRect(0,h*.88,w,h*.12);});
const pic=(x,y,z,ry,w,h,s)=>{const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;sc.add(g);box(w+.12,h+.12,.05,0x3a2a1c,0,0,0,{roughness:.6},g);let mp;if(!/noph/.test(location.search)){mp=tx('art'+s,1,[1,1]);mp.wrapS=mp.wrapT=THREE.ClampToEdgeWrapping;}else mp=art(s);plane(w,h,new THREE.MeshStandardMaterial({map:mp,roughness:.55}),0,0,.03,0,g);box(w+.02,.03,.01,0xf4f0e8,0,h/2,.026,{},g);};
pic(-9.6,5.25,-14.78,0,1.7,1.05,0);pic(9.6,5.25,-14.78,0,1.7,1.05,1);pic(-12.45,2.4,-10.5,Math.PI/2,2.2,1.4,2);
// ---- textured rugs
const kilim=ctex(256,256,(c,w,h)=>{c.fillStyle='#8c6a52';c.fillRect(0,0,w,h);const cs=['#c8b49a','#4a3a30','#6a7060'];for(let y=0;y<h;y+=32){c.fillStyle=cs[(y/32)%3];c.fillRect(0,y+12,w,6);for(let x=0;x<w;x+=32){c.beginPath();c.moveTo(x+16,y+4);c.lineTo(x+28,y+16);c.lineTo(x+16,y+28);c.lineTo(x+4,y+16);c.fill();}}for(let i=0;i<4000;i++){c.fillStyle=`rgba(0,0,0,${RN()*.08})`;c.fillRect(RN()*w,RN()*h,1,2);}});
kilim.wrapS=kilim.wrapT=THREE.RepeatWrapping;
const rug2=(w,d,x,z)=>{let mt;if(MOBILE){const t=kilim.clone();t.needsUpdate=true;t.repeat.set(w/2.5,d/2.5);mt=new THREE.MeshStandardMaterial({map:t,roughness:1,color:0xe8dcd0});}else mt=PBR('rug',[w/1.5,d/1.5],{color:0xd8ccbc,env:.3});const m=add(new THREE.BoxGeometry(w,.02,d),mt,x,.012,z,sc,false);m.receiveShadow=true;};
rug2(3.4,8,-10,0);rug2(3.4,8,10,0);rug2(8.5,2.6,15.8,11.2);rug2(4,2.6,-16,10.6);
// ---- light shafts + dust motes
const shaftT=ctex(64,256,(c,w,h)=>{const gr=c.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,205,150,0)');gr.addColorStop(.12,'rgba(255,205,150,.55)');gr.addColorStop(1,'rgba(255,205,150,0)');c.fillStyle=gr;c.fillRect(0,0,w,h);});
const shaftM=new THREE.MeshBasicMaterial({map:shaftT,transparent:true,opacity:MOBILE?.07:.08,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
for(const x of[-17.4,-11.4,-5.4,.6,6.6,12.6]){const s=new THREE.Mesh(new THREE.CylinderGeometry(1.7,2.2,8.2,4,1,true),shaftM);s.position.set(x+1.2,2.1,-11.2);s.rotation.set(-1.05,Math.PI/4,0,'XYZ');s.renderOrder=5;sc.add(s);}
const DN=MOBILE?70:320,dpos=new Float32Array(DN*3);for(let i=0;i<DN;i++){dpos[i*3]=-18+RN()*36;dpos[i*3+1]=.3+RN()*4.5;dpos[i*3+2]=-14+RN()*27;}
const dgeo=new THREE.BufferGeometry();dgeo.setAttribute('position',new THREE.BufferAttribute(dpos,3));
const dustT=ctex(32,32,(c)=>{const gr=c.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(255,235,200,1)');gr.addColorStop(1,'rgba(255,235,200,0)');c.fillStyle=gr;c.fillRect(0,0,32,32);});
const dust=new THREE.Points(dgeo,new THREE.PointsMaterial({map:dustT,size:.05,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending,color:0xffe0b0}));sc.add(dust);

// desks + bots
const scrGeo=new THREE.PlaneGeometry(1,.6);
const bub=ctex(128,96,(g)=>{g.fillStyle='#0d0b1e';g.strokeStyle='#22e6ff';g.lineWidth=5;g.beginPath();g.roundRect(6,6,116,62,18);g.fill();g.stroke();g.beginPath();g.moveTo(40,66);g.lineTo(30,90);g.lineTo(62,66);g.fill();g.stroke();g.fillStyle='#ff9be6';for(const x of[38,64,90]){g.beginPath();g.arc(x,37,8,0,7);g.fill();}});
// ---------- Stylized characters (personalizable via ../avatars.json) ----------
const BUILD={pixel:1,jocko:1.2,manny:1.1,mick:1.08,merlin:1.02,sage:.96,shoppy:.98,ness:.95,quill:.95,scout:1,jr:1.03};
// hair: procedural strand texture (map+bump+alpha for cards) and anisotropic sheen
const HAIRT=(()=>{if(MOBILE)return null;const c=document.createElement('canvas');c.width=128;c.height=512;const x=c.getContext('2d');x.fillStyle='#808080';x.fillRect(0,0,128,512);
 for(let i=0;i<900;i++){const px=Math.random()*128,l=120+Math.random()*392,v=90+Math.random()*120|0;x.strokeStyle=`rgba(${v},${v},${v},${.25+Math.random()*.5})`;x.lineWidth=.6+Math.random()*1.1;x.beginPath();x.moveTo(px,0);x.bezierCurveTo(px+(Math.random()-.5)*8,l*.3,px+(Math.random()-.5)*10,l*.6,px+(Math.random()-.5)*12,l);x.stroke();}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,1);t.colorSpace=THREE.SRGBColorSpace;return t;})();
const HCARD=(()=>{if(MOBILE)return null;const c=document.createElement('canvas');c.width=64;c.height=256;const x=c.getContext('2d');
 for(let i=0;i<70;i++){const px=8+Math.random()*48,a=.35+Math.random()*.6;x.strokeStyle=`rgba(255,255,255,${a})`;x.lineWidth=.7+Math.random();x.beginPath();x.moveTo(px,0);x.quadraticCurveTo(px+(Math.random()-.5)*14,128,32+(px-32)*.5+(Math.random()-.5)*10,190+Math.random()*66);x.stroke();}
 const t=new THREE.CanvasTexture(c);return t;})();
const HMC={};const hairM=c=>HMC[c]||(HMC[c]=MOBILE?M(c,{roughness:.75,metalness:0}):new THREE.MeshPhysicalMaterial({color:c,map:HAIRT,bumpMap:HAIRT,bumpScale:1.2,roughness:.42,metalness:0,sheen:.6,sheenRoughness:.35,sheenColor:new THREE.Color(c).lerp(new THREE.Color(0xffffff),.35),anisotropy:.7,anisotropyRotation:Math.PI/2,envMapIntensity:.6}));
const HCM={};const cardM=c=>HCM[c]||(HCM[c]=new THREE.MeshStandardMaterial({color:c,alphaMap:HCARD,alphaTest:.3,transparent:false,side:THREE.DoubleSide,roughness:.5,metalness:0}));
const AVSCHEMA={patch:['none','cross','flag','star'],build:['slim','average','athletic','buff'],face:['masc','fem'],expression:['smile','warm','calm','stern'],hair:['bald','buzz','high_tight','short','side_part','curly','long','long_waves','bob','ponytail','sleek_ponytail','bun'],beard:['none','stubble','full','goatee','wizard'],outfit_style:['robe','blazer','tee','athleisure','chef_coat','cardigan','explorer','sweater_vest','work_vest','hoodie','tactical'],hat:['none','wizard','chef','hard_hat','explorer','cap','beanie','headband','crown'],accessory:['none','glasses','safety_glasses','headset','binoculars','tie','scarf','tool_belt','leaf_pin','cross_pin','plate_carrier','watch'],prop:['none','staff','bible','water_bottle','shopping_bags','binoculars','quill','wrench','spatula','notebook','coffee','dumbbell']};
const DEFAV={patch:'none',build:'average',face:'masc',expression:'smile',outfit_style:'tee',outfit:'#556070',outfit2:'#d0c8b8',skin:'#e0b090',hair:'short',hair_color:'#3a2a20',beard:'none',hat:'none',accessory:'none',prop:'none',mug:'#e8e0d0',decor:[],motto:''};
const hexc=(h,d)=>/^#[0-9a-fA-F]{6}$/.test(h||'')?parseInt(h.slice(1),16):d;
const CM={};const cloth=c=>(c==null&&(c=0x707070),CM)&&CM['c'+c]||(CM['c'+c]=MOBILE?M(c,{roughness:.88,metalness:0}):(()=>{const m=FAB(c).clone();m.color=new THREE.Color(c);m.roughness=.92;m.metalness=0;return m;})());
const skinM=c=>CM['s'+c]||(CM['s'+c]=MOBILE?M(c,{roughness:.55,metalness:0}):new THREE.MeshPhysicalMaterial({color:c,roughness:.52,metalness:0,sheen:.6,sheenColor:new THREE.Color(0xff9a80),sheenRoughness:.45,clearcoat:.12,clearcoatRoughness:.55,specularIntensity:.45,attenuationColor:new THREE.Color(0xc04030),thickness:.4,envMapIntensity:.75}));
const glossy=(c,r=.35,mt=0)=>M(c,{roughness:r,metalness:mt,env:1});
const IRC={};const IRIS=c=>IRC[c]||(IRC[c]=(()=>{const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext('2d');const col=new THREE.Color(c);const h='#'+col.getHexString();
 const gr=g.createRadialGradient(64,64,8,64,64,64);gr.addColorStop(0,'#000');gr.addColorStop(.34,'#000');gr.addColorStop(.38,'#'+col.clone().multiplyScalar(1.25).getHexString());gr.addColorStop(.55,h);gr.addColorStop(.8,'#'+col.clone().multiplyScalar(.6).getHexString());gr.addColorStop(.93,'#0c0806');gr.addColorStop(1,'#0c0806');g.fillStyle=gr;g.fillRect(0,0,128,128);
 g.globalAlpha=.25;for(let i=0;i<70;i++){const a=i/70*Math.PI*2;g.strokeStyle=i%2?'#fff':'#000';g.beginPath();g.moveTo(64+Math.cos(a)*22,64+Math.sin(a)*22);g.lineTo(64+Math.cos(a)*56,64+Math.sin(a)*56);g.stroke();}
 const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map:t,roughness:.4});})());
let CORM;const CORNEA=()=>CORM||(CORM=MOBILE?new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.08,roughness:0}):new THREE.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.12,roughness:0,clearcoat:1,clearcoatRoughness:0,specularIntensity:1,envMapIntensity:2,depthWrite:false}));
const SG={};const G=(k,f)=>SG[k]||(SG[k]=f());
window.dress=function(b,avIn){
 const av=Object.assign({},DEFAV,avIn||{});for(const k in AVSCHEMA)if(!AVSCHEMA[k].includes(av[k]))av[k]=DEFAV[k];
 b.head.scale.setScalar(av.build==='buff'?.88:av.face==='fem'?.95:1);b.av=av;const FEM=av.face==='fem',BUFF=av.build==='buff';const W={slim:.86,average:1,athletic:1.06,buff:1.3}[av.build]*(FEM?.9:1),AW={slim:.82,average:1,athletic:1.08,buff:1.5}[av.build]*(FEM?.82:1);
 for(let i=0;i<2;i++){const s=i?1:-1;b.arms[i].position.x=s*(.235*W+.02*AW);b.hips[i].position.x=s*.1*W*(FEM?1.05:1);}
 const LIMB=(k,P)=>G('L'+k,()=>{const g=new THREE.LatheGeometry(P.map(([r,y])=>new THREE.Vector2(r,y)),MOBILE?10:22);return g;});
 // sculpted muscle profile: top radius, belly radius, bottom radius, length, belly position
 const musc=(rt,rm,rb,len,bp=.35)=>{const P=[[0,0],[rt*.6,.012],[rt,.03]];for(let i=1;i<=10;i++){const u=i/10,y=-len*u;const bell=Math.exp(-Math.pow((u-bp)/.28,2));P.push([rt+(rb-rt)*u+(rm-Math.max(rt,rb))*bell*1.0+(rm>rt?0:0),y]);}P.push([rb*.6,-len-.012],[0,-len-.02]);return P.map(([r,y])=>[Math.max(r,.004),y]).reverse().map(([r,y])=>[r,y]);};
 const all=[b.root,b.torso,b.head,...b.arms,...b.elbows,...b.hips,...b.knees,b.decor];
 for(const g of all)for(const c of [...g.children])if(c.userData.av){g.remove(c);}
 const A=(geo,mat,x,y,z,p,sh=true)=>{const m=add(geo,mat,x,y,z,p,sh);m.userData.av=1;return m;};
 const O=cloth(hexc(av.outfit,0x556070)),O2=cloth(hexc(av.outfit2,0xd0c8b8)),SK=skinM(hexc(av.skin,0xe0b090)),HC=hexc(av.hair_color,0x3a2a20),HR=hairM(HC),
  dark=M(0x1a1614,{roughness:.6,metalness:0}),white=M(0xf8f6f2,{roughness:.25,metalness:0,env:1}),shoe=glossy(av.outfit_style==='athleisure'?0xf2f2f2:0x2a1e18,.45),pant=cloth({robe:0x2a2632,blazer:0x2a2c34,tee:0x2a2c30,athleisure:0x22262a,chef_coat:0x2a2a2c,cardigan:0x4a5a7a,explorer:0x6a5a40,sweater_vest:0x4a4038,work_vest:0x3a4a62,hoodie:0x3a3e48}[av.outfit_style]);
 const st=av.outfit_style,R=b.root,T=b.torso,H=b.head;const TAC=st==='tactical';
 // torso (soft jelly-bean)
 const TPk=FEM?'f':BUFF?'b':'m';const TP=(FEM?[[0,0],[.14,0],[.16,.05],[.15,.14],[.12,.28],[.135,.42],[.15,.5],[.14,.6],[.1,.67],[.04,.7],[0,.7]]:BUFF?[[0,0],[.13,0],[.145,.05],[.14,.2],[.17,.34],[.215,.5],[.22,.58],[.17,.66],[.06,.71],[0,.71]]:[[0,0],[.13,0],[.15,.04],[.155,.18],[.17,.36],[.185,.5],[.17,.6],[.12,.67],[.05,.7],[0,.7]]).map(([x,y])=>new THREE.Vector2(x,y));
 const bodyG=G('body'+TPk,()=>new THREE.LatheGeometry(TP,MOBILE?12:32));
 const top=st==='sweater_vest'||st==='work_vest'?O2:O;
 A(bodyG,top,0,-.02,0,T).scale.set(1.2*W,1,.85*W);
 if(BUFF)for(const s of[-1,1]){const p=A(G('pec',()=>new THREE.SphereGeometry(.1,18,12)),top,s*.085*W,.5,-.07*W,T);p.scale.set(1.1*W,.75,.6);}
 if(FEM)for(const s of[-1,1]){const p=A(G('bust',()=>new THREE.SphereGeometry(.07,16,12)),top,s*.055,.45,-.065,T);p.scale.set(.9,.72,.45);}
 for(const y of[.06,.12])A(G('fold',()=>new THREE.TorusGeometry(.15,.006,4,28)),top,0,y,0,T,false).scale.set(1.2*W*(FEM?.83:1),.85*W,1).constructor;T.children.slice(-2).forEach(m=>m.rotation.x=Math.PI/2);
 A(G('hipb',()=>new THREE.SphereGeometry(.15,18,12)),pant,0,-.02,0,R).scale.set((FEM?1.32:1.25)*W,.7,.95*W);
 if(st==='sweater_vest'||st==='work_vest'){const v=A(bodyG,O,0,.02,0,T);v.scale.set(1.24*W,.86,.89*W);}
 if(st==='blazer'){for(const s of[-1,1]){const l=A(G('lap',()=>new THREE.BoxGeometry(.06,.3,.02)),O,s*.06,.47,-.135*W,T);l.rotation.z=s*.35;l.rotation.x=-.12;}A(G('shirt',()=>new THREE.BoxGeometry(.1,.22,.02)),O2,0,.52,-.128*W,T);
}
 if(st==='chef_coat'){for(let i=0;i<3;i++)for(const s of[-1,1])A(G('btn',()=>new THREE.SphereGeometry(.012,8,6)),O2,s*.05,.25+i*.11,-.14*W,T);}
 if(st==='explorer'){for(const s of[-1,1])A(G('pock',()=>new THREE.BoxGeometry(.08,.08,.02)),O2,s*.08,.44,-.145*W,T);}
 if(st==='athleisure'){A(G('stripe',()=>new THREE.BoxGeometry(.02,.5,.005)),O2,.12*W,.32,-.13*W,T);}
 if(st==='hoodie'){const h=A(G('hood',()=>new THREE.TorusGeometry(.12,.05,8,18)),O,0,.66,.03,T);h.rotation.x=Math.PI/2;}
 if(st==='robe'){const RP=[[.17,.1],[.2,-.1],[.25,-.45],[.3,-.62],[0,-.62]].map(([x,y])=>new THREE.Vector2(x,y));const r=A(G('robe',()=>new THREE.LatheGeometry(RP,MOBILE?12:28,0,Math.PI*2)),O,0,0,0,R);r.scale.set(W,1,.85*W);
  {const bt=A(G('belt',()=>new THREE.TorusGeometry(.155,.018,6,26)),O2,0,.12,0,T);bt.scale.set(1.2*W,.85*W,1);bt.rotation.x=Math.PI/2;}
  for(let i=0;i<6;i++){const s=A(G('star',()=>new THREE.OctahedronGeometry(.018)),M(hexc(av.outfit2,0xd8b45a),{metalness:.8,roughness:.3,env:1.2}),Math.sin(i*2.1)*.17,-.1-(i%3)*.15,Math.cos(i*2.1)*.15,R,false);}}
 const BM0=M(0xeceae4,{roughness:.85,metalness:0});
 // neck + head
 A(G('neck',()=>new THREE.CylinderGeometry(.05,.06,.12,14)),SK,0,.72,0,T).scale.set(BUFF?1.7:FEM?.85:1,1,BUFF?1.5:FEM?.85:1);
 const hg=G('head',()=>new THREE.SphereGeometry(.2,MOBILE?18:36,MOBILE?14:28));A(hg,SK,0,.12,0,H).scale.set(FEM?.9:BUFF?1.02:1,FEM?1.1:1.05,.98);if(!FEM){const j=A(G('jaw',()=>new THREE.SphereGeometry(.15,24,16)),SK,0,.04,-.04,H);j.scale.set(BUFF?1.12:1,.75,1);}else{const j=A(G('chin',()=>new THREE.SphereGeometry(.12,24,16)),SK,0,.04,-.05,H);j.scale.set(.95,.8,1);}
 for(const s of[-1,1]){A(G('ear',()=>new THREE.SphereGeometry(.04,12,10)),SK,s*.195,.11,.01,H).scale.set(.5,1,.8);
  A(G('eyew',()=>new THREE.SphereGeometry(.042,18,14)),white,s*.072,.14,-.168,H).scale.set(FEM?1.08:1,FEM?1.12:1.05,.6);
  const ir=A(G('irisd',()=>new THREE.CircleGeometry(.029,28)),IRIS(hexc(av.eye_color,FEM?0x5a7a4a:0x4a3424)),s*.072,.136,-.1935,H,false);ir.rotation.y=Math.PI;
  A(G('glint',()=>new THREE.SphereGeometry(.0055,6,5)),new THREE.MeshBasicMaterial({color:0xffffff}),s*.072+.009,.147,-.197,H,false);
  if(av.expression==='stern')A(G('lid',()=>new THREE.SphereGeometry(.045,18,10,0,Math.PI*2,0,Math.PI*.24)),SK,s*.072,.143,-.166,H).rotation.x=-.15;
  if(FEM){const l=A(G('lash',()=>new THREE.TorusGeometry(.04,.005,4,16,Math.PI*.9)),M(0x0a0806,{roughness:.6}),s*.072,.142,-.19,H,false);l.rotation.z=Math.PI*.05;l.scale.y=.75;
   for(let q=0;q<3;q++){const f=A(G('flick',()=>new THREE.ConeGeometry(.004,.018,4)),M(0x0a0806,{roughness:.6}),s*(.072+.035)-s*q*.012,.172+q*.002,-.19,H,false);f.rotation.z=-s*(.9-q*.25);}}
  const br=A(G(FEM?'browf':'brow',()=>FEM?new THREE.CapsuleGeometry(.005,.05,3,6):new THREE.CapsuleGeometry(.01,.05,3,6)),av.beard==='wizard'?BM0:HR,s*.075,FEM?.208:.2,-.172,H,false);br.rotation.z=Math.PI/2+(av.expression==='stern'?-s*.32:s*(FEM?.22:.15));if(av.expression==='stern')br.position.y-=.012;}
 A(G('nose',()=>new THREE.SphereGeometry(.03,12,10)),SK,0,.09,-.198,H).scale.set(FEM?.72:BUFF?1.15:1,FEM?.8:.95,FEM?.75:.95);
 const LIP=FEM?new THREE.MeshPhysicalMaterial({color:0xb8505a,roughness:.32,clearcoat:.5,clearcoatRoughness:.3}):M(0x8a4a40,{roughness:.6});
 if(av.expression==='stern'){const rg=A(G('ridge',()=>new THREE.SphereGeometry(.1,18,10)),SK,0,.19,-.135,H);rg.scale.set(1.6,.32,.55);A(G('flat',()=>new THREE.CapsuleGeometry(.007,.06,3,6)),LIP,0,.045,-.2,H,false).rotation.z=Math.PI/2;}
 else if(FEM){for(const [y,sx,k] of[[.049,1,'ul'],[.039,.9,'ll']]){const l=A(G(k,()=>new THREE.SphereGeometry(.03,16,10)),LIP,0,y,-.19,H,false);l.scale.set(sx*.85,.24,.32);}
}
 else{const smile=A(G(av.expression==='calm'?'smc':'smile',()=>new THREE.TorusGeometry(av.expression==='calm'?.035:.05,.009,6,16,Math.PI)),LIP,0,.045,-.205,H,false);smile.rotation.z=Math.PI;smile.rotation.x=.25;}
 for(const s of[-1,1])A(G('cheek',()=>new THREE.CircleGeometry(.025,12)),new THREE.MeshBasicMaterial({color:0xe07a6a,transparent:true,opacity:FEM?.3:.18,depthWrite:false}),s*.12,.08,-.172,H,false).rotation.y=Math.PI+s*.5;
 // hair
 const hz=FEM&&av.hair==='long'?'long_waves':FEM&&av.hair==='ponytail'?'sleek_ponytail':av.hair;
 if(hz!=='bald'){const cap=G('hcap'+hz,()=>new THREE.SphereGeometry(.208,MOBILE?16:30,14,0,Math.PI*2,0,hz==='buzz'||hz==='high_tight'?Math.PI*.36:Math.PI*.44));const h=A(cap,HR,0,.13,.015,H);h.rotation.x=FEM?.62:.42;if(FEM)for(const s of[-1,1]){const t=A(G('temple',()=>new THREE.SphereGeometry(.09,14,10)),HR,s*.15,.2,-.06,H);t.scale.set(.55,1,.9);}h.scale.set(1.02,1.05,1.02);
  if(hz==='side_part'){const q=A(G('quiff',()=>new THREE.SphereGeometry(.1,14,10)),HR,.05,.3,-.08,H);q.scale.set(1.4,.5,1);}
  if(hz==='short'){const q=A(G('quiff2',()=>new THREE.SphereGeometry(.09,14,10)),HR,0,.3,-.1,H);q.scale.set(1.5,.45,1);}
  if(hz==='curly')for(let i=0;i<14;i++){const a=i/14*Math.PI*2;A(G('curl',()=>new THREE.SphereGeometry(.06,10,8)),HR,Math.cos(a)*.18,.22+Math.sin(i*1.7)*.05,Math.sin(a)*.17+.02,H);}
  if(hz==='long'){const l=A(G('long',()=>new THREE.CylinderGeometry(.2,.22,.3,20,1,true,-Math.PI*.15,Math.PI*1.3)),HR,0,.02,.02,H);l.rotation.y=Math.PI*.5+Math.PI;}
  if(hz==='ponytail'){const p=A(G('pony',()=>new THREE.CapsuleGeometry(.045,.18,4,10)),HR,0,.12,.23,H);p.rotation.x=.5;}
  if(hz==='bun'){A(G('bun',()=>new THREE.SphereGeometry(.075,18,14)),HR,0,.28,.17,H);A(G('bunr',()=>new THREE.TorusGeometry(.06,.012,6,18)),HR,0,.26,.13,H).rotation.x=.9;}
  if(hz==='high_tight')h.scale.set(1.0,1.18,1.0);
  if(FEM&&hz!=='buzz'){const sw=A(G('sweep',()=>new THREE.SphereGeometry(.12,18,12)),HR,.05,.285,-.1,H);sw.scale.set(1.15,.3,.75);sw.rotation.z=-.3;}
  if(hz==='long_waves'){for(let i=0;i<11;i++){const a=Math.PI*.1+i/10*Math.PI*.8,x=Math.cos(a)*.2,z=Math.sin(a)*.17+.03;const w=A(G('wave',()=>{const c=new THREE.CatmullRomCurve3([0,1,2,3,4].map(j=>new THREE.Vector3(Math.sin(j*1.4)*.018,-j*.1,Math.cos(j*1.4)*.01)));return new THREE.TubeGeometry(c,24,.045,8);}),HR,x*1.05,.24,z,H);w.rotation.y=-a+Math.PI/2;w.scale.set(1,1.05,1);}
   for(const s of[-1,1]){const f=A(G('lock',()=>{const c=new THREE.CatmullRomCurve3([0,1,2,3].map(j=>new THREE.Vector3(Math.sin(j*1.5)*.015,-j*.11,0)));return new THREE.TubeGeometry(c,20,.035,8);}),HR,s*.18,.22,-.08,H);}}
  if(hz==='bob'){{const bb=A(G('bob3',()=>new THREE.SphereGeometry(.222,32,16,Math.PI*1.72,Math.PI*1.56,Math.PI*.2,Math.PI*.62)),HR,0,.13,.015,H);bb.scale.set(1.02,1.05,1.04);}for(const s of[-1,1]){const t=A(G('bobt',()=>new THREE.SphereGeometry(.04,10,8)),HR,s*.2,-.02,-.08,H);t.scale.set(.8,.6,1.4);}}
  if(hz==='sleek_ponytail'){h.scale.set(1.0,1.02,1.0);A(G('pband',()=>new THREE.TorusGeometry(.03,.01,6,12)),dark,0,.24,.21,H).rotation.x=.6;
   A(G('spony',()=>{const c=new THREE.CatmullRomCurve3([[0,0,0],[0,-.06,.06],[0,-.2,.08],[0,-.36,.05],[.01,-.48,.02]].map(p=>new THREE.Vector3(...p)));const g=new THREE.TubeGeometry(c,30,.04,10);const p=g.attributes.position;return g;}),HR,0,.24,.22,H);}}
 if(!MOBILE&&hz!=='bald'&&hz!=='buzz'&&hz!=='high_tight'){const CM2=cardM(new THREE.Color(HC).multiplyScalar(.7).getHex());const n=FEM?36:18,L=hz==='long_waves'?.5:hz==='bob'?.3:FEM?.26:.14;const cg=G('card'+L,()=>{const g=new THREE.PlaneGeometry(.06,L,1,4);g.translate(0,-L/2,0);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setZ(i,(y*y)*.15-y*.04);}g.computeVertexNormals();return g;});
  for(let i=0;i<n;i++){const a=(i/n)*Math.PI*2;const back=Math.cos(a);if(back<.15&&!(hz==='bob'||hz==='long_waves'))continue;if(back<-.3)continue;const r=.2,cx=Math.sin(a)*r,cz=Math.cos(a)*r*.95+.015;const m=A(cg,CM2,cx,.2+(back<0?.04:0),cz,H,false);m.rotation.y=a;m.rotation.x=-.12-(back<0?.15:0);m.rotation.z=(i%3-1)*.06;}}
 // beard
 const bd=av.beard,BM=M(bd==='wizard'?0xeceae4:HC,{roughness:.85,metalness:0});
 if(bd==='full'){const f=A(G('beardf',()=>new THREE.SphereGeometry(.19,24,16,0,Math.PI*2,Math.PI*.58,Math.PI*.36)),BM,0,.075,-.02,H);f.scale.set(1.1,1.15,1.1);A(G('must',()=>new THREE.CapsuleGeometry(.018,.07,3,8)),BM,0,.035,-.19,H).rotation.z=Math.PI/2;}
 if(bd==='stubble'){const f=A(G('beards',()=>new THREE.SphereGeometry(.201,24,16,Math.PI*.95,Math.PI*1.1,Math.PI*.5,Math.PI*.33)),new THREE.MeshStandardMaterial({color:HC,transparent:true,opacity:.35,roughness:1,depthWrite:false}),0,.12,0,H,false);}
 if(bd==='goatee'){A(G('goat',()=>new THREE.SphereGeometry(.035,10,8)),BM,0,.0,-.185,H).scale.set(1,1.3,.7);A(G('must',()=>new THREE.CapsuleGeometry(.018,.07,3,8)),BM,0,.07,-.195,H).rotation.z=Math.PI/2;}
 if(bd==='wizard'){const c=A(G('wbeard',()=>new THREE.ConeGeometry(.13,.42,16)),BM,0,-.1,-.12,H);c.rotation.x=Math.PI+.25;A(G('must',()=>new THREE.CapsuleGeometry(.018,.07,3,8)),BM,0,.07,-.195,H).rotation.z=Math.PI/2;}
 // hats
 const hat=av.hat,HM2=cloth(hexc(av.outfit2,0xd0c8b8));
 if(hat==='wizard'){A(G('wbrim',()=>new THREE.CylinderGeometry(.33,.33,.02,32)),O,0,.27,0,H);const c=A(G('wcone',()=>new THREE.ConeGeometry(.2,.55,28)),O,0,.55,.04,H);c.rotation.x=-.18;
  for(let i=0;i<5;i++)A(G('star',()=>new THREE.OctahedronGeometry(.018)),M(hexc(av.outfit2,0xd8b45a),{metalness:.8,roughness:.3,env:1.2}),Math.sin(i*1.9)*.12,.38+i*.06,Math.cos(i*1.9)*.1-.02,H,false);}
 if(hat==='chef'){A(G('ctube',()=>new THREE.CylinderGeometry(.19,.18,.14,24)),white,0,.32,0,H);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;A(G('puff',()=>new THREE.SphereGeometry(.11,14,10)),white,Math.cos(a)*.11,.45,Math.sin(a)*.11,H);}A(G('puff',()=>new THREE.SphereGeometry(.11,14,10)),white,0,.5,0,H);}
 if(hat==='hard_hat'){const hm=glossy(0xffd60a,.3);A(G('hh',()=>new THREE.SphereGeometry(.225,24,12,0,Math.PI*2,0,Math.PI/2)),hm,0,.17,0,H);const br=A(G('hhb',()=>new THREE.CylinderGeometry(.25,.25,.02,28)),hm,0,.18,-.03,H);br.scale.z=1.1;A(G('hhr',()=>new THREE.BoxGeometry(.04,.03,.4)),hm,0,.39,0,H);}
 if(hat==='explorer'){const hm=cloth(0xc8b080);A(G('eb',()=>new THREE.CylinderGeometry(.34,.34,.02,32)),hm,0,.26,0,H);A(G('ec',()=>new THREE.SphereGeometry(.2,24,12,0,Math.PI*2,0,Math.PI/2)),hm,0,.25,0,H).scale.y=.8;A(G('eband',()=>new THREE.CylinderGeometry(.203,.203,.04,24,1,true)),M(0x4a3020,{roughness:.7}),0,.28,0,H);}
 if(hat==='cap'){A(G('cc',()=>new THREE.SphereGeometry(.212,24,12,0,Math.PI*2,0,Math.PI/2)),HM2,0,.17,0,H);const v=A(G('cv',()=>new THREE.CylinderGeometry(.14,.14,.015,20,1,false,0,Math.PI)),HM2,0,.19,-.16,H);v.rotation.y=Math.PI/2;}
 if(hat==='beanie'){A(G('bn',()=>new THREE.SphereGeometry(.215,24,12,0,Math.PI*2,0,Math.PI*.55)),HM2,0,.15,0,H).scale.y=1.15;}
 if(hat==='headband'){const h=A(G('hb',()=>new THREE.TorusGeometry(.2,.018,8,30)),HM2,0,.24,0,H);h.rotation.x=Math.PI/2+.25;}
 if(hat==='crown'){const cm=glossy(0xe0b040,.25,1);A(G('cr',()=>new THREE.CylinderGeometry(.17,.16,.08,8,1,true)),cm,0,.33,0,H);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;A(G('crp',()=>new THREE.ConeGeometry(.025,.07,6)),cm,Math.cos(a)*.165,.4,Math.sin(a)*.165,H);}}
 // accessories
 const ac=av.accessory;
 if(ac==='glasses'||ac==='safety_glasses'){const gm2=ac==='glasses'?glossy(0x2a1a12,.3):new THREE.MeshPhysicalMaterial({color:0xfff0b0,transmission:MOBILE?0:.6,transparent:true,opacity:.45,roughness:.1});
  for(const s of[-1,1]){const r=A(ac==='glasses'?G('lens',()=>new THREE.TorusGeometry(.045,.007,6,20)):G('sglen',()=>new THREE.BoxGeometry(.11,.06,.01)),gm2,s*.072,.14,-.215,H,false);}
  if(ac==='glasses')A(G('bridge',()=>new THREE.BoxGeometry(.04,.006,.006)),gm2,0,.15,-.215,H,false);}
 if(ac==='headset'){A(G('hs',()=>new THREE.TorusGeometry(.215,.012,6,24,Math.PI)),dark,0,.12,.01,H);for(const s of[-1,1])A(G('cup2',()=>new THREE.CylinderGeometry(.055,.055,.04,16)),glossy(hexc(av.outfit,0x7a5a9a),.4),s*.205,.12,0,H).rotation.z=Math.PI/2;
  const mic=A(G('boom',()=>new THREE.CapsuleGeometry(.007,.15,3,6)),dark,-.16,.04,-.12,H);mic.rotation.x=1.2;mic.rotation.z=.5;}
 if(ac==='binoculars'){for(const s of[-1,1])A(G('bino',()=>new THREE.CylinderGeometry(.03,.034,.09,14)),dark,s*.04,.42,-.17*W,T);A(G('strap',()=>new THREE.TorusGeometry(.13,.006,4,24,Math.PI)),M(0x4a3020),0,.47,-.04,T).rotation.z=0;}
 if(ac==='tie'){A(G('tie',()=>new THREE.BoxGeometry(.04,.22,.015)),cloth(0x8a2a2a),0,.5,-.15*W,T);}
 if(ac==='scarf'){const s=A(G('scarf',()=>new THREE.TorusGeometry(.085,.035,8,20)),HM2,0,.68,0,T);s.rotation.x=Math.PI/2;A(G('scarft',()=>new THREE.BoxGeometry(.06,.2,.03)),HM2,.05,.56,-.13*W,T);}
 if(ac==='tool_belt'||st==='work_vest'){{const tb=A(G('tb',()=>new THREE.TorusGeometry(.17,.025,6,28)),M(0x5a3a1e,{roughness:.7}),0,.02,0,R);tb.scale.set(1.2*W,.9*W,1);tb.rotation.x=Math.PI/2;}for(const s of[-1,1])A(G('pouch',()=>new THREE.BoxGeometry(.08,.1,.06)),M(0x6a4422,{roughness:.75}),s*.18*W,-.04,-.07,R);
  if(st==='work_vest')for(const y of[.25,.4])A(G('refl',()=>new THREE.BoxGeometry(.36,.02,.3)),M(0xd8d8d0,{roughness:.2,metalness:.4,env:1.4}),0,y,0,T).scale.set(W,1,W);}

 if(ac==='plate_carrier'){const pc=cloth(0x3a3a30);for(const z of[-1,1]){const p=A(G('plate',()=>new RoundedBoxGeometry(.3,.32,.05,2,.02)),pc,0,.43,z*.15*W,T);p.scale.x=W;for(let r=0;r<3;r++)A(G('molle',()=>new THREE.BoxGeometry(.26,.012,.012)),M(0x22221c,{roughness:.9}),0,.36+r*.05,z*(.15*W+.027),T,false).scale.x=W;}
  for(const s of[-1,1])A(G('pstrap',()=>new THREE.BoxGeometry(.06,.03,.32)),pc,s*.09*W,.64,0,T).scale.z=W;for(const s of[-1,1])A(G('mag',()=>new RoundedBoxGeometry(.06,.1,.04,2,.01)),pc,s*.07*W,.32,-.15*W-.04,T);}
 if(av.patch!=='none'){const z=-(ac==='plate_carrier'?.15*W+.032:.15*W+.006),px=-.075*W,py=ac==='plate_carrier'?.535:.53;const pm=av.patch==='cross'?M(0xf2ead8,{roughness:.55,emissive:0x2a2418}):av.patch==='flag'?M(0x9a9a86,{roughness:.8}):M(0xe8e4d0,{roughness:.6});
  A(G('patchbg2',()=>new THREE.BoxGeometry(.105,.09,.008)),M(0x7a6a48,{roughness:.95}),px,py,z,T,false);A(G('patchbd',()=>new THREE.BoxGeometry(.113,.098,.004)),M(0x3a3424,{roughness:.9}),px,py,z+.003,T,false);
  if(av.patch==='cross'){A(G('pcv2',()=>new THREE.BoxGeometry(.016,.07,.006)),pm,px,py-.002,z-.006,T,false);A(G('pch2',()=>new THREE.BoxGeometry(.046,.016,.006)),pm,px,py+.012,z-.006,T,false);}else A(G('p2'+av.patch,()=>av.patch==='star'?new THREE.OctahedronGeometry(.026):new THREE.BoxGeometry(.08,.05,.006)),pm,px,py,z-.006,T,false);}
 if(ac==='leaf_pin'){const l=A(G('leafp',()=>new THREE.SphereGeometry(.03,8,6)),glossy(0x5fae5a,.4),.09*W,.5,-.15*W,T);l.scale.set(.5,1,.3);l.rotation.z=-.5;}
 if(ac==='cross_pin'){const g=glossy(0xc9a86a,.25,1);A(G('cpv',()=>new THREE.BoxGeometry(.012,.045,.008)),g,.09*W,.52,-.158*W,T);A(G('cph',()=>new THREE.BoxGeometry(.03,.012,.008)),g,.09*W,.53,-.158*W,T);}
 // arms & legs
 const sleeve=st==='tee'||st==='athleisure'?null:(st==='sweater_vest'||st==='work_vest'?O2:O);
 for(let i=0;i<2;i++){const sh=b.arms[i],el=b.elbows[i],s=i?1:-1;
  A(G('shb',()=>new THREE.SphereGeometry(.085,14,10)),sleeve||O,0,0,0,sh).scale.setScalar(FEM?.72:AW*.9);
  const bare=st==='tee'||TAC||st==='athleisure'&&FEM;
  A(LIMB('ua'+AW,musc(.062*AW,.074*AW,.05*AW,.31,.35)),bare?SK:(sleeve||O),0,0,0,sh);
  if(bare){A(G('tsl'+AW,()=>new THREE.CylinderGeometry(.085*AW,.08*AW,FEM?.07:.12,16)),O,0,-.04,0,sh);A(G('cuff'+AW,()=>new THREE.TorusGeometry(.08*AW,.008,4,18)),O,0,FEM?-.075:-.1,0,sh,false).rotation.x=Math.PI/2;}
  A(LIMB('fa'+AW,musc(.05*AW,.058*AW,.036*AW,.27,.25)),sleeve&&st!=='chef_coat'&&!bare?sleeve:(st==='chef_coat'?O:SK),0,.02,0,el);
  if(!bare&&sleeve)A(G('scuf'+AW,()=>new THREE.TorusGeometry(.043*AW,.008,4,16)),sleeve,0,-.22,0,el,false).rotation.x=Math.PI/2;
  const hs=FEM?.85:BUFF?1.15:1;const palm=A(G('palm',()=>new RoundedBoxGeometry(.075,.08,.035,2,.015)),SK,0,-.29,0,el);palm.scale.setScalar(hs);
  for(let f=0;f<4;f++){const fg=A(G('fing',()=>new THREE.CapsuleGeometry(.0105,.042,3,6)),SK,(f-1.5)*.018*hs,-.355*hs-.01*(f===0||f===3?-1:0)+(-.29+.29*hs),-.008,el);fg.rotation.x=-.35;fg.scale.setScalar(hs*(f===3?.85:1));}
  const th=A(G('thumb',()=>new THREE.CapsuleGeometry(.012,.032,3,6)),SK,-s*.042*hs,-.29,-.022,el);th.rotation.z=-s*.6;th.rotation.x=-.4;
  if((TAC||av.accessory==='watch')&&i===0){A(G('watch',()=>new THREE.CylinderGeometry(.04*AW,.04*AW,.022,16,1,true)),dark,0,-.225,0,el);A(G('wface',()=>new THREE.CylinderGeometry(.02,.02,.012,16)),glossy(0x222428,.2,.8),0,-.225,-.04*AW,el).rotation.x=Math.PI/2;}
  const hp=b.hips[i],kn=b.knees[i];const legM=st==='robe'?pant:pant;
  const LW=W*(FEM?.92:1);const legM2=TAC?cloth(0x4a4a3c):legM;
  A(LIMB('th'+LW,musc(.085*LW,.092*LW,.06*LW,.42,.3)),legM2,0,0,0,hp);
  A(LIMB('sh'+LW,musc(.06*LW,.068*LW,.042*LW,.41,.3)),legM2,0,.01,0,kn);
  A(G('knee'+LW,()=>new THREE.SphereGeometry(.062*LW,14,10)),legM2,0,0,0,kn);
  if(TAC){A(G('cargo',()=>new RoundedBoxGeometry(.06,.1,.08,2,.01)),legM2,s*.08*LW,-.25,-.01,hp);A(G('boot',()=>new THREE.CylinderGeometry(.058,.062,.14,14)),glossy(0x1a1714,.55),0,-.36,0,kn);}
  const f=A(G(FEM?'shoef':TAC?'shoet':'shoe',()=>new RoundedBoxGeometry(FEM?.1:TAC?.14:.13,FEM?.06:.09,FEM?.2:.25,2,.03)),TAC?glossy(0x1a1714,.55):shoe,0,-.43,-.035,kn);
  if(av.outfit_style==='athleisure')A(G('sole',()=>new THREE.BoxGeometry(.112,.018,.2)),M(0xffffff,{roughness:.6}),0,-.462,-.035,kn);}
 // held prop in left hand (elbows[0]); mug goes in right
 const P=b.elbows[0],pr=av.prop;
 if(pr==='staff'){A(G('staff',()=>new THREE.CylinderGeometry(.018,.024,1.5,10)),PBRW(),0,-.25,-.02,P);const orb=A(G('orb',()=>new THREE.SphereGeometry(.055,20,14)),new THREE.MeshStandardMaterial({color:0x9ab8ff,emissive:0x5a7aff,emissiveIntensity:.9,roughness:.1}),0,.52,-.02,P,false);}
 if(pr==='bible'){A(G('bib',()=>new THREE.BoxGeometry(.13,.17,.04)),M(0x3a1a14,{roughness:.55}),0,-.33,-.05,P);A(G('bibp',()=>new THREE.BoxGeometry(.122,.162,.042)),M(0xf2ead8,{roughness:.8}),.004,-.33,-.05,P);A(G('bibc',()=>new THREE.BoxGeometry(.02,.06,.002)),glossy(0xd4af5a,.2,1),0,-.32,-.073,P,false);A(G('bibc2',()=>new THREE.BoxGeometry(.045,.015,.002)),glossy(0xd4af5a,.2,1),0,-.305,-.073,P,false);}
 if(pr==='water_bottle'){A(G('wb',()=>new THREE.CylinderGeometry(.035,.035,.2,16)),glossy(hexc(av.outfit2,0xd8e8d0),.25,.6),0,-.33,-.04,P);A(G('wbc',()=>new THREE.CylinderGeometry(.028,.033,.04,14)),dark,0,-.21,-.04,P);}
 if(pr==='shopping_bags'){for(const [x,c] of[[-.02,0xe85a8a],[.06,0x5ab8e8]]){A(G('bag',()=>new THREE.BoxGeometry(.16,.2,.08)),cloth(c),x,-.48,-.02,P);A(G('bagh',()=>new THREE.TorusGeometry(.05,.006,4,14,Math.PI)),dark,x,-.38,-.02,P,false);}}
 if(pr==='binoculars'){for(const s of[-1,1])A(G('bino',()=>new THREE.CylinderGeometry(.03,.034,.09,14)),dark,s*.035,-.32,-.04,P);}
 if(pr==='quill'){const q=A(G('quill',()=>new THREE.ConeGeometry(.025,.24,8)),M(0xf4f0e8,{roughness:.7}),0,-.22,-.04,P);q.rotation.x=.3;}
 if(pr==='wrench'){const w=A(G('wr',()=>new THREE.BoxGeometry(.025,.24,.012)),METAL,0,-.38,-.03,P);A(G('wrh',()=>new THREE.TorusGeometry(.03,.012,6,12,Math.PI*1.5)),METAL,0,-.5,-.03,P);}
 if(pr==='spatula'){A(G('sph',()=>new THREE.CylinderGeometry(.01,.01,.22,8)),M(0x3a2414),0,-.36,-.03,P);A(G('spb',()=>new THREE.BoxGeometry(.07,.09,.008)),METAL,0,-.5,-.03,P);}
 if(pr==='notebook'){A(G('nb',()=>new THREE.BoxGeometry(.12,.16,.025)),cloth(hexc(av.outfit,0x7a5a9a)),0,-.33,-.05,P);}
 if(pr==='coffee'){A(G('cof',()=>new THREE.CylinderGeometry(.04,.032,.11,14)),glossy(hexc(av.mug,0x111111),.35),0,-.33,-.04,P);}
 if(pr==='dumbbell'){const d=A(G('dbb',()=>new THREE.CylinderGeometry(.012,.012,.18,8)),METAL,0,-.3,-.03,P);d.rotation.z=Math.PI/2;for(const s of[-1,1])A(G('dbw',()=>new THREE.CylinderGeometry(.04,.04,.04,12)),dark,s*.08,-.3,-.03,P).rotation.z=Math.PI/2;}
 b.cup.material=glossy(hexc(av.mug,0xe8e0d0),.35);
 // desk decor
 const D=b.decor,dy=b.deskY,X=[-.55,-.78,.35];
 A(G('dmug',()=>new THREE.CylinderGeometry(.04,.034,.09,14)),glossy(hexc(av.mug,0xe8e0d0),.35),.45,dy+.05,.2,D);
 (av.decor||[]).slice(0,3).forEach((it,j)=>{const x=X[j],y=dy,z=-.1+j*.12;
  if(it==='plant'){A(G('dp',()=>new THREE.CylinderGeometry(.05,.04,.08,12)),TERRA,x,y+.04,z,D);for(let i=0;i<5;i++){const l=A(G('dpl',()=>new THREE.SphereGeometry(.04,8,6)),M(0x4a7a3a,{roughness:.6}),x+Math.cos(i*1.3)*.03,y+.12+i*.01,z+Math.sin(i*1.3)*.03,D);l.scale.set(.5,1.4,.3);l.rotation.z=Math.cos(i*1.3)*.6;}}
  if(it==='books')for(let i=0;i<3;i++)A(G('db'+i,()=>new THREE.BoxGeometry(.18,.035,.13)),M([0x7a2a22,0x2a4a6a,0x4a6a3a][i],{roughness:.7}),x,y+.018+i*.036,z,D).rotation.y=i*.2;
  if(it==='candle'){A(G('dc',()=>new THREE.CylinderGeometry(.025,.025,.09,12)),M(0xf2e8d0,{roughness:.6}),x,y+.045,z,D);A(G('dcf',()=>new THREE.SphereGeometry(.012,8,6)),new THREE.MeshBasicMaterial({color:0xffc070}),x,y+.105,z,D,false).scale.y=1.6;}
  if(it==='trophy'){const g=glossy(0xd4af37,.2,1);A(G('tb2',()=>new THREE.BoxGeometry(.06,.03,.06)),dark,x,y+.015,z,D);A(G('tcup',()=>new THREE.CylinderGeometry(.04,.015,.08,12)),g,x,y+.09,z,D);}
  if(it==='photo'){const p=A(G('ph',()=>new THREE.BoxGeometry(.12,.15,.015)),M(0x3a2414,{roughness:.5}),x,y+.075,z,D);p.rotation.x=-.2;p.rotation.y=.3;}
  if(it==='globe'){A(G('gl',()=>new THREE.SphereGeometry(.07,16,12)),M(0x3a7aa8,{roughness:.4}),x,y+.11,z,D);A(G('glb',()=>new THREE.CylinderGeometry(.03,.04,.04,10)),M(0x6a4a2a),x,y+.02,z,D);}
  if(it==='dumbbell'){const d=A(G('dbb',()=>new THREE.CylinderGeometry(.012,.012,.18,8)),METAL,x,y+.04,z,D);d.rotation.z=Math.PI/2;for(const s of[-1,1])A(G('dbw',()=>new THREE.CylinderGeometry(.04,.04,.04,12)),dark,x+s*.08,y+.04,z,D).rotation.z=Math.PI/2;}
  if(it==='cactus'){A(G('dp',()=>new THREE.CylinderGeometry(.05,.04,.08,12)),TERRA,x,y+.04,z,D);A(G('cac',()=>new THREE.CapsuleGeometry(.03,.08,4,8)),M(0x5a8a4a,{roughness:.7}),x,y+.15,z,D);}
  if(it==='crystal_ball'){A(G('cb',()=>new THREE.SphereGeometry(.06,20,14)),MOBILE?M(0xb8c8ff,{roughness:.05,transparent:true,opacity:.6}):new THREE.MeshPhysicalMaterial({color:0xd8e0ff,transmission:.9,roughness:.02,thickness:.1,emissive:0x3a4aa0,emissiveIntensity:.3}),x,y+.09,z,D);A(G('cbs',()=>new THREE.CylinderGeometry(.04,.05,.03,10)),glossy(0xb08850,.3,1),x,y+.015,z,D);}
  if(it==='herbs'){A(G('hb2',()=>new THREE.BoxGeometry(.2,.06,.07)),TERRA,x,y+.03,z,D);for(let i=0;i<6;i++)A(G('hbl',()=>new THREE.SphereGeometry(.025,6,5)),M(0x5a9a4a,{roughness:.6}),x-.08+i*.032,y+.08,z,D);}
  if(it==='map'){A(G('map',()=>new THREE.BoxGeometry(.22,.004,.16)),M(0xd8c8a0,{roughness:.9}),x,y+.003,z,D).rotation.y=.3;}
  if(it==='toolbox'){A(G('tbx',()=>new THREE.BoxGeometry(.2,.09,.1)),glossy(0xc03a2a,.4,.3),x,y+.045,z,D);}
  if(it==='pennant'){const p=A(G('pen2',()=>new THREE.ConeGeometry(.04,.16,3)),cloth(hexc(av.outfit,0xe8845a)),x,y+.2,z,D);p.rotation.z=Math.PI/2;A(G('penp',()=>new THREE.CylinderGeometry(.005,.005,.25)),dark,x-.08,y+.125,z,D);}
  if(it==='headphones'){const h=A(G('hph',()=>new THREE.TorusGeometry(.07,.01,6,18,Math.PI)),dark,x,y+.07,z,D);for(const s of[-1,1])A(G('hpc',()=>new THREE.CylinderGeometry(.03,.03,.025,12)),dark,x+s*.07,y+.03,z,D).rotation.z=Math.PI/2;}
 });
 for(const g of all)g.traverse(o=>{if(o.isMesh&&o.userData.av&&MOBILE)o.castShadow=false;});
}
let PBRWm;const PBRW=()=>PBRWm||(PBRWm=WOODD);
let AVS={},AVK='';var SRD=window.SRD=[];
window.loadAvatars=async function(){try{const r=await fetch('../avatars.json?'+Date.now(),{cache:'no-store'});if(!r.ok)return;const j=await r.json();window.__av=j;for(const id in bots){const s=JSON.stringify(j[id]||{});if(bots[id].avk!==s){bots[id].avk=s;window.dress(bots[id],j[id]);}}AVS=j;}catch(e){console.warn('avatars',e);}}
IDS.forEach((id,idx)=>{const m=BOTS_META[id];const[dx,dz,yaw]=DESK[id];
 const desk=new THREE.Group();desk.position.set(dx,0,dz);desk.rotation.y=yaw;sc.add(desk);const off=id==='merlin'?-.9:0,deskY=id==='merlin'?1.1:.76;
 if(id!=='merlin'){box(1.9,.05,1,WOODM,0,.735,0,null,desk);box(1.86,.04,.96,WOODD,0,.69,0,null,desk);for(const sx of[-.85,.85])box(.06,.68,.9,METAL,sx,.34,0,null,desk);box(1.64,.3,.03,WOODD,0,.52,.42,null,desk);}
 box(.06,.35,.06,0x222,0,deskY+.17,-.3+off,{metalness:.8},desk);box(1.1,.68,.05,0x0a0a10,0,deskY+.65,-.32+off,{metalness:.5},desk);
 const scr=new THREE.Mesh(scrGeo,new THREE.MeshBasicMaterial({color:SC.idle,toneMapped:false}));scr.position.set(0,deskY+.65,-.29+off);desk.add(scr);
 const kb1=box(.5,.025,.17,0x2a2826,0,deskY+.015,.1+off,{roughness:.5},desk),kb2=box(.46,.008,.13,0x4a4642,0,deskY+.03,.1+off,{roughness:.8},desk);SRD.push({desk,deskY,off,id,kb:[kb1,kb2]});{const ms=add(new THREE.SphereGeometry(.035,10,8),M(0x2a2826),.38,deskY+.015,.12+off,desk);ms.scale.set(1,.5,1.4);SRD[SRD.length-1].ms=ms;SRD[SRD.length-1].idx=idx;}
 if(id!=='merlin'){blob(2.3,1.6,0,.2,desk);const mug=add(new THREE.CylinderGeometry(.045,.04,.1,14),M([0xd8d0c0,0xa0583a,0x5a7a5a][idx%3],{roughness:.4}),-.62,deskY+.05,.2,desk);const mh=add(new THREE.TorusGeometry(.03,.008,6,12),mug.material,-.575,deskY+.05,.2,desk);mh.rotation.y=Math.PI/2;SRD[SRD.length-1].mug=[mug,mh];
  for(let j=0;j<2+idx%2;j++)box(.32,.05,.22,[0x7a3a2a,0x3a5a4a,0xc8a070][j],-.72,deskY+.03+j*.05,-.25,{roughness:.8},desk).rotation.y=j*.2;
  if(idx%2===0&&!MOBILE)LAMPS.push([desk,deskY]);
  if(idx%2===0&&MOBILE){add(new THREE.CylinderGeometry(.07,.08,.03,14),M(0x2a2826,{metalness:.6}),.78,deskY+.015,-.3,desk);const ar=add(new THREE.CylinderGeometry(.01,.01,.42,6),M(0x2a2826,{metalness:.6}),.74,deskY+.22,-.3,desk);ar.rotation.z=.25;
   const sh=add(new THREE.ConeGeometry(.09,.12,14,1,true),M(0x6a5a40,{side:THREE.DoubleSide,roughness:.5}),.66,deskY+.43,-.3,desk);sh.rotation.z=.5;add(new THREE.SphereGeometry(.03,8,6),new THREE.MeshBasicMaterial({color:0xffd9a0}),.65,deskY+.4,-.3,desk,false);}
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,deskY+.4,-.36),new THREE.Vector3(.05,deskY+.03,-.44),new THREE.Vector3(.4,deskY+.01,-.47),new THREE.Vector3(.5,.02,-.4),new THREE.Vector3(.7,.01,-.2)]),20,.01,5),M(0x1a1a1a,{roughness:.6}),0,0,0,desk,false);}
 const glow=new THREE.PointLight(SC.idle,0,2.5,2);glow.position.set(0,deskY+.7,off);
 const pi={jr:0x7a1f1f,quill:0xffffff,scout:0x333,sage:0x3fae5a,ness:0xe0409a,shoppy:0xc8a060,mick:0xffffff,manny:0xf2c230,jocko:0x222}[id];if(pi!==undefined)box(.25,.25,.25,pi,.7,deskY+.13,0,{},desk);
 if(id!=='merlin'){if(MOBILE){box(.5,.08,.5,LEATH,0,.44,.85,null,desk);box(.06,.42,.06,0x2a2a2a,0,.21,.85,{metalness:.8,roughness:.3},desk);box(.5,.5,.07,LEATH,0,.75,1.1,null,desk);}else CHAIRS.push(desk);}
 const grp=new THREE.Group();const root=new THREE.Group();root.position.y=.92;grp.add(root);
 const torso=new THREE.Group();torso.position.y=.08;root.add(torso);
 const head=new THREE.Group();head.position.y=.78;torso.add(head);
 const arms=[],elbows=[],hips=[],knees=[];const BW=BUILD[id]||1;
 for(const s of[-1,1]){const sh=new THREE.Group();sh.position.set(s*.25*BW,.56,0);torso.add(sh);const el=new THREE.Group();el.position.y=-.3;sh.add(el);arms.push(sh);elbows.push(el);
  const hp=new THREE.Group();hp.position.set(s*.1*BW,-.06,0);root.add(hp);const kn=new THREE.Group();kn.position.y=-.42;hp.add(kn);hips.push(hp);knees.push(kn);}
 const cup=add(new THREE.CylinderGeometry(.04,.032,.1,12),M(0xe8e0d0,{roughness:.4}),0,-.33,-.03,elbows[1]);cup.visible=false;
 const decor=new THREE.Group();desk.add(decor);
 grp.scale.setScalar(.95);
 const bc=document.createElement('canvas');bc.width=512;bc.height=136;const btex=new THREE.CanvasTexture(bc);btex.colorSpace=THREE.SRGBColorSpace;const bubble=new THREE.Sprite(new THREE.SpriteMaterial({map:btex,transparent:true,toneMapped:false,depthWrite:false,depthTest:false}));bubble.renderOrder=10;bubble.scale.set(1.9,.505,1);bubble.position.y=2.9;blob(.8,.8,0,0,grp);bubble.visible=false;grp.add(bubble);
 const seat=new THREE.Vector3(0,0,.85);desk.localToWorld(seat);if(id==='merlin')seat.set(0,0,-10.1);
 const a=idx/IDS.length*Math.PI*2,lounge=new THREE.Vector3(LOUNGE[0]+Math.sin(a)*2.3,0,LOUNGE[1]+Math.cos(a)*2.3);
 const [bx,bz]=BAR(idx),bar=new THREE.Vector3(bx,0,bz);
 grp.position.copy(seat);grp.rotation.y=yaw;sc.add(grp);
 const el=document.createElement('div');el.className='lbl';el.onclick=()=>card(id);el.innerHTML='<i></i>'+m.name;document.getElementById('labels').appendChild(el);
 el.onmouseenter=()=>hover=id;el.onmouseleave=()=>hover=null;
 const side=new THREE.Vector3(1.2,0,.45);desk.localToWorld(side);if(id==='merlin')side.set(2.2,0,-9.4);const mon=new THREE.Vector3(0,1.4,-.3+off);desk.localToWorld(mon);
 bots[id]={id,decor,desk,deskY,bc,btex,side,mon,path:[],until:0,sayUntil:0,laughUntil:0,grp,el,scr,glow,arms,elbows,hips,knees,root,torso,cup,head,bubble,seat,lounge,bar,yaw,tgt:seat.clone(),spot:'seat',data:null,phase:Math.random()*6};});
for(const id in bots)window.dress(bots[id],null);window.loadAvatars();
// ?realchar pilot (desktop only): CC0 Blender Studio base mesh for Sage, bones driven by the procedural rig
if(!MOBILE&&/[?&]realchar/.test(location.search)&&bots.sage){const b=bots.sage;GL.load('../assets/models/opt/realchar_sage.glb',g=>{
 const av=(window.__av&&window.__av.sage)||{},SK=new THREE.Color(av.skin||'#c98e6a'),OC=av.outfit||'#5b2a86',HC=(av.hair&&av.hair.color)||'#3b2417';
 const m=g.scene,S=1.04,FLIP=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI),tq=new THREE.Quaternion(),tv=new THREE.Vector3(),ts=new THREE.Vector3();sc.add(m);
 const place=()=>{b.grp.updateWorldMatrix(true,false);b.grp.matrixWorld.decompose(tv,tq,ts);m.quaternion.copy(tq).multiply(FLIP);m.scale.copy(ts).multiplyScalar(S);m.position.set(b.root.position.x,b.root.position.y-.92,b.root.position.z).applyMatrix4(b.grp.matrixWorld);m.updateMatrixWorld(true);};place();
 const Tm=(n,s)=>{const t=tx(n,s,[1,1]);t.flipY=false;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.needsUpdate=true;return t;};
 // baked skin (Blender Cycles, procedural object-space pores/mottling) + sheen as a cheap subsurface/peach-fuzz look
 const skinM=new THREE.MeshPhysicalMaterial({color:SK,map:Tm('skin_diff',true),roughnessMap:Tm('skin_rough',false),roughness:1,normalMap:Tm('skin_nor',false),normalScale:new THREE.Vector2(.6,.6),metalness:0,sheen:.55,sheenColor:new THREE.Color(0xff9a7a),sheenRoughness:.45,specularIntensity:.45,clearcoat:.04,clearcoatRoughness:.5});
 skinM.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\n reflectedLight.indirectDiffuse+=diffuseColor.rgb*vec3(.10,.035,.02);');};
 const CL=(c,rep,o={})=>{const mm=PBR('linen',[rep,rep],Object.assign({color:c,normalScale:new THREE.Vector2(.9,.9)},o));mm.side=THREE.DoubleSide;return mm;};
 const blz=CL(OC,46,{sheen:.6,sheenColor:new THREE.Color(OC).offsetHSL(0,0,.2),sheenRoughness:.6});
 const mats={skin:skinM,blazer:blz,top:blz,shirt:CL(av.outfit2||'#f5f0e6',60),pants:CL(0x2a2a31,46),shoes:new THREE.MeshPhysicalMaterial({color:0x17151a,roughness:.28,clearcoat:.8,clearcoatRoughness:.15,side:THREE.DoubleSide}),eye:new THREE.MeshBasicMaterial({visible:false})};
 m.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.frustumCulled=false;const n=(o.material&&o.material.name)||'';o.material=mats[n]||o.material;}});
 b.root.traverse(o=>{if(o.isMesh)o.visible=false;});window.__rc={m,grp:b.grp,b};
 const B={};m.traverse(o=>{if(o.isBone){B[o.name]=o;B[o.name.replace(/([LR])$/,'.$1')]=o;}});m.updateWorldMatrix(true,true);
 const gq=new THREE.Quaternion(),q=new THREE.Quaternion(),pq=new THREE.Quaternion(),v=new THREE.Vector3(),w=new THREE.Vector3();b.grp.getWorldQuaternion(gq);const gqi=gq.clone().invert();
 const rest=n=>B[n].getWorldQuaternion(new THREE.Quaternion()).premultiply(gqi);
 const dir=(a,c)=>{B[a].getWorldPosition(v);B[c].getWorldPosition(w);b.grp.worldToLocal(v);b.grp.worldToLocal(w);return w.sub(v).normalize();};
 const al={};for(const s of['L','R']){const sx=s=='L'?-1:1;al[s]=new THREE.Quaternion().setFromUnitVectors(dir('upperarm.'+s,'hand.'+s),new THREE.Vector3(sx*.12,-1,0).normalize());}
 const I=new THREE.Quaternion(),map=[[b.root,'hips',I],[b.torso,'spine',I],[b.head,'head',I],[b.arms[0],'upperarm.L',al.L],[b.elbows[0],'forearm.L',al.L],[b.arms[1],'upperarm.R',al.R],[b.elbows[1],'forearm.R',al.R],[b.hips[0],'thigh.L',I],[b.knees[0],'shin.L',I],[b.hips[1],'thigh.R',I],[b.knees[1],'shin.R',I]].filter(e=>e[0]&&B[e[1]]).map(e=>[e[0],B[e[1]],e[2],rest(e[1])]);
 // ---- eyes: sclera + textured iris + clear cornea, rigid on head bone (original eye prim hidden)
 const hd=B.head,fwd=new THREE.Vector3(0,0,1).applyQuaternion(m.quaternion).normalize(),upv=new THREE.Vector3(0,1,0),rgt=new THREE.Vector3().crossVectors(upv,fwd).normalize();
 let eyeO;m.traverse(o=>{if(o.isMesh&&o.material===mats.eye&&!eyeO)eyeO=o;});
 const irisT=(()=>{const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,512,512);
  const C=256;for(let i=0;i<900;i++){const a=Math.random()*6.283,r0=60+Math.random()*30,r1=150+Math.random()*90;const l=25+Math.random()*30;x.strokeStyle=`hsl(${22+Math.random()*16},${45+Math.random()*25}%,${l}%)`;x.lineWidth=1+Math.random()*2.2;x.beginPath();x.moveTo(C+Math.cos(a)*r0,C+Math.sin(a)*r0);x.lineTo(C+Math.cos(a+.05)*r1,C+Math.sin(a+.05)*r1);x.stroke();}
  let g=x.createRadialGradient(C,C,200,C,C,256);g.addColorStop(0,'rgba(20,10,5,0)');g.addColorStop(1,'rgba(20,10,5,.95)');x.fillStyle=g;x.beginPath();x.arc(C,C,256,0,7);x.fill();
  g=x.createRadialGradient(C,C,60,C,C,82);g.addColorStop(0,'#050403');g.addColorStop(1,'rgba(5,4,3,0)');x.fillStyle=g;x.beginPath();x.arc(C,C,84,0,7);x.fill();
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;})();
 const sclM=new THREE.MeshPhysicalMaterial({color:0xf1ebe4,roughness:.35,sheen:.3,sheenColor:new THREE.Color(0xffc0b0)});
 const irM=new THREE.MeshPhysicalMaterial({map:irisT,roughness:.6});
 const corM=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:0,metalness:0,transparent:true,opacity:.12,clearcoat:1,clearcoatRoughness:0,envMapIntensity:2.5,depthWrite:false});
 if(eyeO){eyeO.visible=false;const p=eyeO.geometry.attributes.position,L=[],R=[],e=new THREE.Vector3();eyeO.updateMatrixWorld(true);
  for(let i=0;i<p.count;i++){e.fromBufferAttribute(p,i);eyeO.applyBoneTransform(i,e);e.applyMatrix4(eyeO.matrixWorld);const s=e.clone().sub(hd.getWorldPosition(new THREE.Vector3())).dot(rgt);(s>0?R:L).push(e.clone());}
  for(const P of[L,R]){if(!P.length)continue;const bx=new THREE.Box3().setFromPoints(P),c=bx.getCenter(new THREE.Vector3()),rr=bx.getSize(new THREE.Vector3()).x/2*1.0;
   const eg=new THREE.Group();eg.position.copy(c);eg.lookAt(c.clone().add(fwd));
   eg.add(new THREE.Mesh(new THREE.SphereGeometry(rr*.985,32,24),sclM));
   const ir=new THREE.Mesh(new THREE.CircleGeometry(rr*.5,48),irM);ir.position.z=rr*.995;eg.add(ir);
   const co=new THREE.Mesh(new THREE.SphereGeometry(rr*.6,32,16,0,6.283,0,1.1),corM);co.rotation.x=Math.PI/2;co.position.z=rr*.62;eg.add(co);
   sc.add(eg);eg.updateMatrixWorld(true);hd.attach(eg);if(/rcnoeyes/.test(location.search))eg.visible=false;}}
 // ---- hair: ~1400 strand ribbons grown over a fitted scalp ellipsoid, falling with gravity, long style; anisotropic sheen
 {const bodyO=[];m.traverse(o=>{if(o.isSkinnedMesh&&o.material===skinM)bodyO.push(o);});const hp=hd.getWorldPosition(new THREE.Vector3()),pts=[],e=new THREE.Vector3();
  for(const o of bodyO){const p=o.geometry.attributes.position;o.updateMatrixWorld(true);for(let i=0;i<p.count;i+=3){e.fromBufferAttribute(p,i);o.applyBoneTransform(i,e);e.applyMatrix4(o.matrixWorld);if(e.y>hp.y+.02&&e.distanceTo(hp)<.3)pts.push(e.clone());}}
  const toL=q=>{const d=q.clone().sub(hp);return new THREE.Vector3(d.dot(rgt),d.dot(upv),d.dot(fwd));};
  const Lp=pts.map(toL),bx=new THREE.Box3().setFromPoints(Lp),C=bx.getCenter(new THREE.Vector3()),Rd=bx.getSize(new THREE.Vector3()).multiplyScalar(.5);C.y=bx.max.y-Rd.y*1.0;Rd.y=Rd.y;
  const E=(x,y,z)=>Math.hypot((x-C.x)/Rd.x,(y-C.y)/Rd.y,(z-C.z)/Rd.z);
  const pos=[],uv=[],idx=[],tan=[];let vi=0;const SEG=22,rnd=Math.random;
  for(let k=0;k<2600;k++){const th=Math.acos(1-rnd()*1.25),ph=rnd()*6.283;let d=new THREE.Vector3(Math.sin(th)*Math.cos(ph),Math.cos(th),Math.sin(th)*Math.sin(ph));
   // skip face: front cone below hairline
   if(d.z>.3)continue;if(d.z>.05&&d.y<.9)continue;if(d.z>-.35&&d.y<.35)continue;if(d.z>-.1&&d.y<.1&&Math.abs(d.x)<.6)continue;
   let p=new THREE.Vector3(C.x+d.x*Rd.x*1.0,C.y+d.y*Rd.y*1.0,C.z+d.z*Rd.z*1.0);const back=-d.z,Lh=(.30+.16*Math.max(0,back)+rnd()*.05),st=Lh/SEG;
   const n0=new THREE.Vector3(d.x/Rd.x,d.y/Rd.y,d.z/Rd.z).normalize();let dir=new THREE.Vector3(0,-1,-.25).addScaledVector(n0,-new THREE.Vector3(0,-1,-.25).dot(n0)).normalize();if(d.z>-.2){dir.set(Math.sign(d.x||(rnd()-.5))*1.0,-.15,-1.1).normalize();}if(d.y>.6)dir.lerp(n0,.2).normalize();const w=.0055+rnd()*.0045;
   for(let s=0;s<=SEG;s++){const n=new THREE.Vector3((p.x-C.x)/Rd.x,(p.y-C.y)/Rd.y,(p.z-C.z)/Rd.z).normalize();const side=new THREE.Vector3().crossVectors(dir,n).normalize().multiplyScalar(w*(1-.6*s/SEG));
    const tn=side.clone().normalize();if(!isFinite(tn.x)||tn.lengthSq()<.5)tn.set(1,0,0);for(const sg of[-1,1]){const q=p.clone().addScaledVector(side,sg);pos.push(q.x,q.y,q.z);uv.push(sg<0?0:1,s/SEG);tan.push(tn.x,tn.y,tn.z,1);}
    if(s<SEG){idx.push(vi,vi+1,vi+2,vi+1,vi+3,vi+2);}vi+=2;
    dir.y-=.22;dir.normalize();p.addScaledVector(dir,st);
    const r=E(p.x,p.y,p.z);if(r<1.04){const n2=new THREE.Vector3((p.x-C.x)/Rd.x/Rd.x,(p.y-C.y)/Rd.y/Rd.y,(p.z-C.z)/Rd.z/Rd.z).normalize();p.addScaledVector(n2,(1.04-r)*Math.min(Rd.x,Rd.z));}
    if(p.y<C.y-Rd.y*.85){p.z=Math.min(p.z,C.z-Rd.z*.55+Math.abs(p.x)*.15);if(p.y<C.y-Rd.y*1.15)p.x*=.985;}}}
  const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));hg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));hg.setIndex(idx);hg.computeVertexNormals();hg.setAttribute('tangent',new THREE.Float32BufferAttribute(tan,4));
  const hm=new THREE.MeshPhysicalMaterial({color:HC,roughness:.38,metalness:0,alphaMap:HCARD,alphaTest:.4,side:THREE.DoubleSide,anisotropy:.85,anisotropyRotation:Math.PI/2,sheen:.35,sheenColor:new THREE.Color(HC).offsetHSL(.02,.05,.1),sheenRoughness:.4,specularIntensity:.35});
  const hair=new THREE.Mesh(hg,hm);hair.castShadow=true;const hgp=new THREE.Group();hgp.add(hair);const cap=new THREE.Mesh(new THREE.SphereGeometry(1,40,24,0,6.283,0,1.22),new THREE.MeshStandardMaterial({color:HC,roughness:.6}));cap.scale.copy(Rd).multiplyScalar(1.045);cap.position.copy(C);hgp.add(cap);
  hgp.position.copy(hp);const bm=new THREE.Matrix4().makeBasis(rgt,upv,fwd);hgp.quaternion.setFromRotationMatrix(bm);sc.add(hgp);hgp.updateMatrixWorld(true);hd.attach(hgp);if(/rcnohair/.test(location.search))hgp.visible=false;window.__hgp=hgp;window.__hair={n:pos.length/3,C,Rd};}
 b.rc=()=>{b.grp.traverse(o=>{if(o.isMesh&&o.visible)o.visible=false;});place();b.grp.getWorldQuaternion(gq);
  if(/rcnod/.test(location.search))return;for(const [p,bn,a,r] of map){p.getWorldQuaternion(q);q.premultiply(gqi.copy(gq).invert());q.multiply(a).multiply(r).premultiply(gq);bn.parent.getWorldQuaternion(pq);bn.quaternion.copy(pq.invert().multiply(q));bn.updateMatrixWorld(true);}};
});}

let hover=null;
const ray=new THREE.Raycaster(),mv=new THREE.Vector2();if(/realchar/.test(location.search)){window.__ray=ray;window.__sc=sc;}let lastUser=-99,tourOn=true;const clk=new THREE.Clock();
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
window.__go=(...a)=>go(...a);const go=(b,pos,o={})=>{b.goal=Object.assign({pos:pos.clone(),pose:'stand',anim:'idle'},o);b.path=route(b.grp.position,pos);};
// demo
const DEMO=[{merlin:'working',jr:'working',jocko:'working',sage:'working',scout:'working',quill:'working',ness:'waiting',shoppy:'waiting',mick:'working',manny:'working',pixel:'working'},
{merlin:'working',jr:'idle',jocko:'idle',sage:'idle',scout:'idle',quill:'idle',ness:'idle',shoppy:'idle',mick:'idle',manny:'waiting',pixel:'idle'},
{merlin:'working',jr:'idle',jocko:'working',sage:'waiting',scout:'working',quill:'idle',ness:'working',shoppy:'idle',mick:'waiting',manny:'working',pixel:'waiting'}];
const DTASK={merlin:"Routing today's tasks",jr:'Preparing morning devotion',jocko:'Planning 5am workout',sage:'Breathing exercise plan',scout:'Researching FDE roles',quill:'Drafting PD video script',ness:'Coaching executive presence',shoppy:'Building grocery list',mick:'Training block + meal plan',manny:'Wiring Bot HQ 3D',pixel:'Sketching Bot HQ visuals'};
let demo=false,demoPhase=0,demoNext=0;
eff=b=>demo?{status:DEMO[demoPhase][b.id],task:DTASK[b.id],name:BOTS_META[b.id].name,demo:true}:(b.data||{status:'idle',task:''});
const snip=s=>{s=(s||'').trim();return s.length>30?s.slice(0,29)+'…':s;};
function say(b,text,dur,t){const c=b.bc.getContext('2d');c.clearRect(0,0,512,136);c.font='600 30px system-ui,sans-serif';const nm=BOTS_META[b.id].name;const w=Math.min(500,Math.max(c.measureText(text).width,120)+44),x=(512-w)/2;
 c.fillStyle='rgba(42,34,30,.93)';c.strokeStyle='#e0a060';c.lineWidth=3;c.beginPath();c.roundRect(x,6,w,98,22);c.fill();c.stroke();c.beginPath();c.moveTo(236,103);c.lineTo(256,130);c.lineTo(276,103);c.fill();
 c.textAlign='center';c.textBaseline='middle';c.fillStyle='#e0a060';c.font='700 22px system-ui,sans-serif';c.fillText(nm,256,30);c.fillStyle='#f6e8d2';c.font='600 30px system-ui,sans-serif';c.fillText(text,256,70);b.btex.needsUpdate=true;b.sayUntil=t+dur;}
const CONV=[];
function conv(members,t,dur,mode){CONV.push({members,until:t+dur,mode,i:0,next:t+1.5});}
const CHAT=['Haha, so true','Coffee run?','This latte is good','How was your week?','Love this plant wall','Ha! Classic','Needed this break','Rain looks nice tonight','Same, honestly','Try the oat latte'];
const pickW=opts=>{let s=opts.reduce((a,o)=>a+o[1],0)*Math.random();for(const o of opts){if((s-=o[1])<=0)return o[0];}return opts[0][0];};
function plan(b,t){const st=eff(b).status;release(b);b.job=null;
 if(st==='working'){go(b,b.seat,{pose:b.id==='merlin'?'stand':'sit',sit:.5,yaw:b.yaw,anim:'type'});b.until=t+1e9;return;}
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
  if(W.length>=2&&Math.random()<.8){W.sort(()=>Math.random()-.5);const a=W[0],h=W[1],dur=16;let mode=['desk','desk','board','war'][Math.floor(Math.random()*4)];if(mode!=='desk'&&SLOT[mode].some(sl=>sl.by||IDS.some(i=>bots[i].grp.position.distanceTo(sl.p)<1.2||bots[i].goal&&bots[i].goal.pos.distanceTo(sl.p)<.5)))mode='desk';
   a.job={until:t+dur};h.job={until:t+dur};
   if(mode==='desk'){go(a,h.side,{face:h.mon,anim:'collab'});go(h,h.seat,{pose:'sit',sit:.5,yaw:h.yaw,anim:'collab'});}
   else{const S=SLOT[mode];[a,h].forEach((b,i)=>{release(b);const s=S[i];s.by=b.id;b.slot=s;go(b,s.p,{yaw:s.yaw,face:s.face,anim:'collab',point:true});});}
   conv([a,h],t+1,dur-1,'task');}
  const m=bots.merlin;if(eff(m).status==='working'&&!m.job&&t>(m.nextCheck||8)){const tg=IDS.map(i=>bots[i]).filter(b=>b!==m&&eff(b).status==='working'&&!b.job&&arrived(b));
   if(tg.length){const h=tg[Math.floor(Math.random()*tg.length)];m.job={until:t+15};h.job={until:t+15};go(m,h.side,{face:h.mon,anim:'collab'});go(h,h.seat,{pose:'sit',sit:.5,yaw:h.yaw,anim:'collab'});conv([m,h],t+3,12,'check');}
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
let wallT=-9,ti=0,tNext=0;const tgtV=new THREE.Vector3();ctl.target.set(0,0,PORTRAIT()?-4:0);{const q=new URLSearchParams(location.search).get('cam');if(q){const v=q.split(',').map(Number);ctl.target.set(v[3],v[4],v[5]);tourOn=false;ctl.autoRotate=false;}}
const v=new THREE.Vector3(),rects=[];let frame=0;
if(!MOBILE)setTimeout(()=>{try{const rt=new THREE.WebGLCubeRenderTarget(64,{type:THREE.HalfFloatType});const cc=new THREE.CubeCamera(.3,60,rt);const P=[];
 for(const [x,z] of[[0,1],[-12,0],[12,0],[0,-10],[14,10],[-15,-10]]){cc.position.set(x,1.6,z);cc.update(r,sc);P.push(LightProbeGenerator.fromCubeRenderTarget(r,rt));}
 const lp=new THREE.LightProbe();P.forEach(p=>lp.sh.add(p.sh));lp.sh.scale(1/P.length);lp.intensity=.9;sc.add(lp);window.__lp=lp;rt.dispose();}catch(e){console.warn('probe',e);}},6000);
const NOAUTO=/noauto/.test(location.search);let qLvl=0,pAcc=0,pN=0,pWarm=0;
const PERF=dt=>{if(NOAUTO)return;pWarm+=dt;if(pWarm<4)return;pAcc+=dt;pN++;if(pAcc<3)return;const fps=pN/pAcc;pAcc=0;pN=0;
 if(fps<30&&qLvl<3){qLvl++;if(qLvl===1){if(window.__ao)__ao.enabled=false;if(window.__smaa)__smaa.enabled=false;}else if(qLvl===2){r.setPixelRatio(Math.max(1,r.getPixelRatio()*.75));comp.setPixelRatio(r.getPixelRatio());bloom.enabled=false;}else{r.shadowMap.autoUpdate=false;r.shadowMap.needsUpdate=true;dust.visible=false;r.setPixelRatio(.75);comp.setPixelRatio(.75);}console.info('BotHQ quality step-down to',qLvl,'fps',fps.toFixed(1));}};
window.__q=()=>qLvl;
(function loop(){requestAnimationFrame(loop);const dt=Math.min(clk.getDelta(),.05),t=clk.elapsedTime;frame++;PERF(dt);
 if(tourOn&&!ctl.autoRotate&&t-lastUser>20)ctl.autoRotate=true;
 if(tourOn&&ctl.autoRotate){if(t>tNext){ti=(ti+1)%TOUR.length;tNext=t+(ti===0?12:9);}tgtV.set(...TOUR[ti]);ctl.target.lerp(tgtV,.008);
  const wantD=(ti===0?40:17)*(PORTRAIT()?1.35:1);const off=cam.position.clone().sub(ctl.target);const d=off.length();off.setLength(d+(wantD-d)*.01);cam.position.copy(ctl.target).add(off);}
 ctl.update();
 candles.forEach((f,i)=>f.scale.set(1,1.5+Math.sin(t*11+i*2)*.15,1));cl.intensity=(5.5+Math.sin(t*7)*.5+Math.sin(t*13)*.3)*1.9;
 arm.rotation.y=Math.sin(t*.8)*.8;arm2.rotation.x=Math.sin(t*1.3)*.4;duck.position.y=1.35+Math.abs(Math.sin(t*3))*.05;bag.rotation.z=Math.sin(t*2)*.05;
 holo.rotation.y=t*.6;holo.rotation.x=t*.3;ring.position.y=1.3+Math.sin(t*1.5)*.25;holoM.opacity=.55+Math.sin(t*3)*.15;
if(frame%2===0){const pa=dgeo.attributes.position.array;for(let i=0;i<DN;i++){pa[i*3]+=.003;pa[i*3+1]+=Math.sin(t*.5+i)*.002;if(pa[i*3]>18)pa[i*3]=-18;}dgeo.attributes.position.needsUpdate=true;}
 holos.forEach((h,i)=>h.position.y=h.userData.y+Math.sin(t*.9+i)*.08);
 if(t-wallT>2){drawWall();wallT=t;}
 director(t);
 for(const id in bots){const b=bots[id],st=eff(b).status;animate(b,t,dt);if(b.rc)b.rc(t);
  const sc0=st==='working'?SC.working:st==='waiting'?SC.waiting:SC.idle;b.scr.material.color.setHex(sc0);
  if(st==='working')b.scr.material.color.multiplyScalar(1.1+.3*Math.sin(t*6+b.phase));if(st==='waiting')b.scr.material.color.multiplyScalar(.7+.4*Math.abs(Math.sin(t*2)));
  
  b.el.firstChild.style.background=b.el.firstChild.style.color='#'+(st==='working'?'2ecc71':st==='waiting'?'f5a623':'9aa3ad');}
 if(frame%2===0){const arr=[];for(const id in bots){const b=bots[id];v.set(b.grp.position.x,2.3,b.grp.position.z).project(cam);if(t<b.sayUntil||v.z>1||Math.abs(v.x)>1.15||Math.abs(v.y)>1.05){b.el.style.display='none';continue;}
   arr.push({id,b,x:(v.x+1)/2*innerWidth,y:(1-v.y)/2*innerHeight,z:v.z});}
  arr.sort((a,c)=>(a.id===hover?-1:c.id===hover?1:a.z-c.z));rects.length=0;
  for(const o of arr){const w=o.b.el.offsetWidth||70,h=22;const x=Math.max(w/2+4,Math.min(innerWidth-w/2-4,o.x)),y=Math.max(h+40,o.y);const R=[x-w/2-3,y-h-3,x+w/2+3,y+3];
   if(rects.some(q=>R[0]<q[2]&&R[2]>q[0]&&R[1]<q[3]&&R[3]>q[1])&&o.id!==hover){o.b.el.style.display='none';continue;}
   rects.push(R);o.b.el.style.display='block';o.b.el.style.transform=`translate(${x-w/2}px,${y-h}px)`;}}
 if(window.__fin)__fin.uniforms.t.value=t%10;comp.render();})();
window.__bothq={bots,ctl,cam,setDemo:(on,ph=0)=>{demo=on;demoPhase=ph;demoNext=clk.elapsedTime+1e6;},speed:v=>SPEED=v,settle:()=>{for(const id in bots){const b=bots[id];if(b.path.length){const e=b.path[b.path.length-1];b.grp.position.set(e.x,0,e.z);b.path=[];}}}};
poll();setInterval(poll,BOTHQ_CONFIG.pollMs);}
function card(id){const d=eff(bots[id]),m=BOTS_META[id];const $=i=>document.getElementById(i);$('cn').textContent=d.name||m.name;$('cr').textContent=m.role;$('cs').textContent=STATION[id];$('ct').textContent=d.task||'—';{const mo=(bots[id].av&&bots[id].av.motto)||'';$('cm').textContent=mo?'“'+mo+'”':'';$('cm').style.display=mo?'':'none';}$('cst').textContent=(d.status||'idle')+(d.demo?' (demo)':'');$('cst').className='pill '+(d.status||'idle');$('cu').textContent=d.updated?fmt(d.updated):'—';$('card').style.display='block';}
async function poll(){window.loadAvatars();try{data=await bothqFetchStatus('../');document.getElementById('upd').textContent='updated '+fmt(data.updated);
 for(const d of data.bots){const b=bots[d.id];if(!b)continue;b.data=d;b.el.title=d.task||'';}}catch(e){document.getElementById('upd').textContent='status offline';}}
bothqGate(start);

