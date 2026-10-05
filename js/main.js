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




function activarPlano() {
  const lienzo = document.querySelector(".hero__oleaje");
  const hero = document.querySelector(".hero");
  if (!lienzo || !hero) return;

  if (window.innerWidth < 900) return;
  if (prefiereMenosMovimiento()) return;

  const pincel = lienzo.getContext("2d");
  if (!pincel) return;

  /* PLANO DE CONSTRUCCION.

     No es un efecto de fondo: es el dibujo tecnico de la marca. Grilla
     milimetrada, los dos ejes de la V trazados en punteado, el nodo del
     vertice y las cotas de los angulos.

     Los angulos NO son decorativos, son los reales del logo: en el SVG
     el trazo marino va de (117,118) a (299,394) — 33.2 grados respecto
     de la vertical — y el azul de (395,118) a (303,381), 19.2 grados.
     Son los mismos numeros con los que calculamos la V del titulo.

     La idea: el sitio muestra como esta hecho. Es lo mas honesto que
     puede tener de fondo el portfolio de alguien que construye cosas
     midiendo. */
  /* Los angulos van NEGATIVO el izquierdo y POSITIVO el derecho. Con
     los signos al reves los brazos quedan espejados: el ancho (el del
     trazo marino) se va a la derecha y deja de ser tu V. */
  const EJE_IZQ = -33.2;
  const EJE_DER = 19.2;
  /* El vertice vive abajo a la derecha, fuera del bloque de texto. El
     plano acompana, no compite: si las cotas caen encima del titulo,
     dejan de leerse como anotaciones y pasan a ser ruido. */
  const VERTICE_X = 0.86;
  const VERTICE_Y = 0.90;

  const TINTA = "13, 27, 42";
  const PASO = 46;          // lado de la celda de la grilla, en px

  let ancho = 0;
  let alto = 0;

  function medir() {
    const caja = hero.getBoundingClientRect();
    const escala = Math.min(window.devicePixelRatio || 1, 2);
    lienzo.width = Math.round(caja.width * escala);
    lienzo.height = Math.round(caja.height * escala);
    pincel.setTransform(escala, 0, 0, escala, 0, 0);
    ancho = caja.width;
    alto = caja.height;
  }

  /** Dibuja una recta infinita que pasa por (x,y) con cierto angulo. */
  function eje(x, y, grados, alfa, guion) {
    const r = ((grados - 90) * Math.PI) / 180;
    const largo = ancho + alto;
    pincel.save();
    pincel.strokeStyle = "rgba(" + TINTA + ", " + alfa + ")";
    pincel.lineWidth = 1;
    pincel.setLineDash(guion);
    pincel.beginPath();
    pincel.moveTo(x - Math.cos(r) * largo, y - Math.sin(r) * largo);
    pincel.lineTo(x + Math.cos(r) * largo, y + Math.sin(r) * largo);
    pincel.stroke();
    pincel.restore();
  }

  function dibujar(t) {
    pincel.clearRect(0, 0, ancho, alto);

    // --- La grilla. Se desplaza muy despacio en diagonal: el plano
    //     "respira" sin que se vea nada moverse. El modulo hace que el
    //     desplazamiento sea continuo y nunca salte.
    const corre = (t * 3) % PASO;
    pincel.lineWidth = 1;
    for (let x = -PASO + corre; x < ancho + PASO; x += PASO) {
      // Cada quinta linea un poco mas marcada, como el papel milimetrado.
      const fuerte = Math.round((x - corre) / PASO) % 5 === 0;
      pincel.strokeStyle = "rgba(" + TINTA + ", " + (fuerte ? 0.055 : 0.025) + ")";
      pincel.beginPath();
      pincel.moveTo(Math.round(x) + 0.5, 0);
      pincel.lineTo(Math.round(x) + 0.5, alto);
      pincel.stroke();
    }
    for (let y = -PASO + corre; y < alto + PASO; y += PASO) {
      const fuerte = Math.round((y - corre) / PASO) % 5 === 0;
      pincel.strokeStyle = "rgba(" + TINTA + ", " + (fuerte ? 0.055 : 0.025) + ")";
      pincel.beginPath();
      pincel.moveTo(0, Math.round(y) + 0.5);
      pincel.lineTo(ancho, Math.round(y) + 0.5);
      pincel.stroke();
    }

    const vx = VERTICE_X * ancho;
    const vy = VERTICE_Y * alto;

    // --- Los dos ejes de la V, en punteado de plano.
    //     El punteado se corre con el tiempo: es la unica senal de que
    //     el dibujo esta vivo, y se lee como un trazo en curso.
    const avance = (t * 14) % 22;
    pincel.lineDashOffset = -avance;
    eje(vx, vy, EJE_IZQ, 0.16, [7, 15]);
    eje(vx, vy, EJE_DER, 0.16, [7, 15]);
    pincel.lineDashOffset = 0;

    // --- La vertical de referencia desde la que se miden los angulos.
    eje(vx, vy, 0, 0.07, [2, 9]);

    // --- El nodo del vertice: el circulito de los planos.
    pincel.strokeStyle = "rgba(" + TINTA + ", 0.26)";
    pincel.lineWidth = 1;
    pincel.beginPath();
    pincel.arc(vx, vy, 6, 0, Math.PI * 2);
    pincel.stroke();

    // --- El arco entre los dos ejes, como en un plano de verdad.
    //     Los angulos se calculan del MISMO numero que dibuja los ejes,
    //     no a mano: si algun dia se cambia la inclinacion, el arco la
    //     sigue solo en vez de quedar apuntando a cualquier lado.
    const aIzq = ((EJE_IZQ - 90) * Math.PI) / 180;
    const aDer = ((EJE_DER - 90) * Math.PI) / 180;
    pincel.strokeStyle = "rgba(" + TINTA + ", 0.20)";
    pincel.lineWidth = 1;
    pincel.beginPath();
    pincel.arc(vx, vy, 78, aIzq, aDer);
    pincel.stroke();

    // --- Las cotas. Dicen los angulos de verdad del logo, y se colocan
    //     SOBRE cada eje: asi se lee cual angulo describe cada una.
    pincel.fillStyle = "rgba(" + TINTA + ", 0.34)";
    pincel.font = "500 11px " + getComputedStyle(document.body).fontFamily;
    const rotulo = (ang, texto, dist) => {
      const r = ((ang - 90) * Math.PI) / 180;
      pincel.fillText(texto, vx + Math.cos(r) * dist - 14,
                             vy + Math.sin(r) * dist);
    };
    rotulo(EJE_IZQ, "33.2°", 112);
    rotulo(EJE_DER, "19.2°", 112);
  }

  // --- El reloj -------------------------------------------------------
  // 24 cuadros por segundo. El movimiento es tan lento que a 60 la
  // mitad de los cuadros serian identicos al anterior.
  const MS_POR_CUADRO = 1000 / 24;
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

  let reloj = null;
  window.addEventListener("resize", () => {
    clearTimeout(reloj);
    reloj = setTimeout(() => { medir(); dibujar(performance.now() / 1000); }, 200);
  }, { passive: true });

  medir();
  dibujar(0);
  pedido = requestAnimationFrame(cuadro);

  // --- Seguimiento del mouse -----------------------------------------
  // El campo entero se corre siguiendo el mouse. Es lo que mas le
  // gusta del fondo: el movimiento responde a donde estas mirando.
  const capas = [{ nodo: lienzo, factor: 14 }];

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
   5c. PROGRESO DE SCROLL
   ---------------------------------------------------------------------
   Esto es, en chiquito, lo que hace ScrollTrigger en los sitios que
   miramos: a cada elemento marcado con data-progreso le escribe una
   variable CSS --p que va de 0 a 1 segun cuanto avanzo por la pantalla.

   La gracia es el reparto de trabajo: el JS SOLO calcula un numero. Que
   hacer con ese numero (mover, escalar, girar) lo decide el CSS. Para
   sumar un efecto nuevo no hay que tocar JavaScript.

   --p vale 0 cuando el elemento esta por entrar por abajo y 1 cuando
   termino de salir por arriba. En el medio (0.5) esta centrado.
   ===================================================================== */
function activarProgresoDeScroll() {
  const objetivos = document.querySelectorAll("[data-progreso]");
  if (objetivos.length === 0) return;
  if (prefiereMenosMovimiento()) return;

  // Solo se calculan los que estan en pantalla. Sin esto estariamos
  // midiendo elementos que nadie ve, en cada cuadro, para siempre.
  const activos = new Set();
  let corriendo = false;

  // Si la pagina no se movio desde el cuadro anterior, no hay nada que
  // recalcular. Sin esto el bucle llamaba a getBoundingClientRect 60
  // veces por segundo aunque la pagina estuviera quieta, y cada llamada
  // obliga al navegador a recalcular el diseno antes de responder.
  let ultimoScroll = -1;

  function cuadro() {
    if (activos.size === 0) {
      corriendo = false;
      return;
    }
    requestAnimationFrame(cuadro);

    const scroll = window.scrollY;
    if (scroll === ultimoScroll) return;
    ultimoScroll = scroll;

    const alto = window.innerHeight;
    activos.forEach((el) => {
      const caja = el.getBoundingClientRect();
      // Recorrido total: el elemento entra por abajo y sale por arriba,
      // o sea que atraviesa el alto de la ventana MAS su propio alto.
      const p = (alto - caja.top) / (alto + caja.height);
      el.style.setProperty("--p", Math.min(1, Math.max(0, p)).toFixed(4));
    });
  }

  function arrancar() {
    if (!corriendo) {
      corriendo = true;
      requestAnimationFrame(cuadro);
    }
  }

  const vigia = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) activos.add(e.target);
        else activos.delete(e.target);
      });
      arrancar();
    },
    // Un margen generoso: empieza a calcular un poco antes de que el
    // elemento asome, asi nunca se ve el primer salto.
    { rootMargin: "25% 0px" }
  );

  objetivos.forEach((o) => vigia.observe(o));
}


