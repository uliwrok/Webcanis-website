"""Dependency-free checks of the exported asset, hierarchy, UVs and hinge animation."""
import json, struct
from pathlib import Path

path=Path(__file__).with_name('generic-laptop.glb')
data=path.read_bytes()
magic,version,length=struct.unpack_from('<4sII',data)
assert magic==b'glTF' and version==2 and length==len(data)
n,kind=struct.unpack_from('<II',data,12)
assert kind==0x4e4f534a
doc=json.loads(data[20:20+n])
bin_size,bin_kind=struct.unpack_from('<II',data,20+n)
assert bin_kind==0x004e4942
binary=data[28+n:28+n+bin_size]

def values(index):
    a=doc['accessors'][index];view=doc['bufferViews'][a['bufferView']]
    components={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
    fmt={5126:'f',5123:'H',5125:'I'}[a['componentType']]
    size=struct.calcsize('<'+fmt)*components
    offset=view.get('byteOffset',0)+a.get('byteOffset',0)
    stride=view.get('byteStride',size)
    return [struct.unpack_from('<'+fmt*components,binary,offset+i*stride) for i in range(a['count'])]

nodes={n['name']:(i,n) for i,n in enumerate(doc['nodes'])}
hi,hinge=nodes['Lid_Hinge'];si,screen=nodes['Screen_Surface'];li,lid=nodes['Lid_Shell']
assert set(hinge['children'])=={si,li}
assert nodes['Laptop_Base'][0] in nodes['Laptop_Root'][1]['children']
primitive=doc['meshes'][screen['mesh']]['primitives'][0]
uv=values(primitive['attributes']['TEXCOORD_0'])
assert set(uv)=={(0.,0.),(1.,0.),(1.,1.),(0.,1.)}
animation=next(a for a in doc['animations'] if a['name']=='CloseLid')
channel=animation['channels'][0]
assert channel['target']=={'node':hi,'path':'rotation'}
sampler=animation['samplers'][channel['sampler']]
time=values(sampler['input']);rotation=values(sampler['output'])
assert abs(time[-1][0]-1.5)<1e-6
assert max(abs(rotation[0][i]-rotation[-1][i]) for i in range(4))>.5
assert all(abs(rotation[-1][i])<1e-5 for i in range(3))
assert abs(abs(rotation[-1][3])-1)<1e-5
assert all('bufferView' in i and 'uri' not in i for i in doc['images'])
assert not doc.get('extensionsRequired')
triangles=sum(doc['accessors'][p['indices']]['count']//3 for m in doc['meshes'] for p in m['primitives'])
assert triangles<25000 and len(data)<1024*1024
print(f'PASS: {triangles:,} triangles; {len(data):,} bytes; embedded textures; 1.5s hinge animation; full screen UVs.')
