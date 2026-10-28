"""Convert a GLB (character or room) into a compact game model for Scam Detective.

usage: python3 -I convert_model.py <toolsdir> <in.glb> <out-base> <id> [options as key=value]
  kind=character|room   characters stand up (y-up, feet at 0, normalised to height 1); rooms keep metres
  cell=0.02             clustering cell (fraction of height for characters, metres for rooms); 0 = no decimation
  headcell=0.0065       finer cell above the shoulders (characters)
  tex=1024              max texture size
  yaw=0                 extra rotation about y (radians) so the model faces +z
  exclude=A,B           skip scene nodes whose names start with these prefixes

Every primitive is transformed to world space; primitives sharing a base-colour texture are merged into one part.
Decimation is UV-island aware vertex clustering: positions come from spatial cells (so neighbouring islands stay
stitched), vertices are split per UV island so texture coordinates stay clean.
Output: <out-base>.js containing Models.register(id, {...}) with base64 data and JPEG textures.
"""
import json, struct, sys, io, base64, math
import numpy as np
from PIL import Image
sys.path.insert(0, sys.argv[1])
from glbinfo import load
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components

src, out, model_id = sys.argv[2], sys.argv[3], sys.argv[4]
opt = dict(a.split('=', 1) for a in sys.argv[5:])
kind = opt.get('kind', 'character'); cell_body = float(opt.get('cell', 0.02)); cell_head = float(opt.get('headcell', 0.0065))
texmax = int(opt.get('tex', 1024)); yaw = float(opt.get('yaw', 0)); flipz = opt.get('flipz') == '1'
js, bn = load(src)

def acc(i):
    a = js['accessors'][i]; bv = js['bufferViews'][a['bufferView']]
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
    dt = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8, 5122: np.int16, 5120: np.int8}[a['componentType']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0); stride = bv.get('byteStride'); isz = np.dtype(dt).itemsize
    if stride and stride != isz * n:
        arr = np.ndarray(shape=(a['count'], n), dtype=dt, buffer=bn, offset=off, strides=(stride, isz))
    else: arr = np.frombuffer(bn, dtype=dt, count=a['count'] * n, offset=off).reshape(a['count'], n)
    arr = arr.astype(np.float64)
    if a.get('normalized'): arr = arr / {np.uint16: 65535, np.uint8: 255, np.int16: 32767, np.int8: 127}[dt]
    return arr
def qmat(q):
    x, y, z, w = q
    return np.array([[1 - 2*(y*y+z*z), 2*(x*y - z*w), 2*(x*z + y*w)], [2*(x*y + z*w), 1 - 2*(x*x+z*z), 2*(y*z - x*w)], [2*(x*z - y*w), 2*(y*z + x*w), 1 - 2*(x*x+y*y)]])
def node_mat(nd):
    if 'matrix' in nd: return np.array(nd['matrix']).reshape(4, 4).T
    M = np.eye(4); M[:3, :3] = qmat(nd.get('rotation', [0, 0, 0, 1])) @ np.diag(nd.get('scale', [1, 1, 1])); M[:3, 3] = nd.get('translation', [0, 0, 0]); return M

# walk the scene graph collecting (mesh, world matrix)
scene = js['scenes'][js.get('scene', 0)]; inst = []
exclude = [x for x in opt.get('exclude', '').split(',') if x]
def walk(i, parent):
    nd = js['nodes'][i]; W = parent @ node_mat(nd)
    skip = any((nd.get('name') or '').startswith(x) for x in exclude)
    if 'mesh' in nd and not skip: inst.append((nd['mesh'], W))
    for c in nd.get('children', []): walk(c, W)
for r in scene['nodes']: walk(r, np.eye(4))

def tex_of(mat):
    pbr = mat.get('pbrMetallicRoughness', {}); bc = pbr.get('baseColorTexture')
    col = pbr.get('baseColorFactor', [1, 1, 1, 1])
    if not bc: return None, None, col
    return js['textures'][bc['index']]['source'], bc, col

