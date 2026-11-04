# Pruebas de API de cuentas: registro, login por rol, permisos cruzados, publicación de propietarios.
import os, json, urllib.request, urllib.error, urllib.parse, http.cookiejar, uuid, sys

B = 'http://localhost:8080'
RES = []


def chk(cond, texto, extra=''):
    RES.append(bool(cond))
    print(('✅ ' if cond else '❌ ') + texto + (('  → ' + str(extra)) if extra != '' else ''))


class Sin302(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


class Cliente:
    """Un navegador con su propia cookie de sesión."""
    def __init__(self):
        self.cj = http.cookiejar.CookieJar()
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cj), Sin302())

    def req(self, metodo, ruta, json_body=None, form=None, multipart=None):
        headers, data = {}, None
        if json_body is not None:
            data = json.dumps(json_body).encode(); headers['Content-Type'] = 'application/json'
        elif form is not None:
            data = urllib.parse.urlencode(form).encode(); headers['Content-Type'] = 'application/x-www-form-urlencoded'
        elif multipart is not None:
            borde = '----' + uuid.uuid4().hex
            partes = []
            for nombre, (archivo, tipo, contenido) in multipart.items():
                cab = f'--{borde}\r\nContent-Disposition: form-data; name="{nombre}"' + (f'; filename="{archivo}"' if archivo else '') + f'\r\nContent-Type: {tipo}\r\n\r\n'
                partes.append(cab.encode() + (contenido if isinstance(contenido, bytes) else contenido.encode()) + b'\r\n')
            data = b''.join(partes) + f'--{borde}--\r\n'.encode()
            headers['Content-Type'] = f'multipart/form-data; boundary={borde}'
        r = urllib.request.Request(B + ruta, data=data, method=metodo, headers=headers)
        try:
            resp = self.op.open(r, timeout=15)
            cuerpo = resp.read().decode('utf-8', 'replace'); return resp.status, cuerpo, resp.headers
        except urllib.error.HTTPError as e:
            cuerpo = e.read().decode('utf-8', 'replace'); return e.code, cuerpo, e.headers

    def js(self, metodo, ruta, **k):
        s, c, h = self.req(metodo, ruta, **k)
        try: return s, json.loads(c)
        except Exception: return s, c

    def login(self, usuario, clave, extra=None):
        f = {'username': usuario, 'password': clave}; f.update(extra or {})
        s, c, h = self.req('POST', '/login', form=f)
        return s, h.get('Location', '')


PNG = bytes.fromhex('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c63f8ffff3f0005fe02fea79aa0a00000000049454e44ae426082')
TAG = uuid.uuid4().hex[:6]
CLAVE = 'Clave1234'
def prop_json(**kw):
    d = dict(titulo='Casa de prueba ' + TAG, descripcion='Descripción de prueba', precio=450000000, habitaciones=3, wc=2, estacionamiento=1,
             metrosCuadrados=95, ciudad='Cartagena', barrio='Prueba', direccion='Calle 1 # 2-3', visible=True)
    d.update(kw); return json.dumps(d)
def mp(propiedad, imgs=1, nombre_img='foto.png', tipo='image/png', contenido=PNG):
    m = {'propiedad': (None, 'application/json', propiedad)}
    for i in range(imgs):
        m[f'imagenes{i}'] = None
    return m
def mp_multi(propiedad, archivos):
    """multipart con varias partes del mismo nombre 'imagenes'"""
    borde = '----' + uuid.uuid4().hex
    out = [f'--{borde}\r\nContent-Disposition: form-data; name="propiedad"\r\nContent-Type: application/json\r\n\r\n{propiedad}\r\n'.encode()]
    for nombre, tipo, cont in archivos:
        out.append(f'--{borde}\r\nContent-Disposition: form-data; name="imagenes"; filename="{nombre}"\r\nContent-Type: {tipo}\r\n\r\n'.encode() + cont + b'\r\n')
    return b''.join(out) + f'--{borde}--\r\n'.encode(), f'multipart/form-data; boundary={borde}'
