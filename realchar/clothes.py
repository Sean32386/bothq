import bpy,bmesh,math
def dom(o,v):
  gs=sorted(v.groups,key=lambda g:-g.weight);return o.vertex_groups[gs[0].group].name if gs else ''
def shell(body,name,pick,off,smooth=4,mat=None):
  o=body.copy();o.data=body.data.copy();o.name=name;bpy.context.scene.collection.objects.link(o)
  bm=bmesh.new();bm.from_mesh(o.data);bm.faces.ensure_lookup_table()
  keep=set(i for i in range(len(bm.faces)) if pick[i])
  bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.index not in keep],context='FACES')
  for _ in range(smooth):bmesh.ops.smooth_vert(bm,verts=bm.verts,factor=.5,use_axis_x=True,use_axis_y=True,use_axis_z=True)
  bm.normal_update()
  for v in bm.verts:v.co+=v.normal*off
  bm.to_mesh(o.data);bm.free()
  o.data.materials.clear();o.data.materials.append(mat)
  return o
def tailor(o,z0,H):
  # hang the jacket: bridge under-bust/waist on the front and lumbar on the back, flare hem, pad shoulders
  me=o.data;V=me.vertices;B=.02*H
  F=lambda v:(v.co.z-z0)/H
  col=lambda x:int(round(x/B))
  def I(d,x):
    a=math.floor(x/B);b=a+1;w=x/B-a
    if a in d and b in d:return d[a]*(1-w)+d[b]*w
    return d.get(col(x))
  apex={};blade={};hemf={};hemb={}
  for v in V:
    f=F(v);x,y=v.co.x,v.co.y;k=col(x)
    if abs(x)>.13*H:continue
    if .70<f<.77:apex[k]=min(apex.get(k,9),y);blade[k]=max(blade.get(k,-9),y)
    if .47<f<.53:hemf[k]=min(hemf.get(k,9),y);hemb[k]=max(hemb.get(k,-9),y)
  fa=.735
  for v in V:
    f=F(v);x=v.co.x;k=col(x)
    if abs(x)<.13*H and .47<f<fa and k in apex and k in hemf:
      t=(fa-f)/(fa-.47);t=t*t*(3-2*t)
      if v.co.y<0:
        tg=I(apex,x)+(I(hemf,x)-I(apex,x))*t
        if tg<v.co.y:v.co.y+=(tg-v.co.y)*.8
      else:
        tg=I(blade,x)+(I(hemb,x)-I(blade,x))*t
        if tg>v.co.y:v.co.y+=(tg-v.co.y)*.7
    if f<.54 and abs(x)<.16*H:v.co.x*=1+(.54-f)*.6
    if .78<f<.83 and .09*H<abs(x)<.14*H:v.co.z+=.006;v.co.x+=.006*(1 if x>0 else -1)
  bm=bmesh.new();bm.from_mesh(me);sv=[v for v in bm.verts if .44<(v.co.z-z0)/H<.78]
  for _ in range(6):bmesh.ops.smooth_vert(bm,verts=sv,factor=.5,use_axis_x=True,use_axis_y=True,use_axis_z=True)
  bm.to_mesh(me);bm.free()
  m=o.modifiers.new('sol','SOLIDIFY');m.thickness=.004;m.offset=1;m.use_rim=True
  bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier='sol')
def build(body,ao,z0,H):
  me=body.data;V=me.vertices
  D=[dom(body,v) for v in V]
  M={n:bpy.data.materials.get(n) or bpy.data.materials.new(n) for n in ['blazer','shirt','pants','shoes']}
  def fstats(p):
    c=p.center;f=(c.z-z0)/H;ds=[D[i] for i in p.vertices];return c,f,ds
  P=list(me.polygons);n=len(P)
  bl=[False]*n;sh=[False]*n;pa=[False]*n;so=[False]*n
  for i,p in enumerate(P):
    if p.material_index==[k for k,m in enumerate(me.materials) if m.name.startswith('eye')][0]:continue
    c,f,ds=fstats(p);ax=abs(c.x)
    arm=all(d.startswith(('upperarm','forearm')) for d in ds);hand=any(d.startswith('hand') for d in ds)
    leg=all(d.startswith(('thigh','shin','foot','hips')) for d in ds)
    torso=ax<.13*H and not any(d.startswith(('upperarm','forearm','hand')) for d in ds)
    front=c.y<-.02
    vneck=front and f>.69 and ax<(f-.69)*.9*H+.004
    if f<.065:so[i]=True
    elif (torso and .47<f<.835 and not vneck) or (arm and f>.4 and not hand):bl[i]=True
    if torso and .6<f<.85 and front and ax<.06*H:sh[i]=True
    if (leg or (torso and f<.57)) and .055<f<.57:pa[i]=True
  bz=shell(body,'blazer',bl,.016,6,M['blazer']);tailor(bz,z0,H)
  objs=[bz,shell(body,'shirt',sh,.005,5,M['shirt']),shell(body,'pants',pa,.006,4,M['pants']),shell(body,'shoes',so,.005,2,M['shoes'])]
  # hide body under clothes (keep a margin under shirt V and cuffs)
  bm=bmesh.new();bm.from_mesh(me);bm.faces.ensure_lookup_table()
  kill=[bm.faces[i] for i in range(n) if (bl[i] or pa[i] or so[i] or sh[i])]
  # only kill faces whose neighbours are also covered (keeps border strip)
  cov=set(f.index for f in kill)
  kill=[f for f in kill if all(l.index in cov for e in f.edges for l in e.link_faces)]
  bmesh.ops.delete(bm,geom=kill,context='FACES_ONLY');bm.to_mesh(me);bm.free()
  print('CLOTHES',[ (o.name,len(o.data.polygons)) for o in objs],'body polys',len(me.polygons))
  return objs