groups = {}   # key: image index or colour -> lists
for mi, W in inst:
    for pr in js['meshes'][mi]['primitives']:
        if pr.get('mode', 4) != 4: continue
        mat = js['materials'][pr['material']] if 'material' in pr else {}
        img, bc, col = tex_of(mat)
        if mat.get('alphaMode') == 'BLEND' and col[3] < 0.5: continue
        P = acc(pr['attributes']['POSITION']); n = len(P)
        N = acc(pr['attributes']['NORMAL']) if 'NORMAL' in pr['attributes'] else np.tile([0, 1, 0], (n, 1)).astype(float)
        tc = (bc or {}).get('texCoord', 0)
        UV = acc(pr['attributes']['TEXCOORD_%d' % tc]) if img is not None and ('TEXCOORD_%d' % tc) in pr['attributes'] else np.zeros((n, 2))
        I = acc(pr['indices']).astype(np.int64).reshape(-1, 3) if 'indices' in pr else np.arange(n).reshape(-1, 3)
        tt = (bc or {}).get('extensions', {}).get('KHR_texture_transform')
        if tt:
            sc = tt.get('scale', [1, 1]); of = tt.get('offset', [0, 0]); rot = tt.get('rotation', 0); u = UV[:, 0] * sc[0]; v = UV[:, 1] * sc[1]
            cr, sr = math.cos(rot), math.sin(rot); UV = np.stack([cr * u + sr * v + of[0], -sr * u + cr * v + of[1]], 1)
        P = P @ W[:3, :3].T + W[:3, 3]; N = N @ np.linalg.inv(W[:3, :3]).T; N /= np.linalg.norm(N, axis=1, keepdims=True) + 1e-12
        key = ('img', img) if img is not None else ('col', tuple(round(c, 3) for c in col[:3]))
        g = groups.setdefault(key, {'P': [], 'N': [], 'UV': [], 'I': [], 'base': 0, 'col': col})
        g['P'].append(P); g['N'].append(N); g['UV'].append(UV); g['I'].append(I + g['base']); g['base'] += n

allP = np.concatenate([np.concatenate(g['P']) for g in groups.values()])
R = np.eye(3)
if yaw: c, s = math.cos(yaw), math.sin(yaw); R = np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
if flipz: R = np.diag([-1, 1, -1]) @ R
allP = allP @ R.T
mn, mx = allP.min(0), allP.max(0)
if kind == 'character': shift = np.array([-(mn[0] + mx[0]) / 2, -mn[1], -(mn[2] + mx[2]) / 2]); H = mx[1] - mn[1]
else: shift = np.zeros(3); H = 1.0