def enviar_prop(cli, metodo, ruta, propiedad, archivos):
    data, ctype = mp_multi(propiedad, archivos)
    r = urllib.request.Request(B + ruta, data=data, method=metodo, headers={'Content-Type': ctype})
    try:
        resp = cli.op.open(r, timeout=15); return resp.status, json.loads(resp.read().decode() or 'null')
    except urllib.error.HTTPError as e:
        b = e.read().decode('utf-8', 'replace')
        try: return e.code, json.loads(b)
        except Exception: return e.code, b

print('\n— 1. Registro —')
anon = Cliente()
s, c = anon.js('POST', '/api/auth/registro', json_body=dict(nombre='X', correo=f'a{TAG}@test.com', password='corta1', rol='CLIENTE'))
chk(s == 400 and 'entre 8 y 72' in str(c), 'contraseña corta rechazada', c)
s, c = anon.js('POST', '/api/auth/registro', json_body=dict(nombre='X', correo=f'a{TAG}@test.com', password='soloLetrasLargas', rol='CLIENTE'))
chk(s == 400 and 'letra y un número' in str(c), 'contraseña sin número rechazada', c)
s, c = anon.js('POST', '/api/auth/registro', json_body=dict(nombre='X', correo=f'a{TAG}@test.com', password=CLAVE, rol='ADMIN'))
chk(s == 400, 'NO se puede registrar un ADMIN desde el formulario público', c)
s, c = anon.js('POST', '/api/auth/registro', json_body=dict(nombre='X', correo='no-es-correo', password=CLAVE, rol='CLIENTE'))
chk(s == 400, 'correo inválido rechazado', c)
s, c = anon.js('POST', '/api/auth/registro', json_body=dict(nombre='Dueño', correo=f'p0{TAG}@test.com', password=CLAVE, rol='PROPIETARIO', telefono=''))
chk(s == 400 and 'celular' in str(c), 'propietario sin celular rechazado', c)
for nombre, correo, rol, tel in [('Cliente Uno', f'c1{TAG}@test.com', 'CLIENTE', ''), ('Dueña Uno', f'p1{TAG}@test.com', 'PROPIETARIO', '3001234567'), ('Dueño Dos', f'p2{TAG}@test.com', 'PROPIETARIO', '3109876543')]:
    s, c = anon.js('POST', '/api/auth/registro', json_body=dict(nombre=nombre, correo=correo.upper(), password=CLAVE, rol=rol, telefono=tel))
    chk(s == 201, f'registro de {rol.lower()} ({nombre})', s)
s, c = anon.js('POST', '/api/auth/registro', json_body=dict(nombre='Otro', correo=f'c1{TAG}@test.com', password=CLAVE, rol='CLIENTE'))
chk(s == 409, 'correo repetido rechazado (aunque cambien mayúsculas)', c)
s, c = anon.js('GET', '/api/auth/yo')
chk(s == 200 and c.get('autenticado') is False, 'sin sesión /api/auth/yo responde autenticado:false')

