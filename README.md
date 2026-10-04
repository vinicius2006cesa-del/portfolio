# Portfolio — Vinicius Cesa

Sitio personal de una sola página. HTML, CSS y JavaScript puros: sin frameworks,
sin npm y sin paso de compilación.

## Estructura

```
index.html                  Todo el contenido de la página
legal.html                  Aviso legal, términos, privacidad y cookies
404.html                    Se muestra en cualquier dirección que no exista
_headers                    Cabeceras de seguridad (lo lee Cloudflare Pages)
publicar.sh                 El script detras de `git publicar`
css/styles.css              Estilos. Las variables de diseño están arriba de todo
js/main.js                  Comportamiento (menú, animaciones, acordeón, formulario)
assets/marca/               Logo, ícono y favicons
assets/img/                 Imágenes de los proyectos y la de compartir
kit-marca/                  Archivo completo del logo (no lo usa la web)
herramientas/               Utilidades que NO forman parte del sitio
  generar-og.html           Genera la imagen que se ve al compartir el link
```

Los archivos que empiezan con `_` son configuración de Cloudflare Pages: se
leen en el deploy pero no se publican como páginas.

## Cómo verlo en tu computadora

Abrí `index.html` con doble clic. No hace falta servidor ni instalar nada.

Si usás VS Code, la extensión **Live Server** recarga la página sola cada vez
que guardás. Clic derecho en `index.html` → "Open with Live Server".

## Dónde vive el proyecto

`D:\dev\Portfolio`

Los proyectos van en el disco D para dejar el C libre para Windows.

Nota: D es un disco mecánico (HDD). Para un sitio estático no se nota, pero si
algún día hacés un proyecto con `npm` (miles de archivos chicos), va a ir más
lento que en C.

**No lo muevas a `Documentos` ni a OneDrive.** El "Acceso controlado a carpetas"
de Windows Defender bloquea que Git y los editores escriban ahí, y OneDrive
sincronizando la carpeta `.git` puede corromper el repositorio.

## Marca

Los archivos del logo están en `assets/marca/`:

| Archivo | Dónde se usa |
|---|---|
| `vince-logo-crema.svg` | navbar (fondo marino) |
| `vince-logo-marino.svg` | por si alguna vez va sobre fondo claro |
| `vince-webstudio-crema.svg` | footer (lleva la bajada "Web Studio") |
| `vince-icono-marino.svg` | favicon y el badge del hero |
| `apple-touch-icon.png` | ícono al guardar el sitio en un iPhone |

**Hay dos carpetas de marca y conviene no confundirlas:**

| Carpeta | Qué es | Si la tocás |
|---|---|---|
| `assets/marca/` | los 7 archivos que **usa la web** | el sitio se queda sin logo ni favicon |
| `kit-marca/` | el **archivo completo**: todas las variantes en todos los tamaños, para usar el logo fuera de la web | no pasa nada, el sitio no la mira |

El detalle de qué hay en el kit y cuándo usar cada tamaño está en
`kit-marca/LEEME.txt`.

## Cómo cambiar el diseño

Todos los colores, tipografías y espaciados están en el bloque `:root`, al
principio de `css/styles.css`. Cambiás ahí y se actualiza el sitio entero.

**Paleta (los cuatro colores del logo):**

| | Hex | Uso |
|---|---|---|
| Marino | `#0D1B2A` | navbar, footer, texto |
| Crema | `#F5EBD7` | fondo de todo el sitio |
| Azul | `#2563EB` | botones y cajas |
| Azul claro | `#3B7BFF` | acento sobre marino |

**Ojo con el azul.** El azul de marca sobre crema da 4.37:1 de contraste, apenas
por debajo del mínimo accesible (4.5:1). Por eso hay dos tokens:

- `--color-acento` → cajas, botones y titulares grandes
- `--color-acento-legible` (`#1D4ED8`) → texto chico y links

A ojo son el mismo azul. Si escribís texto chico en azul, usá el segundo.

**Tipografía:** una sola familia, **Outfit** (Google Fonts, se carga desde el
`<head>`). Peso 800 para titulares — el mismo con el que está dibujada la
palabra "Vince" del logo — y 400/500/600 para el resto.

## La imagen que se ve al compartir el link

