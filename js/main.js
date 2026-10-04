/* =====================================================================
   VINICIUS CESA — JavaScript principal

   INDICE
   1. Utilidades
   2. Animaciones de aparicion al hacer scroll
   3. Menu de navegacion (hamburguesa)
   4. Estado de la navbar al hacer scroll
   5. Link activo segun la seccion visible
   5b. Boton flotante de WhatsApp
   6. Acordeon del proceso
   7. Formulario de contacto
   8. Arranque
   ===================================================================== */

// "use strict" activa el modo estricto: JavaScript avisa de errores que
// normalmente se traga en silencio (por ejemplo, usar una variable sin declarar).
"use strict";


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

  function revisar() {
    // Cuanto falta para el fondo de la pagina:
    //   alto de la ventana + lo que scrolleaste = donde termina lo que ves
    //   scrollHeight = alto total del documento
    const llegoAlFinal =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;

    // El boton se ve desde el primer momento. Lo unico que lo esconde es
    // llegar al pie: ahi tapaba el "Volver arriba" y ademas ya tenes el
    // WhatsApp, el mail y el telefono escritos a la vista.
    boton.classList.toggle("wsp-flotante--visible", !llegoAlFinal);
  }

  window.addEventListener("scroll", revisar, { passive: true });
  revisar();
}


/* =====================================================================
   4b. DETALLES DEL HERO
   ---------------------------------------------------------------------
   La hora local de Rosario y el leve movimiento de la V del fondo.
   Los dos son adorno: si este archivo no corre, la pagina se ve igual
   salvo por la hora, que deja el texto de reserva del HTML.
   ===================================================================== */
function activarHoraLocal() {
  const salida = document.getElementById("hora-local");
  if (!salida) return;

  function pintar() {
    // timeZone fijo a proposito: queremos MI hora, no la de quien mira.
    // Ese es el punto del dato: que se note que hay alguien en un lugar.
    const hora = new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Cordoba",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
    salida.textContent = hora + " hora local";
  }

  pintar();
  setInterval(pintar, 30000);
}


function activarFiligrana() {
  const v = document.querySelector(".hero__filigrana");
  const hero = document.querySelector(".hero");
  if (!v || !hero) return;

  // Solo con mouse de verdad. En tactil no hay cursor que seguir, y
  // ademas moverla gastaria bateria para nada.
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (prefiereMenosMovimiento()) return;

  let pendiente = false;
  let x = 0;
  let y = 0;

  function mover() {
    pendiente = false;
    v.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  hero.addEventListener(
    "mousemove",
    (evento) => {
      const caja = hero.getBoundingClientRect();
      // -1 a 1 segun donde este el cursor dentro del hero
      const dx = (evento.clientX - caja.left) / caja.width - 0.5;
      const dy = (evento.clientY - caja.top) / caja.height - 0.5;
      // 18px de recorrido maximo. Mas que eso se nota y distrae; menos,
      // no se percibe. El signo negativo hace que la V se aleje del
      // cursor, que da mas sensacion de profundidad que seguirlo.
      x = -dx * 18;
      y = -dy * 18;

      // requestAnimationFrame: el mousemove dispara decenas de veces por
      // segundo, pero la pantalla solo se dibuja 60. Sin esto estariamos
      // calculando posiciones que nadie llega a ver.
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(mover);
      }
    },
    { passive: true }
  );

  hero.addEventListener("mouseleave", () => {
    x = 0;
    y = 0;
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(mover);
    }
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
   6. ACORDEON DEL PROCESO
   ---------------------------------------------------------------------
   Al tocar una etapa se abre su panel y se cierran las demas.
   ===================================================================== */
function activarProceso() {
  const etapas = document.querySelectorAll(".etapa");
  if (etapas.length === 0) return;

  /**
   * Abre o cierra una etapa.
   * @param {Element} etapa - el <article class="etapa">
   * @param {boolean} abrir
   */
  function cambiarEtapa(etapa, abrir) {
    const boton = etapa.querySelector(".etapa__boton");
    etapa.classList.toggle("etapa--abierta", abrir);
    if (boton) boton.setAttribute("aria-expanded", String(abrir));
  }

  etapas.forEach((etapa) => {
    const boton = etapa.querySelector(".etapa__boton");
    if (!boton) return;

    boton.addEventListener("click", () => {
      const estaAbierta = etapa.classList.contains("etapa--abierta");

      // Cerramos todas y abrimos solo la tocada. Si ya estaba abierta,
      // queda cerrada: se puede colapsar todo.
      etapas.forEach((otra) => cambiarEtapa(otra, false));
      cambiarEtapa(etapa, !estaAbierta);
    });
  });
}


/* =====================================================================
   7. FORMULARIO DE CONTACTO
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
   8. ARRANQUE
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
  activarHoraLocal();
  activarFiligrana();
  activarVitrina();
  activarProceso();
  activarFormulario();
}

iniciar();