/* =====================================================================
   5c2. REVELADO DE TEXTO POR RENGLONES
   ---------------------------------------------------------------------
   Cada renglon sube desde abajo detras de una mascara, uno atras de
   otro. Es el efecto que mas "editorial" se lee y el que mas trabajo
   da, porque NO se puede hacer solo con CSS: el navegador no expone
   donde corta cada renglon. Hay que medirlo.

   El metodo: se recorren las palabras una por una con un Range y se
   mira a que altura cae cada una. Cuando la altura cambia, empezo un
   renglon nuevo. Con eso se reagrupa el texto en un <span> por renglon,
   cada uno dentro de otro con overflow:hidden que hace de mascara.

   Como el corte depende del ancho, se rehace al cambiar el tamano de
   la ventana. Y se guarda el texto original para poder rehacerlo:
   medir sobre el texto ya partido daria cualquier cosa.
   ===================================================================== */
function activarRevelado() {
  const objetivos = document.querySelectorAll("[data-revelar]");
  if (objetivos.length === 0) return;

  // Sin animaciones el texto se queda exactamente como esta. No se toca
  // nada: partirlo sin motivo solo rompe la seleccion con el mouse.
  if (!document.documentElement.classList.contains("con-animaciones")) return;
  if (prefiereMenosMovimiento()) return;

  /**
   * Envuelve cada palabra en un <span> SIN tocar el resto del marcado,
   * y le anota en que renglon cayo.
   *
   * El primer intento rearmaba el texto renglon por renglon, con una
   * mascara por renglon. Se veia mejor, pero destruia el HTML de
   * adentro: las tres negritas de la bajada del hero desaparecian y
   * quedaba un espacio colgado antes de cada coma. Un efecto no vale
   * romper el contenido.
   *
   * Asi, cada palabra se queda donde estaba — las que viven adentro de
   * un <b> siguen adentro de ese <b> — y lo unico que se agrega es el
   * envoltorio que permite moverla.
   */
  function preparar(el) {
    if (el.dataset.preparado === "1") return;

    const nodos = [];
    const paseador = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = paseador.nextNode())) nodos.push(n);

    const palabras = [];
    for (const nodo of nodos) {
      if (!nodo.textContent.trim()) continue;
      const partes = nodo.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      for (const parte of partes) {
        if (parte === "") continue;
        if (!parte.trim()) {
          // Los espacios se conservan tal cual: son los que separan las
          // palabras y los que permiten que el renglon corte donde debe.
          frag.appendChild(document.createTextNode(parte));
        } else {
          const sp = document.createElement("span");
          sp.className = "revelar__palabra";
          sp.textContent = parte;
          frag.appendChild(sp);
          palabras.push(sp);
        }
      }
      nodo.parentNode.replaceChild(frag, nodo);
    }
    if (palabras.length === 0) return;

    el.dataset.preparado = "1";
    el.classList.add("revelar--listo");
    el._palabras = palabras;
    numerarRenglones(el);
  }

  /**
   * Mira a que altura quedo cada palabra y le pone el numero de renglon
   * en --renglon. El CSS usa ese numero para el retraso: asi las
   * palabras de un mismo renglon entran juntas y los renglones entran
   * uno atras de otro.
   */
  function numerarRenglones(el) {
    const palabras = el._palabras;
    if (!palabras) return;
    let altura = null;
    let renglon = -1;
    for (const sp of palabras) {
      const y = Math.round(sp.getBoundingClientRect().top);
      if (altura === null || Math.abs(y - altura) > 2) {
        altura = y;
        renglon++;
      }
      sp.style.setProperty("--renglon", renglon);
    }
  }

  objetivos.forEach(preparar);

  const vigia = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("revelar--visible");
          vigia.unobserve(e.target);
        }
      });
    },
    { threshold: 0.05 }
  );
  objetivos.forEach((el) => vigia.observe(el));

  // Donde corta cada renglon depende del ancho: al cambiar hay que
  // volver a numerar. No hace falta rehacer nada mas.
  let reloj = null;
  window.addEventListener("resize", () => {
    clearTimeout(reloj);
    reloj = setTimeout(() => objetivos.forEach(numerarRenglones), 250);
  }, { passive: true });
}


