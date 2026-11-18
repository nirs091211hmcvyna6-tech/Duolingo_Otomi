<?php
/* Guarda el resultado de una partida ganada y suma puntos de experiencia.
   Los puntos se calculan AQUÍ (no se confía en lo que mande el navegador). */
session_start();
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/../../db.php";
require_once __DIR__ . "/juegos_db.php";
require_once __DIR__ . "/../../racha_diaria.php";

if (!isset($_SESSION["id_usuario"])) {
    echo json_encode(["success" => false, "sin_sesion" => true,
        "mensaje" => "Inicia sesión para guardar tus puntos y desbloquear logros."]);
    exit;
}

$d = json_decode(file_get_contents("php://input"), true);
if (!is_array($d)) $d = [];

$juego = $d["juego"] ?? "";
$dif   = $d["dificultad"] ?? "";
$movs  = max(0, (int)($d["movimientos"] ?? 0));
$pistas = max(0, (int)($d["pistas"] ?? 0));
$seg   = max(0, (int)($d["segundos"] ?? 0));

$base  = ["facil" => 10, "medio" => 20, "dificil" => 30];
$pares = ["facil" => 6,  "medio" => 8,  "dificil" => 10];

if (!in_array($juego, ["memorama", "sopa"], true) || !isset($base[$dif])) {
    echo json_encode(["success" => false, "mensaje" => "Datos de partida no válidos."]);
    exit;
}
// Una partida real nunca dura menos de unos segundos
if ($seg < 5) {
    echo json_encode(["success" => false, "mensaje" => "Partida demasiado corta para sumar puntos."]);
    exit;
}

$xp = $base[$dif];
if ($juego === "memorama") {
    // Bonus por jugar con pocos intentos (máximo 2 intentos por par)
    if ($movs > 0 && $movs <= $pares[$dif] * 2) $xp += 10;
} else {
    // Cada pista cuesta 3 puntos (mínimo 5 por ganar)
    $xp = max(5, $xp - 3 * $pistas);
}

$id = (int)$_SESSION["id_usuario"];

// progreso del usuario (por si aún no existe)
$ins = $conn->prepare("INSERT IGNORE INTO progreso (id_usuario, experiencia, racha, porcentaje) VALUES (?, 0, 0, 0)");
$ins->bind_param("i", $id);
$ins->execute();
$ins->close();

$up = $conn->prepare("UPDATE progreso SET experiencia = experiencia + ? WHERE id_usuario = ?");
$up->bind_param("ii", $xp, $id);
$ok1 = $up->execute();
$up->close();

$mg = $juego === "memorama" ? 1 : 0;
$sg = $juego === "sopa" ? 1 : 0;
$st = $conn->prepare(
    "INSERT INTO juegos_stats (id_usuario, memorama_ganados, sopa_ganadas, xp_juegos) VALUES (?,?,?,?)
     ON DUPLICATE KEY UPDATE memorama_ganados = memorama_ganados + VALUES(memorama_ganados),
                             sopa_ganadas     = sopa_ganadas     + VALUES(sopa_ganadas),
                             xp_juegos        = xp_juegos        + VALUES(xp_juegos)"
);
$st->bind_param("iiii", $id, $mg, $sg, $xp);
$ok2 = $st->execute();
$st->close();

if (!$ok1 || !$ok2) {
    echo json_encode(["success" => false, "mensaje" => "No se pudo guardar la partida."]);
    exit;
}

$racha = registrar_actividad_diaria($conn, $id);   // los juegos también cuentan para la racha diaria
$stats = obtener_stats_juegos($conn, $id);
$total = 0;
$q = $conn->prepare("SELECT experiencia FROM progreso WHERE id_usuario = ?");
$q->bind_param("i", $id);
$q->execute();
if ($f = $q->get_result()->fetch_assoc()) $total = (int)$f["experiencia"];
$q->close();

// ¿Esta victoria desbloqueó un logro de juegos?
$ganadas = $juego === "memorama" ? $stats["memorama_ganados"] : $stats["sopa_ganadas"];
$nuevo = null;
if (in_array($ganadas, [1, 5, 15], true)) {
    $nombres = [
        "memorama" => [1 => "Memorista", 5 => "Memoria de elefante", 15 => "Maestro del memorama"],
        "sopa"     => [1 => "Cazapalabras", 5 => "Ojo de águila", 15 => "Maestro de la sopa"],
    ];
    $nuevo = $nombres[$juego][$ganadas];
}

echo json_encode([
    "success"     => true,
    "xp"          => $xp,
    "experiencia" => $total,
    "ganadas"     => $ganadas,
    "nuevo_logro" => $nuevo,
    "racha"       => $racha["racha"],
    "nuevo_dia"   => $racha["nuevo_dia"],
    "mensaje"     => "¡Ganaste " . $xp . " puntos!"
]);
$conn->close();
