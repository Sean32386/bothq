# Bot HQ realchar2: refsheet-driven character.
# Shape: image-to-3D mesh generated from Pixel's refsheet (see CREDITS.md for model + licence).
# Texture: our own orthographic projection of the refsheet front/side views, blended by normal, baked to UVs.
# Rig: same 17-bone skeleton as realchar (main.js drives it), Blender automatic weights.
import bpy,bmesh,sys,os,math,json
from mathutils import Vector
A=json.loads(os.environ['CFG'])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=A['mesh'])
ob=[o for o in bpy.data.objects if o.type=='MESH'][0]
bpy.context.view_layer.objects.active=ob;ob.select_set(True)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
for o in list(bpy.data.objects):
  if o!=ob:bpy.data.objects.remove(o)
me=ob.data
# clean: merge doubles, keep largest connected piece
bm=bmesh.new();bm.from_mesh(me);bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=1e-5)
bm.verts.ensure_lookup_table();seen=set();parts=[]
for v in bm.verts:
  if v.index in seen:continue
  st=[v];comp=[];seen.add(v.index)
  while st:
    x=st.pop();comp.append(x)
    for e in x.link_edges:
      o=e.other_vert(x)
      if o.index not in seen:seen.add(o.index);st.append(o)
  parts.append(comp)
parts.sort(key=len,reverse=True);print('parts',[len(p) for p in parts[:5]])
small=[v for p in parts[1:] if len(p)<0.02*len(parts[0]) for v in p]
bmesh.ops.delete(bm,geom=small,context='VERTS');bm.to_mesh(me);bm.free()
# decimate for web
m=ob.modifiers.new('dec','DECIMATE');m.ratio=A.get('ratio',.14);bpy.ops.object.modifier_apply(modifier='dec')
bpy.ops.object.shade_smooth()
zs=[v.co.z for v in me.vertices];z0=min(zs);H=max(zs)-z0
print('faces',len(me.polygons),'H',H)
# UVs
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.004);bpy.ops.object.mode_set(mode='OBJECT')
# projection material
mat=bpy.data.materials.new('baked');mat.use_nodes=True;nt=mat.node_tree;N=nt.nodes;L=nt.links
for n in list(N):N.remove(n)
out=N.new('ShaderNodeOutputMaterial');em=N.new('ShaderNodeEmission');L.new(em.outputs[0],out.inputs[0])
geo=N.new('ShaderNodeNewGeometry')
sx=N.new('ShaderNodeSeparateXYZ');L.new(geo.outputs['Position'],sx.inputs[0])
sn=N.new('ShaderNodeSeparateXYZ');L.new(geo.outputs['Normal'],sn.inputs[0])
def math_(op,a,b=None):
  n=N.new('ShaderNodeMath');n.operation=op
  for i,v in enumerate([a,b]):
    if v is None:continue
    if isinstance(v,(int,float)):n.inputs[i].default_value=v
    else:L.new(v,n.inputs[i])
  return n.outputs[0]
def img(path,u,v):
  t=N.new('ShaderNodeTexImage');t.image=bpy.data.images.load(path);t.extension='EXTEND';t.interpolation='Cubic'
  c=N.new('ShaderNodeCombineXYZ');L.new(u,c.inputs[0]);L.new(v,c.inputs[1]);L.new(c.outputs[0],t.inputs[0]);return t.outputs[0]
F=A['front'];S=A['side']
_sl=[v.co.y for v in me.vertices if abs(v.co.z-(z0+S['fit_f']*H))<.01 and abs(v.co.x)<.12]
_y0,_y1=min(_sl),max(_sl);_a,_b=S['fit_px']   # image px back..front ; front is -y
S['kx']=(_y1-_y0)/(_b-_a);S['cx']=_a+_y1/S['kx'];print('side fit',_y0,_y1,S['kx'],S['cx'])
# image uv: u=(px)/W, v=1-(py)/Hpx ; px=cx+X/k ; py=ytop+(ztop-Z)/k
def uv_of(cfg,coord,sign):
  k=cfg['k'];u=math_('DIVIDE',math_('ADD',math_('MULTIPLY',coord,sign/cfg['kx']),cfg['cx']),cfg['W'])
  py=math_('ADD',math_('MULTIPLY',math_('SUBTRACT',cfg['ztop'],sx.outputs[2]),1/k),cfg['ytop'])
  v=math_('SUBTRACT',1.0,math_('DIVIDE',py,cfg['Hpx']));return u,v
