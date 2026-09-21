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

`C:\Users\vinic\dev\Portfolio`

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

## Formulario (Formspree)

1. Crear cuenta en [formspree.io](https://formspree.io)
2. New Form → poner un nombre y el mail donde querés recibir las consultas
3. Copiar el ID del form (la parte final de la URL que te dan)
4. En `index.html`, reemplazar `TU_ID_DE_FORMSPREE` en el `action` del formulario
5. Confirmar el mail que te manda Formspree
6. Probar enviando una consulta desde el sitio publicado

El plan gratuito acepta 50 envíos por mes.

## Imágenes

Reemplazá los archivos de `assets/img/` por los tuyos. Si cambiás la extensión
(de `.svg` a `.jpg`), actualizala también en `index.html`.

## Publicar en Vercel

1. Subir el repositorio a GitHub
2. En [vercel.com](https://vercel.com) → "Add New Project" → importar el repo
3. No tocar ninguna configuración: Vercel detecta el `index.html` y lo sirve
4. Deploy. Cada `git push` a la rama principal republica el sitio solo

## Pendientes

- [ ] Revisar los textos del proceso marcados como `<!-- BORRADOR -->` (etapas 02 a 05)
- [ ] Reemplazar las imágenes placeholder por las reales
- [ ] Exportar `og-image.png` de 1200x630 px y actualizar `og:image` y `twitter:image`
- [ ] Crear el formulario en Formspree y pegar el ID
- [ ] Actualizar la URL definitiva en `canonical`, `og:url` y `twitter:image`
- [ ] Borrar la copia vieja en `OneDrive\Documents\Portfolio`
