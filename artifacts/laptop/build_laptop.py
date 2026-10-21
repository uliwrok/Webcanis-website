import bpy, math, json
from pathlib import Path
from mathutils import Vector

OUT=Path(r'C:/Users/wroks/Documents/GitHub/Webcanis website/artifacts/laptop')
# A dedicated scene preserves everything already open in Blender.
scene=bpy.data.scenes.new('Generic Laptop • Studio')
bpy.context.window.scene=scene
scene.unit_settings.system='METRIC'
scene.unit_settings.scale_length=1
asset=bpy.data.collections.new('Laptop Asset')
scene.collection.children.link(asset)
studio=bpy.data.collections.new('Studio • excluded from GLB')
scene.collection.children.link(studio)

def material(name,color,metal=0,rough=.4):
    m=bpy.data.materials.new(name); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal
    p.inputs['Roughness'].default_value=rough
    m.diffuse_color=(*color,1)
    return m

al=material('Aluminum • satin silver',(.48,.52,.57),.82,.28)
edge=material('Aluminum • machined edge',(.63,.67,.72),.88,.22)
dark=material('Graphite polymer',(.012,.015,.020),.05,.38)
rubber=material('Rubber and port recesses',(.005,.007,.009),0,.68)
pad=material('Trackpad • frosted silver',(.36,.40,.45),.65,.36)
glass=material('Camera glass',(.015,.035,.05),.3,.12)
key=material('Keyboard • shared 1K legend atlas',(.015,.015,.015),0,.42)
tex=key.node_tree.nodes.new('ShaderNodeTexImage')
tex.image=bpy.data.images.load(str(OUT/'keyboard-atlas.png'));tex.image.pack()
key.node_tree.links.new(tex.outputs['Color'],key.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
screenmat=material('Screen • replace image here',(1,1,1),0,.25)
p=screenmat.node_tree.nodes.get('Principled BSDF')
p.inputs['Specular IOR Level'].default_value=.18
t=screenmat.node_tree.nodes.new('ShaderNodeTexImage');t.name='Screen_Image';t.label='Replace with any 16:9 image'
t.image=bpy.data.images.load(str(OUT/'screen-placeholder.png'));t.image.pack()
screenmat.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
screenmat.node_tree.links.new(t.outputs['Color'],p.inputs['Emission Color'])
p.inputs['Emission Strength'].default_value=.45

def empty(name,parent=None,loc=(0,0,0)):
    o=bpy.data.objects.new(name,None);asset.objects.link(o);o.parent=parent;o.location=loc
    return o
root=empty('Laptop_Root')
root['dimensions_m']='0.350 wide × 0.235 deep; approximately 0.022 closed height'
root['forward']='-Y in Blender; +Z in glTF'
hinge=empty('Lid_Hinge',root,(0,.107,.014))
hinge.rotation_euler.x=math.radians(-105)
hinge['closed_angle_x']=0.0
hinge['open_angle_x']=math.radians(-105)
hinge['instructions']='Rotate local X: 0 closed, -1.832596 open. Screen is a child of this pivot.'

def rounded(name,w,d,h,r,bevel,loc,mat,parent=root,segments=6,topmat=None,tile=None):
    verts=[]
    # Four rings give small real chamfers with broad rounded plan corners.
    for inset,z in [(bevel,-h/2),(0,-h/2+bevel),(0,h/2-bevel),(bevel,h/2)]:
        rr=max(r-inset,.00001)
        for cx,cy,a in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),(-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)]:
            for j in range(segments+1):
                ang=math.radians(a+j*90/segments)
                verts.append((cx+rr*math.cos(ang),cy+rr*math.sin(ang),z))
    n=4*(segments+1)
    faces=[tuple(reversed(range(n)))]
    for ring in range(3):
        for j in range(n):
            k=(j+1)%n
            faces.append((ring*n+j,ring*n+k,(ring+1)*n+k,(ring+1)*n+j))
    faces.append(tuple(range(3*n,4*n)))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);asset.objects.link(obj);obj.parent=parent;obj.location=loc
    mesh.materials.append(mat)
    for f in mesh.polygons: f.use_smooth=len(f.vertices)==4
    if topmat:
        mesh.materials.append(topmat);mesh.polygons[-1].material_index=1
    uv=mesh.uv_layers.new(name='UVMap')
    for f in mesh.polygons:
        for li in f.loop_indices:
            v=mesh.vertices[mesh.loops[li].vertex_index].co
            u=v.x/w+.5; vv=v.y/d+.5
            if tile is not None:
                u=((tile%16)+u)/16;vv=1-((tile//16)+1-vv)/8
            uv.data[li].uv=(u,vv)
    return obj

base=[]
base.append(rounded('Lower shell',.35,.235,.010,.009,.0007,(0,0,.002),al))
base.append(rounded('Fine perimeter seam',.3485,.2335,.0007,.0085,.00015,(0,0,.0072),rubber))
base.append(rounded('Palmrest deck',.35,.235,.0024,.009,.0004,(0,0,.0085),al))
base.append(rounded('Keyboard recessed well',.292,.112,.0008,.004,.0002,(0,.037,.0098),rubber))

rows=json.loads((OUT/'keyboard-layout.json').read_text())
index=0
for rowno,row in enumerate(rows):
    total=sum(item[1] for item in row);unit=.282/total
    x=-.141
    y=.082-rowno*.0185
    for label,width in row:
        kw=width*unit-.0022;kh=.012 if rowno==0 else .0155
        o=rounded('Key '+(label or 'Space'),kw,kh,.0022,.0017,.00035,(x+width*unit/2,y,.01115),dark,segments=3,topmat=key,tile=index)
        base.append(o);x+=width*unit;index+=1

base.append(rounded('Trackpad precision seam',.117,.065,.0005,.004,.0001,(0,-.068,.0099),rubber))
base.append(rounded('Trackpad',.1158,.0638,.00055,.0036,.00012,(0,-.068,.01005),pad))
# Rear speaker bar; a shared mesh of short slots instead of thousands of perforations.
for i in range(57):
    x=(i-28)*.0047
    base.append(rounded('Speaker vent',.0025,.0011,.00015,.0005,.00003,(x,.099,.00978),rubber,segments=2))
# A small unbranded power key beyond the keyboard, with an LED.
base.append(rounded('Power key',.009,.005,.0005,.002,.0001,(.159,.081,.010),dark,segments=4))
base.append(rounded('Power indicator',.002,.0005,.0001,.0002,.00002,(.159,.081,.0103),edge,segments=2))
# Generic side I/O recesses with metallic borders and dark openings.
for side,ports in [(-1,[(.064,.009,.003),(.039,.009,.003),(.008,.016,.004)]),(1,[(.061,.015,.004),(.026,.015,.004),(-.011,.023,.0018)])]:
    for y,w,h in ports:
        outer=rounded('I/O metal rim',w,h,.0003,min(h*.35,.001),.00005,(side*.17505,y,.0025),edge,segments=3)
        outer.rotation_euler=(math.pi/2,0,math.pi/2)
        inner=rounded('I/O dark cavity',w-.001,h-.0007,.00035,min(h*.25,.0007),.00004,(side*.17525,y,.0025),rubber,segments=3)
        inner.rotation_euler=outer.rotation_euler
        base.extend([outer,inner])
for x in [-.135,.135]:
    for y in [-.083,.078]:
        base.append(rounded('Rubber foot',.027,.009,.0015,.004,.0003,(x,y,-.0036),rubber,segments=4))

def cylinder(name,r,depth,loc,mat,parent=root):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=r,depth=depth,location=(0,0,0))
    o=bpy.context.object;o.name=name
    for c in list(o.users_collection):c.objects.unlink(o)
    asset.objects.link(o);o.parent=parent;o.location=loc
    o.rotation_euler.y=math.pi/2;o.data.materials.append(mat)
    for f in o.data.polygons:f.use_smooth=len(f.vertices)==4
    return o
for x in [-.115,.115]:
    base.append(cylinder('Hinge barrel',.0045,.042,(x,.107,.012),dark))
    base.append(cylinder('Hinge end cap',.00455,.002,(x-.022,.107,.012),edge))

lid=[]
lid.append(rounded('Display aluminum shell',.35,.222,.0065,.009,.0006,(0,-.111,.0046),al,hinge))
lid.append(rounded('Display edge gasket',.3465,.2185,.0008,.008,.00018,(0,-.111,.001),rubber,hinge))
lid.append(rounded('Display graphite bezel',.3435,.2155,.00065,.007,.00015,(0,-.111,.0004),dark,hinge))
# A flat, independent, rectangular surface with full 0..1 UVs, facing out of the lid.
w=.325;h=w*9/16;cy=-.116
mesh=bpy.data.meshes.new('Screen_Surface')
mesh.from_pydata([(-w/2,cy-h/2,-.00003),(w/2,cy-h/2,-.00003),(w/2,cy+h/2,-.00003),(-w/2,cy+h/2,-.00003)],[],[(3,2,1,0)])
mesh.materials.append(screenmat);uv=mesh.uv_layers.new(name='Screen_UV')
# Top of lid is negative Y; keep image upright when viewed from the front.
coords=[(0,1),(1,1),(1,0),(0,0)]
for li in mesh.polygons[0].loop_indices:uv.data[li].uv=coords[mesh.loops[li].vertex_index]
screen=bpy.data.objects.new('Screen_Surface',mesh);asset.objects.link(screen);screen.parent=hinge
screen['aspect_ratio']='16:9';screen['texture_slot']='Screen_Image';screen['integration']='Replace baseColorTexture and emissiveTexture together; three.js texture.flipY=false, SRGBColorSpace.'
# Discreet webcam, no notch or logos.
cam=rounded('Webcam surround',.006,.003,.00025,.0014,.00005,(0,-.212,-.00008),rubber,hinge,segments=4);lid.append(cam)
cam=rounded('Webcam lens',.0018,.0018,.0003,.0008,.00005,(0,-.212,-.00025),glass,hinge,segments=6);lid.append(cam)

def join(objects,name,parent):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join();o=bpy.context.object;o.name=name
    # All source meshes already share the same parent.
    return o
baseobj=join(base,'Laptop_Base',root)
lidobj=join(lid,'Lid_Shell',hinge)
scene.render.fps=30;scene.frame_start=1;scene.frame_end=46
hinge.rotation_euler.x=math.radians(-105);hinge.keyframe_insert(data_path='rotation_euler',frame=1)
hinge.rotation_euler.x=0;hinge.keyframe_insert(data_path='rotation_euler',frame=46)
hinge.animation_data.action.name='CloseLid'
scene.frame_set(1)

# Studio only. It is never included in the GLB export selection.
world=bpy.data.worlds.new('Soft neutral studio');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.22,.25,.30,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.45
scene.world=world
def area(name,loc,power,size,color,target=(0,0,.08),size_y=None):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
    o=bpy.data.objects.new(name,data);studio.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    return o
area('Large softbox',(-.35,-.28,.65),14,.5,(1,.95,.90))
area('Cool fill',(.4,-.1,.35),8,.38,(.78,.87,1))
area('Lid edge strip',(.05,.4,.46),19,.35,(1,1,1))
data=bpy.data.cameras.new('Hero camera');camera=bpy.data.objects.new('Hero camera',data);studio.objects.link(camera)
camera.location=(.43,-.60,.38);target=Vector((0,.008,.111))
camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();data.type='ORTHO';data.ortho_scale=.56;data.lens=55
scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=1500;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.view_settings.view_transform='AgX'
scene.render.filepath=str(OUT/'laptop-hero.png')

bpy.ops.object.select_all(action='DESELECT')
for o in asset.objects:o.select_set(True)
bpy.context.view_layer.objects.active=baseobj
bpy.context.view_layer.update()
triangles=0
for o in asset.objects:
    if o.type=='MESH':o.data.calc_loop_triangles();triangles+=len(o.data.loop_triangles)
assert triangles<25000,triangles
assert screen.parent==hinge and lidobj.parent==hinge
assert len(screen.data.vertices)==4
assert abs(w/h-16/9)<1e-6
bpy.ops.export_scene.gltf(filepath=str(OUT/'generic-laptop.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=True,export_animation_mode='ACTIONS',export_anim_slide_to_zero=True,export_force_sampling=True,export_extras=True,export_cameras=False,export_lights=False,export_apply=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'generic-laptop.blend'))
result={'triangles':triangles,'asset_objects':len(asset.objects),'glb_bytes':(OUT/'generic-laptop.glb').stat().st_size,'output':str(OUT)}
