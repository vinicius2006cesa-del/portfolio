/* =====================================================================
   VINICIUS CESA — JavaScript principal

   INDICE
   1. Utilidades
   2. Animaciones de aparicion al hacer scroll
   3. Menu de navegacion (hamburguesa)
   4. Estado de la navbar al hacer scroll
   5. Link activo segun la seccion visible
   5b. Boton flotante de WhatsApp
   6. Formulario de contacto
   7. Arranque
   ===================================================================== */

// "use strict" activa el modo estricto: JavaScript avisa de errores que
// normalmente se traga en silencio (por ejemplo, usar una variable sin declarar).
"use strict";

// Le avisa a js/activar-animaciones.js que este archivo si llego. Si la
// marca falta cuando termina de cargar la pagina, aquel saca la clase
// que esconde el contenido y el sitio se ve igual, sin animaciones.
// Va aca arriba de todo a proposito: aunque mas abajo explote algo, la
// marca ya quedo puesta y el contenido no se pierde.
document.documentElement.setAttribute("data-animaciones-listas", "");


/* =====================================================================
   1. UTILIDADES
   ===================================================================== */

/**
 * Devuelve true si la persona pidio en su sistema operativo ver menos
 * animaciones. Lo consultamos antes de animar cualquier cosa.
 */
function prefiereMenosMovimiento() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}


/* =====================================================================
   2. ANIMACIONES DE APARICION AL HACER SCROLL
   ---------------------------------------------------------------------
   Todo elemento con class="aparece" empieza invisible (lo define el CSS).
   Cuando entra en pantalla le agregamos "visible" y el CSS hace la
   transicion.
   ===================================================================== */
/**
 * Le da a cada hijo de un bloque [data-escalonar] un retraso creciente,
 * para que entren uno atras de otro en vez de todos juntos.
 *
 * El retraso se guarda en la variable CSS --retraso, que el CSS ya lee
 * en transition-delay. El JS decide CUANTO espera cada uno; el CSS
 * decide QUE pasa. Cada lenguaje hace lo suyo.
 */
function prepararEscalonado() {
  document.querySelectorAll("[data-escalonar]").forEach((bloque) => {
    bloque.querySelectorAll(".aparece").forEach((el, indice) => {
      el.style.setProperty("--retraso", indice * 90 + "ms");
    });
  });
}


function activarAnimacionesDeScroll() {
  const elementos = document.querySelectorAll(".aparece");

  // Si no hay nada que animar, o la persona pidio menos movimiento,
  // mostramos todo de una y no creamos ningun observador.
  if (elementos.length === 0 || prefiereMenosMovimiento()) {
    elementos.forEach((el) => el.classList.add("visible"));
    return;
  }

  // IntersectionObserver: el navegador nos avisa cuando un elemento entra
  // o sale de la pantalla. Es mucho mas eficiente que escuchar el evento
  // scroll, porque no corre en cada pixel que te moves.
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visible");
          // Una vez que aparecio dejamos de observarlo: la animacion se
          // hace una sola vez, no cada vez que pasas.
          observador.unobserve(entrada.target);
        }
      });
    },
    {
      threshold: 0.12,                      // cuando se ve el 12% del elemento
      rootMargin: "0px 0px -60px 0px",      // un toque despues de asomar
    }
  );

  elementos.forEach((el) => observador.observe(el));
}


/* =====================================================================
   3. MENU DE NAVEGACION (hamburguesa)
   ===================================================================== */
