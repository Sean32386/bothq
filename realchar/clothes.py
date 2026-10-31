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
  objs=[shell(body,'blazer',bl,.011,5,M['blazer']),shell(body,'shirt',sh,.005,5,M['shirt']),shell(body,'pants',pa,.006,4,M['pants']),shell(body,'shoes',so,.005,2,M['shoes'])]
  # hide body under clothes (keep a margin under shirt V and cuffs)
  bm=bmesh.new();bm.from_mesh(me);bm.faces.ensure_lookup_table()
  kill=[bm.faces[i] for i in range(n) if (bl[i] or pa[i] or so[i] or sh[i])]
  # only kill faces whose neighbours are also covered (keeps border strip)
  cov=set(f.index for f in kill)
  kill=[f for f in kill if all(l.index in cov for e in f.edges for l in e.link_faces)]
  bmesh.ops.delete(bm,geom=kill,context='FACES_ONLY');bm.to_mesh(me);bm.free()
  print('CLOTHES',[ (o.name,len(o.data.polygons)) for o in objs],'body polys',len(me.polygons))
  return objs