`assets/img/og-image.png` (1200 x 630) es lo que muestran WhatsApp, Twitter y
LinkedIn cuando pegás el link.

Para regenerarla: abrí `herramientas/generar-og.html` **con el servidor local**
(no con doble clic — la tipografía y el logo necesitan cargarse por HTTP),
cambiá el texto en el bloque `TITULAR` y apretá el botón. Se descarga el PNG;
copialo a `assets/img/` pisando el que está.

Después de publicar, WhatsApp cachea la imagen vieja por un rato. Para forzar
que la relea, pegá el link en
[developers.facebook.com/tools/debug](https://developers.facebook.com/tools/debug/)
y tocá "Scrape Again".

## Cómo agregar un proyecto nuevo

En `index.html`, buscá el comentario `PARA AGREGAR UN PROYECTO NUEVO`.
Copiá un bloque `<article class="proyecto">` entero, pegalo antes de la tarjeta
oscura del final y cambiá la imagen, el alt, la categoría, el título y la
descripción. La grilla se acomoda sola.

## Cómo publicar un cambio

### El atajo

```
git -C "D:\dev\Portfolio" publicar "que cambiaste"
```

Eso hace los tres pasos de una: agrega todos los archivos, guarda la versión
con ese mensaje y la manda a GitHub. Cloudflare publica solo en 30-60 segundos.

El `-C "D:\dev\Portfolio"` le dice a Git en qué carpeta trabajar, así **funciona
desde cualquier lado**. Sin eso, si la terminal está parada en otra carpeta,
Git responde `fatal: not a git repository`.

### Si el atajo no existe (hay que crearlo una vez)

Se guarda en `.git/config`, que no se versiona. Si clonás el repo de nuevo o
cambiás de computadora, hay que volver a crearlo:

```
git -C "D:\dev\Portfolio" config alias.publicar '!sh publicar.sh'
```

La lógica vive en `publicar.sh` y no dentro del alias **a propósito**:
PowerShell rompe las comillas dobles cuando le pasa argumentos a programas
externos, así que un alias del tipo `git commit -m "$1"` se guarda sin las
comillas y el mensaje del commit llega partido en palabras sueltas. Dentro de
un archivo no hay terminal que las toque.

### Los tres pasos por separado

Por si alguna vez querés un mensaje largo de varias líneas, o revisar antes de
mandar:

```
cd D:\dev\Portfolio
git status          # ver qué cambió
git add .           # marcar todo
git commit -m "..."  # guardar la versión
git push            # mandarla a GitHub
```

### Comprobar que se publicó

```
curl -I https://viniciuscesa.com/
```

Si el deploy falla, el detalle está en el panel de Cloudflare Pages, en la
pestaña de deployments del proyecto.

## Seguridad: qué es público y qué no

**El repositorio es público y eso está bien.** Un sitio estático no tiene
parte oculta: cada archivo del repo es exactamente lo que el navegador
descarga al entrar a viniciuscesa.com. Cualquiera puede apretar Ctrl+U en el
sitio y ver el mismo HTML, CSS y JavaScript. Ponerlo privado no escondería
absolutamente nada.

**Lo que NUNCA puede entrar al repo** (eso sí serían claves reales):

- Tokens de API de Cloudflare o GitHub
- Archivos `.env`, `wrangler.toml` con credenciales, `.npmrc`
- Claves privadas SSH o certificados (`.pem`, `.key`)

Hoy no hay ninguno, y nunca hubo: se revisaron los 16 commits del historial.
Si alguna vez subís una por error, **no alcanza con borrarla en un commit
nuevo**: sigue viva en el historial y los bots la encuentran igual. Hay que
revocarla en el servicio que la emitió.

**La clave de Web3Forms es pública a propósito.** La documentación oficial lo
dice textual: *"Don't worry this can be public"*. No da acceso a nada: solo
indica a qué casilla va el formulario. Nadie puede leer tus mensajes ni entrar
a tus cuentas con ella. El único abuso posible es que alguien la copie para
mandarte spam; contra eso está el honeypot que ya tiene el formulario, y si
algún día llega basura se puede sumar hCaptcha (gratis, en el panel de
Web3Forms).

**Tus cuentas reales** (Cloudflare, GitHub, Hostinger, Gmail) no están en el
código. Lo que las protege es la verificación en dos pasos, no el repositorio.

### Cabeceras de seguridad

El archivo `_headers` de la raíz las configura. Cloudflare Pages lo lee solo en
cada deploy: no hay que tocar el panel ni ejecutar nada.

La más importante es la `Content-Security-Policy`: una lista blanca de lo único
que el navegador tiene permitido cargar. Si mañana alguien lograra inyectar un
script en la página, el navegador se niega a ejecutarlo. Está en modo estricto
porque el sitio no tiene ni un script ni un estilo escrito dentro del HTML.

Para comprobar que están activas después de publicar:

```
curl -I https://viniciuscesa.com/
```

Si alguna vez agregás algo externo (Google Analytics, un video de YouTube, una
fuente nueva), **hay que sumar ese dominio a la política o no va a cargar**.

Ya pasó una vez: Cloudflare Pages inyecta solo el script de Web Analytics
(el que cuenta las visitas) y la política lo bloqueaba, porque ese script no
está escrito en ningún lado del código. Por eso la lista permite
`static.cloudflareinsights.com` y `cloudflareinsights.com`.

**Cómo darte cuenta si bloqueaste algo sin querer:** abrí el sitio, apretá F12
y mirá la pestaña Console. Si algo está bloqueado vas a ver un mensaje que
dice *"violates the following Content Security Policy directive"* con el
dominio que falta.

## Formulario (Web3Forms)

Las consultas del formulario llegan a tu mail.

1. Entrar a [web3forms.com](https://web3forms.com)
2. Escribir tu mail en el campo de la página principal → "Create Access Key"
3. Te llega la clave por mail (es un código largo tipo `a1b2c3d4-...`)
4. En `index.html`, buscar `TU_CLAVE_DE_WEB3FORMS` y reemplazarlo por esa clave
5. Probar enviando una consulta desde el sitio

No hace falta crear cuenta ni entrar a ningún panel. El plan gratuito
acepta 250 envíos por mes.

Tu dirección de mail **no** queda escrita en el HTML: la clave le dice a
Web3Forms a dónde reenviar. Los robots de spam rastrean mails a la vista
en el código de las páginas, así que esto te evita ese problema.

Mientras la clave no esté puesta, el formulario no envía nada: muestra un
aviso y deriva a WhatsApp, así no se pierde ninguna consulta.

## Imágenes

Reemplazá los archivos de `assets/img/` por los tuyos. Si cambiás la extensión
(de `.svg` a `.jpg`), actualizala también en `index.html`.

## Publicado en Cloudflare Pages

**En vivo: https://viniciuscesa.com**

Dominio registrado en Hostinger, con el DNS delegado a Cloudflare
(nameservers `jack` y `treasure.ns.cloudflare.com`). La dirección interna
`portfolio-d8u.pages.dev` sigue existiendo: es a donde apunta el CNAME del
dominio, así que no hay que borrarla.

El sitio se republica solo con cada `git push` a la rama `main`.

Configuración usada (por si hay que rehacerla):

| Campo | Valor |
|---|---|
| Framework preset | None |
| Build command | vacío |
| Build output directory | vacío (raíz) |
| Production branch | main |

Se eligió Cloudflare por sobre Vercel porque su plan gratuito permite uso
comercial (el de Vercel no), sirve desde Buenos Aires en vez de São Paulo
—responde al doble de velocidad desde Argentina— y vende los dominios
al costo.

## Pendientes

- [ ] Revisar los textos del proceso marcados como `<!-- BORRADOR -->` (etapas 02 a 05)
- [ ] Reemplazar las imágenes placeholder por las reales
- [x] Pedir la clave en Web3Forms y pegarla en `index.html`
- [x] Probar el formulario: llega el mail con todos los datos
- [ ] Sumar Instagram al footer cuando exista la cuenta (hay dos bloques
      comentados en `index.html` listos para descomentar)
- [ ] Decidir si se activan los links legales del footer. Están escritos y
      comentados al final de `index.html`; necesitan sus páginas reales
      (`terminos.html`, `privacidad.html`, `cookies.html`, `aviso-legal.html`)
- [ ] Borrar la copia vieja en `OneDrive\Documents\Portfolio`
