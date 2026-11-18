(function () {
    "use strict";
    const { $, mezclar, capitalizar, cargarPalabras, sinRepetidos, crearReloj, terminar } = window.Juego;

    const NIVELES = {
        facil: { pares: 6,  cols: 4 },
        medio: { pares: 8,  cols: 4 },
        dificil: { pares: 10, cols: 5 }
    };

    const reloj = crearReloj($("tiempo"));
    let categorias = [], palabras = [];
    let abiertas = [], bloqueo = false, aciertos = 0, intentos = 0, total = 0, termino = false;


    function aptas(p) {
        return p.espanol.length <= 24 && p.otomi.length <= 18 && !/[\/,]/.test(p.otomi);
    }

    function candidatas(catId) {
        const base = palabras.filter((p) => aptas(p) && (catId === 0 || p.categoria === catId));
        return sinRepetidos(base, (p) => p.otomi.trim().toLowerCase());
    }

    /* Llena el selector de categorías: solo las que tienen suficientes pares */
    function llenarCategorias() {
        const nivel = NIVELES[$("dificultad").value];
        const sel = $("categoria");
        const previa = sel.value;
        sel.innerHTML = "";
        const todas = new Option("Todas", "0");
        sel.add(todas);
        categorias.forEach(function (c) {
            const n = candidatas(c.id).length;
            if (n >= nivel.pares) sel.add(new Option(c.nombre + " (" + n + ")", String(c.id)));
        });
        sel.value = Array.from(sel.options).some((o) => o.value === previa) ? previa : "0";
    }

    function nuevaPartida() {
        reloj.reiniciar();
        $("modal").hidden = true;
        abiertas = []; bloqueo = false; aciertos = 0; intentos = 0; termino = false;

        const nivel = NIVELES[$("dificultad").value];
        const pool = candidatas(parseInt($("categoria").value, 10) || 0);
        if (pool.length < nivel.pares) {
            $("estado").textContent = "❌ No hay suficientes palabras para esta combinación.";
            $("estado").className = "jg-aviso error";
            $("tablero").innerHTML = "";
            return;
        }
        $("estado").textContent = "Voltea dos cartas y encuentra las parejas.";
        $("estado").className = "jg-aviso";

        const elegidas = pool.slice(0, nivel.pares);
        total = elegidas.length;
        const cartas = [];
        elegidas.forEach(function (p) {
            cartas.push({ id: p.id, tipo: "es", texto: capitalizar(p.espanol) });
            cartas.push({ id: p.id, tipo: "ot", texto: capitalizar(p.otomi) });
        });

        const tab = $("tablero");
        tab.innerHTML = "";
        tab.style.setProperty("--cols", nivel.cols);
        mezclar(cartas).forEach(function (c) {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "mem-carta";
            b.dataset.id = c.id;
            b.dataset.tipo = c.tipo;
            b.setAttribute("aria-label", "Carta oculta");

            const f = document.createElement("span");
            f.className = "mem-cara mem-frente";
            f.textContent = "?";
            const d = document.createElement("span");
            d.className = "mem-cara mem-dorso";
            d.textContent = c.texto;
            b.append(f, d);
            b.addEventListener("click", () => voltear(b, c.texto));
            tab.append(b);
        });
        actualizar();
    }

    function actualizar() {
        $("intentos").textContent = intentos;
        $("pares").textContent = aciertos + "/" + total;
    }

    function voltear(carta, texto) {
        if (bloqueo || termino) return;
        if (carta.classList.contains("volteada") || carta.classList.contains("acertada")) return;

        reloj.iniciar();
        carta.classList.add("volteada");
        carta.setAttribute("aria-label", texto);
        abiertas.push(carta);
        if (abiertas.length < 2) return;

        intentos++;
        const [a, b] = abiertas;
        const pareja = a.dataset.id === b.dataset.id && a.dataset.tipo !== b.dataset.tipo;

        if (pareja) {
            [a, b].forEach((c) => { c.classList.remove("volteada"); c.classList.add("acertada"); });
            abiertas = [];
            aciertos++;
            actualizar();
            if (aciertos === total) ganar();
        } else {
            bloqueo = true;
            setTimeout(function () {
                [a, b].forEach((c) => { c.classList.remove("volteada"); c.setAttribute("aria-label", "Carta oculta"); });
                abiertas = [];
                bloqueo = false;
            }, 900);
            actualizar();
        }
    }

    function ganar() {
        termino = true;
        const seg = reloj.detener();
        const dif = $("dificultad").value;
        terminar(
            { juego: "memorama", dificultad: dif, movimientos: intentos, segundos: seg },
            "Encontraste los " + total + " pares en " + intentos + " intentos (" + window.Juego.formatoTiempo(seg) + ")."
        );
    }

    $("dificultad").addEventListener("change", function () { llenarCategorias(); nuevaPartida(); });
    $("categoria").addEventListener("change", nuevaPartida);
    $("btnNuevo").addEventListener("click", nuevaPartida);
    $("btnOtra").addEventListener("click", nuevaPartida);

    cargarPalabras().then(function (datos) {
        categorias = datos.categorias;
        palabras = datos.palabras;
        llenarCategorias();
        nuevaPartida();
    }).catch(function (e) {
        console.error(e);
        $("estado").textContent = "❌ No se pudieron cargar las palabras. Abre el juego desde http://localhost/ con Apache y MySQL encendidos.";
        $("estado").className = "jg-aviso error";
    });
})();
