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
   1b. COORDINADOR DE SCROLL
   ---------------------------------------------------------------------
   Un solo lugar que escucha el scroll, lo mide UNA vez por cuadro y le
   pasa el resultado a todos los efectos que lo necesitan.

   POR QUE EXISTE. Antes habia tres oyentes de scroll sueltos (la
   navbar, el boton de WhatsApp, la barra de progreso) mas un bucle
   aparte para el parallax. Cada uno pedia su propio cuadro y cada uno
   le preguntaba al navegador cuanto mide la pagina. Preguntar eso
   obliga al navegador a frenar y recalcular el diseno antes de poder
   contestar. Medido: unos 110 recalculos forzados en un scroll de
   cuatro segundos, la mayoria pidiendo dos veces el mismo numero en el
   mismo cuadro.

   Ahora se mide una vez y se reparte. Los efectos no leen nada del
   navegador: reciben los numeros ya calculados.

   Y lo mas importante: scrollHeight queda guardado. Ese numero (cuanto
   mide la pagina a lo largo) NO cambia cuando scrolleas, solo cuando
   cambia el tamano de la ventana o el contenido. Pedirlo en cada cuadro
   era trabajo puro al pedo.
   ===================================================================== */
var Scroll = (function () {
  var oyentes = [];
  var pendiente = false;
  var altoVentana = 0;
  var recorrido = 0;   // cuanto se puede scrollear en total

  function medirPagina() {
    altoVentana = window.innerHeight;
    recorrido = document.documentElement.scrollHeight - altoVentana;
  }

  function cuadro() {
    pendiente = false;
    var y = window.scrollY;
    // Parte del recorrido ya hecha, de 0 a 1.
    var avance = recorrido > 0 ? Math.min(1, Math.max(0, y / recorrido)) : 0;
    for (var i = 0; i < oyentes.length; i++) {
      oyentes[i](y, avance, altoVentana, recorrido);
    }
  }

  function pedir() {
    // El scroll dispara muchas mas veces por segundo que las que la
    // pantalla se dibuja. Sin esto calculariamos cuadros que nadie ve.
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(cuadro);
    }
  }

  var reloj = null;
  function remedir() {
    clearTimeout(reloj);
    reloj = setTimeout(function () {
      medirPagina();
      cuadro();
    }, 150);
  }

  medirPagina();
  window.addEventListener("scroll", pedir, { passive: true });
  window.addEventListener("resize", remedir, { passive: true });

  /* El alto de la pagina tambien cambia sin que nadie toque la ventana:
     al abrir el menu, al revelar texto que reacomoda renglones, al
     aparecer un mensaje de error en el formulario. ResizeObserver avisa
     de eso; "resize" solo, no. */
  if (window.ResizeObserver) {
    new ResizeObserver(remedir).observe(document.body);
  }

  return {
    /** Suma un efecto. Recibe (y, avance, altoVentana, recorrido). */
    sumar: function (fn) {
      oyentes.push(fn);
      fn(window.scrollY, recorrido > 0 ? window.scrollY / recorrido : 0, altoVentana, recorrido);
    },
    /** Fuerza un recalculo de las medidas de la pagina. */
    remedir: remedir,
  };
})();


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

  /* Antes esto escuchaba el scroll directo, sin limitarlo por cuadro:
     era la funcion que mas CPU consumia de todo el archivo. Ahora corre
     una sola vez por cuadro, igual que el resto.

     Scroll.sumar ya la llama una vez al conectarla, asi que la pagina
     que abre scrolleada a la mitad (pasa al recargar con F5) arranca
     con la navbar en el estado correcto. */
  Scroll.sumar(function (y) {
    navbar.classList.toggle("navbar--scrolleado", y > 8);
  });
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

  function revisar(y, avance, altoVentana, recorrido) {
    /* Cuanto falta para el fondo de la pagina. Antes esto preguntaba
       document.documentElement.scrollHeight en cada cuadro, y esa
       pregunta obliga al navegador a recalcular el diseno antes de
       contestar. Ahora el recorrido total llega ya medido desde el
       coordinador, que solo lo recalcula cuando cambia de verdad. */
    const llegoAlFinal = y >= recorrido - 160;

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

  Scroll.sumar(revisar);
}




