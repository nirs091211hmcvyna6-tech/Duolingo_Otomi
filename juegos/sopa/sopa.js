(function () {
    "use strict";
    const { $, mezclar, capitalizar, cargarPalabras, sinRepetidos, crearReloj, terminar } = window.Juego;

    const D8 = [[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]];
    const NIVELES = {
        facil:   { n: 8,  palabras: 6,  dirs: [[0,1],[1,0]] },
        medio:   { n: 10, palabras: 8,  dirs: [[0,1],[1,0],[1,1],[-1,1]] },
        dificil: { n: 12, palabras: 10, dirs: D8 }
    };

    const reloj = crearReloj($("tiempo"));
    let categorias = [], palabras = [];
    let n = 8, celdas = [], letras = [], puestas = [], pistas = 0, encontradas = 0, termino = false;

    /* ---------- Palabras de la sopa ---------- */
    // "T'ōnio" → ["T","Ō","N","I","O"] (sin apóstrofos, en mayúsculas)
    function aLetras(texto) {
        return Array.from(texto.normalize("NFC").toUpperCase().replace(/['’`´-]/g, ""));
    }
    function esUnaPalabra(p) {
        return !/[\s\/,]/.test(p.otomi) && /^[\p{L}'’`´-]+$/u.test(p.otomi.normalize("NFC"));
    }
    function candidatas(catId, maxLen) {
        const base = palabras.filter(function (p) {
            if (catId !== 0 && p.categoria !== catId) return false;
            if (!esUnaPalabra(p)) return false;
            const l = aLetras(p.otomi).length;
            return l >= 3 && l <= maxLen;
        });
        return sinRepetidos(base, (p) => aLetras(p.otomi).join(""));
    }

    function llenarCategorias() {
        const nivel = NIVELES[$("dificultad").value];
        const sel = $("categoria");
        const previa = sel.value;
        sel.innerHTML = "";
        sel.add(new Option("Todas", "0"));
        categorias.forEach(function (c) {
            const k = candidatas(c.id, nivel.n - 1).length;
            if (k >= nivel.palabras) sel.add(new Option(c.nombre + " (" + k + ")", String(c.id)));
        });
        sel.value = Array.from(sel.options).some((o) => o.value === previa) ? previa : "0";
    }

    /* ---------- Generar la cuadrícula ---------- */
    function rand(k) { return Math.floor(Math.random() * k); }

    function colocar(lista, tam, dirs) {
        const g = Array.from({ length: tam }, () => Array(tam).fill(""));
        const hechas = [];
        lista.slice().sort((a, b) => b.letras.length - a.letras.length).forEach(function (p) {
            const L = p.letras, len = L.length;
            for (let t = 0; t < 400; t++) {
                const [dr, dc] = dirs[rand(dirs.length)];
                const r0 = rand(tam), c0 = rand(tam);
                const r1 = r0 + dr * (len - 1), c1 = c0 + dc * (len - 1);
                if (r1 < 0 || r1 >= tam || c1 < 0 || c1 >= tam) continue;
                let cabe = true, nuevas = 0;
                for (let i = 0; i < len; i++) {
                    const cur = g[r0 + dr * i][c0 + dc * i];
                    if (cur === "") nuevas++;
                    else if (cur !== L[i]) { cabe = false; break; }
                }
                if (!cabe || nuevas === 0) continue;   // no encimar una palabra entera sobre otra
                for (let i = 0; i < len; i++) g[r0 + dr * i][c0 + dc * i] = L[i];
                hechas.push({ p: p, r0: r0, c0: c0, dr: dr, dc: dc });
                break;
            }
        });
        return { g: g, hechas: hechas };
    }

    function generar(elegidas, tam, dirs) {
        let mejor = null;
        for (let i = 0; i < 40; i++) {
            const res = colocar(elegidas, tam, dirs);
            if (!mejor || res.hechas.length > mejor.hechas.length) mejor = res;
            if (res.hechas.length === elegidas.length) break;
        }
        // Relleno con letras de las propias palabras (más natural) y vocales
        const pool = [];
        elegidas.forEach((p) => pool.push(...p.letras));
        pool.push("A", "E", "I", "O", "U", "Ä", "Ö");
        for (let r = 0; r < tam; r++)
            for (let c = 0; c < tam; c++)
                if (mejor.g[r][c] === "") mejor.g[r][c] = pool[rand(pool.length)];
        return mejor;
    }

    /* ---------- Nueva partida ---------- */
    function nuevaPartida() {
        reloj.reiniciar();
        $("modal").hidden = true;
        pistas = 0; encontradas = 0; termino = false; ancla = null; arrastre = null;

        const nivel = NIVELES[$("dificultad").value];
        n = nivel.n;
        const pool = candidatas(parseInt($("categoria").value, 10) || 0, n - 1);
        if (pool.length < nivel.palabras) {
            $("estado").textContent = "❌ No hay suficientes palabras para esta combinación.";
            $("estado").className = "jg-aviso error";
            $("grid").innerHTML = ""; $("lista").innerHTML = "";
            return;
        }
        $("estado").textContent = "Encuentra en la sopa la palabra en hñähñu de cada significado.";
        $("estado").className = "jg-aviso";

        const elegidas = pool.slice(0, nivel.palabras).map(function (p) {
            return { id: p.id, espanol: p.espanol, otomi: capitalizar(p.otomi), letras: aLetras(p.otomi), texto: aLetras(p.otomi).join("") };
        });
        const res = generar(elegidas, n, nivel.dirs);
        letras = res.g;
        puestas = res.hechas.map(function (h, i) {
            return { p: h.p, r0: h.r0, c0: h.c0, hallada: false, tono: (i * 47 + 20) % 360 };
        });

        pintarGrid();
        pintarLista();
        actualizar();
    }

    function pintarGrid() {
        const grid = $("grid");
        grid.innerHTML = "";
        grid.style.setProperty("--n", n);
        celdas = [];
        for (let r = 0; r < n; r++) {
            celdas.push([]);
            for (let c = 0; c < n; c++) {
                const d = document.createElement("div");
                d.className = "sopa-celda";
                d.textContent = letras[r][c];
                d.dataset.r = r; d.dataset.c = c;
                grid.append(d);
                celdas[r].push(d);
            }
        }
    }

    function pintarLista() {
        const ul = $("lista");
        ul.innerHTML = "";
        puestas.forEach(function (w, i) {
            const li = document.createElement("li");
            li.id = "w" + i;
            const b = document.createElement("b");
            b.textContent = capitalizar(w.p.espanol);
            const s = document.createElement("small");
            s.textContent = w.p.letras.length + " letras";
            li.append(b, s);
            ul.append(li);
        });
    }

    function actualizar() {
        $("encontradas").textContent = encontradas + "/" + puestas.length;
        $("pistas").textContent = pistas;
    }

    /* ---------- Selección con ratón / dedo ---------- */
    let arrastre = null;   // { r0, c0, movio }
    let ancla = null;      // primer toque (modo "toca inicio y fin")

    function celdaEn(x, y) {
        const el = document.elementFromPoint(x, y);
        const c = el && el.closest ? el.closest(".sopa-celda") : null;
        return c && $("grid").contains(c) ? c : null;
    }

    // Línea recta (8 direcciones) desde (r0,c0) hacia (r1,c1)
    function linea(r0, c0, r1, c1) {
        const dr = r1 - r0, dc = c1 - c0, adr = Math.abs(dr), adc = Math.abs(dc);
        if (!adr && !adc) return [[r0, c0]];
        let sr, sc, len;
        if (adr >= 2 * adc)      { sr = Math.sign(dr); sc = 0; len = adr; }
        else if (adc >= 2 * adr) { sr = 0; sc = Math.sign(dc); len = adc; }
        else                     { sr = Math.sign(dr); sc = Math.sign(dc); len = Math.max(adr, adc); }
        const out = [];
        for (let i = 0; i <= len; i++) {
            const r = r0 + sr * i, c = c0 + sc * i;
            if (r < 0 || r >= n || c < 0 || c >= n) break;
            out.push([r, c]);
        }
        return out;
    }

    function limpiarSel() {
        $("grid").querySelectorAll(".sel").forEach((c) => c.classList.remove("sel"));
    }
    function marcar(cel) {
        limpiarSel();
        cel.forEach(([r, c]) => celdas[r][c].classList.add("sel"));
    }

    function comprobar(cel) {
        if (cel.length < 2) return false;
        const t = cel.map(([r, c]) => letras[r][c]).join("");
        const rev = Array.from(t).reverse().join("");
        for (let i = 0; i < puestas.length; i++) {
            const w = puestas[i];
            if (w.hallada) continue;
            if (w.p.texto === t || w.p.texto === rev) {
                w.hallada = true;
                encontradas++;
                cel.forEach(function ([r, c]) {
                    const el = celdas[r][c];
                    el.classList.add("hallada");
                    el.style.setProperty("--tono", w.tono);
                });
                const li = $("w" + i);
                li.classList.add("ok");
                li.firstChild.textContent = w.p.otomi + " — " + capitalizar(w.p.espanol);
                li.querySelector("small").textContent = "✓ encontrada";
                actualizar();
                if (encontradas === puestas.length) ganar();
                return true;
            }
        }
        return false;
    }

    $("grid").addEventListener("pointerdown", function (e) {
        if (termino) return;
        const c = celdaEn(e.clientX, e.clientY);
        if (!c) return;
        e.preventDefault();
        reloj.iniciar();
        $("grid").setPointerCapture(e.pointerId);
        arrastre = { r0: +c.dataset.r, c0: +c.dataset.c, movio: false };
        marcar(ancla ? linea(ancla.r, ancla.c, arrastre.r0, arrastre.c0) : [[arrastre.r0, arrastre.c0]]);
    });

    $("grid").addEventListener("pointermove", function (e) {
        if (!arrastre) return;
        const c = celdaEn(e.clientX, e.clientY);
        if (!c) return;
        const r1 = +c.dataset.r, c1 = +c.dataset.c;
        if (r1 !== arrastre.r0 || c1 !== arrastre.c0) arrastre.movio = true;
        marcar(linea(arrastre.r0, arrastre.c0, r1, c1));
    });

    function soltar(e) {
        if (!arrastre) return;
        const a = arrastre;
        arrastre = null;
        const c = celdaEn(e.clientX, e.clientY);
        const r1 = c ? +c.dataset.r : a.r0, c1 = c ? +c.dataset.c : a.c0;

        if (a.movio) {                                   // arrastrar: comprobar de inmediato
            ancla = null;
            comprobar(linea(a.r0, a.c0, r1, c1));
            limpiarSel();
        } else if (ancla) {                              // 2.º toque: fin de la palabra
            comprobar(linea(ancla.r, ancla.c, a.r0, a.c0));
            ancla = null;
            limpiarSel();
        } else {                                         // 1.er toque: inicio de la palabra
            ancla = { r: a.r0, c: a.c0 };
            marcar([[a.r0, a.c0]]);
        }
    }
    $("grid").addEventListener("pointerup", soltar);
    $("grid").addEventListener("pointercancel", function () { arrastre = null; ancla = null; limpiarSel(); });

    /* ---------- Pista ---------- */
    $("btnPista").addEventListener("click", function () {
        if (termino) return;
        const pendientes = puestas.filter((w) => !w.hallada);
        if (!pendientes.length) return;
        reloj.iniciar();
        const w = pendientes[rand(pendientes.length)];
        pistas++;
        actualizar();
        const el = celdas[w.r0][w.c0];
        el.classList.add("pista");
        setTimeout(() => el.classList.remove("pista"), 2500);
    });

    /* ---------- Victoria ---------- */
    function ganar() {
        termino = true;
        const seg = reloj.detener();
        terminar(
            { juego: "sopa", dificultad: $("dificultad").value, pistas: pistas, segundos: seg },
            "Encontraste las " + puestas.length + " palabras en " + window.Juego.formatoTiempo(seg) +
            (pistas ? " usando " + pistas + " pista" + (pistas > 1 ? "s" : "") : " sin pistas") + "."
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