/* =====================================================================
   5c3. INCLINACION 3D DE LA IMAGEN DE PROYECTOS
   ---------------------------------------------------------------------
   La imagen se inclina hacia el cursor, con un reflejo que la recorre.
   Es el efecto que hace que una captura plana se lea como un objeto.

   Dos limites deliberados:
   - 7 grados como maximo. Pasado eso deja de parecer una superficie
     inclinada y empieza a parecer que la pagina esta rota.
   - Solo con mouse. En tactil no hay cursor al que inclinarse, y en
     una pantalla chica la perspectiva no se aprecia.
   ===================================================================== */
function activarInclinacion() {
  const marcos = document.querySelectorAll("[data-inclinar]");
  if (marcos.length === 0) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (prefiereMenosMovimiento()) return;

  const GRADOS = 7;

  marcos.forEach((marco) => {
    let pedido = null;
    let gx = 0, gy = 0, lx = 50, ly = 50;

    function pintar() {
      pedido = null;
      marco.style.transform =
        "perspective(1100px) rotateX(" + gy.toFixed(2) + "deg) rotateY(" +
        gx.toFixed(2) + "deg)";
      // El reflejo sigue al cursor por separado: es lo que vende que
      // hay una superficie y no solo una caja girada.
      marco.style.setProperty("--brillo-x", lx.toFixed(1) + "%");
      marco.style.setProperty("--brillo-y", ly.toFixed(1) + "%");
    }

    marco.addEventListener("mousemove", (e) => {
      const caja = marco.getBoundingClientRect();
      const px = (e.clientX - caja.left) / caja.width;   // 0 a 1
      const py = (e.clientY - caja.top) / caja.height;
      // El signo de rotateX va invertido: el mouse arriba tiene que
      // inclinar el borde superior HACIA ATRAS, no hacia adelante.
      gx = (px - 0.5) * 2 * GRADOS;
      gy = -(py - 0.5) * 2 * GRADOS;
      lx = px * 100;
      ly = py * 100;
      if (!pedido) pedido = requestAnimationFrame(pintar);
    }, { passive: true });

    marco.addEventListener("mouseleave", () => {
      gx = 0;
      gy = 0;
      lx = 50;
      ly = 50;
      if (!pedido) pedido = requestAnimationFrame(pintar);
    });
  });
}


