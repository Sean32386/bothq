# Blender 4.2 CLI: build realistic Sage pilot from Blender Studio Human Base Meshes (CC0)
import bpy,bmesh,math,sys
from mathutils import Vector
F='/tmp/hbm/human-base-meshes-bundle-v1.4.1/human_base_meshes_bundle.blend'
OUT=sys.argv[sys.argv.index('--')+1]
bpy.ops.wm.read_factory_settings(use_empty=True)
with bpy.data.libraries.load(F) as (src,dst):dst.collections=['Body Female - Realistic']
col=dst.collections[0];bpy.context.scene.collection.children.link(col)
body=bpy.data.objects['GEO-body_female_realistic'];eyes=[o for o in col.all_objects if '.eye.' in o.name]
for o in list(col.all_objects):o.make_local() if o.library else None
body=[o for o in bpy.context.scene.objects if o.name.startswith('GEO-body_female_realistic') and '.eye' not in o.name][0]
eyes=[o for o in bpy.context.scene.objects if '.eye.' in o.name]
bpy.context.view_layer.objects.active=body
for o in bpy.context.scene.objects:o.select_set(False)
body.select_set(True)
mr=[m for m in body.modifiers if m.type=='MULTIRES'][0];print('MULTIRES total',mr.total_levels)
lvl=min(int(sys.argv[-1]) if sys.argv[-1].isdigit() else 1,mr.total_levels);mr.levels=lvl;mr.render_levels=lvl
bpy.ops.object.modifier_apply(modifier=mr.name)
for e in eyes:
  e.select_set(True)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
import mathutils
_xs=[v.co.x for v in body.data.vertices];_bx=(min(_xs)+max(_xs))/2;print('CENTER shift',_bx)
for _o in [body]+eyes:
  for v in _o.data.vertices:v.co.x-=_bx
import sys as _s;_s.path.insert(0,'/workspace/bothq/realchar');import figure;figure.shape(body)
me=body.data;print('verts',len(me.vertices),'uv',len(me.uv_layers))
zs=[v.co.z for v in me.vertices];z0=min(zs);H=max(zs)-z0;print('H',H,'z0',z0)
print("BODYX",min(v.co.x for v in me.vertices),max(v.co.x for v in me.vertices),"Y",min(v.co.y for v in me.vertices),max(v.co.y for v in me.vertices))
# fingertip (max |x|)
tipR=max(me.vertices,key=lambda v:v.co.x).co.copy();tipL=max(me.vertices,key=lambda v:-v.co.x).co.copy()
Z=lambda f:z0+f*H
sh={1:Vector((.105*H,0,Z(.815))),-1:Vector((-.105*H,0,Z(.815)))}
tip={1:tipR,-1:tipL}
# armature
arm=bpy.data.armatures.new('rig');ao=bpy.data.objects.new('rig',arm);bpy.context.scene.collection.objects.link(ao)
bpy.context.view_layer.objects.active=ao;bpy.ops.object.mode_set(mode='EDIT')
def B(n,h,t,p=None):
  b=arm.edit_bones.new(n);b.head=h;b.tail=t
  if p:b.parent=arm.edit_bones[p];b.use_connect=False
  return b
B('hips',Vector((0,0,Z(.53))),Vector((0,0,Z(.6))))
B('spine',Vector((0,0,Z(.6))),Vector((0,0,Z(.72))),'hips')
B('chest',Vector((0,0,Z(.72))),Vector((0,0,Z(.84))),'spine')
B('neck',Vector((0,0,Z(.845))),Vector((0,0,Z(.89))),'chest')
B('head',Vector((0,0,Z(.89))),Vector((0,0,Z(1.0))),'neck')
for s,S in((1,'L'),(-1,'R')):
  a=sh[s];t=tip[s];el=a+(t-a)*.42;wr=a+(t-a)*.8
  B('upperarm.'+S,a,el,'chest');B('forearm.'+S,el,wr,'upperarm.'+S);B('hand.'+S,wr,t,'forearm.'+S)
  hp=Vector((s*.055*H,0,Z(.52)));kn=Vector((s*.055*H,0,Z(.285)));an=Vector((s*.055*H,.0,Z(.045)))
  B('thigh.'+S,hp,kn,'hips');B('shin.'+S,kn,an,'thigh.'+S);B('foot.'+S,an,an+Vector((0,-.1,-.03)),'shin.'+S)
bpy.ops.object.mode_set(mode='OBJECT')
# materials by region
mats={}
for n,c in [('skin',(0.79,0.56,0.42,1)),('top',(0.36,0.16,0.53,1)),('shirt',(0.96,0.94,0.9,1)),('pants',(0.16,0.17,0.2,1)),('shoes',(0.1,0.08,0.07,1)),('eye',(0.95,0.95,0.95,1))]:
  m=bpy.data.materials.new(n);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=c;mats[n]=m
