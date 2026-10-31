import asyncio,sys
from playwright.async_api import async_playwright
U=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8765/3d/'
VIEWS=__import__('json').loads(__import__('os').environ['V']) if 'V' in __import__('os').environ else {'face':(0.55,0.0,0.02),'eyes':(0.3,0.25,0.0),'body':(2.3,0.0,-0.55),'side':(1.0,0.9,-0.05),'back':(1.2,2.6,-0.1),'hair':(0.7,1.9,0.05),'seat':(2.0,0.5,-0.4),'seatside':(1.8,1.45,-0.45)}
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    d=await b.new_page(viewport={'width':1280,'height':800});E=[]
    d.on('pageerror',lambda e:E.append(str(e)[:200]))
    await d.goto(U);await d.evaluate("localStorage.setItem('bothq_ok',BOTHQ_CONFIG.passHash)")
    await d.goto(U+'?noauto&realchar'+__import__('os').environ.get('X','')+'&cam=-6,2,0,-8.7,1,-2');await d.wait_for_function("window.__rc",timeout=150000);await d.wait_for_timeout(15000)
    for k,(dist,ang,dy) in VIEWS.items():
      if k=='seat':
        await d.evaluate("(()=>{const b=window.__rc.b;setInterval(()=>{b.path.length=0;b.grp.position.copy(b.seat);b.goal={pos:b.seat.clone(),pose:'sit',sit:.5,yaw:b.yaw,anim:'type'};},40)})()");await d.wait_for_timeout(4000)
      await d.evaluate("""([dist,ang,dy])=>{clearInterval(window.__ti);window.__ti=setInterval(()=>{const r=window.__rc,V=r.grp.position.constructor;let hd;r.m.traverse(x=>{if(x.name=='head')hd=x;});const h=new V();hd.getWorldPosition(h);h.y+=.08;
       const f=new V(0,0,1).applyQuaternion(r.m.quaternion);f.y=0;f.normalize();f.applyAxisAngle(new V(0,1,0),ang);
       const c=h.clone().addScaledVector(f,dist);c.y+=dy+(dist>2?.1:0);const t=h.clone();if(dist>2)t.y-=.6;
       window.__cam.position.copy(c);window.__ctl.target.copy(t);window.__ctl.update();if((window.__hk=(window.__hk||0)+1)%20==3){const D=h.distanceTo(c);window.__ray.set(c,h.clone().sub(c).normalize());window.__ray.far=D-.25;window.__ray.camera=window.__cam;for(const it of window.__ray.intersectObjects(window.__sc.children,true)){let o=it.object,mine=false;for(let x=o;x;x=x.parent)if(x===r.m)mine=true;if(!mine&&!o.isSprite)o.visible=false;}}},30);}""",[dist,ang,dy])
      await d.wait_for_timeout(2500)
      await d.screenshot(path=f'/workspace/bothq/shots/{__import__('os').environ.get('P','real_char2')}_{k}.png',timeout=180000)
    print('errs',E);await b.close()
asyncio.run(main())