print('\n— 2. Inicio de sesión: cada rol aterriza en lo suyo —')
cli, p1, p2, adm = Cliente(), Cliente(), Cliente(), Cliente()
s, loc = cli.login(f'c1{TAG}@test.com', CLAVE); chk(s == 302 and loc.endswith('/cuenta.html'), 'cliente → /cuenta.html', loc)
s, loc = p1.login(f'p1{TAG}@test.com', CLAVE); chk(s == 302 and loc.endswith('/propietario.html'), 'propietario → /propietario.html', loc)
s, loc = p2.login(f'p2{TAG}@test.com', CLAVE); chk(s == 302 and loc.endswith('/propietario.html'), 'otro propietario → /propietario.html', loc)
s, loc = adm.login('admin', os.environ.get('ADMIN_PASSWORD', 'admin123')); chk(s == 302 and loc.endswith('/admin/index.html'), 'admin → /admin/index.html', loc)
t = Cliente(); s, loc = t.login(f'c1{TAG}@test.com', 'mala'); chk(s == 302 and loc.endswith('/ingresar.html?error=true'), 'clave incorrecta vuelve a /ingresar.html', loc)
t = Cliente(); s, loc = t.login('admin', 'mala', {'origen': '/admin/login.html'}); chk(loc.endswith('/admin/login.html?error=true'), 'el admin que falla vuelve a su login', loc)
t = Cliente(); s, loc = t.login('admin', 'mala', {'origen': 'http://evil.com'}); chk('evil.com' not in loc and loc.endswith('/ingresar.html?error=true'), 'origen malicioso ignorado (sin redirección abierta)', loc)
t = Cliente(); s, loc = t.login(f'c1{TAG}@test.com', CLAVE, {'volver': '/propiedad.html?id=abc'}); chk(loc.endswith('/propiedad.html?id=abc'), 'el cliente vuelve a la página donde estaba', loc)
t = Cliente(); s, loc = t.login(f'c1{TAG}@test.com', CLAVE, {'volver': '//evil.com'}); chk('evil.com' not in loc and loc.endswith('/cuenta.html'), '"volver" externo ignorado', loc)
t = Cliente(); s, loc = t.login(f'p1{TAG}@test.com', CLAVE, {'volver': '/anuncio.html'}); chk(loc.endswith('/propietario.html'), 'el propietario siempre va a su panel', loc)
s, c = cli.js('GET', '/api/auth/yo'); chk(c.get('rol') == 'CLIENTE' and c.get('nombre') == 'Cliente Uno' and 'password' not in json.dumps(c), '/api/auth/yo devuelve el perfil sin la contraseña', c)

print('\n— 3. Matriz de permisos —')
def codigo(cl, m, r, **k):
    return cl.req(m, r, **k)[0]
filas = [
    ('GET', '/api/cliente/favoritos', {'anon': 401, 'cliente': 200, 'prop': 403, 'admin': 403}),
    ('GET', '/api/cliente/solicitudes', {'anon': 401, 'cliente': 200, 'prop': 403, 'admin': 403}),
    ('GET', '/api/propietario/propiedades', {'anon': 401, 'cliente': 403, 'prop': 200, 'admin': 403}),
    ('GET', '/api/cuenta/perfil', {'anon': 401, 'cliente': 200, 'prop': 200, 'admin': 403}),
    ('GET', '/api/propiedades', {'anon': 401, 'cliente': 403, 'prop': 403, 'admin': 200}),
    ('GET', '/api/contacto', {'anon': 401, 'cliente': 403, 'prop': 403, 'admin': 200}),
    ('POST', '/api/prediccion/precio', {'anon': 401, 'cliente': 403, 'prop': 403}),
    ('DELETE', '/api/propiedades/noexiste', {'anon': 401, 'cliente': 403, 'prop': 403, 'admin': 200}),
    ('PATCH', '/api/propiedades/noexiste/estado', {'anon': 401, 'cliente': 403, 'prop': 403}),
]
quien = {'anon': anon, 'cliente': cli, 'prop': p1, 'admin': adm}
for m, r, esp in filas:
    obt = {k: codigo(quien[k], m, r, json_body={} if m in ('POST', 'PATCH') else None) for k in esp}
    chk(all(obt[k] == v for k, v in esp.items()), f'{m:6} {r}', ' '.join(f'{k}={obt[k]}' for k in esp))
for pag in ['/admin/index.html', '/admin/propiedades.html']:
    r = {k: codigo(quien[k], 'GET', pag) for k in ('cliente', 'prop', 'admin')}
    chk(r['cliente'] == 403 and r['prop'] == 403 and r['admin'] == 200, f'página {pag}', r)