function activarMenu() {
  const boton = document.getElementById("boton-menu");
  const menu = document.getElementById("menu-principal");

  // Si el HTML cambio y estos elementos no existen, salimos sin hacer
  // nada en vez de romper todo el script.
  if (!boton || !menu) return;

  /**
   * Abre o cierra el menu.
   * @param {boolean} abrir - true para abrir, false para cerrar
   */
  function cambiarMenu(abrir) {
    menu.classList.toggle("navbar__menu--abierto", abrir);

    // aria-expanded es lo que escucha el lector de pantalla.
    // Ademas el CSS lo usa para dibujar la X de la hamburguesa.
    boton.setAttribute("aria-expanded", String(abrir));
    boton.setAttribute("aria-label", abrir ? "Cerrar menú" : "Abrir menú");

    // Bloquea el scroll del fondo mientras el menu esta abierto.
    document.body.style.overflow = abrir ? "hidden" : "";
  }

  // 1. Clic en la hamburguesa: alterna el estado actual
  boton.addEventListener("click", () => {
    const estaAbierto = boton.getAttribute("aria-expanded") === "true";
    cambiarMenu(!estaAbierto);
  });

  // 2. Clic en cualquier link del menu: lo cerramos. Sin esto, en celular
  //    el panel te taparia la seccion a la que acabas de saltar.
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => cambiarMenu(false));
  });

  // 3. Escape cierra el menu y devuelve el foco al boton. Devolver el foco
  //    importa: si navegas con teclado, sin esto quedarias perdido en un
  //    menu que ya no se ve.
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && boton.getAttribute("aria-expanded") === "true") {
      cambiarMenu(false);
      boton.focus();
    }
  });

  // 4. Si agrandas la ventana a desktop con el menu abierto, lo cerramos.
  //    Sin esto el panel desaparece por CSS pero el scroll del body queda
  //    bloqueado para siempre.
  window.matchMedia("(min-width: 900px)").addEventListener("change", (evento) => {
    if (evento.matches) cambiarMenu(false);
  });
}


/* =====================================================================
   4. ESTADO DE LA NAVBAR AL HACER SCROLL
   ===================================================================== */
function activarNavbarScroll() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  function revisar() {
    navbar.classList.toggle("navbar--scrolleado", window.scrollY > 8);
  }

  // passive: true le avisa al navegador que no vamos a frenar el scroll.
  // Le permite desplazar la pagina sin esperar a que termine nuestro codigo.
  window.addEventListener("scroll", revisar, { passive: true });

  // Lo corremos una vez al cargar, por si la pagina abre ya scrolleada
  // (pasa al recargar con F5 estando en el medio del sitio).
  revisar();
}


/* =====================================================================
   5. LINK ACTIVO SEGUN LA SECCION VISIBLE  ("scrollspy")
   ===================================================================== */
function activarLinkActivo() {
  const links = document.querySelectorAll(".navbar__link");
  if (links.length === 0) return;

  // Diccionario { "#perfil": <a>, "#servicios": <a>, ... } para encontrar
  // el link de cada seccion sin recorrer la lista entera cada vez.
  const linkPorId = {};
  const secciones = [];

  links.forEach((link) => {
    const id = link.getAttribute("href");
    const seccion = document.querySelector(id);
    if (seccion) {
      linkPorId[id] = link;
      secciones.push(seccion);
    }
  });

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;

        const link = linkPorId["#" + entrada.target.id];
        if (!link) return;

        // Apagamos todos y prendemos solo el que corresponde
        links.forEach((l) => l.classList.remove("navbar__link--activo"));
        link.classList.add("navbar__link--activo");
      });
    },
    {
      // Franja de deteccion en el medio de la pantalla: recorta 30% desde
      // arriba y 60% desde abajo. Sin esto, con dos secciones visibles a la
      // vez el resaltado saltaria de una a otra.
      rootMargin: "-30% 0px -60% 0px",
    }
  );

  secciones.forEach((seccion) => observador.observe(seccion));
}


/* =====================================================================
   5b. BOTON FLOTANTE DE WHATSAPP
   ---------------------------------------------------------------------
   Aparece recien cuando bajaste del inicio. Arriba ya hay dos botones
   grandes; un tercero seria ruido.
   ===================================================================== */
