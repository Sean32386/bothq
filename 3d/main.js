import * as THREE from '../vendor/three.module.min.js';import {OrbitControls} from '../vendor/OrbitControls.js';
const ST={merlin:[0,-8],jr:[-12,-8],jocko:[10,-8],mick:[14,0],sage:[-13,3],shoppy:[11,9],scout:[-5,-10],quill:[-6,10],ness:[2,10],manny:[6,2]};
const BC={merlin:[0x8a8fa8,0x4b3c8f,7],jr:[0xf2ead7,0x8b2e2e,4],jocko:[0x444444,0x111111,3],mick:[0xfff3e0,0xc0392b,3],sage:[0xdff5e1,0x3fae5a,3],shoppy:[0xffe8c2,0xff8a3d,3],scout:[0xa0784a,0x5a3a1a,9],quill:[0xe8e0ff,0x2f6fd6,3],ness:[0x7a3b2e,0xe0409a,1],manny:[0xd6c09a,0x7a5a2f,3]};
let data=null;const bots={};
function fmt(t){try{return new Date(t).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'})}catch(e){return t}}
function start(){
const r=new THREE.WebGLRenderer({antialias:true});r.setPixelRatio(Math.min(devicePixelRatio,2));r.setSize(innerWidth,innerHeight);r.shadowMap.enabled=true;document.body.prepend(r.domElement);
const sc=new THREE.Scene();sc.background=new THREE.Color(0xbfe3ff);sc.fog=new THREE.Fog(0xbfe3ff,40,90);
const cam=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,0.1,200);cam.position.set(0,26,30);
const ctl=new OrbitControls(cam,r.domElement);ctl.enableDamping=true;ctl.maxPolarAngle=1.35;ctl.minDistance=8;ctl.maxDistance=60;ctl.autoRotate=true;ctl.autoRotateSpeed=0.4;
sc.add(new THREE.HemisphereLight(0xffffff,0x557744,0.9));const sun=new THREE.DirectionalLight(0xfff2d0,1.4);sun.position.set(15,30,10);sun.castShadow=true;sun.shadow.camera.left=-30;sun.shadow.camera.right=30;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-30;sun.shadow.mapSize.set(2048,2048);sc.add(sun);
const M=c=>new THREE.MeshLambertMaterial({color:c,flatShading:true});
const box=(w,h,d,c,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;sc.add(m);return m;};
const g=new THREE.Mesh(new THREE.PlaneGeometry(44,32),M(0x7cc152));g.rotation.x=-Math.PI/2;g.receiveShadow=true;sc.add(g);
box(44,0.05,2.5,0xd9b98a,0,0.03,-3);box(2.5,0.05,32,0xd9b98a,0,0.03,0);
const pond=new THREE.Mesh(new THREE.CylinderGeometry(3,3,0.1,12),M(0x4a90d9));pond.position.set(-3,0.05,4);sc.add(pond);
for(let i=0;i<30;i++){const x=(Math.random()-.5)*42,z=(Math.random()-.5)*30;if(Math.abs(z+3)<2.5||Math.abs(x)<2.5)continue;if(Object.values(ST).some(([a,b])=>Math.hypot(a-x,b-z)<4))continue;
 box(.3,1,.3,0x6b4a2b,x,.5,z);const c=new THREE.Mesh(new THREE.ConeGeometry(1,2.2,6),M(0x2f7d32));c.position.set(x,2,z);c.castShadow=true;sc.add(c);}
for(const id in ST){const[x,z]=ST[id];const[wa,ro,h]=BC[id];
 if(id==='ness'){box(5,.6,3,wa,x,.3,z);box(.4,4,.4,ro,x-2.4,2,z-1.3);box(.4,4,.4,ro,x+2.4,2,z-1.3);box(5.2,.5,.5,ro,x,4,z-1.3);continue;}
 const w=id==='scout'||id==='merlin'?2.6:4;box(w,h,3,wa,x,h/2,z-1.5);const roof=new THREE.Mesh(new THREE.ConeGeometry(w*0.85,1.8,4),M(ro));roof.position.set(x,h+.9,z-1.5);roof.rotation.y=Math.PI/4;roof.castShadow=true;sc.add(roof);
 box(.8,1.4,.1,0x5b3d22,x,.7,z);
 if(id==='merlin'){const o=new THREE.Mesh(new THREE.IcosahedronGeometry(.5),new THREE.MeshBasicMaterial({color:0x66ccff}));o.position.set(x,h+2.4,z-1.5);sc.add(o);bots._orb=o;}}
// characters
for(const id in BOTS_META){const m=BOTS_META[id];const grp=new THREE.Group();const[x,z]=ST[id];grp.position.set(x+1.5,0,z+1.5);
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.35,.6,4,8),M(m.color));body.position.y=.75;body.castShadow=true;grp.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.32,10,8),M(id==='jocko'?0x8d5524:0xf1c27d));head.position.y=1.55;head.castShadow=true;grp.add(head);
 const add=(geo,c,px,py,pz)=>{const k=new THREE.Mesh(geo,M(c));k.position.set(px,py,pz);grp.add(k);return k;};
 if(id==='merlin')add(new THREE.ConeGeometry(.35,.8,8),0x6a4cff,0,2.1,0);
 if(id==='mick')add(new THREE.CylinderGeometry(.3,.25,.4,8),0xffffff,0,1.95,0);
 if(id==='manny'){add(new THREE.SphereGeometry(.34,8,6,0,Math.PI*2,0,Math.PI/2),0xf2c230,0,1.62,0);add(new THREE.BoxGeometry(.08,.6,.08),0x8b5a2b,.45,.9,.2);add(new THREE.BoxGeometry(.3,.12,.12),0x999999,.45,1.2,.2);}
 if(id==='jr')add(new THREE.BoxGeometry(.3,.4,.1),0x5a2a10,.3,.9,.35);
 if(id==='scout')add(new THREE.BoxGeometry(.4,.12,.15),0x333333,0,1.6,.3);
 if(id==='ness')add(new THREE.CylinderGeometry(.05,.05,.4),0x333333,.3,1.2,.3);
 if(id==='shoppy')add(new THREE.BoxGeometry(.35,.3,.3),0xc8a060,.4,.8,.2);
 if(id==='quill')add(new THREE.ConeGeometry(.05,.5,4),0xffffff,.35,1.1,.2);
 if(id==='sage')add(new THREE.SphereGeometry(.15,6,4),0x3fae5a,-.4,.9,.2);
 sc.add(grp);const el=document.createElement('div');el.className='lbl';el.onclick=()=>card(id);document.getElementById('labels').appendChild(el);
 bots[id]={grp,el,home:[x+1.5,z+1.5],tgt:[x+1.5,z+1.5],data:null};}