print('\n— 4. Cuenta, favoritos y contraseña —')
s, c = cli.js('PUT', '/api/cliente/favoritos', json_body={'ids': ['abc123', 'abc123', '<script>', 'x' * 50, 'ok999', None]})
chk(s == 200 and c['ids'] == ['abc123', 'ok999'], 'favoritos: se limpian duplicados, scripts y ids largos', c)
s, c = cli.js('PUT', '/api/cliente/favoritos', json_body={'ids': [f'id{i}' for i in range(300)]})
chk(s == 200 and len(c['ids']) == 200, 'máximo 200 favoritos', len(c['ids']) if isinstance(c, dict) else c)
s, c = cli.js('GET', '/api/cliente/favoritos'); chk(len(c['ids']) == 200, 'los favoritos quedan guardados en la cuenta')
cli.js('PUT', '/api/cliente/favoritos', json_body={'ids': ['abc123']})
s, c = cli.js('PUT', '/api/cuenta/perfil', json_body={'nombre': 'Cliente Renombrado', 'telefono': '3001112222'}); chk(s == 200, 'actualizar perfil', c)
s, c = cli.js('PUT', '/api/cuenta/perfil', json_body={'nombre': '', 'telefono': ''}); chk(s == 400, 'perfil con nombre vacío rechazado', c)
s, c = p1.js('PUT', '/api/cuenta/perfil', json_body={'nombre': 'Dueña', 'telefono': ''}); chk(s == 400 and 'celular' in str(c), 'un propietario no puede quitar su celular', c)
s, c = cli.js('PUT', '/api/cuenta/password', json_body={'actual': 'incorrecta1', 'nueva': 'NuevaClave99'}); chk(s == 400 and 'actual' in str(c), 'cambiar contraseña con la actual incorrecta falla', c)
s, c = cli.js('PUT', '/api/cuenta/password', json_body={'actual': CLAVE, 'nueva': 'sinnumeros'}); chk(s == 400, 'la nueva contraseña también exige letra y número', c)
s, c = cli.js('PUT', '/api/cuenta/password', json_body={'actual': CLAVE, 'nueva': 'NuevaClave99'}); chk(s == 200, 'cambio de contraseña correcto', c)
t = Cliente(); s, loc = t.login(f'c1{TAG}@test.com', CLAVE); chk('error' in loc, 'la contraseña vieja ya no sirve')
t = Cliente(); s, loc = t.login(f'c1{TAG}@test.com', 'NuevaClave99'); chk(loc.endswith('/cuenta.html'), 'la nueva contraseña sí')
cli = t

print('\n— 5. Propietario publica: revisión, aislamiento y abusos —')
FOTO = ('foto.png', 'image/png', PNG)
s, c = enviar_prop(p1, 'POST', '/api/propietario/propiedades', prop_json(), [])
chk(s == 400 and 'foto' in str(c), 'sin foto se rechaza', c)
s, c = enviar_prop(p1, 'POST', '/api/propietario/propiedades', prop_json(ciudad='Marte'), [FOTO]); chk(s == 400 and 'ciudad' in str(c).lower(), 'ciudad fuera de la lista se rechaza', c)
s, c = enviar_prop(p1, 'POST', '/api/propietario/propiedades', prop_json(precio=-5), [FOTO]); chk(s == 400, 'precio negativo se rechaza', c)
s, c = enviar_prop(p1, 'POST', '/api/propietario/propiedades', prop_json(), [('x.html', 'text/html', b'<script>1</script>')]); chk(s == 400, 'un .html no se acepta como imagen', c)
s, c = enviar_prop(p1, 'POST', '/api/propietario/propiedades', prop_json(), [FOTO] * 5); chk(s == 400 and 'hasta 4' in str(c), 'más de 4 fotos se rechaza', c)
hack = prop_json(estado='PUBLICADA', visible=True, propietarioId='otro', motivoRechazo='x')
s, creada = enviar_prop(p1, 'POST', '/api/propietario/propiedades', hack, [FOTO])
chk(s == 200 and creada['estado'] == 'PENDIENTE' and creada['visible'] is False, 'intento de auto-publicarse (estado/visible en el cuerpo) ignorado', f"estado={creada.get('estado') if isinstance(creada, dict) else creada}")
PID = creada['id']
chk('propietarioId' not in json.dumps(creada), 'el id interno del dueño no se expone en el JSON')
s, c = anon.js('GET', '/api/propiedades/visibles'); chk(not any(x['id'] == PID for x in c), 'pendiente: no aparece en el catálogo público')
s, c = anon.js('GET', f'/api/propiedades/{PID}'); chk(s == 404, 'pendiente: su ficha pública da 404', s)
s, c = p1.js('GET', '/api/propietario/propiedades'); chk(any(x['propiedad']['id'] == PID and x['consultas'] == 0 for x in c), 'el propietario la ve en su lista con 0 consultas')
s, c = p2.js('GET', f'/api/propietario/propiedades/{PID}'); chk(s == 404, 'OTRO propietario no puede verla (404)', s)
s, c = enviar_prop(p2, 'PUT', f'/api/propietario/propiedades/{PID}', prop_json(titulo='Robada'), [FOTO]); chk(s == 404, 'OTRO propietario no puede editarla', s)
s, c = p2.js('POST', f'/api/propietario/propiedades/{PID}/retirar'); chk(s == 404, 'OTRO propietario no puede retirarla', s)
s, c = cli.js('GET', f'/api/propietario/propiedades/{PID}'); chk(s == 403, 'un cliente no entra a la API de propietarios', s)
s, c = adm.js('GET', '/api/propiedades'); fila = next((x for x in c if x['id'] == PID), {})
chk(fila.get('estado') == 'PENDIENTE' and fila.get('propietarioNombre') == 'Dueña Uno' and '3001234567' in (fila.get('propietarioContacto') or ''), 'el admin la ve pendiente con los datos del dueño', fila.get('propietarioContacto'))