function activarBotonFlotante() {
  const boton = document.getElementById("wsp-flotante");
  if (!boton) return;

  // El boton es fijo: SIEMPRE va a flotar sobre algo. La solucion no es
  // moverlo, es que no este cuando molesta.
  //
  // Se esconde al bajar y aparece al subir. Suena al reves, pero sigue
  // lo que esta haciendo la persona: si bajas, estas leyendo contenido
  // nuevo y el boton solo tapa; si subis, estas buscando algo, y lo mas
  // probable es que sea como contactarse. Ya tapaba la hora del hero y
  // despues el año de la ficha de proyectos.
  const MINIMO = 6;     // menos que esto es temblor del dedo, no scroll
  const ARRANQUE = 200; // arriba de todo no se esconde: recien aparecio

  let ultimoY = window.scrollY;
  let pendiente = false;

  function revisar() {
    pendiente = false;
    const y = window.scrollY;

    // Cuanto falta para el fondo de la pagina:
    //   alto de la ventana + lo que scrolleaste = donde termina lo que ves
    //   scrollHeight = alto total del documento
    const llegoAlFinal =
      window.innerHeight + y >= document.documentElement.scrollHeight - 160;

    const movimiento = y - ultimoY;

    let mostrar;
    if (llegoAlFinal) {
      // En el pie tapaba el "Volver arriba", y ademas ahi ya tenes el
      // WhatsApp, el mail y el telefono escritos a la vista.
      mostrar = false;
    } else if (y < ARRANQUE) {
      mostrar = true;
    } else if (Math.abs(movimiento) < MINIMO) {
      // Movimiento despreciable: dejamos el estado como esta, asi no
      // parpadea mientras la pagina se asienta.
      mostrar = boton.classList.contains("wsp-flotante--visible");
    } else {
      mostrar = movimiento < 0;   // negativo = subiendo
    }

    boton.classList.toggle("wsp-flotante--visible", mostrar);

    // Solo se actualiza cuando el movimiento conto: si no, un scroll
    // lento de 3px por cuadro nunca llegaria al minimo y el boton se
    // quedaria trabado en el ultimo estado para siempre.
    if (Math.abs(movimiento) >= MINIMO) ultimoY = y;
  }

  // El scroll dispara decenas de veces por segundo y la pantalla se
  // dibuja 60: sin esto calculariamos posiciones que nadie ve.
  window.addEventListener(
    "scroll",
    () => {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(revisar);
      }
    },
    { passive: true }
  );

  revisar();
}




