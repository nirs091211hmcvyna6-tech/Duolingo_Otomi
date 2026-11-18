(function () {
    "use strict";

    const $ = (id) => document.getElementById(id);

    const tabs = { registro: $("tabRegistro"), login: $("tabLogin") };
    const paneles = { registro: $("panelRegistro"), login: $("panelLogin") };

    function mostrar(cual, enfocar) {
        Object.keys(tabs).forEach(function (k) {
            const activa = k === cual;
            tabs[k].classList.toggle("activa", activa);
            tabs[k].setAttribute("aria-selected", activa ? "true" : "false");
            tabs[k].tabIndex = activa ? 0 : -1;
            paneles[k].classList.toggle("activo", activa);
            paneles[k].hidden = !activa;
        });
        if (history.replaceState) history.replaceState(null, "", "#" + cual);
        if (enfocar) {
            const primero = paneles[cual].querySelector("input");
            if (primero) primero.focus();
        }
    }

    Object.keys(tabs).forEach(function (k) {
        tabs[k].addEventListener("click", function () { mostrar(k, false); });
        // Flechas izquierda/derecha entre pestañas (accesibilidad)
        tabs[k].addEventListener("keydown", function (e) {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                const otro = k === "registro" ? "login" : "registro";
                mostrar(otro, false);
                tabs[otro].focus();
            }
        });
    });
    document.querySelectorAll("[data-ir]").forEach(function (b) {
        b.addEventListener("click", function () { mostrar(b.dataset.ir, true); });
    });

    mostrar(location.hash === "#login" ? "login" : "registro", false);

    (function () {
        const d = new Date();
        $("regFechaNac").max = d.getFullYear() + "-" +
            String(d.getMonth() + 1).padStart(2, "0") + "-" +
            String(d.getDate()).padStart(2, "0");
    })();

    function mensaje(el, texto, tipo) {
        el.textContent = texto;
        el.className = "msg " + (tipo || "");
    }

    function validar(form, msgEl) {
        let primero = null;
        form.querySelectorAll("input, select").forEach(function (c) {
            const mal = !c.checkValidity();
            c.classList.toggle("invalido", mal);
            if (mal && !primero) primero = c;
        });
        if (primero) {
            mensaje(msgEl, "❌ Revisa los campos marcados.", "error");
            primero.focus();
            return false;
        }
        return true;
    }

    async function enviar(url, datos, msgEl, boton) {
        if (location.protocol === "file:") {
            mensaje(msgEl, "❌ Abriste el archivo con doble clic. Ábrelo desde http://localhost/ (Apache encendido en XAMPP).", "error");
            return null;
        }
        boton.disabled = true;
        mensaje(msgEl, "Enviando…", "");
        try {
            const r = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos),
                credentials: "same-origin"
            });
            const texto = await r.text();
            let j;
            try {
                j = JSON.parse(texto);
            } catch (e) {
                mensaje(msgEl, "❌ El servidor no devolvió JSON (HTTP " + r.status + "): " + texto.substring(0, 200), "error");
                return null;
            }
            mensaje(msgEl, j.mensaje || "", j.estado ? "ok" : "error");
            return j;
        } catch (e) {
            console.error(e);
            mensaje(msgEl, "❌ No se pudo conectar con el servidor: " + e.message, "error");
            return null;
        } finally {
            boton.disabled = false;
        }
    }

    $("formRegistro").addEventListener("submit", async function (e) {
        e.preventDefault();
        const f = this;
        const msg = $("msgRegistro");
        if (!validar(f, msg)) return;

        if (f.contrasena.value !== f.contrasena2.value) {
            f.contrasena2.classList.add("invalido");
            mensaje(msg, "❌ Las contraseñas no coinciden.", "error");
            f.contrasena2.focus();
            return;
        }

        const j = await enviar("registro.php", {
            nombre: f.nombre.value.trim(),
            email: f.email.value.trim(),
            contrasena: f.contrasena.value,
            fecha_nac: f.fecha_nac.value,
            pais: f.pais.value,
            nivel: f.nivel.value
        }, msg, f.querySelector("button[type=submit]"));

        if (j && j.estado) {
            setTimeout(function () { window.location.href = j.redirect || "conoce_san_nicolas.html"; }, 700);
        }
    });

    $("formLogin").addEventListener("submit", async function (e) {
        e.preventDefault();
        const f = this;
        const msg = $("msgLogin");
        if (!validar(f, msg)) return;

        const j = await enviar("login.php", {
            email: f.email.value.trim(),
            contrasena: f.contrasena.value
        }, msg, f.querySelector("button[type=submit]"));

        if (j && j.estado) {
            setTimeout(function () { window.location.href = j.redirect || "Unidad1.html"; }, 500);
        }
    });

    document.querySelectorAll("input, select").forEach(function (c) {
        c.addEventListener("input", function () { c.classList.remove("invalido"); });
    });
})();