def _mat(n,c):
  m=bpy.data.materials.get(n) or bpy.data.materials.new(n);m.diffuse_color=c;return m
def skirt(body,z0,H,ftop=.60,fbot=.30,off=.008,NA=72,NZ=26):
  # tube skirt: per-height polar max radius of the hip/thigh slice, smoothed, slight A-line; skinned from nearest body verts
  import mathutils
  me=body.data;V=me.vertices;MW=body.matrix_world
  rings=[];OK=[dom(body,v).startswith(('hips','spine','thigh')) for v in V]
  for j in range(NZ+1):
    f=ftop-(ftop-fbot)*j/NZ;z=z0+f*H;dz=.012*H
    pts=[v.co for v in V if OK[v.index] and abs(v.co.z-z)<dz]
    cx=sum(p.x for p in pts)/len(pts);cy=sum(p.y for p in pts)/len(pts)
    Q=sorted(set((round(p.x-cx,4),round(p.y-cy,4)) for p in pts))
    cr=lambda o,a,b:(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
    lo=[];up=[]
    for q in Q:
      while len(lo)>=2 and cr(lo[-2],lo[-1],q)<=0:lo.pop()
      lo.append(q)
    for q in reversed(Q):
      while len(up)>=2 and cr(up[-2],up[-1],q)<=0:up.pop()
      up.append(q)
    hull=lo[:-1]+up[:-1];R=[]
    for k in range(NA):
      a=-math.pi+(k+.5)/NA*2*math.pi;u=(math.cos(a),math.sin(a));best=0
      for e in range(len(hull)):
        p1=hull[e];p2=hull[(e+1)%len(hull)];dx,dy=p2[0]-p1[0],p2[1]-p1[1];den=u[0]*dy-u[1]*dx
        if abs(den)<1e-9:continue
        t=(p1[0]*dy-p1[1]*dx)/den;sg=(p1[0]*u[1]-p1[1]*u[0])/den
        if t>0 and -1e-6<=sg<=1+1e-6:best=max(best,t)
      R.append(best)
    for _ in range(4):R=[(R[k-1]+2*R[k]+R[(k+1)%NA])/4 for k in range(NA)]
    fl=1+max(0,(.5-f))*.15
    of=off*min(1,max(0,(ftop-f)/.05))-.002*max(0,1-(ftop-f)/.05)
    rings.append([(cx+math.cos(-math.pi+(k+.5)/NA*2*math.pi)*(R[k]*fl+of),cy+math.sin(-math.pi+(k+.5)/NA*2*math.pi)*(R[k]*fl+of),z) for k in range(NA)])
  vs=[p for r in rings for p in r];fs=[]
  for j in range(NZ):
    for k in range(NA):fs.append((j*NA+k,j*NA+(k+1)%NA,(j+1)*NA+(k+1)%NA,(j+1)*NA+k))
  m2=bpy.data.meshes.new('skirt');m2.from_pydata(vs,[],fs);m2.update()
  o=body.copy();o.data=m2;o.name='skirt';bpy.context.scene.collection.objects.link(o)
  for g in list(o.vertex_groups):o.vertex_groups.remove(g)
  kd=mathutils.kdtree.KDTree(len(V))
  for v in V:kd.insert(v.co,v.index)
  kd.balance()
  for g in body.vertex_groups:o.vertex_groups.new(name=g.name)
  for v in m2.vertices:
    acc={}
    for co,i,d in kd.find_n(v.co,6):
      for g in V[i].groups:
        n=body.vertex_groups[g.group].name;acc[n]=acc.get(n,0)+g.weight/(d+.003)
    t=sum(acc.values())
    for n,w in acc.items():o.vertex_groups[n].add([v.index],w/t,'REPLACE')
  return o,rings
def build_dress(body,ao,z0,H):
  me=body.data;V=me.vertices;D=[dom(body,v) for v in V]
  MD=_mat('dress',(.36,.16,.52,1));MT=_mat('trim',(.96,.94,.9,1));MS=_mat('shoes',(.95,.95,.95,1));MSo=_mat('sole',(.8,.8,.8,1));MG=_mat('gold',(.83,.69,.22,1))
  P=list(me.polygons);n=len(P);eye=[k for k,m in enumerate(me.materials) if m.name.startswith('eye')][0]
  top=[False]*n;so=[False]*n;cover=[False]*n
  SKI=[k for k,m in enumerate(me.materials) if m.name=='skin'][0]
  for p in P:
    if p.material_index!=eye:p.material_index=SKI
  for i,p in enumerate(P):
    if p.material_index==eye:continue
    c=p.center;f=(c.z-z0)/H;ds=[D[j] for j in p.vertices];ax=abs(c.x)
    arm=all(d.startswith(('upperarm','forearm')) for d in ds);hand=any(d.startswith('hand') for d in ds)
    torso=not any(d.startswith(('hand','head','neck','thigh','shin','foot')) for d in ds) and not all(d.startswith('forearm') for d in ds)
    vneck=c.y<-.02 and f>.775 and ax<(f-.775)*.6*H+.003   # high, shallow V
    if f<.062:so[i]=True
    elif (torso and .535<f<.865 and not vneck) or (arm and f>.4 and not hand):top[i]=True
    if top[i] or (.30<f<.60 and not arm and not hand):cover[i]=True
  bod=shell(body,'dress_top',top,.007,5,MD)
  # trim: V edge band, wrap diagonal (her left shoulder V -> right waist), cuffs
  bod.data.materials.append(MT)
  for p in bod.data.polygons:
    c=p.center;f=(c.z-z0)/H;ax=abs(c.x)
    if c.y<-.02 and f>.77 and ax<(f-.775)*.6*H+.003+.0055*H:p.material_index=1
    if c.y<-.02 and .56<f<=.775:
      xl=(f-.56)/(.775-.56)*(-.003*H)+(1-(f-.56)/(.775-.56))*(.045*H)   # diagonal toward wearer's left hip (+x)
      if abs(c.x-xl)<.0035*H:p.material_index=1
    if f>.4 and ax>.17*H and any(D[j].startswith('forearm') for j in p.vertices):
      pass
  # cuffs: lowest band of each sleeve
  arms=[p for p in bod.data.polygons if abs(p.center.x)>.16*H]
  for s in(-1,1):
    ps=[p for p in arms if p.center.x*s>0]
    if ps:
      # sleeve end = farthest from shoulder along the arm (min z for hanging A-pose arm)
      zmin=min(p.center.z for p in ps)
      for p in ps:
        if p.center.z<zmin+.018*H:p.material_index=1
  sk,rings=skirt(body,z0,H);sk.data.materials.append(MD);sk.data.materials.append(MT)
  NA=len(rings[0])
  for p in sk.data.polygons:
    c=p.center
    if c.y<0 and abs(c.x-.045*H)<.0035*H:p.material_index=1  # wrap edge down the skirt
  for o in(bod,sk):
    m=o.modifiers.new('sol','SOLIDIFY');m.thickness=.003;m.offset=1;m.use_rim=True
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier='sol')
  sh=shell(body,'shoes',so,.007,2,MS);sh.data.materials.append(MSo)
  for p in sh.data.polygons:
    if (p.center.z-z0)/H<.012:p.material_index=1
  # brooch: small gold leaf cluster at the wrap point, parented/skinned to spine
  zb=z0+.565*H;ys=[v.co.y for v in V if abs(v.co.z-zb)<.01*H and abs(v.co.x-.04*H)<.01*H]
  bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=.012*H,location=(.042*H,min(ys)-.012,zb))
  br=bpy.context.active_object;br.name='brooch';br.scale=(1.4,.35,.8);bpy.ops.object.transform_apply(scale=True)
  br.data.materials.append(MG)
  arm_mod=[m for m in body.modifiers if m.type=='ARMATURE']
  if arm_mod:
    am=br.modifiers.new('arm','ARMATURE');am.object=arm_mod[0].object;br.parent=body.parent
    g=br.vertex_groups.new(name='spine');g.add([v.index for v in br.data.vertices],1.0,'REPLACE')
  bm=bmesh.new();bm.from_mesh(me);bm.faces.ensure_lookup_table()
  kill=[bm.faces[i] for i in range(n) if cover[i] or so[i]];cov=set(f.index for f in kill)
  kill=[f for f in kill if all(l.index in cov for e in f.edges for l in e.link_faces)]
  bmesh.ops.delete(bm,geom=kill,context='FACES_ONLY');bm.to_mesh(me);bm.free()
  print('DRESS',[(o.name,len(o.data.polygons)) for o in(bod,sk,sh,br)])
  return [bod,sk,sh,br]