function activarOleaje() {
  const lienzo = document.querySelector(".hero__oleaje");
  const hero = document.querySelector(".hero");
  if (!lienzo || !hero) return;

  // En celular no se dibuja: un canvas que repinta todo el tiempo gasta
  // bateria, y en una pantalla de 6 pulgadas el movimiento casi no se
  // aprecia. Queda el degradado que el CSS le puso de fondo al canvas.
  const anchoMinimo = 900;
  if (window.innerWidth < anchoMinimo) return;
  if (prefiereMenosMovimiento()) return;

  const pincel = lienzo.getContext("2d");
  if (!pincel) return;

  const ANCHO = lienzo.width;    // 192
  const ALTO = lienzo.height;    // 108
  const imagen = pincel.createImageData(ANCHO, ALTO);
  const datos = imagen.data;

  // Los tres colores del oleaje, en crudo. Son los mismos del sitio:
  // la crema de fondo, el dorado calido y un azul MUY lavado. El azul
  // esta a proposito a un pelo de la crema: con uno mas saturado, medio
  // hero se veia gris y la pagina perdia el color de la marca.
  const CREMA = [245, 235, 215];
  const ORO = [228, 203, 152];
  const AZUL = [230, 233, 240];

  // mezcla devuelve el color que corresponde a un valor de -1 a 1:
  // hacia abajo tira a azul, en el medio crema, hacia arriba a dorado.
  function mezclar(v, salida) {
    if (v >= 0) {
      const k = v;
      salida[0] = CREMA[0] + (ORO[0] - CREMA[0]) * k;
      salida[1] = CREMA[1] + (ORO[1] - CREMA[1]) * k;
      salida[2] = CREMA[2] + (ORO[2] - CREMA[2]) * k;
    } else {
      const k = -v;
      salida[0] = CREMA[0] + (AZUL[0] - CREMA[0]) * k;
      salida[1] = CREMA[1] + (AZUL[1] - CREMA[1]) * k;
      salida[2] = CREMA[2] + (AZUL[2] - CREMA[2]) * k;
    }
  }

  const color = [0, 0, 0];

  function dibujar(t) {
    let i = 0;
    for (let py = 0; py < ALTO; py++) {
      const y = py / ALTO;
      for (let px = 0; px < ANCHO; px++) {
        const x = px / ANCHO;

        // El frente de la ola: cuanto se corre hacia arriba o hacia
        // abajo segun donde estes en el eje horizontal. Dos senos de
        // periodo distinto que van en sentidos opuestos: asi la cresta
        // nunca es una curva regular, se deforma mientras avanza.
        const frente =
          Math.sin(x * 4.2 + t * 0.055) * 0.5 +
          Math.sin(x * 2.3 - t * 0.031) * 0.32;

        // La ola propiamente dicha. El 1.6 es cuantas bandas entran en
        // la altura de la pantalla: con mas, se ve rayado.
        const ola = Math.sin((y + frente * 0.22) * 1.6 - t * 0.042);

        // Segunda capa, mas grande y mucho mas lenta, en diagonal. Es la
        // que evita que se lea como un patron: sola la ola de arriba se
        // repite, con esta encima nunca cae dos veces igual.
        const marea = Math.sin((x * 1.1 + y * 1.6) - t * 0.019) * 0.45;

        // 0.30 de amplitud total. Arranco en 0.55 y era demasiado: en
        // seis segundos la pantalla pasaba de calida a fria entera. Esto
        // tiene que leerse como luz que cambia, no como colores que se
        // mueven. Si lo subis, el texto de arriba empieza a costar.
        mezclar((ola * 0.62 + marea) * 0.30, color);

        datos[i++] = color[0];
        datos[i++] = color[1];
        datos[i++] = color[2];
        datos[i++] = 255;
      }
    }
    pincel.putImageData(imagen, 0, 0);
  }

  // --- El reloj -------------------------------------------------------
  // Se dibuja a 30 cuadros por segundo, no a 60: el movimiento es tan
  // lento que la mitad de los cuadros serian identicos al anterior.
  // Baja a la mitad el trabajo sin que se note ninguna diferencia.
  const MS_POR_CUADRO = 1000 / 30;
  let ultimo = 0;
  let corriendo = true;
  let pedido = null;

  function cuadro(ahora) {
    if (!corriendo) return;
    pedido = requestAnimationFrame(cuadro);
    if (ahora - ultimo < MS_POR_CUADRO) return;
    ultimo = ahora;
    dibujar(ahora / 1000);
  }

  // Cuando el hero sale de pantalla se para del todo. No tiene sentido
  // dibujar un fondo que nadie esta mirando.
  const vigia = new IntersectionObserver(
    (entradas) => {
      const visible = entradas[0].isIntersecting;
      if (visible && !corriendo) {
        corriendo = true;
        pedido = requestAnimationFrame(cuadro);
      } else if (!visible && corriendo) {
        corriendo = false;
        if (pedido) cancelAnimationFrame(pedido);
      }
    },
    { threshold: 0 }
  );
  vigia.observe(hero);

  dibujar(0);
  pedido = requestAnimationFrame(cuadro);

  // --- Seguimiento del mouse -----------------------------------------
  // Las dos capas del fondo, cada una con su factor de recorrido.
  // Que se muevan DISTINTO es lo que genera la profundidad: si las dos
  // se corrieran igual, el ojo las lee como una sola lamina plana.
  // La V es la capa "cercana" y el oleaje la "lejana", por eso la V se
  // mueve mas del doble.
  const capas = [
    { nodo: document.querySelector(".hero__filigrana"), factor: 18 },
    { nodo: lienzo, factor: 7 },
  ].filter((capa) => capa.nodo);

  // Solo con mouse de verdad. En tactil no hay cursor que seguir.
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  let pendiente = false;
  let dx = 0;
  let dy = 0;

  function mover() {
    pendiente = false;
    for (const capa of capas) {
      // El signo negativo hace que el fondo se aleje del cursor, que da
      // mas sensacion de profundidad que seguirlo.
      const x = -dx * capa.factor;
      const y = -dy * capa.factor;
      capa.nodo.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }

  function pedirCuadro() {
    // requestAnimationFrame: el mousemove dispara decenas de veces por
    // segundo, pero la pantalla solo se dibuja 60. Sin esto estariamos
    // calculando posiciones que nadie llega a ver.
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(mover);
    }
  }

  hero.addEventListener(
    "mousemove",
    (evento) => {
      const caja = hero.getBoundingClientRect();
      // -0.5 a 0.5 segun donde este el cursor dentro del hero
      dx = (evento.clientX - caja.left) / caja.width - 0.5;
      dy = (evento.clientY - caja.top) / caja.height - 0.5;
      pedirCuadro();
    },
    { passive: true }
  );

  hero.addEventListener("mouseleave", () => {
    dx = 0;
    dy = 0;
    pedirCuadro();
  });
}


