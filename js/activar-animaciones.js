/* =====================================================================
   UNA SOLA LINEA, Y TIENE QUE CORRER ANTES DEL PRIMER PINTADO
   ---------------------------------------------------------------------
   El CSS esconde los elementos con .aparece SOLO si el <html> tiene la
   clase que agrega este archivo. Si el JS no carga, la clase no se
   agrega, nadie esconde nada, y el sitio se ve igual: sin animaciones
   de entrada, pero completo.

   Antes era al reves y era un punto unico de falla: el CSS escondia
   TODO el contenido del sitio y main.js era el unico que lo podia
   mostrar. Medido con un navegador de verdad: cortando el pedido de
   main.js, la opacidad del titulo se quedaba en 0 indefinidamente. La
   pagina quedaba en blanco para siempre.

   Va como archivo aparte y no suelto dentro del HTML porque la politica
   de seguridad del sitio es script-src 'self' (ver _headers): un script
   escrito adentro de la pagina lo bloquearia el navegador.

   Y va SIN defer ni async a proposito: tiene que ejecutarse antes de que
   se dibuje el primer cuadro. Con defer, el navegador pintaria el
   contenido visible y recien despues lo esconderia: se veria un
   parpadeo. Es un archivo de bytes, no frena nada.
   ===================================================================== */
document.documentElement.classList.add("con-animaciones");

/* RED DE SEGURIDAD
   ---------------------------------------------------------------------
   Lo de arriba resuelve "no hay JavaScript", pero no resuelve el caso
   mas probable: que ESTE archivo cargue y main.js no (404, red movil que
   corta, una extension que bloquea de mas). Ahi la clase queda puesta,
   el CSS esconde todo y nadie lo revela nunca. Medido: pasaba.

   main.js marca el <html> apenas arranca. Si al terminar de cargar la
   pagina la marca no esta, es que main.js no corrio: sacamos la clase y
   el contenido aparece igual, sin animaciones.

   Se escucha "load" y no un temporizador al azar: los scripts con defer
   se ejecutan ANTES de que "load" se dispare. O sea que cuando esto
   corre, main.js ya tuvo su oportunidad. No hay que adivinar cuanto
   esperar. */
window.addEventListener("load", function () {
  if (!document.documentElement.hasAttribute("data-animaciones-listas")) {
    document.documentElement.classList.remove("con-animaciones");
  }
});
