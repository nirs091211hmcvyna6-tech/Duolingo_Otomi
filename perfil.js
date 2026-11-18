(function () {
    "use strict";

    const RANGOS = [
        { min: 0, icono: "🌱", nombre: "Semilla" },
        { min: 50, icono: "🌿", nombre: "Brote" },
        { min: 150, icono: "🧭", nombre: "Explorador" },
        { min: 300, icono: "🛡️", nombre: "Guardián" },
        { min: 600, icono: "📜", nombre: "Sabio" },
        { min: 1000, icono: "👑", nombre: "Leyenda" }
    ];

    function crearLogros(d, dias) {
        return [
            { icono: "🌱", titulo: "Primer paso", desc: "Supera tu primer nivel", valor: d.niveles || 0, meta: 1 },
            { icono: "📸", titulo: "Con cara", desc: "Sube tu foto de perfil", valor: d.foto ? 1 : 0, meta: 1 },
            { icono: "⭐", titulo: "Aprendiz", desc: "Reúne 50 puntos", valor: d.experiencia, meta: 50 },
            { icono: "🌟", titulo: "Estudioso", desc: "Reúne 150 puntos", valor: d.experiencia, meta: 150 },
            { icono: "🏅", titulo: "Constante", desc: "Reúne 300 puntos", valor: d.experiencia, meta: 300 },
            { icono: "🏆", titulo: "Maestro", desc: "Reúne 600 puntos", valor: d.experiencia, meta: 600 },
            { icono: "🔥", titulo: "En racha", desc: "Practica 3 días seguidos", valor: d.racha, meta: 3 },
            { icono: "🚀", titulo: "Imparable", desc: "Practica 7 días seguidos", valor: d.racha, meta: 7 },
            { icono: "💎", titulo: "Leyenda viva", desc: "Practica 30 días seguidos", valor: d.racha, meta: 30 },
            { icono: "🪜", titulo: "Escalador", desc: "Supera 10 niveles", valor: d.niveles || 0, meta: 10 },
            { icono: "🧭", titulo: "A medio camino", desc: "Avanza el 50% del curso", valor: d.porcentaje, meta: 50 },
            { icono: "🎓", titulo: "Curso completo", desc: "Llega al 100% del curso", valor: d.porcentaje, meta: 100 },
            { icono: "📅", titulo: "Ya eres de casa", desc: "Cumple 7 días en la app", valor: dias, meta: 7 },

            /* ----- Juegos ----- */
            { icono: "🃏", titulo: "Memorista", desc: "Gana 1 memorama", valor: d.memorama_ganados || 0, meta: 1 },
            { icono: "🐘", titulo: "Memoria de elefante", desc: "Gana 5 memoramas", valor: d.memorama_ganados || 0, meta: 5 },
            { icono: "🧠", titulo: "Maestro del memorama", desc: "Gana 15 memoramas", valor: d.memorama_ganados || 0, meta: 15 },
            { icono: "🔎", titulo: "Cazapalabras",desc: "Completa 1 sopa de letras", valor: d.sopa_ganadas || 0, meta: 1 },
            { icono: "🦅", titulo: "Ojo de águila", desc: "Completa 5 sopas de letras", valor: d.sopa_ganadas || 0, meta: 5 },
            { icono: "🧩", titulo: "Maestro de la sopa", desc: "Completa 15 sopas de letras", valor: d.sopa_ganadas || 0, meta: 15 },
            { icono: "🎮", titulo: "Jugador completo", desc: "Gana un memorama y una sopa", valor: Math.min(d.memorama_ganados || 0, 1) + Math.min(d.sopa_ganadas || 0, 1), meta: 2 }
        ];
    }

    const $ = (id) => document.getElementById(id);

    function diasDesde(fecha) {
        if (!fecha) return 0;
        const inicio = new Date(fecha + "T00:00:00");
        if (isNaN(inicio)) return 0;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return Math.max(0, Math.floor((hoy - inicio) / 86400000)) + 1;
    }

    function textoFecha(fecha) {
        const f = new Date(fecha + "T00:00:00");
        if (isNaN(f)) return "—";
        return f.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
    }

    function pintarAvatar(foto, nombre) {
        const img = $("avatarImg");
        const inicial = $("avatarInicial");
        inicial.textContent = (nombre || "?").trim().charAt(0).toUpperCase() || "?";

        if (foto) {
            img.src = foto + "?v=" + Date.now();  
            img.hidden = false;
            inicial.hidden = true;
            $("btnQuitar").hidden = false;
            $("btnSubir").textContent = "Cambiar foto";
        } else {
            img.hidden = true;
            img.removeAttribute("src");
            inicial.hidden = false;
            $("btnQuitar").hidden = true;
            $("btnSubir").textContent = "Subir foto";
        }
    }

    function mensaje(texto, tipo) {
        const m = $("mensajeFoto");
        m.textContent = texto;
        m.className = "mensaje " + (tipo || "");
    }

    function pintarRango(xp) {
        let idx = 0;
        RANGOS.forEach((r, i) => { if (xp >= r.min) idx = i; });
        const actual = RANGOS[idx];
        const sig = RANGOS[idx + 1];

        $("chipRango").textContent = actual.icono + " " + actual.nombre;
        $("rangoActual").textContent = actual.icono + " " + actual.nombre;

        if (sig) {
            const rango = sig.min - actual.min;
            const avance = Math.min(100, Math.round(((xp - actual.min) / rango) * 100));
            $("rangoSiguiente").textContent = "Siguiente: " + sig.icono + " " + sig.nombre;
            $("rangoRelleno").style.width = avance + "%";
            $("rangoTexto").textContent = "Te faltan " + (sig.min - xp) + " puntos para ser " + sig.nombre + ".";
        } else {
            $("rangoSiguiente").textContent = "¡Rango máximo!";
            $("rangoRelleno").style.width = "100%";
            $("rangoTexto").textContent = "Alcanzaste el rango más alto. ¡Eres toda una leyenda!";
        }
    }

    function pintarLogros(d, dias) {
        const logros = crearLogros(d, dias);
        const grid = $("logrosGrid");
        grid.innerHTML = "";
        let ganados = 0;
        let proximo = null;

        logros.forEach((l) => {
            const ok = l.valor >= l.meta;
            if (ok) ganados++;
            else if (!proximo || (l.valor / l.meta) > (proximo.valor / proximo.meta)) proximo = l;

            const card = document.createElement("div");
            card.className = "logro " + (ok ? "ganado" : "bloqueado");

            const icono = document.createElement("div");
            icono.className = "logro-icono";
            icono.textContent = ok ? l.icono : "🔒";

            const h3 = document.createElement("h3");
            h3.textContent = l.titulo;

            const p = document.createElement("p");
            p.textContent = l.desc;

            card.append(icono, h3, p);

            if (ok) {
                const et = document.createElement("span");
                et.className = "logro-etiqueta";
                et.textContent = "¡Desbloqueado!";
                card.append(et);
            } else {
                const mini = document.createElement("div");
                mini.className = "logro-mini";
                const rel = document.createElement("div");
                rel.style.width = Math.round((l.valor / l.meta) * 100) + "%";
                mini.append(rel);
                const et = document.createElement("span");
                et.className = "logro-etiqueta";
                et.textContent = l.valor + " / " + l.meta;
                card.append(mini, et);
            }
            grid.append(card);
        });

        $("logrosResumen").textContent = ganados + " de " + logros.length + " logros desbloqueados";

        const caja = $("proximoLogro");
        if (proximo) {
            caja.hidden = false;
            caja.textContent = "🎯 Tu próximo logro: " + proximo.titulo + " — " + proximo.desc.toLowerCase() + ".";
        } else {
            caja.hidden = false;
            caja.textContent = "🎉 ¡Desbloqueaste todos los logros!";
        }
    }

    function pintarPerfil(d) {
        const dias = diasDesde(d.fecha_registro);

        $("pNombre").textContent = d.nombre;
        $("pEmail").textContent = d.email;
        $("chipNivel").textContent = "📘 Nivel " + (d.nivel || "básico");
        $("chipPais").textContent = "📍 " + (d.pais || "—");
        $("chipDesde").textContent = "📅 Desde " + textoFecha(d.fecha_registro);

        $("sXp").textContent = d.experiencia;
        $("sRacha").textContent = d.racha;
        $("sRachaTxt").textContent = d.racha === 1 ? "Día de racha" : "Días de racha";
        $("sPorc").textContent = d.porcentaje + "%";
        $("sDias").textContent = dias;

        pintarAvatar(d.foto, d.nombre);
        pintarRango(d.experiencia);
        pintarLogros(d, dias);
    }

    let datos = null;

    async function cargar() {
        const aviso = $("estadoCarga");
        try {
            const r = await fetch("perfil_datos.php", { credentials: "same-origin" });
            if (r.status === 401) {
                window.location.href = "registro.html#login";
                return;
            }
            const j = await r.json();
            if (!j.estado) throw new Error(j.mensaje || "Error desconocido");

            datos = j;
            pintarPerfil(j);
            aviso.hidden = true;
            $("contenidoPerfil").hidden = false;
        } catch (e) {
            aviso.textContent = "❌ " + e.message;
            aviso.classList.add("error");
        }
    }

    async function enviar(formData) {
        $("btnSubir").disabled = true;
        $("btnQuitar").disabled = true;
        mensaje("", "");
        try {
            const r = await fetch("subir_foto.php", { method: "POST", body: formData, credentials: "same-origin" });
            const j = await r.json();
            mensaje(j.estado ? "" : j.mensaje, j.estado ? "" : "error");   // solo se muestran los errores
            if (j.estado) {
                datos.foto = j.foto;
                pintarAvatar(datos.foto, datos.nombre);
                pintarLogros(datos, diasDesde(datos.fecha_registro));   // el logro "Con cara"
            }
        } catch (e) {
            mensaje("❌ Error de conexión con el servidor", "error");
        } finally {
            $("btnSubir").disabled = false;
            $("btnQuitar").disabled = false;
        }
    }

    function alElegirArchivo(ev) {
        const archivo = ev.target.files[0];
        ev.target.value = "";            
        if (!archivo) return;

        if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type)) {
            mensaje("❌ Solo se permiten imágenes JPG, PNG o WEBP", "error");
            return;
        }

        const url = URL.createObjectURL(archivo);
        $("avatarImg").src = url;
        $("avatarImg").hidden = false;
        $("avatarInicial").hidden = true;

        const fd = new FormData();
        fd.append("foto", archivo);
        enviar(fd).then(() => URL.revokeObjectURL(url));
    }

    function quitarFoto() {
        if (!confirm("¿Quieres quitar tu foto de perfil?")) return;
        const fd = new FormData();
        fd.append("accion", "quitar");
        enviar(fd);
    }

    $("btnCamara").addEventListener("click", () => $("inputFoto").click());
    $("btnSubir").addEventListener("click", () => $("inputFoto").click());
    $("inputFoto").addEventListener("change", alElegirArchivo);
    $("btnQuitar").addEventListener("click", quitarFoto);

    cargar();
})();