/* =====================================================================
   5b. VITRINA DE PROYECTOS
   ---------------------------------------------------------------------
   Lista de nombres + vista grande. Implementa el patron de pestañas:
   click y flechas del teclado, con un ciclado automatico que se frena
   en cuanto la persona interactua.
   ===================================================================== */
function activarVitrina() {
  const vitrina = document.getElementById("vitrina");
  if (!vitrina) return;

  const pestanas = [...vitrina.querySelectorAll('[role="tab"]')];
  const paneles = [...vitrina.querySelectorAll('[role="tabpanel"]')];
  if (pestanas.length < 2) return;

  let actual = pestanas.findIndex((p) => p.getAttribute("aria-selected") === "true");
  if (actual < 0) actual = 0;

  /**
   * Muestra el proyecto numero `indice`.
   * @param {boolean} moverFoco  true cuando el cambio vino del teclado:
   *   ahi hay que llevar el foco al nuevo boton. Con el mouse no, porque
   *   robarle el foco a alguien que solo paso el cursor es molesto.
   */
  function mostrar(indice, moverFoco) {
    if (indice === actual) return;

    pestanas.forEach((pestana, i) => {
      const elegida = i === indice;
      pestana.setAttribute("aria-selected", elegida ? "true" : "false");
      // Solo la pestaña activa entra en el recorrido del Tab. Las otras
      // se alcanzan con las flechas. Es como funcionan las pestañas en
      // cualquier programa: un Tab para entrar al grupo, flechas adentro.
      pestana.tabIndex = elegida ? 0 : -1;

      paneles[i].classList.toggle("vitrina__panel--activo", elegida);
      // hidden saca el panel del arbol de accesibilidad y del Tab. Se
      // quita ANTES de la animacion y se pone DESPUES, para que el
      // fundido se llegue a ver.
      if (elegida) paneles[i].hidden = false;
    });

    const anterior = actual;
    actual = indice;

    // 320ms = lo que dura --transicion-normal en el CSS.
    setTimeout(() => {
      if (actual !== anterior) paneles[anterior].hidden = true;
    }, 320);

    if (moverFoco) pestanas[indice].focus();
  }

  // --- Mouse y tacto -------------------------------------------------
  pestanas.forEach((pestana, i) => {
    pestana.addEventListener("click", () => {
      detenerCiclado();
      mostrar(i, false);
    });
    // En desktop basta con pasar el cursor. En tactil este evento no
    // existe, asi que ahi manda el click de arriba.
    pestana.addEventListener("mouseenter", () => {
      detenerCiclado();
      mostrar(i, false);
    });
  });

  // --- Teclado --------------------------------------------------------
  vitrina.addEventListener("keydown", (evento) => {
    const mapa = {
      ArrowDown: actual + 1,
      ArrowRight: actual + 1,
      ArrowUp: actual - 1,
      ArrowLeft: actual - 1,
      Home: 0,
      End: pestanas.length - 1,
    };
    if (!(evento.key in mapa)) return;
    evento.preventDefault();
    detenerCiclado();
    // El modulo hace que de la ultima se pase a la primera y al reves.
    const destino = (mapa[evento.key] + pestanas.length) % pestanas.length;
    mostrar(destino, true);
  });

  // --- Ciclado automatico ---------------------------------------------
  // Va pasando los proyectos solo, como una demostracion. Se frena para
  // siempre apenas la persona toca algo: a partir de ahi manda ella.
  let reloj = null;

  function detenerCiclado() {
    if (reloj) {
      clearInterval(reloj);
      reloj = null;
    }
  }

  function arrancarCiclado() {
    // Si pidieron menos movimiento, no se mueve nada solo.
    if (prefiereMenosMovimiento()) return;
    reloj = setInterval(() => {
      mostrar((actual + 1) % pestanas.length, false);
    }, 4500);
  }

  // Solo cicla mientras la seccion esta a la vista: no tiene sentido
  // gastar animacion si la persona esta leyendo otra parte de la pagina.
  const vigia = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting && !reloj) arrancarCiclado();
        else if (!entrada.isIntersecting) detenerCiclado();
      });
    },
    { threshold: 0.4 }
  );
  vigia.observe(vitrina);

  // Al enfocar con teclado tambien se frena.
  vitrina.addEventListener("focusin", detenerCiclado);
}


