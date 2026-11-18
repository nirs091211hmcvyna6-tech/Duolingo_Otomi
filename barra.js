(function () {
    const barra = document.getElementById("barra");
    if (!barra) return;

    const opciones = [
        { clave: "conoce", icono: "🏞️", texto: "Conoce San Nicolás", href: "conoce_san_nicolas.html" },
        { clave: "aprender", icono: "📚", texto: "Aprender", href: "Unidad1.html" },
        { clave: "vocales", icono: "🅰️", texto: "Vocales", href: "vocales.html" },
        { clave: "consonantes", icono: "🔤", texto: "Consonantes", href: "consonantes.html" },
        { clave: "juegos", icono: "🎮", texto: "Juegos", href: "juegos.html" },
        { clave: "perfil", icono: "👤", texto: "Perfil", href: "perfil.html" }
    ];

    const alias = { sabias: "conoce", inicio: "conoce", lecciones: "aprender" };
    let activo = barra.dataset.activo || "";
    activo = alias[activo] || activo;

    const items = opciones.map(function (o) {
        const clase = o.clave === activo ? ' class="activo" aria-current="page"' : "";
        return (
            "<li>" +
            '<a href="' + o.href + '"' + clase + ">" +
            '<span class="icono">' + o.icono + "</span>" +
            "<span>" + o.texto + "</span>" +
            "</a></li>"
        );
    }).join("");

    barra.innerHTML =
        '<h2 class="barra-titulo">Menú</h2>' +
        '<ul class="barra-lista">' + items + "</ul>";
})();