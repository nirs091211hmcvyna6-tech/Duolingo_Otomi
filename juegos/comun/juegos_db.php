<?php
/* Ayuda compartida para los juegos: lee las partidas ganadas de la tabla `juegos_stats`. */

function obtener_stats_juegos($conn, $idUsuario) {
    $vacio = ["memorama_ganados" => 0, "sopa_ganadas" => 0, "xp_juegos" => 0];
    $s = $conn->prepare("SELECT memorama_ganados, sopa_ganadas, xp_juegos FROM juegos_stats WHERE id_usuario = ?");
    if (!$s) return $vacio;
    $s->bind_param("i", $idUsuario);
    $s->execute();
    $fila = $s->get_result()->fetch_assoc();
    $s->close();
    return $fila ? array_map("intval", $fila) : $vacio;
}
