<?php
date_default_timezone_set("America/Mexico_City");

function registrar_actividad_diaria($conn, $idUsuario) {
    $ins = $conn->prepare("INSERT IGNORE INTO progreso (id_usuario, experiencia, racha, porcentaje) VALUES (?, 0, 0, 0)");
    $ins->bind_param("i", $idUsuario);
    $ins->execute();
    $ins->close();

    $q = $conn->prepare("SELECT racha, ultima_actividad FROM progreso WHERE id_usuario = ?");
    $q->bind_param("i", $idUsuario);
    $q->execute();
    $f = $q->get_result()->fetch_assoc();
    $q->close();

    $hoy = date("Y-m-d");
    $ayer = date("Y-m-d", strtotime("-1 day"));
    $racha = (int)($f["racha"] ?? 0);
    $ult = $f["ultima_actividad"] ?? null;

    if ($ult === $hoy) {
        return ["racha" => $racha, "nuevo_dia" => false];
    }
    $racha = ($ult === $ayer) ? $racha + 1 : 1;

    $u = $conn->prepare("UPDATE progreso SET racha = ?, ultima_actividad = ? WHERE id_usuario = ?");
    $u->bind_param("isi", $racha, $hoy, $idUsuario);
    $u->execute();
    $u->close();
    return ["racha" => $racha, "nuevo_dia" => true];
}

function racha_vigente($racha, $ultimaActividad) {
    $racha = (int)$racha;
    if (!$ultimaActividad) return $racha;          
    $ayer = date("Y-m-d", strtotime("-1 day"));
    return ($ultimaActividad >= $ayer) ? $racha : 0;
}
