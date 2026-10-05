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

  // En celular no se dibuja: una pantalla chica no luce el efecto y el
  // dibujo continuo gasta bateria. Queda el degradado del CSS.
  if (window.innerWidth < 900) return;
  if (prefiereMenosMovimiento()) return;

  const pincel = lienzo.getContext("2d");
  if (!pincel) return;

  /* TIRAS DE LA V FLOTANDO.

     La marca son dos trazos que se cruzan: pintas uno y el otro asoma
     por detras. El fondo hace lo mismo en grande y en capas — varias V
     anchas, a distintas escalas y profundidades, cruzandose muy
     despacio. No es el logo apoyado encima del fondo: es el logo
     repetido como materia.

     LA PROPORCION SALE DEL ARCHIVO, NO DE MI OJO. En el SVG el trazo
     marino va de x=117 a x=300 y el azul de 300 a 394, sobre un lienzo
     de 292 que arranca en 110: el vertice cae a 0.65 del ancho y el
     brazo izquierdo es el DOBLE de ancho que el derecho. Esa asimetria
     es lo que la hace tu V y no una flecha cualquiera.

     Y es barato: cinco trazos de tres puntos por cuadro. La version de
     lineas finas dibujaba 960 puntos; la de pixeles, 20.736. */
  const V_IZQ = 0.34;   // alcance del brazo izquierdo, de 0 a 1
  const V_DER = 0.17;   // el derecho: la mitad

  const MARINO = "13, 27, 42";
  const AZUL = "37, 99, 235";

  /* Cada tira: donde esta, cuanto mide, de que color y a que ritmo
     flota. Las velocidades no son multiplos entre si a proposito, asi
     el conjunto no vuelve nunca a la misma posicion. */
  const TIRAS = [
    { x: 0.28, y: 0.34, escala: 1.30, grosor: 0.20, color: MARINO, alfa: 0.055, vel: 0.055, fase: 0.0 },
    { x: 0.45, y: 0.56, escala: 0.95, grosor: 0.15, color: AZUL,   alfa: 0.060, vel: 0.041, fase: 1.7 },
    { x: 0.70, y: 0.30, escala: 1.60, grosor: 0.24, color: MARINO, alfa: 0.045, vel: 0.033, fase: 3.1 },
    { x: 0.86, y: 0.62, escala: 1.05, grosor: 0.17, color: AZUL,   alfa: 0.050, vel: 0.047, fase: 4.4 },
    { x: 0.12, y: 0.74, escala: 0.80, grosor: 0.13, color: MARINO, alfa: 0.040, vel: 0.062, fase: 5.6 },
  ];

  let ancho = 0;
  let alto = 0;

  function medir() {
    const caja = hero.getBoundingClientRect();
    // A resolucion REAL de pantalla, no a la mitad. Antes se dibujaba
    // chico y el CSS lo estiraba al doble: para manchas difusas daba
    // igual, pero una linea de 1px estirada al doble sale dentada y se
    // ve de mala calidad. Dibujar mas pixeles no cuesta nada aca: lo
    // caro era calcular en JavaScript, y ahora solo trazamos 15 lineas;
    // rellenarlas lo hace el navegador por su cuenta.
    // El tope de 2 es para que una pantalla 3x no multiplique la
    // superficie por nueve sin que se note la diferencia.
    const escala = Math.min(window.devicePixelRatio || 1, 2);
    ancho = Math.round(caja.width * escala);
    alto = Math.round(caja.height * escala);
    lienzo.width = ancho;
    lienzo.height = alto;
    pincel.setTransform(escala, 0, 0, escala, 0, 0);
    // A partir de aca dibujamos en pixeles CSS y el navegador escala.
    ancho = caja.width;
    alto = caja.height;
  }

  function dibujar(t) {
    pincel.clearRect(0, 0, ancho, alto);
    // Vertice en punta, como el de la marca: la union en angulo vivo es
    // lo que distingue una V de una U.
    pincel.lineJoin = "miter";
    pincel.miterLimit = 12;
    pincel.lineCap = "butt";

    for (const tira of TIRAS) {
      // Flota: sube y baja, y se corre de costado a otro ritmo. Dos
      // movimientos de periodo distinto hacen que el recorrido sea una
      // curva abierta y no un vaiven.
      const dy = Math.sin(t * tira.vel + tira.fase) * 0.055;
      const dx = Math.cos(t * tira.vel * 0.63 + tira.fase) * 0.030;

      const cx = (tira.x + dx) * ancho;   // el vertice
      const cy = (tira.y + dy) * alto;
      const brazo = tira.escala * alto * 0.52;
      const abre = tira.escala * ancho * 0.62;

      pincel.lineWidth = tira.grosor * alto;
      pincel.strokeStyle = "rgba(" + tira.color + ", " + tira.alfa + ")";

      pincel.beginPath();
      pincel.moveTo(cx - V_IZQ * abre, cy - brazo);
      pincel.lineTo(cx, cy);
      pincel.lineTo(cx + V_DER * abre, cy - brazo);
      pincel.stroke();
    }
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
  activarOleaje();
  activarProgresoDeScroll();
  activarVitrina();
  activarFormulario();
}

iniciar();