function activarPlano() {
  const lienzo = document.querySelector(".hero__oleaje");
  const hero = document.querySelector(".hero");
  if (!lienzo || !hero) return;
  if (prefiereMenosMovimiento()) return;

  /* EL FONDO SOLO CORRE EN PANTALLAS ANCHAS, PERO LA DECISION NO ES
     PARA SIEMPRE.

     Antes esto era un "if (window.innerWidth < 900) return;" suelto, y
     eso se evalua UNA sola vez: en el momento de cargar. Si abrias la
     tablet en vertical (820px de ancho) y despues la girabas a
     horizontal (1180px), el fondo no aparecia nunca. La pagina ya habia
     decidido que no, y no habia quien le avisara que cambio.

     matchMedia si avisa. Se arranca cuando la pantalla se hace ancha,
     sin importar si fue al cargar o al girar el aparato.

     Arranca una sola vez y despues no se apaga al volver a angosto: el
     trabajo pesado (crear el lienzo, medir) ya esta hecho, y apagarlo
     no devolveria nada. De no dibujar cuando el hero no se ve ya se
     encarga el IntersectionObserver de mas abajo. */
  const pantallaAncha = window.matchMedia("(min-width: 900px)");
  let arrancado = false;

  function quizaArrancar() {
    if (arrancado || !pantallaAncha.matches) return;
    arrancado = true;
    dibujarPlano(lienzo, hero);
  }

  pantallaAncha.addEventListener("change", quizaArrancar);
  quizaArrancar();
}