/* =====================================================================
   5d. BARRA DE PROGRESO DE LECTURA
   ===================================================================== */
function activarProgresoDeLectura() {
  const barra = document.querySelector(".progreso__barra");
  if (!barra) return;

  let pendiente = false;

  function pintar() {
    pendiente = false;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    // Una pagina que no scrollea no tiene progreso que mostrar.
    const p = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
    // scaleX y no width: escalar lo resuelve la placa de video, cambiar
    // el ancho obliga a recalcular el diseno en cada cuadro.
    barra.style.transform = "scaleX(" + p.toFixed(4) + ")";
  }

  window.addEventListener("scroll", () => {
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(pintar);
    }
  }, { passive: true });

  window.addEventListener("resize", pintar, { passive: true });
  pintar();
}


/* =====================================================================
   6. FORMULARIO DE CONTACTO
   ---------------------------------------------------------------------
   Lo enviamos con fetch para no recargar la pagina y poder mostrar un
   mensaje ahi mismo. Si el JavaScript fallara, el formulario igual
   funciona: el navegador lo enviaria de la forma tradicional.
   ===================================================================== */
/* --- Validacion de los campos ----------------------------------------
   El navegador YA valida con required, pattern y minlength: si el JS no
   carga, el formulario igual no se envia incompleto. Esto es la capa de
   arriba, y sirve para dos cosas que el navegador hace mal:

   1. Sus mensajes son genericos y a veces estan en ingles ("Please match
      the requested format"). Aca escribimos que esta mal y como
      arreglarlo, en castellano.
   2. Sus globos aparecen de a uno y desaparecen solos. Estos quedan
      escritos debajo del campo hasta que lo corregis.
   -------------------------------------------------------------------- */
