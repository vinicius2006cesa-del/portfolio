#!/bin/sh
# =====================================================================
# Publica los cambios del sitio: versiona + add + commit + push.
#
# No se ejecuta directo, se llama con el atajo de Git:
#     git publicar "que cambiaste"
#
# Si el atajo no existe (pasa al clonar el repo de nuevo), se crea con:
#     git config alias.publicar '!sh publicar.sh'
#
# La logica vive aca y no dentro del alias porque PowerShell rompe las
# comillas dobles al pasarle argumentos a programas externos, y el
# mensaje del commit llegaba partido en palabras sueltas.
# =====================================================================

mensaje="$1"

if [ -z "$mensaje" ]; then
  echo "Falta el mensaje."
  echo 'Uso:  git publicar "que cambiaste"'
  exit 1
fi

if [ -z "$(git status --porcelain)" ]; then
  echo "No hay ningun cambio para publicar."
  exit 0
fi

# --- Versionado del CSS y el JS --------------------------------------
# Cloudflare le dice al navegador que guarde el CSS y el JS unas horas.
# Si el nombre del archivo no cambia, el navegador reusa el viejo y el
# sitio se ve roto: HTML nuevo con estilos viejos (navbar blanco, logo
# invisible). Cambiando el ?v= en cada publicacion, la direccion es
# nueva y NINGUN cache puede servir la version vieja: ni el tuyo, ni el
# de Cloudflare, ni el de un visitante que entro ayer.
#
# Va despues del chequeo de cambios a proposito: si no hay nada que
# publicar, no tiene sentido generar una version nueva.
version=$(date +%Y%m%d%H%M)
for f in index.html legal.html 404.html; do
  [ -f "$f" ] || continue
  # Generico a proposito: agarra CUALQUIER archivo de css/ o js/, no solo
  # styles.css y main.js. Antes estaban nombrados uno por uno, y al sumar
  # js/activar-animaciones.js se habria quedado sin versionar: justo el
  # bug de cache que este bloque existe para evitar.
  sed -i -E "s|(href=\"/?css/[A-Za-z0-9._-]+\.css)(\?v=[0-9]+)?\"|\1?v=$version\"|g" "$f"
  sed -i -E "s|(src=\"/?js/[A-Za-z0-9._-]+\.js)(\?v=[0-9]+)?\"|\1?v=$version\"|g" "$f"

  # LA IMAGEN DE LA VISTA PREVIA TAMBIEN SE VERSIONA.
  #
  # Cuando compartis el link por WhatsApp, Instagram o LinkedIn, esas
  # aplicaciones NO leen tu sitio cada vez: lo leen una sola vez, se
  # guardan el titulo, la descripcion y la imagen, y despues sirven esa
  # copia a todo el mundo durante dias. Por eso al compartir seguia
  # apareciendo una vista previa vieja aunque el sitio ya estuviera
  # cambiado.
  #
  # Lo que esas aplicaciones usan como identificador es la DIRECCION de
  # la imagen. Mientras sea siempre la misma, no tienen motivo para ir a
  # buscarla de nuevo. Agregandole ?v= en cada publicacion, la direccion
  # cambia y la tienen que volver a pedir.
  #
  # Ojo: esto arregla la imagen a futuro, pero NO borra lo que esas
  # aplicaciones ya tienen guardado de antes. Para eso hay que pedirles
  # que relean, ver el final de este archivo.
  #
  # LO MISMO PARA LAS CAPTURAS DE LOS PROYECTOS.
  #
  # Nos mordio una vez: se reemplazo la captura de un proyecto por otra
  # distinta manteniendo el nombre del archivo, y Cloudflare siguio
  # sirviendo la vieja durante horas (max-age=14400). La pagina pedia
  # una imagen larga para recorrerla y recibia la cuadrada de antes, asi
  # que no se movia nada.
  #
  # Cambiar el contenido de un archivo sin cambiar su direccion no le
  # avisa a ningun cache. El ?v= si.
  # El separador del sed es # y no la barra vertical: la barra vertical
  # tambien separa alternativas adentro de la expresion, y las dos cosas
  # se chocan. Probado: el comando se partia al medio y no corria.
  sed -i -E "s#(content=\"https://viniciuscesa\.com/assets/img/[A-Za-z0-9._-]+\.(png|jpg|webp))(\?v=[0-9]+)?\"#\1?v=$version\"#g" "$f"
  # (src|poster) y no solo src: el <video> del recorrido lleva su
  # captura de respaldo en poster=, y esa tambien se puede cambiar.
  # Y mp4 en la lista de extensiones, por el video mismo.
  sed -i -E "s#((src|poster)=\"/?assets/[A-Za-z0-9._/-]+\.(png|jpg|jpeg|webp|svg|mp4|webm))(\?v=[0-9]+)?\"#\1?v=$version\"#g" "$f"
done
echo "Version nueva de CSS, JS e imagenes: $version"
echo

echo "Se van a publicar estos archivos:"
echo
git status --short
echo

git add -A                 || { echo "Fallo al preparar los archivos."; exit 1; }
git commit -m "$mensaje"   || { echo "Fallo el commit."; exit 1; }
git push                   || { echo "Fallo el push. Revisa tu conexion."; exit 1; }

echo
echo "Listo. Cloudflare publica el sitio en 30-60 segundos."
echo "Para comprobarlo:  curl -I https://viniciuscesa.com/"
echo
echo "Si cambiaste la imagen o los textos de la vista previa, pedile a"
echo "cada aplicacion que relea el sitio (si no, siguen mostrando la"
echo "copia vieja que se guardaron):"
echo "  WhatsApp y Facebook  https://developers.facebook.com/tools/debug/"
echo "  LinkedIn             https://www.linkedin.com/post-inspector/"
echo "  X / Twitter          https://cards-dev.twitter.com/validator"
