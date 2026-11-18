(function () {
    "use strict";
    const $ = (id) => document.getElementById(id);
    const TIPO = document.body.dataset.tipo;      // "vocal" | "consonante"
    const POR_PAGINA = 12;

    let letras = [], palabras = [], mostrando = 0, actual = null;

    const BASE = { "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u", "ę": "e", "ē": "e", "ō": "o", "ū": "u", "ā": "a", "ī": "i" };
    function norm(t) {
        return Array.from(t.normalize("NFC").toLowerCase().replace(/[’`´]/g, "'"))
            .map((c) => BASE[c] || c).join("");
    }
    function minuscula(l) {            // "CH ch" → "ch"
        const partes = l.letra.trim().split(/\s+/);
        return partes[partes.length - 1].toLowerCase();
    }
    function mayuscula(l) { return l.letra.trim().split(/\s+/)[0]; }

    function preparar() {
        const vistos = new Set();
        palabras = palabras.filter(function (p) {
            const k = norm(p.otomi);
            if (!k || vistos.has(k)) return false;
            vistos.add(k);
            p._n = k;
            return true;
        }).sort((a, b) => a._n.localeCompare(b._n, "es"));

        palabras.forEach(function (p) {
            let mejor = null;
            letras.forEach(function (l) {
                const m = norm(minuscula(l));
                if (p._n.startsWith(m) && (!mejor || m.length > norm(minuscula(mejor)).length)) mejor = l;
            });
            p._letra = mejor ? mejor.id : null;
        });
    }

    function ejemplos(l) {
        const empiezan = palabras.filter((p) => p._letra === l.id).map((p) => ({ p: p, contiene: false }));
        if (empiezan.length >= 3) return empiezan;
        const m = norm(minuscula(l));
        const resto = palabras
            .filter((p) => p._letra !== l.id && p._n.includes(m))
            .map((p) => ({ p: p, contiene: true }));
        return empiezan.concat(resto);
    }

    function capitalizar(t) { t = t.trim(); return t.charAt(0).toUpperCase() + t.slice(1); }

    function pintarGrid(lista) {
        const grid = $("letrasGrid");
        grid.innerHTML = "";
        lista.forEach(function (l, i) {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "letra-card";
            b.dataset.id = l.id;
            b.setAttribute("role", "tab");
            const t = document.createElement("span");
            t.className = "l-txt";
            t.textContent = l.letra;
            const n = document.createElement("span");
            n.className = "l-num";
            n.textContent = "#" + (i + 1);
            b.append(t, n);
            b.addEventListener("click", () => elegir(l));
            grid.append(b);
        });
    }

    function elegir(l) {
        actual = l;
        mostrando = 0;
        document.querySelectorAll(".letra-card").forEach(function (b) {
            const on = Number(b.dataset.id) === l.id;
            b.classList.toggle("activa", on);
            b.setAttribute("aria-selected", on ? "true" : "false");
        });
        $("letraGrande").textContent = l.letra;
        $("detalleTitulo").textContent = (TIPO === "vocal" ? "Vocal " : "Consonante ") + mayuscula(l);
        $("palabrasLista").innerHTML = "";
        cargarMas();
    }

    function cargarMas() {
        const todas = ejemplos(actual);
        const ul = $("palabrasLista");
        const propias = todas.filter((x) => !x.contiene).length;

        if (!todas.length) {
            $("detalleSub").textContent = "";
            ul.innerHTML = '<li class="palabras-vacio">Aún no hay palabras registradas con esta letra.</li>';
            $("btnMas").hidden = true;
            return;
        }
        $("detalleSub").textContent = propias
            ? propias + (propias === 1 ? " palabra empieza" : " palabras empiezan") + " con esta letra."
            : "Aún no hay palabras que empiecen con esta letra; estas la contienen.";

        todas.slice(mostrando, mostrando + POR_PAGINA).forEach(function (x) {
            const li = document.createElement("li");
            const o = document.createElement("span");
            o.className = "p-otomi";
            o.textContent = capitalizar(x.p.otomi);
            const e = document.createElement("span");
            e.className = "p-es";
            e.textContent = capitalizar(x.p.espanol);
            li.append(o, e);
            if (x.p.categoria) {
                const c = document.createElement("span");
                c.className = "p-cat";
                c.textContent = x.p.categoria;
                li.append(c);
            }
            if (x.contiene) {
                const k = document.createElement("span");
                k.className = "p-contiene";
                k.textContent = " · la contiene";
                li.append(k);
            }
            ul.append(li);
        });
        mostrando += POR_PAGINA;
        $("btnMas").hidden = mostrando >= todas.length;
    }
    $("btnMas").addEventListener("click", cargarMas);

    fetch("letras_datos.php", { credentials: "same-origin" })
        .then((r) => r.json())
        .then(function (d) {
            if (!d.estado) throw new Error(d.mensaje || "Error desconocido");
            letras = d.letras;
            palabras = d.palabras;
            preparar();
            const lista = letras.filter((l) => l.tipo === TIPO);
            pintarGrid(lista);
            $("estadoCarga").hidden = true;
            $("contenido").hidden = false;
            elegir(lista[0]);
        })
        .catch(function (e) {
            console.error(e);
            $("estadoCarga").textContent = "❌ No se pudieron cargar los datos. Abre la página desde http://localhost/ con Apache y MySQL encendidos.";
            $("estadoCarga").classList.add("error");
        });
})();
