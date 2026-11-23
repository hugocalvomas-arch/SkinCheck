"""Convierte el catálogo de hugosbeautyproject (web-marca-personal) al formato de la tabla productos."""
import json, glob, re, sys
src = sys.argv[1]  # ruta a web-marca-personal
scores = {x['i']: x for x in json.load(open(f'{src}/public/productos/datos.json'))}
out = []
for f in sorted(glob.glob(f'{src}/lib/tienda/productos/*.json')):
    for p in json.load(open(f)):
        m = re.search(r'([\d.,]+)\s*ml', p.get('formato') or '', re.I)
        ml = float(m.group(1).replace(',', '.')) if m else None
        s = scores.get(p['id'], {})
        precio = (p.get('comprar') or {}).get('precio_eur')
        img = ((p.get('imagenes') or {}).get('principal') or {}).get('archivo')
        out.append({
            'id': p['id'], 'marca': p['marca'], 'nombre': p['nombre'],
            'tipo': p.get('tipo'), 'textura': p.get('textura'),
            'formato_ml': ml, 'spf': p.get('spf'),
            'inci': p.get('inci') or [],
            'declarados': p.get('declarados') or {},
            'puntuaciones': {k: {'n': v.get('n'), 'd': v.get('d')} for k, v in (s.get('s') or {}).items()},
            'necesidades': p.get('para') or [],
            'pvp_referencia': precio, 'imagen': img,
            'datos_extra': {k: p.get(k) for k in ('subtitulo', 'uso', 'base', 'uva', 'ph', 'url_oficial') if p.get(k) is not None},
        })
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'productos')
