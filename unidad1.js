(function () {
    "use strict";

    const $ = (id) => document.getElementById(id);
    const VIDAS = 5;

    const PLAN = {
        1: ["elegir", "elegir", "elegir_inv", "elegir", "parejas", "elegir_inv", "elegir", "elegir_inv"],
        2: ["elegir_inv", "elegir", "parejas", "ordenar", "elegir_inv", "elegir", "ordenar", "parejas", "elegir_inv", "ordenar"],
        3: ["ordenar", "escribir", "elegir_inv", "parejas", "escribir", "ordenar", "escribir", "elegir", "parejas", "escribir", "ordenar", "escribir"]
    };

    let datos = null;     
    let lec = null;     
    let recien = null;     

    function mezclar(a) {
        a = a.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
    function cap(t) { t = (t || "").trim(); return t.charAt(0).toUpperCase() + t.slice(1); }
    function unificar(t) {
        return t.normalize("NFC").toLowerCase().replace(/[’`´‘]/g, "'").replace(/\s+/g, " ").trim();
    }
    function sinAcentos(t) { return t.normalize("NFD").replace(/[̀-ͯ]/g, ""); }
    function el(tag, clase, texto) {
        const e = document.createElement(tag);
        if (clase) e.className = clase;
        if (texto !== undefined) e.textContent = texto;
        return e;
    }
    const COLORES = ["#7c4ddb", "#b392f0", "#e0a82e", "#ffd95a", "#f0527f", "#2fa968", "#5b6cf0"];
    const sinMovimiento = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function confeti(x, y, o) {
        if (sinMovimiento()) return;
        o = Object.assign({ n: 16, esparcir: 130, arriba: 120, caida: 160, lluvia: false }, o || {});
        const capa = el("div", "confeti-capa");
        capa.setAttribute("aria-hidden", "true");
        for (let i = 0; i < o.n; i++) {
            const c = el("span", "confeti");
            const ang = (Math.random() - 0.5) * 2;                       // -1 .. 1
            const x0 = o.lluvia ? Math.random() * window.innerWidth : x;
            const y0 = o.lluvia ? -20 : y;
            c.style.setProperty("--x0", x0 + "px");
            c.style.setProperty("--y0", y0 + "px");
            c.style.setProperty("--dx", Math.round(ang * o.esparcir) + "px");
            c.style.setProperty("--dy", (o.lluvia ? 40 : -Math.round(o.arriba * (0.5 + Math.random() * 0.6))) + "px");
            c.style.setProperty("--fall", Math.round(o.caida * (0.8 + Math.random() * 0.5)) + "px");
            c.style.setProperty("--rot", Math.round((Math.random() - 0.5) * 900) + "deg");
            c.style.setProperty("--c", COLORES[i % COLORES.length]);
            c.style.setProperty("--w", (6 + Math.random() * 6) + "px");
            c.style.setProperty("--h", (9 + Math.random() * 8) + "px");
            c.style.setProperty("--d", (o.lluvia ? 1.6 + Math.random() * 1.2 : 0.95 + Math.random() * 0.4) + "s");
            c.style.setProperty("--dl", (o.lluvia ? Math.random() * 0.8 : Math.random() * 0.08) + "s");
            if (i % 3 === 0) c.style.borderRadius = "50%";
            capa.append(c);
        }
        document.body.append(capa);
        setTimeout(() => capa.remove(), o.lluvia ? 3200 : 1700);
    }
    function centroDe(e) {
        const r = e.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    function contar(elem, hasta, antes, despues) {
        if (sinMovimiento() || hasta <= 0) { elem.textContent = antes + hasta + despues; return; }
        const t0 = performance.now(), dur = 800;
        (function paso(t) {
            const k = Math.min(1, (t - t0) / dur);
            elem.textContent = antes + Math.round(hasta * (1 - Math.pow(1 - k, 3))) + despues;
            if (k < 1) requestAnimationFrame(paso);
        })(t0);
    }
    function mascota(clase) {
        const i = el("img", clase);
        i.src = "img/capibara.png";
        i.alt = "";
        i.setAttribute("aria-hidden", "true");
        return i;
    }

    function unaPalabra(p) { return !/[\s\/,]/.test(p.otomi) && Array.from(p.otomi).length >= 2 && Array.from(p.otomi).length <= 10; }

    function palabrasDe(catId) {
        const vEs = new Set(), vOt = new Set(), out = [];
        datos.palabras.filter((p) => p.categoria === catId).forEach(function (p) {
            const es = unificar(p.espanol), ot = unificar(p.otomi);
            if (vEs.has(es) || vOt.has(ot)) return;
            vEs.add(es); vOt.add(ot); out.push(p);
        });
        return out;
    }

    function hecho(tema, n) { return tema.niveles && tema.niveles[n] !== undefined; }

    function pintarRuta() {
        const ruta = $("ruta");
        ruta.innerHTML = "";
        let marcado = false;   

        datos.temas.forEach(function (t, ti) {
            const fila = el("div", "u-fila");
            const tema = el("div", "u-tema", t.titulo);
            tema.append(el("small", "", palabrasDe(t.id).length + " palabras"));
            fila.append(tema);

            const niv = el("div", "u-niveles");
            for (let n = 1; n <= 3; n++) {
                const ok = hecho(t, n);
                const abierto = n > 1 ? hecho(t, n - 1) : (ti === 0 || hecho(datos.temas[ti - 1], 3));
                const actual = !marcado && abierto && !ok;
                if (actual) marcado = true;

                const esNuevo = recien && recien.cat === t.id && recien.nivel === n;
                const b = el("button", "u-nodo" + (actual ? " actual" : "") + (esNuevo ? " recien" : ""));
                b.type = "button";
                b.disabled = !abierto;
                const icono = ok ? "ic-done" : (abierto ? "ic-open" : "ic-lock");
                b.innerHTML = '<svg class="u-ic" aria-hidden="true"><use href="#' + icono + '"></use></svg>';
                b.append(el("span", "u-lbl", "Nvl." + n));
                const err = ok ? t.niveles[n] : null;
                b.append(el("span", "u-estrellas", ok ? (err === 0 ? "⭐⭐⭐" : err <= 2 ? "⭐⭐" : "⭐") : ""));
                if (actual) b.append(el("span", "u-empezar", "¡EMPIEZA!"));
                b.setAttribute("aria-label", t.titulo + ", nivel " + n + (ok ? ", superado" : abierto ? "" : ", bloqueado"));
                if (abierto) b.addEventListener("click", () => empezar(t, n));
                niv.append(b);
            }
            fila.append(niv);
            ruta.append(fila);
        });
        recien = null;
    }

    function pintarEstado() {
        $("uEstado").hidden = false;
        $("chipRacha").textContent = "🔥 " + datos.racha + (datos.racha === 1 ? " día de racha" : " días de racha");
        $("chipXp").textContent = "⭐ " + datos.experiencia + " puntos";
        const hoy = $("chipHoy");
        hoy.classList.toggle("listo", datos.activo_hoy);
        hoy.textContent = datos.activo_hoy ? "✅ Ya sumaste tu día de racha" : "Haz un ejercicio hoy para sumar tu día";
    }

    async function cargar() {
        try {
            const r = await fetch("ruta_datos.php", { credentials: "same-origin" });
            if (r.status === 401) { location.href = "registro.html#login"; return; }
            const j = await r.json();
            if (!j.estado) throw new Error(j.mensaje || "Error");
            datos = j;
            $("estadoCarga").hidden = true;
            pintarEstado();
            pintarRuta();
        } catch (e) {
            console.error(e);
            $("estadoCarga").textContent = "❌ No se pudo cargar la ruta. Abre la página desde http://localhost/ con Apache y MySQL encendidos (y ejecuta ruta_aprendizaje.sql una vez).";
            $("estadoCarga").classList.add("error");
        }
    }

    function distractores(pool, w, k, campo) {
        const usados = new Set([unificar(w[campo])]);
        const res = [];
        const candidatos = mezclar(pool.filter((p) => p.id !== w.id))
            .concat(mezclar(datos.palabras.filter((p) => p.categoria !== w.categoria)));
        for (const p of candidatos) {
            const u = unificar(p[campo]);
            if (usados.has(u)) continue;
            if (campo === "otomi" && !unaPalabra(p) && p.otomi.length > 18) continue;
            usados.add(u); res.push(p);
            if (res.length === k) break;
        }
        return res;
    }

    function armar(tema, nivel) {
        const pool = palabrasDe(tema.id);
        let cola = [];
        const siguiente = function (filtro) {
            if (cola.length < 4) cola = cola.concat(mezclar(pool));
            let i = cola.findIndex((p) => !filtro || filtro(p));
            if (i < 0) return null;
            return cola.splice(i, 1)[0];
        };
        const lista = [];
        PLAN[nivel].forEach(function (tipo) {
            if (tipo === "parejas") {
                const g = mezclar(pool).slice(0, Math.min(4, pool.length));
                lista.push({ tipo: "parejas", palabras: g });
                return;
            }
            let w = (tipo === "ordenar" || tipo === "escribir") ? siguiente(unaPalabra) : siguiente();
            if (!w) { tipo = tipo === "elegir" ? "elegir" : "elegir_inv"; w = siguiente(); }
            lista.push({ tipo: tipo, palabra: w, pool: pool });
        });
        return lista;
    }

    function eElegir(ej, inverso) {
        const w = ej.palabra;
        const campoRes = inverso ? "espanol" : "otomi";
        const cuerpo = $("lecCuerpo");
        cuerpo.append(el("div", "q-tipo", "Elige la respuesta correcta"));
        const q = el("h2", "q-prompt");
        if (inverso) { q.append("¿Qué significa "); q.append(el("em", "", cap(w.otomi))); q.append("?"); }
        else { q.append("¿Cómo se dice "); q.append(el("em", "", cap(w.espanol))); q.append(" en hñähñu?"); }
        cuerpo.append(q);

        const ops = mezclar([w].concat(distractores(ej.pool, w, 3, campoRes)));
        const caja = el("div", "q-opciones");
        let elegida = null;
        const botones = ops.map(function (p) {
            const b = el("button", "q-op", cap(p[campoRes]));
            b.type = "button";
            b.addEventListener("click", function () {
                if (lec.fase !== "pregunta") return;
                botones.forEach((x) => x.classList.remove("sel"));
                b.classList.add("sel");
                elegida = p;
                $("lecBtn").disabled = false;
            });
            caja.append(b);
            return b;
        });
        cuerpo.append(caja);

        return {
            listo: () => !!elegida,
            comprobar: function () {
                const ok = elegida.id === w.id;
                botones.forEach(function (b, i) {
                    b.disabled = true;
                    if (ops[i].id === w.id) b.classList.add("ok");
                    else if (ops[i] === elegida) b.classList.add("mal");
                    b.classList.remove("sel");
                });
                return { ok: ok, correcta: cap(w[campoRes]) };
            }
        };
    }

    function eParejas(ej) {
        const cuerpo = $("lecCuerpo");
        cuerpo.append(el("div", "q-tipo", "Une las parejas"));
        cuerpo.append(el("h2", "q-prompt", "Toca una palabra en español y su traducción en hñähñu"));

        const izq = el("div", "q-col"), der = el("div", "q-col");
        let selEs = null, selOt = null, aciertos = 0, falloUsado = false;
        const total = ej.palabras.length;

        function intentar() {
            if (!selEs || !selOt) return;
            const a = selEs, b = selOt;
            selEs = selOt = null;
            if (a.dataset.id === b.dataset.id) {
                [a, b].forEach((x) => { x.classList.remove("sel"); x.classList.add("ok"); x.disabled = true; });
                const ca = centroDe(a), cb = centroDe(b);
                confeti((ca.x + cb.x) / 2, (ca.y + cb.y) / 2, { n: 8, esparcir: 90, arriba: 60, caida: 70 });
                aciertos++;
                if (aciertos === total) setTimeout(() => resolver(true), 350);
            } else {
                [a, b].forEach((x) => { x.classList.remove("sel"); x.classList.add("mal"); });
                setTimeout(() => [a, b].forEach((x) => x.classList.remove("mal")), 450);
                if (!falloUsado) {                                 // como máximo 1 vida por ejercicio de parejas
                    falloUsado = true;
                    fallar();
                    if (lec.vidas === 0) setTimeout(sinVidas, 600);
                }
            }
        }
        function boton(texto, id, esEs) {
            const b = el("button", "q-par", texto);
            b.type = "button";
            b.dataset.id = id;
            b.addEventListener("click", function () {
                if (lec.fase !== "pregunta" || b.disabled) return;
                const prev = esEs ? selEs : selOt;
                if (prev) prev.classList.remove("sel");
                b.classList.add("sel");
                if (esEs) selEs = b; else selOt = b;
                intentar();
            });
            return b;
        }
        mezclar(ej.palabras).forEach((p) => izq.append(boton(cap(p.espanol), p.id, true)));
        mezclar(ej.palabras).forEach((p) => der.append(boton(cap(p.otomi), p.id, false)));
        const g = el("div", "q-parejas");
        g.append(izq, der);
        cuerpo.append(g);
        return { auto: true };
    }

    function eOrdenar(ej) {
        const w = ej.palabra;
        const objetivo = Array.from(unificar(w.otomi));
        const cuerpo = $("lecCuerpo");
        cuerpo.append(el("div", "q-tipo", "Ordena las letras"));
        const q = el("h2", "q-prompt");
        q.append("Forma en hñähñu: ");
        q.append(el("em", "", cap(w.espanol)));
        cuerpo.append(q);

        const resp = el("div", "q-resp");
        const banco = el("div", "q-banco");
        const puestas = [];            
        const fichas = mezclar(objetivo.map((c, i) => ({ c: c, i: i })));

        function actualizar() {
            resp.innerHTML = "";
            puestas.forEach(function (f, idx) {
                const b = el("button", "q-ficha", f.c);
                b.style.setProperty("--i", idx);
                b.type = "button";
                b.addEventListener("click", function () {
                    if (lec.fase !== "pregunta") return;
                    puestas.splice(puestas.indexOf(f), 1);
                    actualizar();
                });
                resp.append(b);
            });
            banco.innerHTML = "";
            fichas.forEach(function (f) {
                const b = el("button", "q-ficha" + (puestas.includes(f) ? " vacia" : ""), f.c);
                b.type = "button";
                b.addEventListener("click", function () {
                    if (lec.fase !== "pregunta" || puestas.includes(f)) return;
                    puestas.push(f);
                    actualizar();
                });
                banco.append(b);
            });
            $("lecBtn").disabled = puestas.length !== objetivo.length;
        }
        cuerpo.append(resp, banco);
        actualizar();

        return {
            listo: () => puestas.length === objetivo.length,
            comprobar: function () {
                const ok = puestas.map((f) => f.c).join("") === objetivo.join("");
                resp.classList.add(ok ? "ok" : "mal");
                return { ok: ok, correcta: cap(w.otomi) };
            }
        };
    }

    function eEscribir(ej) {
        const w = ej.palabra;
        const cuerpo = $("lecCuerpo");
        cuerpo.append(el("div", "q-tipo", "Escribe la traducción"));
        const q = el("h2", "q-prompt");
        q.append("Escribe en hñähñu: ");
        q.append(el("em", "", cap(w.espanol)));
        cuerpo.append(q);

        const inp = el("input", "q-input");
        inp.type = "text";
        inp.autocomplete = "off"; inp.autocapitalize = "off"; inp.spellcheck = false;
        inp.setAttribute("aria-label", "Tu respuesta en hñähñu");
        inp.addEventListener("input", () => { $("lecBtn").disabled = !inp.value.trim() || lec.fase !== "pregunta"; });
        cuerpo.append(inp);

        const esp = el("div", "q-teclas");
        [["ä"], ["ë"], ["ï"], ["ö"], ["ü"], ["ñ"], ["í"], ["é"], ["ú"], ["ó"], ["ē"], ["ę"], ["ō"], ["'", "apóstrofo"]].forEach(function (par) {
            const c = par[0];
            const b = el("button", "q-tecla", c === "'" ? "’" : c);
            b.type = "button";
            b.setAttribute("aria-label", par[1] || "letra " + c);
            b.addEventListener("mousedown", (e) => e.preventDefault());    // no le quita el foco al cuadro
            b.addEventListener("click", function () {
                if (lec.fase !== "pregunta") return;
                const a = inp.selectionStart == null ? inp.value.length : inp.selectionStart;
                const z = inp.selectionEnd == null ? a : inp.selectionEnd;
                inp.value = inp.value.slice(0, a) + c + inp.value.slice(z);
                inp.focus();
                inp.setSelectionRange(a + c.length, a + c.length);
                $("lecBtn").disabled = false;
            });
            esp.append(b);
        });
        cuerpo.append(esp);
        cuerpo.append(el("p", "q-nota", "¿No tienes una letra en tu teclado? Toca el botón para ponerla."));
        setTimeout(() => inp.focus(), 50);

        return {
            listo: () => !!inp.value.trim(),
            comprobar: function () {
                const mio = unificar(inp.value), bien = unificar(w.otomi);
                inp.disabled = true;
                if (mio === bien) { inp.classList.add("ok"); return { ok: true, correcta: cap(w.otomi) }; }
                if (sinAcentos(mio) === sinAcentos(bien)) {  
                    inp.classList.add("ok");
                    return { ok: true, correcta: cap(w.otomi), nota: "Casi perfecto: se escribe " + cap(w.otomi) };
                }
                inp.classList.add("mal");
                return { ok: false, correcta: cap(w.otomi) };
            }
        };
    }

    function vidas() {
        $("lecVidas").textContent = "❤️".repeat(lec.vidas) + "🤍".repeat(VIDAS - lec.vidas);
        $("lecVidas").setAttribute("aria-label", lec.vidas + " vidas");
    }

    function empezar(tema, nivel) {
        const ejercicios = armar(tema, nivel);
        lec = { tema: tema, nivel: nivel, ej: ejercicios, i: 0, vidas: VIDAS, errores: 0, inicio: Date.now(), fase: "pregunta", ctl: null, terminado: false };
        $("leccion").hidden = false;
        document.body.style.overflow = "hidden";
        vidas();
        mostrar();
    }

    function cerrarLeccion() {
        $("leccion").hidden = true;
        $("uModal").hidden = true;
        document.body.style.overflow = "";
        lec = null;
    }

    function mostrar() {
        const e = lec.ej[lec.i];
        $("lecRelleno").style.width = Math.round(lec.i / lec.ej.length * 100) + "%";
        $("lecCuerpo").innerHTML = "";
        $("lecCuerpo").scrollTop = 0;
        $("lecPie").className = "lec-pie";
        $("lecFb").innerHTML = "";
        $("leccion").dataset.res = "";
        const rel = $("lecRelleno");
        rel.classList.remove("brilla"); void rel.offsetWidth; if (lec.i > 0) rel.classList.add("brilla");
        $("lecBtn").textContent = "COMPROBAR";
        $("lecBtn").disabled = true;
        lec.fase = "pregunta";

        if (e.tipo === "elegir") lec.ctl = eElegir(e, false);
        else if (e.tipo === "elegir_inv") lec.ctl = eElegir(e, true);
        else if (e.tipo === "parejas") lec.ctl = eParejas(e);
        else if (e.tipo === "ordenar") lec.ctl = eOrdenar(e);
        else lec.ctl = eEscribir(e);

        if (lec.ctl.auto) $("lecBtn").style.visibility = "hidden";
        else $("lecBtn").style.visibility = "visible";
    }

    function mostrarResultado(r) {
        lec.fase = "feedback";
        const pie = $("lecPie");
        pie.className = "lec-pie " + (r.ok ? "ok" : "mal");
        const fb = $("lecFb");
        fb.innerHTML = "";
        $("leccion").dataset.res = r.ok ? "ok" : "mal";
        if (r.ok) {
            const frases = ["¡Correcto!", "¡Muy bien!", "¡Excelente!", "¡Así se hace!", "¡Perfecto!"];
            fb.append(document.createTextNode("✅ " + frases[lec.i % frases.length]));
            if (r.nota) fb.append(el("small", "", r.nota));
            fb.append(mascota("lec-mascota"));
            const c = centroDe(fb);
            confeti(c.x + Math.min(240, window.innerWidth / 2 - 40), c.y - 30, { n: 18 });
        } else {
            fb.append(document.createTextNode("❌ Respuesta correcta:"));
            fb.append(el("small", "", r.correcta));
        }
        const b = $("lecBtn");
        b.style.visibility = "visible";
        b.textContent = "CONTINUAR";
        b.disabled = false;
        b.focus();
    }

    function fallar() {
        lec.errores++;
        lec.vidas = Math.max(0, lec.vidas - 1);
        vidas();
        $("lecVidas").classList.remove("sacudir");
        void $("lecVidas").offsetWidth;
        $("lecVidas").classList.add("sacudir");
    }

    function resolver(ok) {
        if (!lec || lec.fase !== "pregunta") return;
        if (lec.vidas === 0) { sinVidas(); return; }
        mostrarResultado({ ok: true, correcta: "" });
    }

    function alBoton() {
        if (!lec) return;
        if (lec.fase === "pregunta") {
            if (!lec.ctl.comprobar) return;
            const r = lec.ctl.comprobar();
            if (!r.ok) fallar();
            mostrarResultado(r);
            return;
        }
        if (lec.vidas === 0) { sinVidas(); return; }
        lec.i++;
        if (lec.i >= lec.ej.length) terminar();
        else mostrar();
    }

    function modal(emoji, titulo, texto, xp, boton, accion) {
        const em = $("mEmoji");
        em.textContent = "";
        if (emoji === "capi") em.append(mascota("u-modal-mascota")); else em.textContent = emoji;
        $("mTitulo").textContent = titulo;
        $("mTexto").textContent = texto;
        $("mXp").textContent = xp || "";
        const b = $("mBtn");
        b.textContent = boton;
        b.onclick = accion;
        $("uModal").hidden = false;
        b.focus();
    }

    function sinVidas() {
        if (lec.terminado) return;
        lec.terminado = true;
        const t = lec.tema, n = lec.nivel;
        modal("💔", "¡Te quedaste sin vidas!", "Repasa las palabras e inténtalo de nuevo, ¡tú puedes!", "", "INTENTAR DE NUEVO", function () {
            $("uModal").hidden = true;
            empezar(t, n);
        });
    }

    async function terminar() {
        lec.terminado = true;
        $("lecRelleno").style.width = "100%";
        const seg = Math.round((Date.now() - lec.inicio) / 1000);
        modal("⏳", "Guardando…", "", "", "CONTINUAR", function () {});
        $("mBtn").disabled = true;
        let j = null;
        try {
            const r = await fetch("completar_nivel.php", {
                method: "POST", credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categoria_id: lec.tema.id, nivel: lec.nivel, errores: lec.errores, segundos: seg })
            });
            j = await r.json();
        } catch (e) { console.error(e); }
        $("mBtn").disabled = false;

        const salir = function () { cerrarLeccion(); cargar(); };
        if (j && j.success) {
            const lineas = [];
            lineas.push(j.nuevo_dia ? "🔥 ¡Sumaste un día a tu racha! Llevas " + j.racha + (j.racha === 1 ? " día." : " días.")
                                    : "🔥 Hoy ya habías sumado tu día de racha (" + j.racha + (j.racha === 1 ? " día)." : " días)."));
            lineas.push(lec.errores === 0 ? "¡Sin errores! Bonus de +5 puntos." : "Errores: " + lec.errores);
            recien = { cat: lec.tema.id, nivel: lec.nivel };
            modal("capi", "¡Nivel completado!", lineas.join(" "), "", "CONTINUAR", salir);
            contar($("mXp"), j.xp, "+", " puntos ⭐");
            confeti(0, 0, { n: 60, lluvia: true, caida: window.innerHeight });
        } else {
            modal("😕", "No se guardó el avance", (j && j.mensaje) ? j.mensaje : "No hubo conexión con el servidor.", "", "CONTINUAR", salir);
        }
    }

    $("lecBtn").addEventListener("click", alBoton);
    $("lecSalir").addEventListener("click", function () {
        if (confirm("¿Salir de la lección? Perderás el avance de este nivel.")) cerrarLeccion();
    });
    document.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" || !lec || $("leccion").hidden || !$("uModal").hidden) return;
        if (e.target.tagName === "BUTTON") return;
        if (!$("lecBtn").disabled && $("lecBtn").style.visibility !== "hidden") { e.preventDefault(); alBoton(); }
    });

    cargar();
})();