s, c = adm.js('PATCH', f'/api/propiedades/{PID}/estado', json_body={'estado': 'RECHAZADA', 'motivo': 'no'}); chk(s == 400, 'rechazar sin motivo claro falla', c)
s, c = adm.js('PATCH', f'/api/propiedades/{PID}/estado', json_body={'estado': 'INVENTADO'}); chk(s == 400, 'estado inválido falla', c)
s, c = adm.js('PATCH', f'/api/propiedades/{PID}/estado', json_body={'estado': 'RECHAZADA', 'motivo': 'Las fotos no se ven bien'}); chk(s == 200 and c['estado'] == 'RECHAZADA', 'admin rechaza con motivo', c.get('motivoRechazo') if isinstance(c, dict) else c)
s, c = p1.js('GET', '/api/propietario/propiedades'); mia = next(x for x in c if x['propiedad']['id'] == PID)
chk(mia['propiedad']['estado'] == 'RECHAZADA' and 'fotos' in mia['propiedad']['motivoRechazo'], 'el propietario ve el motivo del rechazo', mia['propiedad']['motivoRechazo'])
s, c = enviar_prop(p1, 'PUT', f'/api/propietario/propiedades/{PID}', prop_json(titulo='Casa corregida ' + TAG, precio=470000000), [FOTO])
chk(s == 200 and c['estado'] == 'PENDIENTE' and c['motivoRechazo'] is None and c['precio'] == 470000000, 'al corregir vuelve a revisión y se borra el motivo', c.get('estado') if isinstance(c, dict) else c)
s, c = adm.js('PATCH', f'/api/propiedades/{PID}/estado', json_body={'estado': 'PUBLICADA'}); chk(s == 200 and c['visible'] is True, 'admin aprueba → publicada y visible')
s, c = anon.js('GET', '/api/propiedades/visibles'); chk(any(x['id'] == PID for x in c), 'ahora aparece en el catálogo público')
s, c = anon.js('GET', f'/api/propiedades/{PID}'); chk(s == 200 and 'propietarioId' not in json.dumps(c), 'su ficha pública abre y no filtra datos del dueño')
s, c = enviar_prop(p1, 'PUT', f'/api/propietario/propiedades/{PID}', prop_json(), [FOTO]); chk(s == 409, 'una propiedad publicada no se edita directamente (409)', s)

