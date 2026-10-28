import json, struct, sys
def load(path):
    b = open(path, 'rb').read()
    magic, ver, length = struct.unpack('<4sII', b[:12]); off = 12; js = None; bin_ = None
    while off < len(b):
        clen, ctype = struct.unpack('<I4s', b[off:off+8]); data = b[off+8:off+8+clen]; off += 8 + clen
        if ctype == b'JSON': js = json.loads(data)
        elif ctype == b'BIN\x00': bin_ = data
    return js, bin_
def main(paths):
  for p in paths:
      js, bn = load(p)
      tris = 0
      for m in js.get('meshes', []):
          for pr in m['primitives']:
              if 'indices' in pr: tris += js['accessors'][pr['indices']]['count'] // 3
      acc = js['accessors']
      pos = [pr['attributes']['POSITION'] for m in js['meshes'] for pr in m['primitives']]
      mn = [min(acc[a]['min'][i] for a in pos) for i in range(3)]; mx = [max(acc[a]['max'][i] for a in pos) for i in range(3)]
      print(p.split('/')[-3] if '/source/' in p else p, '| meshes', len(js['meshes']), 'prims', sum(len(m['primitives']) for m in js['meshes']), '| tris', tris,
            '| skins', len(js.get('skins', [])), 'anims', len(js.get('animations', [])), '| nodes', len(js.get('nodes', [])),
            '| images', [ (i.get('mimeType'), js['bufferViews'][i['bufferView']]['byteLength']//1024) for i in js.get('images', [])],
            '| bbox', [round(v, 2) for v in mn], [round(v, 2) for v in mx], '| asset', js.get('asset', {}).get('generator'), '| extras', str(js.get('asset', {}).get('extras', ''))[:200])

if __name__ == '__main__': main(sys.argv[1:])
