/* ==========================================================
   juego.js - utilidades compartidas (palabras, puntos, ventana final)
   ========================================================== */
window.Juego = (function () {
    "use strict";

    const $ = (id) => document.getElementById(id);

    function mezclar(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function capitalizar(t) {
        t = (t || "").trim();
        return t.charAt(0).toUpperCase() + t.slice(1);
    }

    function formatoTiempo(seg) {
        return Math.floor(seg / 60) + ":" + String(seg % 60).padStart(2, "0");
    }

    /* Palabras verificadas desde la base de datos */
    async function cargarPalabras() {
        const r = await fetch("../comun/palabras_juego.php", { credentials: "same-origin" });
        const j = await r.json();
        if (!j.estado) throw new Error(j.mensaje || "No se pudieron cargar las palabras");
        return j;
    }

    /* Quita repetidos por español u otomí (p. ej. "acocil", "m'u", "bindo") */
    function sinRepetidos(lista, clave) {
        const vistoEs = new Set(), vistoOt = new Set(), out = [];
        mezclar(lista).forEach(function (p) {
            const es = p.espanol.trim().toLowerCase();
            const ot = clave(p);
            if (vistoEs.has(es) || vistoOt.has(ot)) return;
            vistoEs.add(es); vistoOt.add(ot);
            out.push(p);
        });
        return out;
    }

    /* Reloj de la partida */
    function crearReloj(elemento) {
        let inicio = 0, id = null, seg = 0;
        return {
            iniciar: function () {
                if (id) return;
                inicio = Date.now();
                id = setInterval(function () {
                    seg = Math.floor((Date.now() - inicio) / 1000);
                    elemento.textContent = formatoTiempo(seg);
                }, 500);
            },
            detener: function () {
                if (id) { clearInterval(id); id = null; }
                if (inicio) seg = Math.floor((Date.now() - inicio) / 1000);
                elemento.textContent = formatoTiempo(seg);
                return seg;
            },
            reiniciar: function () {
                if (id) { clearInterval(id); id = null; }
                inicio = 0; seg = 0;
                elemento.textContent = "0:00";
            }
        };
    }

    /* Envía la victoria al servidor y llena la ventana final */
    async function terminar(datos, resumen) {
        const modal = $("modal");
        $("modalResumen").textContent = resumen;
        $("modalXp").textContent = "Guardando puntos…";
        $("modalLogro").hidden = true;
        $("modalExtra").textContent = "";
        modal.hidden = false;
        $("btnOtra").focus();

        try {
            const r = await fetch("../comun/guardar_juego.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify(datos)
            });
            const j = await r.json();
            if (j.success) {
                $("modalXp").textContent = "+" + j.xp + " puntos ⭐";
                $("modalExtra").textContent = "Llevas " + j.experiencia + " puntos en total.";
                if (j.nuevo_logro) {
                    $("modalLogro").textContent = "🏅 ¡Logro desbloqueado: " + j.nuevo_logro + "!";
                    $("modalLogro").hidden = false;
                }
            } else if (j.sin_sesion) {
                $("modalXp").textContent = "Sin puntos esta vez";
                $("modalExtra").innerHTML = 'Para sumar puntos y logros <a href="../../registro.html#login">inicia sesión</a>.';
            } else {
                $("modalXp").textContent = "No se sumaron puntos";
                $("modalExtra").textContent = j.mensaje || "";
            }
        } catch (e) {
            console.error(e);
            $("modalXp").textContent = "No se pudo guardar";
            $("modalExtra").textContent = "Error de conexión con el servidor.";
        }
    }

    return { $, mezclar, capitalizar, formatoTiempo, cargarPalabras, sinRepetidos, crearReloj, terminar };
})();