print('\n— 6. Consultas y visitas llegan al propietario (sin datos personales) y al cliente —')
import datetime as d
x = d.date.today() + d.timedelta(days=3)
while x.weekday() >= 5: x += d.timedelta(days=1)
msg = dict(nombre='Interesada', correo=f'i{TAG}@test.com', mensaje='Me interesa', medioContacto='correo', casaInteres=PID)
s, c = cli.js('POST', '/api/contacto', json_body=dict(msg, fechaVisita=str(x), horaVisita='11:00')); chk(s == 200 and c.get('usuarioId'), 'contacto de un cliente conectado queda ligado a su cuenta')
s, c = anon.js('POST', '/api/contacto', json_body=msg); chk(s == 200 and not c.get('usuarioId'), 'contacto anónimo sigue funcionando')
s, c = anon.js('POST', '/api/contacto', json_body=dict(msg, usuarioId='robado')); chk(s == 200 and not c.get('usuarioId'), 'no se puede suplantar usuarioId desde el cuerpo')
s, c = p1.js('GET', '/api/propietario/propiedades'); mia = next(x for x in c if x['propiedad']['id'] == PID)
chk(mia['consultas'] == 3 and mia['visitas'] == 1, 'el propietario ve 3 consultas y 1 visita', f"{mia['consultas']} / {mia['visitas']}")
txt = json.dumps(c)
chk(f'i{TAG}@test.com' not in txt and 'Interesada' not in txt, 'y NO ve el nombre ni el correo de los interesados')
s, c = cli.js('GET', '/api/cliente/solicitudes'); sol = c[0] if c else {}
chk(len(c) == 1 and sol.get('fechaVisita') == str(x) and sol.get('propiedadTitulo', '').startswith('Casa corregida'), 'el cliente ve su visita con el título de la propiedad', sol.get('propiedadTitulo'))
s, c = adm.js('GET', '/api/contacto'); mio = next((k for k in c if k.get('usuarioId')), None)
adm.js('PATCH', f"/api/contacto/{mio['id']}/atendido")
s, c = cli.js('GET', '/api/cliente/solicitudes'); chk(c[0]['atendido'] is True, 'cuando el admin la atiende, el cliente lo ve')

print('\n— 7. Retirar —')
s, c = p1.js('POST', f'/api/propietario/propiedades/{PID}/retirar'); chk(s == 200 and c['estado'] == 'RETIRADA' and c['visible'] is False, 'el propietario retira su propiedad')
s, c = anon.js('GET', f'/api/propiedades/{PID}'); chk(s == 404, 'retirada: deja de verse en público')
s, c = anon.js('POST', '/api/contacto', json_body=dict(msg, fechaVisita=str(x), horaVisita='11:00')); chk(s == 400, 'ya no se puede agendar visita en una propiedad retirada', c)
s, c = enviar_prop(p1, 'PUT', f'/api/propietario/propiedades/{PID}', prop_json(titulo='Reenviada ' + TAG), [FOTO]); chk(s == 200 and c['estado'] == 'PENDIENTE', 'una retirada se puede corregir y reenviar')

print('\n— 8. Límites —')
ids_creados = [PID]
resultados = []
for i in range(6):
    s, c = enviar_prop(p2, 'POST', '/api/propietario/propiedades', prop_json(titulo=f'Lote {i} {TAG}'), [FOTO]); resultados.append(s)
    if s == 200: ids_creados.append(c['id'])
chk(resultados == [200] * 5 + [429], 'máximo 5 envíos por día y propietario (el 6.º da 429)', resultados)
# fuerza bruta de login: 25 intentos seguidos desde la misma IP
cod = []
for i in range(25):
    t = Cliente(); s, loc = t.login('nadie@test.com', 'x'); cod.append('bloqueado' in loc)
chk(any(cod), 'muchos intentos de login seguidos se bloquean', f'bloqueado desde el intento {cod.index(True) + 1}' if any(cod) else 'nunca')
# registros: 10/hora por IP (ya se crearon 3)
ult = []
for i in range(9):
    s, c = Cliente().js('POST', '/api/auth/registro', json_body=dict(nombre='Masivo', correo=f'm{i}{TAG}@test.com', password=CLAVE, rol='CLIENTE')); ult.append(s)
chk(429 in ult and ult[:7] == [201] * 7, 'más de 10 cuentas por hora desde una IP se frenan', ult)

# limpieza de propiedades de prueba
for pid in ids_creados:
    adm.js('DELETE', f'/api/propiedades/{pid}')
for k in adm.js('GET', '/api/contacto')[1]:
    if (k.get('correo') or '').endswith('@test.com'): adm.js('DELETE', f"/api/contacto/{k['id']}")

print(f"\nRESULTADO: {sum(RES)} de {len(RES)} comprobaciones correctas")
sys.exit(0 if all(RES) else 1)