/** El fondo propiamente dicho. Lo llama activarPlano cuando corresponde. */
function dibujarPlano(lienzo, hero) {
  const pincel = lienzo.getContext("2d");
  if (!pincel) return;

  /* PLANO DE CONSTRUCCION CON LA V COMO ZONA RAYADA.

     En dibujo tecnico, una region rayada en diagonal marca un corte:
     la parte de la pieza que estas mirando por dentro. Eso es lo que se
     hace aca con la V — no se dibuja el logo encima de la grilla, se
     RAYA la zona que ocupa. La marca aparece como una region del plano,
     no como una calcomania.

     Por eso no se lee como "otra vez el logo": lo primero que ves es
     una trama, y recien despues reconoces la forma.

     EL CONTORNO ES EL DEL ARCHIVO, no uno parecido. Los dos trazos del
     SVG, normalizados al cuadrado de 0 a 1 dividiendo por el viewBox
     (110 de origen, 292 de lado). */
  const V_MARINO = [[0.0251, 0.0266], [0.3427, 0.0266], [0.6457, 0.9734], [0.3543, 0.9734]];
  const V_AZUL   = [[0.6573, 0.0266], [0.9749, 0.0266], [0.6602, 0.9297], [0.5146, 0.4752]];

  // Donde y de que tamano va la V dentro del hero.
  const V_ALTO = 0.86;   // parte del alto del hero que ocupa
  const V_CX = 0.84;     // centro horizontal, de 0 a 1
  const V_CY = 0.52;

  const TINTA = "13, 27, 42";
  const PASO = 46;       // lado de la celda de la grilla, en px

  let ancho = 0;
  let alto = 0;

  function medir() {
    /* Se mide el LIENZO, no el hero. Desde que el lienzo lleva sangrado
       (inset: -24px en el CSS, para que al seguir al mouse no destape
       el borde), es 48px mas ancho y mas alto que el hero. Midiendo el
       hero, el mapa de pixeles quedaba chico y el navegador lo estiraba
       para rellenar: lineas gruesas y borrosas. */
    const caja = lienzo.getBoundingClientRect();
    const escala = Math.min(window.devicePixelRatio || 1, 2);
    lienzo.width = Math.round(caja.width * escala);
    lienzo.height = Math.round(caja.height * escala);
    pincel.setTransform(escala, 0, 0, escala, 0, 0);
    ancho = caja.width;
    alto = caja.height;
  }

  /** Arma el contorno de la V a la escala y posicion de ahora. */
  function contornoV() {
    const lado = V_ALTO * alto;
    const x0 = V_CX * ancho - lado / 2;
    const y0 = V_CY * alto - lado / 2;
    const ruta = new Path2D();
    for (const trazo of [V_MARINO, V_AZUL]) {
      trazo.forEach(([px, py], i) => {
        const x = x0 + px * lado;
        const y = y0 + py * lado;
        if (i === 0) ruta.moveTo(x, y);
        else ruta.lineTo(x, y);
      });
      ruta.closePath();
    }
    return ruta;
  }

  function grilla(corre, alfaFina, alfaFuerte) {
    pincel.lineWidth = 1;
    for (let x = -PASO + corre; x < ancho + PASO; x += PASO) {
      const fuerte = Math.round((x - corre) / PASO) % 5 === 0;
      pincel.strokeStyle = "rgba(" + TINTA + ", " + (fuerte ? alfaFuerte : alfaFina) + ")";
      pincel.beginPath();
      pincel.moveTo(Math.round(x) + 0.5, 0);
      pincel.lineTo(Math.round(x) + 0.5, alto);
      pincel.stroke();
    }
    for (let y = -PASO + corre; y < alto + PASO; y += PASO) {
      const fuerte = Math.round((y - corre) / PASO) % 5 === 0;
      pincel.strokeStyle = "rgba(" + TINTA + ", " + (fuerte ? alfaFuerte : alfaFina) + ")";
      pincel.beginPath();
      pincel.moveTo(0, Math.round(y) + 0.5);
      pincel.lineTo(ancho, Math.round(y) + 0.5);
      pincel.stroke();
    }
  }

  function dibujar(t) {
    pincel.clearRect(0, 0, ancho, alto);

    // La grilla se desplaza muy despacio en diagonal: el plano respira
    // sin que se vea nada moverse. El modulo hace que el desplazamiento
    // sea continuo y nunca salte.
    const corre = (t * 3) % PASO;
    grilla(corre, 0.025, 0.055);

    const ruta = contornoV();

    // --- La zona rayada --------------------------------------------
    pincel.save();
    pincel.clip(ruta);

    // Adentro, la misma grilla pero mas marcada: la zona se lee como
    // mejor definida, igual que en un plano donde la pieza cortada
    // tiene mas detalle que el entorno.
    grilla(corre, 0.05, 0.09);

    // Y encima el rayado de corte. La inclinacion NO es 45 grados como
    // en un plano cualquiera: son los 33.2 del trazo de la marca, asi
    // que la trama corre paralela al propio palo de la V.
    const ANG = (33.2 * Math.PI) / 180;
    const sep = 11;
    const dx = Math.sin(ANG);
    const dy = Math.cos(ANG);
    const largo = ancho + alto;
    // El rayado avanza mucho mas lento que la grilla: dos ritmos
    // distintos es lo que da sensacion de capas.
    const avance = (t * 1.6) % sep;
    pincel.strokeStyle = "rgba(" + TINTA + ", 0.075)";
    pincel.lineWidth = 1;
    pincel.beginPath();
    for (let d = -largo; d < largo; d += sep) {
      const b = d + avance;
      pincel.moveTo(b * dy - dx * largo, -b * dx - dy * largo);
      pincel.lineTo(b * dy + dx * largo, -b * dx + dy * largo);
    }
    pincel.stroke();
    pincel.restore();

    // --- El contorno, finisimo. Es lo que cierra la zona y la hace
    //     leerse como una pieza y no como una mancha rayada.
    pincel.strokeStyle = "rgba(" + TINTA + ", 0.10)";
    pincel.lineWidth = 1;
    pincel.stroke(ruta);
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

  /* La capa de video se pide al entrar y se devuelve al salir. Antes
     estaba pedida siempre desde el CSS con will-change, aunque el
     mouse estuviera en la otra punta de la pagina. */
  let relojCapa = null;

  hero.addEventListener("mouseenter", () => {
    clearTimeout(relojCapa);
    lienzo.classList.add("en-movimiento");
  }, { passive: true });

  hero.addEventListener("mouseleave", () => {
    dx = 0;
    dy = 0;
    pedirCuadro();
    /* No se devuelve la capa en el acto: el CSS tiene una transicion de
       600ms para volver al lugar, y sacarla a mitad de camino obliga al
       navegador a rehacerla justo mientras se esta moviendo. Se espera
       un poco mas que la transicion. */
    clearTimeout(relojCapa);
    relojCapa = setTimeout(() => lienzo.classList.remove("en-movimiento"), 700);
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
      mostrar(i, false);
    });
  });

  /* NO HAY CAMBIO AL PASAR EL CURSOR, Y ES A PROPOSITO.

     Antes bastaba con pasar el mouse por arriba para cambiar de
     proyecto. Parecia comodo y era al reves: moviendo el cursor para
     cualquier otra cosa se cambiaba solo, y uno perdia de vista cual
     estaba mirando. Elegir un proyecto es una decision, no algo que
     pase de casualidad: ahora hay que hacer click. */

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
    // El modulo hace que de la ultima se pase a la primera y al reves.
    const destino = (mapa[evento.key] + pestanas.length) % pestanas.length;
    mostrar(destino, true);
  });

  /* TAMPOCO SE CAMBIA SOLO.

     Habia un ciclado automatico que pasaba de proyecto cada 4,5
     segundos. La idea era mostrar los tres sin que nadie tocara nada,
     pero en la practica le movia el contenido a alguien que estaba
     leyendo, y se mezclaba con el cambio por hover: costaba entender si
     el proyecto cambio porque uno hizo algo o porque si.

     La lista se ve entera de un vistazo, con los tres nombres y el
     recuadro marcando cual esta abierto. No hace falta que se mueva
     sola para que se entienda que hay mas de uno. */
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

  /* DONDE SE ESCRIBE --p, Y POR QUE IMPORTA TANTO.

     Las variables CSS se heredan. Eso significa que escribir --p en el
     <section> del hero obliga al navegador a recalcular el estilo de
     TODO lo que hay adentro del hero (titulo, palabras sueltas del
     revelado, botones, fotos), porque cualquiera de esos hijos podria
     estar usandola. Y eso pasaba en cada cuadro del scroll.

     Medido: el recalculo de estilos era 317ms por scroll contra 19ms
     de calculo de diseno. Un tercio de esos 317 era esto.

     La solucion es escribir la variable en el elemento que de verdad
     la consume, no en el padre. El atributo dice cual es:
         data-progreso=".hero__contenido"
     El padre se sigue usando para MEDIR (es el que define el recorrido),
     pero la escritura va al hijo. Sumado al @property del CSS, que la
     marca como no heredable, cada escritura ensucia un solo elemento. */
  const fichas = [];

  objetivos.forEach((medido) => {
    const sel = medido.getAttribute("data-progreso");
    const destinos = sel ? medido.querySelectorAll(sel) : [medido];
    if (destinos.length === 0) return;
    fichas.push({ medido, destinos, top: 0, alto: 0, activo: false });
  });

  /* GEOMETRIA GUARDADA.

     getBoundingClientRect obliga al navegador a terminar de calcular el
     diseno antes de contestar. Llamarlo por elemento y por cuadro era
     el otro gran costo.

     Pero la posicion de un elemento respecto al DOCUMENTO no cambia al
     scrollear: lo unico que cambia es cuanto scrolleaste. Asi que se
     mide una sola vez (top absoluto = top en pantalla + scroll actual)
     y despues la posicion en pantalla sale de una resta, sin preguntar
     nada. */
  function medirFicha(f) {
    const caja = f.medido.getBoundingClientRect();
    f.top = caja.top + window.scrollY;
    f.alto = caja.height;
  }

  function remedirTodo() {
    fichas.forEach(medirFicha);
  }

  function escribir(y, avance, altoVentana) {
    for (let i = 0; i < fichas.length; i++) {
      const f = fichas[i];
      if (!f.activo) continue;
      const top = f.top - y;
      /* Recorrido total: el elemento entra por abajo y sale por arriba,
         o sea que atraviesa el alto de la ventana MAS su propio alto. */
      const p = (altoVentana - top) / (altoVentana + f.alto);
      const v = Math.min(1, Math.max(0, p)).toFixed(4);
      for (let j = 0; j < f.destinos.length; j++) {
        f.destinos[j].style.setProperty("--p", v);
      }
    }
  }

  const vigia = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        const f = fichas.find((x) => x.medido === e.target);
        if (!f) return;
        f.activo = e.isIntersecting;
        if (f.activo) {
          /* Se remide al entrar, no solo al arrancar: para cuando este
             elemento asoma, las imagenes de arriba ya cargaron y las
             fuentes ya reacomodaron el texto, asi que recien ahora la
             medida es la definitiva. */
          medirFicha(f);
        }
        /* La capa de video se pide solo mientras el elemento esta en
           pantalla, y se devuelve cuando sale. Ver .en-movimiento. */
        f.destinos.forEach((d) => d.classList.toggle("en-movimiento", f.activo));
      });
    },
    // Un margen generoso: empieza a calcular un poco antes de que el
    // elemento asome, asi nunca se ve el primer salto.
    { rootMargin: "25% 0px" }
  );

  fichas.forEach((f) => vigia.observe(f.medido));

  remedirTodo();
  Scroll.sumar(escribir);
  window.addEventListener("resize", () => setTimeout(remedirTodo, 200), { passive: true });
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

  /* Y TAMBIEN HAY QUE VOLVER A NUMERAR CUANDO LLEGA LA TIPOGRAFIA.

     Este es el bug mas escondido que encontramos. El subtitulo del hero
     tiene max-width: 56ch, y "ch" es el ancho del cero DE LA FUENTE QUE
     SE ESTE USANDO. Con Outfit cargada el parrafo mide 632px; con la
     tipografia de respaldo del sistema, 769px. Son renglones
     completamente distintos.

     Si esta funcion numera los renglones antes de que llegue Outfit,
     los numera sobre el corte equivocado, y despues nadie los vuelve a
     calcular: el escalonado queda mal para siempre. Le pasa justamente
     a quien entra por primera vez, que es el que todavia no tiene la
     fuente guardada.

     Medido: corriendo la misma pagina dos veces seguidas, el ancho del
     subtitulo daba 769 una vez y 632 la otra, al azar, segun quien
     ganara la carrera.

     document.fonts.ready avisa cuando terminaron de cargar. Si el
     navegador no lo tiene, no pasa nada: queda como estaba. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      objetivos.forEach(numerarRenglones);
    });
  }
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

    // Misma idea que en el hero: la capa de video se pide al entrar y
    // se devuelve cuando el marco termino de enderezarse.
    let relojCapa = null;

    marco.addEventListener("mouseenter", () => {
      clearTimeout(relojCapa);
      marco.classList.add("en-movimiento");
    }, { passive: true });

    marco.addEventListener("mouseleave", () => {
      gx = 0;
      gy = 0;
      lx = 50;
      ly = 50;
      if (!pedido) pedido = requestAnimationFrame(pintar);
      clearTimeout(relojCapa);
      relojCapa = setTimeout(() => marco.classList.remove("en-movimiento"), 700);
    });
  });
}


/* =====================================================================
   5d. BARRA DE PROGRESO DE LECTURA
   ===================================================================== */