fu,fv=uv_of(F,sx.outputs[0],1.0)
su,sv=uv_of(S,sx.outputs[1],-1.0)   # side image: front (-y) is to the right
cf=img(F['img'],fu,fv);cs=img(S['img'],su,sv);cb=img(F['blur'],fu,fv)
# weights
def pw(x,p):return math_('POWER',math_('MAXIMUM',x,0.0),p)
wf=pw(math_('MULTIPLY',sn.outputs[1],-1.0),A.get('pf',1.0))
f_=math_('DIVIDE',math_('SUBTRACT',sx.outputs[2],z0),H)
ws=math_('MULTIPLY',pw(math_('ABSOLUTE',sn.outputs[0]),A.get('ps',5.0)),1.0)
wb=pw(sn.outputs[1],2.0)
# back colour: blurred front, but hair over head/upper back
noise2=N.new('ShaderNodeTexNoise');noise2.inputs['Scale'].default_value=9;L.new(geo.outputs['Position'],noise2.inputs[0])
hairmask=math_('MAXIMUM',math_('GREATER_THAN',f_,.865),math_('MULTIPLY',math_('GREATER_THAN',math_('ADD',f_,math_('MULTIPLY',math_('SUBTRACT',noise2.outputs[0],.5),.12)),A.get('hairlow',.70)),math_('LESS_THAN',math_('ABSOLUTE',sx.outputs[0]),.11*H)))
hc=N.new('ShaderNodeRGB');hc.outputs[0].default_value=A['hair']+[1]
noise=N.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=60;L.new(geo.outputs['Position'],noise.inputs[0])
hcn=N.new('ShaderNodeMix');hcn.data_type='RGBA';hcn.blend_type='MULTIPLY';hcn.inputs[0].default_value=.35;L.new(hc.outputs[0],hcn.inputs[6]);L.new(noise.outputs['Color'],hcn.inputs[7])
back=N.new('ShaderNodeMix');back.data_type='RGBA';L.new(hairmask,back.inputs[0]);L.new(cb,back.inputs[6]);L.new(hcn.outputs[2],back.inputs[7])
tot=math_('ADD',math_('ADD',wf,ws),math_('ADD',wb,1e-4))
def mixw(acc,col,w):
  m=N.new('ShaderNodeMix');m.data_type='RGBA';L.new(math_('DIVIDE',w,tot),m.inputs[0]);L.new(acc,m.inputs[6]);L.new(col,m.inputs[7]);return m.outputs[2]
# sequential normalised blend: start from back, add side, add front
c1=mixw(back.outputs[2],cs,ws);c2=mixw(c1,cf,wf)
# simpler & exact: weighted sum
def scale(col,w):
  m=N.new('ShaderNodeVectorMath');m.operation='SCALE';L.new(col,m.inputs[0]);L.new(math_('DIVIDE',w,tot),m.inputs[3]);return m.outputs[0]
def add(a,b):
  m=N.new('ShaderNodeVectorMath');m.operation='ADD';L.new(a,m.inputs[0]);L.new(b,m.inputs[1]);return m.outputs[0]