parts = []; total_in = total_out = 0
for key, g in groups.items():
    P = np.concatenate(g['P']) @ R.T + shift; N = np.concatenate(g['N']) @ R.T; UV = np.concatenate(g['UV']); I = np.concatenate(g['I'])
    total_in += len(I)
    if cell_body > 0 and len(I) > 400:
        if kind == 'character':
            head = P[:, 1] > H * 0.8; cell = np.where(head, cell_head, cell_body) * H / 1.7
        else: head = np.zeros(len(P), bool); cell = np.full(len(P), cell_body)
        q = np.floor(P / cell[:, None]).astype(np.int64)
        nv = len(P); e = np.concatenate([I[:, [0, 1]], I[:, [1, 2]], I[:, [2, 0]]])
        _, island = connected_components(coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(nv, nv)), directed=False)
        sk, sinv = np.unique(np.stack([q[:, 0], q[:, 1], q[:, 2], head.astype(np.int64)], 1), axis=0, return_inverse=True); sinv = sinv.ravel()
        uk, inv = np.unique(np.stack([sinv, island], 1), axis=0, return_inverse=True); inv = inv.ravel(); n = len(uk)
        def avg(A, ix, m):
            cnt = np.bincount(ix, minlength=m).astype(np.float64)
            return np.stack([np.bincount(ix, weights=A[:, j], minlength=m) for j in range(A.shape[1])], 1) / cnt[:, None]
        ns = len(sk); Pc = avg(P, sinv, ns); Nc = avg(N, sinv, ns); cof = np.zeros(n, np.int64); cof[inv] = sinv
        P, N, UV = Pc[cof], Nc[cof], avg(UV, inv, n); N /= np.linalg.norm(N, axis=1, keepdims=True) + 1e-12
        T = inv[I]; T = T[(T[:, 0] != T[:, 1]) & (T[:, 1] != T[:, 2]) & (T[:, 0] != T[:, 2])]
        _, first = np.unique(np.sort(T, 1), axis=0, return_index=True); T = T[np.sort(first)]
        used = np.zeros(n, bool); used[T.ravel()] = True; remap = -np.ones(n, np.int64); remap[used] = np.arange(used.sum())
        P, N, UV, T = P[used], N[used], UV[used], remap[T]
    else: T = I
    total_out += len(T)
    # split into chunks below 65536 vertices so 16-bit indices work everywhere
    order = np.arange(len(T)); start = 0
    while start < len(T):
        vmap = {}; chunk = []
        for ti in range(start, len(T)):
            tri = T[ti]; new = sum(1 for v in tri if v not in vmap)
            if len(vmap) + new > 65000: break
            for v in tri:
                if v not in vmap: vmap[v] = len(vmap)
            chunk.append([vmap[v] for v in tri])
        ids = np.array(list(vmap.keys())); start += len(chunk)
        Pp = P[ids] / H; lo = Pp.min(0); hi = np.maximum(Pp.max(0), lo + 1e-6)
        part = {'lo': [float(x) for x in lo], 'hi': [float(x) for x in hi],
                'pos': base64.b64encode(np.round((Pp - lo) / (hi - lo) * 65535).astype(np.uint16).tobytes()).decode(),
                'nrm': base64.b64encode(np.clip(np.round(N[ids] * 127), -127, 127).astype(np.int8).tobytes()).decode(),
                'uv': base64.b64encode(np.clip(np.round(UV[ids] * 4096 + 32768), 0, 65535).astype(np.uint16).tobytes()).decode(),   # 1/4096 steps, range -8..8
                'idx': base64.b64encode(np.array(chunk, np.uint16).tobytes()).decode()}
        if key[0] == 'img':
            img = js['images'][key[1]]; bv = js['bufferViews'][img['bufferView']]
            im = Image.open(io.BytesIO(bn[bv.get('byteOffset', 0): bv.get('byteOffset', 0) + bv['byteLength']])).convert('RGB')
            s = min(texmax, max(im.size)); s = 1 << int(math.log2(s))
            im = im.resize((s, s), Image.LANCZOS); b = io.BytesIO(); im.save(b, 'JPEG', quality=86, optimize=True)
            part['tex64'] = 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
            if g['col'][:3] != [1, 1, 1]: part['color'] = [float(c) for c in g['col'][:3]]
        else: part['color'] = [float(c) for c in g['col'][:3]]
        parts.append(part)
ex = js.get('asset', {}).get('extras', {})
data = {'kind': kind, 'height': float(H), 'parts': parts, 'credit': {'title': ex.get('title'), 'author': ex.get('author'), 'license': ex.get('license'), 'source': ex.get('source')}}
open(out + '.js', 'w').write('Models.register(' + json.dumps(model_id) + ', ' + json.dumps(data) + ');\n')
print(model_id, 'tris', total_in, '->', total_out, 'parts', len(parts), 'height', round(float(H), 3), 'bbox', np.round(mn, 2), np.round(mx, 2), 'KB', round(len(open(out + '.js').read()) / 1024))
