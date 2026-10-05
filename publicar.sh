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
done
echo "Version nueva de CSS y JS: $version"
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