for n in['skin','top','shirt','pants','shoes']:me.materials.append(mats[n])
idx={n:i for i,n in enumerate(['skin','top','shirt','pants','shoes'])}
V=me.vertices
for p in me.polygons:
  c=p.center;f=(c.z-z0)/H;ax=abs(c.x)
  m='skin'
  if f<.055:m='shoes'
  elif f<.56 and ax<.13*H:m='pants'
  elif f<.845 and ax<.1*H:
    m='top'
    if ax<.035*H and .72<f<.835 and c.y<0:m='shirt'
  else:
    # arms: covered up to ~78% of arm length
    if ax>=.09*H and f<.85 and f>.3:
      s=1 if c.x>0 else -1;a=sh[s];t=tip[s];d=(c-a).dot((t-a).normalized())/(t-a).length
      m='top' if d<.76 else 'skin'
    elif f<.56:m='pants'
  p.material_index=idx[m]
for e in eyes:
  e.data.materials.clear();e.data.materials.append(mats['eye'])
# join eyes into body (shared node/quantization in glTF)
for o in bpy.context.scene.objects:o.select_set(False)
for e in eyes:e.select_set(True)
body.select_set(True);bpy.context.view_layer.objects.active=body;bpy.ops.object.join();eyes=[]
me=body.data;EYEI=[i for i,m in enumerate(me.materials) if m and m.name.startswith('eye')][0];EYEV=set(v for p in me.polygons if p.material_index==EYEI for v in p.vertices);print('joined eye verts',len(EYEV))
# skin: auto weights
for o in bpy.context.scene.objects:o.select_set(False)
body.select_set(True);[e.select_set(True) for e in eyes];ao.select_set(True);bpy.context.view_layer.objects.active=ao
bpy.ops.object.parent_set(type='ARMATURE_NAME')
# custom smooth weights: inverse-distance to bone segments, limbs side-restricted
bones=[(b.name,ao.matrix_world@b.head_local,ao.matrix_world@b.tail_local) for b in arm.bones]
def segd(p,a,b):
  ab=b-a;t=max(0,min(1,(p-a).dot(ab)/ab.length_squared));return (a+ab*t-p).length
vg={g.name:g for g in body.vertex_groups}
for n,_,_ in bones:
  if n not in vg:vg[n]=body.vertex_groups.new(name=n)
for v in body.data.vertices:
  for g in list(v.groups):pass
  p=v.co;f=(p.z-z0)/H;side='L' if p.x>0 else 'R'
  cand=[]
  for n,a,b in bones:
    if n.endswith('.L') and side!='L':continue
    if n.endswith('.R') and side!='R':continue
    if n.startswith(('upperarm','forearm','hand')) and abs(p.x)<.075*H:continue
    if n.startswith(('thigh','shin','foot')) and f>.56:continue
    if n.startswith('thigh') and f>.5 and abs(p.x)<.012*H:continue
    cand.append((segd(p,a,b),n))
  cand.sort();d0=cand[0][0]+1e-4;sel=[(d,n) for d,n in cand[:3] if d<d0*1.5+.015]
  ws=[(1/(d+.004)**4,n) for d,n in sel];t=sum(w for w,_ in ws)
  for w,n in ws:vg[n].add([v.index],w/t,'REPLACE')
print('weighted')
# eye verts rigid to head
for vi in EYEV:
  for g in body.vertex_groups:g.remove([vi])
  body.vertex_groups['head'].add([vi],1.0,'REPLACE')
# eyes: rigid to head
for e in eyes:
  for g in list(e.vertex_groups):e.vertex_groups.remove(g)
  vg=e.vertex_groups.new(name='head');vg.add([v.index for v in e.data.vertices],1.0,'REPLACE')
print('groups',len(body.vertex_groups),[g.name for g in body.vertex_groups])
for e in eyes:
  import mathutils;cs=[e.matrix_world@v.co for v in e.data.vertices];print("EYE",e.name,e.parent and e.parent.name,[m.type for m in e.modifiers],min(c.z for c in cs),max(c.z for c in cs),min(c.x for c in cs),max(c.x for c in cs),e.matrix_world.to_scale())
import bake,clothes
bake.bake(body)
clothes.build(body,ao,z0,H)
bpy.ops.export_scene.gltf(filepath=OUT,export_format='GLB',export_skins=True,export_animations=False,export_apply=False,export_yup=True,use_selection=False,export_normals=True,export_tangents=False)
print('EXPORTED',OUT)