/* =====================================================================
   6. FORMULARIO DE CONTACTO
   ---------------------------------------------------------------------
   Lo enviamos con fetch para no recargar la pagina y poder mostrar un
   mensaje ahi mismo. Si el JavaScript fallara, el formulario igual
   funciona: el navegador lo enviaria de la forma tradicional.
   ===================================================================== */
function activarFormulario() {
  const formulario = document.getElementById("formulario-contacto");
  const estado = document.getElementById("formulario-estado");
  if (!formulario || !estado) return;

  /**
   * Escribe un mensaje debajo del boton de enviar.
   * @param {string} texto
   * @param {"ok"|"error"|""} tipo
   */
  function mostrarEstado(texto, tipo) {
    estado.textContent = texto;
    estado.className = "formulario__estado";
    if (tipo) estado.classList.add("formulario__estado--" + tipo);
  }

  formulario.addEventListener("submit", async (evento) => {
    // Si todavia no pegaste la clave de Web3Forms, avisamos en vez de
    // mandar la consulta a un lugar que no existe. Asi no se pierde
    // ningun contacto mientras tanto.
    const clave = formulario.querySelector("input[name='access_key']");
    if (!clave || clave.value.includes("TU_CLAVE_DE_WEB3FORMS")) {
      evento.preventDefault();
      mostrarEstado(
        "El formulario todavía no está conectado. Escribime por WhatsApp mientras tanto.",
        "error"
      );
      return;
    }

    // preventDefault frena el envio tradicional (que recarga la pagina)
    // para hacerlo nosotros con fetch.
    evento.preventDefault();

    const boton = formulario.querySelector("button[type='submit']");
    const textoOriginal = boton.textContent;

    // Deshabilitamos el boton para que no se envie dos veces de un doble clic
    boton.disabled = true;
    boton.textContent = "Enviando...";
    mostrarEstado("", "");

    try {
      const respuesta = await fetch(formulario.action, {
        method: "POST",
        body: new FormData(formulario),
        headers: { Accept: "application/json" },
      });

      if (respuesta.ok) {
        formulario.reset();
        mostrarEstado("¡Listo! Recibí tu consulta y te respondo a la brevedad.", "ok");
      } else {
        mostrarEstado(
          "No se pudo enviar. Probá de nuevo o escribime por WhatsApp.",
          "error"
        );
      }
    } catch (error) {
      // Este catch salta cuando no hay internet o falla la conexion
      mostrarEstado(
        "No hay conexión. Revisá tu internet o escribime por WhatsApp.",
        "error"
      );
    } finally {
      // finally corre siempre, haya salido bien o mal: el boton vuelve
      // a quedar usable en cualquier caso.
      boton.disabled = false;
      boton.textContent = textoOriginal;
    }
  });
}


/* =====================================================================
   7. ARRANQUE
   ---------------------------------------------------------------------
   El <script> tiene defer, asi que el HTML ya esta listo cuando esto
   corre. Igual agrupamos todo aca para que quede claro que se
   inicializa y en que orden.
   ===================================================================== */
function iniciar() {
  // El escalonado va PRIMERO: tiene que estar listo antes de que el
  // observador empiece a marcar elementos como visibles.
  prepararEscalonado();
  activarAnimacionesDeScroll();
  activarMenu();
  activarNavbarScroll();
  activarLinkActivo();
  activarBotonFlotante();
  activarOleaje();
  activarVitrina();
  activarFormulario();
}

iniciar();