function activarProgresoDeLectura() {
  const barra = document.querySelector(".progreso__barra");
  if (!barra) return;

  /* El avance ya viene calculado por el coordinador: esta funcion no le
     pregunta nada al navegador, solo escribe.

     scaleX y no width: escalar lo resuelve la placa de video, cambiar
     el ancho obliga a recalcular el diseno en cada cuadro. */
  Scroll.sumar(function (y, avance) {
    barra.style.transform = "scaleX(" + avance.toFixed(4) + ")";
  });
}


/* =====================================================================
   5e. EL RIEL DE LAMINAS DEL PROCESO
   ---------------------------------------------------------------------
   El HTML es una lista ordenada comun y corriente, y asi se queda en
   celulares y si este archivo no llega: cinco pasos, uno abajo del
   otro, perfectamente legibles. Esta funcion la convierte en un riel de
   laminas, nada mas que en pantallas anchas.

   Se hace desde JavaScript y no en el HTML a proposito: los botones que
   agrega aca solo tienen sentido cuando las laminas estan de canto. En
   la lista los cinco pasos se leen enteros al mismo tiempo, y un boton
   que no cambia nada seria una parada de teclado que no lleva a ningun
   lado.

   Todo el trabajo visual lo hace el CSS. El JS se limita a escribir
   que columna esta abierta.
   ===================================================================== */
