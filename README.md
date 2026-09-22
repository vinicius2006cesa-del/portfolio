# Portfolio — Vinicius Cesa

Sitio personal de una sola página. HTML, CSS y JavaScript puros: sin frameworks,
sin npm y sin paso de compilación.

## Estructura

```
index.html          Todo el contenido de la página
css/styles.css      Estilos. Las variables de diseño están arriba de todo
js/main.js          Comportamiento (menú, animaciones, acordeón, formulario)
assets/img/         Imágenes
```

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

## Cómo cambiar el diseño

Todos los colores, tipografías y espaciados están en el bloque `:root`, al
principio de `css/styles.css`. Cambiás ahí y se actualiza el sitio entero.

Tipografías actuales (Google Fonts, se cargan desde el `<head>`):
- **Archivo Black** — titulares
- **Poppins** — todo el resto

## Cómo agregar un proyecto nuevo

En `index.html`, buscá el comentario `PARA AGREGAR UN PROYECTO NUEVO`.
Copiá un bloque `<article class="proyecto">` entero, pegalo antes de la tarjeta
oscura del final y cambiá la imagen, el alt, la categoría, el título y la
descripción. La grilla se acomoda sola.

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

**En vivo: https://portfolio-d8u.pages.dev**

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
- [ ] Exportar `og-image.png` de 1200x630 px y actualizar `og:image` y `twitter:image`
- [x] Pedir la clave en Web3Forms y pegarla en `index.html`
- [x] Probar el formulario: llega el mail con todos los datos
- [ ] Sumar Instagram al footer cuando exista la cuenta (hay dos bloques
      comentados en `index.html` listos para descomentar)
- [ ] Decidir si se activan los links legales del footer. Están escritos y
      comentados al final de `index.html`; necesitan sus páginas reales
      (`terminos.html`, `privacidad.html`, `cookies.html`, `aviso-legal.html`)
- [ ] Actualizar la URL definitiva en `canonical`, `og:url` y `twitter:image`
- [ ] Borrar la copia vieja en `OneDrive\Documents\Portfolio`