const ray=new THREE.Raycaster(),mv=new THREE.Vector2();r.domElement.addEventListener('pointerdown',e=>{ctl.autoRotate=false;});
r.domElement.addEventListener('click',e=>{mv.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(mv,cam);for(const id in BOTS_META){if(ray.intersectObject(bots[id].grp,true).length){card(id);break;}}});
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();r.setSize(innerWidth,innerHeight);});
setInterval(()=>{for(const id in BOTS_META){const b=bots[id];if(b.data?.status==='idle')continue;b.tgt=[b.home[0]+(Math.random()-.5)*3,b.home[1]+Math.random()*2];}},2500);
const v=new THREE.Vector3();const clk=new THREE.Clock();
(function loop(){requestAnimationFrame(loop);const t=clk.getElapsedTime(),dt=clk.getDelta();ctl.update();if(bots._orb)bots._orb.rotation.y=t;
 for(const id in BOTS_META){const b=bots[id],st=b.data?.status||'idle',p=b.grp.position;
  if(st!=='idle'){const dx=b.tgt[0]-p.x,dz=b.tgt[1]-p.z,d=Math.hypot(dx,dz);if(d>.05){const s=Math.min(d,(st==='working'?.04:.015));p.x+=dx/d*s;p.z+=dz/d*s;b.grp.rotation.y=Math.atan2(dx,dz);}
   p.y=st==='working'?Math.abs(Math.sin(t*8))*.12:0;b.grp.rotation.z=0;}else{p.y=0;b.grp.rotation.z=.25;}
  v.set(p.x,2.4,p.z).project(cam);b.el.style.display=v.z<1?'block':'none';b.el.style.left=((v.x+1)/2*innerWidth)+'px';b.el.style.top=((1-v.y)/2*innerHeight)+'px';}
 r.render(sc,cam);})();
poll();setInterval(poll,BOTHQ_CONFIG.pollMs);}
function card(id){const d=bots[id].data||{},m=BOTS_META[id];const $=i=>document.getElementById(i);$('cn').textContent=d.name||m.name;$('cr').textContent=m.role;$('cs').textContent=d.station||m.station;$('ct').textContent=d.task||'—';$('cst').textContent=d.status||'idle';$('cst').className='pill '+(d.status||'idle');$('cu').textContent=d.updated?fmt(d.updated):'—';$('card').style.display='block';}
async function poll(){try{data=await bothqFetchStatus('../');document.getElementById('upd').textContent='updated '+fmt(data.updated);
 for(const d of data.bots){const b=bots[d.id];if(!b)continue;b.data=d;const ic=d.status==='idle'?'💤':d.status==='waiting'?'⏳':'⚙️';b.el.innerHTML='<b>'+d.name+'</b>'+ic+' '+(d.task.length>30?d.task.slice(0,29)+'…':d.task).replace(/</g,'&lt;');}}catch(e){document.getElementById('upd').textContent='status offline';}}
bothqGate(start);