function activarRiel() {
  const seccion = document.getElementById("proceso");
  const lista = seccion && seccion.querySelector(".proceso__lista");
  if (!lista) return;

  const laminas = [...lista.querySelectorAll(".etapa")];
  if (laminas.length < 2) return;

  /* Igual que el fondo del inicio: la decision no se toma una sola vez.
     Si alguien gira la tablet de vertical a horizontal, el riel se tiene
     que armar ahi mismo. */
  const anchas = window.matchMedia("(min-width: 900px)");
  let armado = false;
  let abierta = 0;
  let contador = null;

  /* Cuanto mide una lamina cerrada. Es el unico numero que el JS
     necesita saber del diseno, y esta puesto una sola vez. */
  const LOMO = "5.5rem";

  function armar() {
    if (armado || !anchas.matches) return;
    armado = true;
    seccion.classList.add("proceso--riel");

    laminas.forEach((lamina, i) => {
      /* FUERA LA ANIMACION DE APARICION DE CADA LAMINA.

         No es prolijidad: .con-animaciones .aparece.visible pone
         transform: none, y son TRES clases contra las dos de
         .proceso--riel .etapa. Gana la de aparicion y pisa el giro del
         nombre en los lomos. Ya nos paso con la version anterior de
         esta seccion, donde dejaba las cinco laminas sin inclinacion.

         La entrada no se pierde: la sigue haciendo el encabezado de la
         seccion, que tiene su propio .aparece. */
      lamina.classList.remove("aparece", "visible");

      const nombre = lamina.querySelector(".etapa__nombre");
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "etapa__tocar";
      boton.setAttribute(
        "aria-label",
        "Ver " + (nombre ? nombre.textContent.trim() : "paso " + (i + 1))
      );
      boton.addEventListener("click", () => abrir(i));
      lamina.appendChild(boton);
    });

    /* La barra de flechas con el contador. Las laminas de canto ya se
       pueden tocar, pero nada avisa que ahi hay algo: sin esta barra,
       alguien ve un dibujo lindo y sigue de largo. */
    const barra = document.createElement("div");
    barra.className = "mazo__barra";

    const anterior = document.createElement("button");
    anterior.type = "button";
    anterior.className = "mazo__flecha";
    anterior.setAttribute("aria-label", "Lamina anterior");
    anterior.textContent = "\u2190";
    anterior.addEventListener("click", () => mover(-1));

    const siguiente = document.createElement("button");
    siguiente.type = "button";
    siguiente.className = "mazo__flecha";
    siguiente.setAttribute("aria-label", "Lamina siguiente");
    siguiente.textContent = "\u2192";
    siguiente.addEventListener("click", () => mover(1));

    contador = document.createElement("p");
    contador.className = "mazo__cuenta";
    /* aria-live: al cambiar de lamina, un lector de pantalla anuncia la
       nueva posicion sin que haya que ir a buscarla. */
    contador.setAttribute("aria-live", "polite");

    barra.append(anterior, contador, siguiente);
    lista.insertAdjacentElement("afterend", barra);

    lista.addEventListener("keydown", (evento) => {
      const pasos = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(evento.key in pasos)) return;
      evento.preventDefault();
      mover(pasos[evento.key]);
      const boton = laminas[abierta].querySelector(".etapa__tocar");
      if (boton) boton.focus();
    });

    abrir(0);
  }

  function mover(paso) {
    abrir((abierta + paso + laminas.length) % laminas.length);
  }

  function abrir(indice) {
    abierta = indice;

    /* UNA SOLA ESCRITURA PARA TODA LA ANIMACION.

       La abierta se lleva el espacio que sobra (1fr) y las demas quedan
       en el ancho del lomo. Los navegadores saben interpolar
       grid-template-columns, asi que el riel se abre y se cierra solo,
       sin que el JS calcule ni una medida ni toque un cuadro. */
    lista.style.gridTemplateColumns = laminas
      .map((_, i) => (i === indice ? "1fr" : LOMO))
      .join(" ");

    laminas.forEach((lamina, i) => {
      lamina.setAttribute("data-abierta", i === indice ? "si" : "no");
      /* No se esconde ninguna: las cinco se leen igual y en orden con un
         lector de pantalla, aunque visualmente esten de canto. */
      if (i === indice) lamina.setAttribute("aria-current", "step");
      else lamina.removeAttribute("aria-current");
    });

    if (contador) {
      contador.textContent =
        String(indice + 1).padStart(2, "0") + " / " +
        String(laminas.length).padStart(2, "0");
    }
  }

  anchas.addEventListener("change", armar);
  armar();
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
  activarRiel();
  activarFormulario();
}

iniciar();
