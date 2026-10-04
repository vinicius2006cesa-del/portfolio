#!/bin/sh
# =====================================================================
# Publica los cambios del sitio: add + commit + push, los tres de una.
#
# No se ejecuta directo, se llama con el atajo de Git:
#     git publicar "que cambiaste"
#
# Si el atajo no existe (pasa al clonar el repo de nuevo), se crea con:
#     git config alias.publicar '!sh publicar.sh'
#
# Este archivo existe en vez de meter toda la logica dentro del alias
# porque PowerShell rompe las comillas dobles al pasarle argumentos a
# programas externos, y el mensaje del commit llegaba partido en
# palabras sueltas. Adentro de un archivo no hay terminal que las toque.
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