sh=N.new('ShaderNodeMix');sh.data_type='RGBA';L.new(math_('GREATER_THAN',f_,A.get('sidetop',.845)),sh.inputs[0]);L.new(cs,sh.inputs[6]);L.new(hcn.outputs[2],sh.inputs[7])
col=add(add(scale(cf,wf),scale(sh.outputs[2],ws)),scale(back.outputs[2],wb))
L.new(col,em.inputs[0])
me.materials.clear();me.materials.append(mat)
tex=bpy.data.images.new('baked',A.get('tex',2048),A.get('tex',2048));tn=N.new('ShaderNodeTexImage');tn.image=tex;N.active=tn;tn.select=True
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.device='CPU';sc.cycles.samples=1;sc.render.bake.margin=8
bpy.ops.object.bake(type='EMIT')
tex.filepath_raw=A['outtex'];tex.file_format='PNG';tex.save()
# final material: baked texture, rough cloth
for n in list(N):N.remove(n)
out=N.new('ShaderNodeOutputMaterial');bs=N.new('ShaderNodeBsdfPrincipled');L.new(bs.outputs[0],out.inputs[0])
tn=N.new('ShaderNodeTexImage');tn.image=tex;L.new(tn.outputs[0],bs.inputs['Base Color']);bs.inputs['Roughness'].default_value=.75
# ---- skeleton fitted to this mesh
J=A['joints']   # image-front px for arm joints -> mesh xz; depth from local slice centre
V=[v.co.copy() for v in me.vertices]
def depth(x,z,r=.04):
  ys=[p.y for p in V if abs(p.x-x)<r and abs(p.z-z)<r];return sum(ys)/len(ys) if ys else 0
def P(px,py):
  x=(px-F['cx'])*F['kx'];z=F['ztop']-(py-F['ytop'])*F['k'];return Vector((x,depth(x,z),z))
Zf=lambda f:z0+f*H
cx0=sum(p.x for p in V if abs(p.z-Zf(.5))<.02)/max(1,len([p for p in V if abs(p.z-Zf(.5))<.02]))
arm=bpy.data.armatures.new('rig');ao=bpy.data.objects.new('rig',arm);sc.collection.objects.link(ao)
bpy.context.view_layer.objects.active=ao;bpy.ops.object.mode_set(mode='EDIT')
def B(n,h,t,p=None):
  b=arm.edit_bones.new(n);b.head=h;b.tail=t
  if p:b.parent=arm.edit_bones[p];b.use_connect=False
  return b
C=lambda f:Vector((cx0,depth(cx0,Zf(f),.06),Zf(f)))
B('hips',C(.53),C(.6));B('spine',C(.6),C(.72),'hips');B('chest',C(.72),C(.84),'spine');B('neck',C(.845),C(.89),'chest');B('head',C(.89),C(1.0),'neck')
for S_,j in J.items():
  sh,el,wr,tp=[P(*q) for q in j['arm']]
  B('upperarm.'+S_,sh,el,'chest');B('forearm.'+S_,el,wr,'upperarm.'+S_);B('hand.'+S_,wr,tp,'forearm.'+S_)
  hp,kn,an=[P(*q) for q in j['leg']]
  B('thigh.'+S_,hp,kn,'hips');B('shin.'+S_,kn,an,'thigh.'+S_);B('foot.'+S_,an,an+Vector((0,-.1,-.03)),'shin.'+S_)
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);ao.select_set(True);bpy.context.view_layer.objects.active=ao
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
nz=sum(1 for v in me.vertices if not v.groups);print('unweighted verts',nz)
if nz:  # fallback: nearest bone for any vertex auto-weights missed
  bones=[(b.name,ao.matrix_world@b.head_local,ao.matrix_world@b.tail_local) for b in arm.bones]
  def segd(p,a,b):
    ab=b-a;t=max(0,min(1,(p-a).dot(ab)/ab.length_squared));return (a+ab*t-p).length
  for v in me.vertices:
    if not v.groups:
      n=min(bones,key=lambda bb:segd(v.co,bb[1],bb[2]))[0]
      g=ob.vertex_groups.get(n) or ob.vertex_groups.new(name=n);g.add([v.index],1.0,'REPLACE')
ob.name='body'
# normalise for the web: feet on origin, waist centred, target height (armature object transform)
_w=[v.co for v in me.vertices if abs(v.co.z-Zf(.5))<.02]
_cx=sum(p.x for p in _w)/len(_w);_cy=sum(p.y for p in _w)/len(_w);_s=A.get('height',1.68)/H
ao.scale=(_s,_s,_s);ao.location=(-_cx*_s,-_cy*_s,-z0*_s)
bpy.ops.export_scene.gltf(filepath=A['out'],export_format='GLB',export_skins=True,export_animations=False,export_yup=True,export_normals=True,export_image_format='WEBP' if A.get('webp') else 'AUTO')
print('EXPORTED',A['out'])