const MENSAJES = {
  nombre: {
    valueMissing: "Escribí tu nombre, así sé cómo llamarte.",
    tooShort: "El nombre es muy corto.",
  },
  whatsapp: {
    patternMismatch: "Solo números. Pueden ir con +, espacios o guiones.",
  },
  email: {
    valueMissing: "Necesito tu mail para poder responderte.",
    typeMismatch: "Revisá el mail: le falta el @ o el dominio.",
    patternMismatch: "Revisá el mail: le falta el @ o el dominio.",
  },
  mensaje: {
    valueMissing: "Contame aunque sea en una línea qué necesitás.",
    tooShort: "Un poquito más de detalle me ayuda a entenderte.",
  },
};

/**
 * Revisa un campo y escribe (o borra) su mensaje de error.
 * @param {HTMLInputElement|HTMLTextAreaElement} campo
 * @returns {boolean} true si el campo esta bien
 */
function revisarCampo(campo) {
  const cartel = document.getElementById("error-" + campo.name);
  const v = campo.validity;

  // Un campo opcional y vacio esta bien: no se le marca nada.
  if (v.valid) {
    if (cartel) cartel.textContent = "";
    campo.removeAttribute("aria-invalid");
    return true;
  }

  const propios = MENSAJES[campo.name] || {};
  let texto = "";
  for (const clave of [
    "valueMissing",
    "typeMismatch",
    "patternMismatch",
    "tooShort",
  ]) {
    if (v[clave] && propios[clave]) {
      texto = propios[clave];
      break;
    }
  }
  // Red de seguridad: si aparece un tipo de error que no previmos,
  // mostramos el del navegador antes que no mostrar nada.
  if (!texto) texto = campo.validationMessage;

  if (cartel) cartel.textContent = texto;
  campo.setAttribute("aria-invalid", "true");
  return false;
}

function activarValidacion(formulario) {
  const campos = formulario.querySelectorAll("input[name], textarea[name]");

  campos.forEach((campo) => {
    if (campo.type === "hidden" || campo.name === "botcheck") return;

    // Al salir del campo se revisa por primera vez.
    campo.addEventListener("blur", () => revisarCampo(campo));

    // Mientras escribis solo se LIMPIA el error, nunca se agrega uno
    // nuevo. Marcarle un error a alguien que todavia esta tipeando el
    // mail es molesto y no ayuda: todavia no termino.
    campo.addEventListener("input", () => {
      if (campo.hasAttribute("aria-invalid") && campo.validity.valid) {
        revisarCampo(campo);
      }
    });
  });

  /**
   * Revisa todo el formulario. Devuelve true si se puede enviar.
   */
  return function revisarTodo() {
    let primerFallo = null;
    campos.forEach((campo) => {
      if (campo.type === "hidden" || campo.name === "botcheck") return;
      if (!revisarCampo(campo) && !primerFallo) primerFallo = campo;
    });
    if (primerFallo) {
      // Lleva el foco al primer campo con problema: quien usa teclado o
      // lector de pantalla queda parado justo donde tiene que corregir.
      primerFallo.focus();
      return false;
    }
    return true;
  };
}


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

  const revisarTodo = activarValidacion(formulario);

  // novalidate apaga los globos del navegador. Se hace desde JS y no en
  // el HTML a proposito: si el JS no carga, el atributo no se pone y el
  // navegador sigue validando por su cuenta.
  formulario.setAttribute("novalidate", "");

  formulario.addEventListener("submit", async (evento) => {
    if (!revisarTodo()) {
      evento.preventDefault();
      return;
    }

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
  activarPlano();
  activarProgresoDeLectura();
  activarRevelado();
  activarInclinacion();
  activarProgresoDeScroll();
  activarVitrina();
  activarFormulario();
}

iniciar();
