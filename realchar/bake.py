import bpy
def bake(body,res=2048,out='/tmp/skin'):
  sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=4;sc.cycles.device='CPU'
  uv=body.data.uv_layers.new(name='atlas');body.data.uv_layers.active=uv
  bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
  bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.004);bpy.ops.object.mode_set(mode='OBJECT')
  mat=bpy.data.materials.new('skinbake');mat.use_nodes=True;nt=mat.node_tree;N=nt.nodes;L=nt.links
  for x in list(N):N.remove(x)
  out_n=N.new('ShaderNodeOutputMaterial');em=N.new('ShaderNodeEmission');bs=N.new('ShaderNodeBsdfPrincipled')
  tc=N.new('ShaderNodeTexCoord')
  def noise(scale,det=6,rough=.55):
    n=N.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=scale;n.inputs['Detail'].default_value=det;n.inputs['Roughness'].default_value=rough;L.new(tc.outputs['Object'],n.inputs['Vector']);return n
  def vor(scale):
    n=N.new('ShaderNodeTexVoronoi');n.feature='DISTANCE_TO_EDGE' if False else 'F1';n.inputs['Scale'].default_value=scale;L.new(tc.outputs['Object'],n.inputs['Vector']);return n
  n1=noise(9);n2=noise(60,8,.6);pv=vor(900)
  # albedo: near-white (tinted by avatar skin in three), mottling + reddish blotch
  r1=N.new('ShaderNodeValToRGB');r1.color_ramp.elements[0].color=(.86,.80,.78,1);r1.color_ramp.elements[1].color=(1,.97,.95,1);L.new(n1.outputs['Fac'],r1.inputs['Fac'])
  mx=N.new('ShaderNodeMixRGB');mx.blend_type='MULTIPLY';mx.inputs['Fac'].default_value=.35;L.new(r1.outputs['Color'],mx.inputs[1])
  r2=N.new('ShaderNodeValToRGB');r2.color_ramp.elements[0].color=(.93,.86,.85,1);r2.color_ramp.elements[1].color=(1,1,1,1);L.new(n2.outputs['Fac'],r2.inputs['Fac']);L.new(r2.outputs['Color'],mx.inputs[2])
  # roughness
  rm=N.new('ShaderNodeMath');rm.operation='MULTIPLY_ADD';rm.inputs[1].default_value=.25;rm.inputs[2].default_value=.36;L.new(n2.outputs['Fac'],rm.inputs[0])
  rp=N.new('ShaderNodeMath');rp.operation='MULTIPLY_ADD';rp.inputs[1].default_value=.18;L.new(pv.outputs['Distance'],rp.inputs[0]);L.new(rm.outputs[0],rp.inputs[2])
  # normal: pores + fine wrinkles
  hb=N.new('ShaderNodeMath');hb.operation='MULTIPLY_ADD';hb.inputs[1].default_value=.6;L.new(pv.outputs['Distance'],hb.inputs[0]);L.new(n2.outputs['Fac'],hb.inputs[2])
  bp=N.new('ShaderNodeBump');bp.inputs['Strength'].default_value=.35;bp.inputs['Distance'].default_value=.0006;L.new(hb.outputs[0],bp.inputs['Height']);L.new(bp.outputs['Normal'],bs.inputs['Normal'])
  img={}
  for k in['diff','rough','nor']:
    im=bpy.data.images.new('skin_'+k,res,res,float_buffer=False);im.colorspace_settings.name='sRGB' if k=='diff' else 'Non-Color';img[k]=im
  tn=N.new('ShaderNodeTexImage');N.active=tn
  saved=[s.material for s in body.material_slots]
  for s in body.material_slots:
    if not s.material or not s.material.name.startswith('eye'):s.material=mat
  sc.render.bake.margin=8
  for k,kind,src in[('diff','EMIT',mx.outputs['Color']),('rough','EMIT',rp.outputs[0]),('nor','NORMAL',None)]:
    tn.image=img[k]
    for l in list(out_n.inputs['Surface'].links):L.remove(l)
    if kind=='EMIT':L.new(src,em.inputs['Color']);L.new(em.outputs[0],out_n.inputs['Surface'])
    else:L.new(bs.outputs[0],out_n.inputs['Surface'])
    bpy.ops.object.bake(type=kind,normal_space='TANGENT',use_clear=True)
    img[k].filepath_raw=f'{out}_{k}.png';img[k].file_format='PNG';img[k].save();print('BAKED',k)
  for s,m in zip(body.material_slots,saved):s.material=m
  body.data.uv_layers.active=uv
  # make atlas the only/first UV so glTF TEXCOORD_0 = atlas
  for nm in [l.name for l in body.data.uv_layers if l.name!='atlas']:
    try:body.data.uv_layers.remove(body.data.uv_layers[nm])
    except Exception as e:print('uvrm',e)
  print('UVS',[l.name for l in body.data.uv_layers])
