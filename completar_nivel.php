<?php
session_start();
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/db.php";
require_once __DIR__ . "/racha_diaria.php";

function salir($ok, $msg, $extra = []) {
    echo json_encode(array_merge(["success" => $ok, "mensaje" => $msg], $extra));
    exit;
}

if (!isset($_SESSION["id_usuario"])) salir(false, "Debes iniciar sesión");
$id = (int)$_SESSION["id_usuario"];

$d = json_decode(file_get_contents("php://input"), true);
if (!is_array($d)) $d = [];
$cat = (int)($d["categoria_id"] ?? 0);
$nivel = (int)($d["nivel"] ?? 0);
$errores = max(0, min(9, (int)($d["errores"] ?? 0)));
$seg = max(0, (int)($d["segundos"] ?? 0));

if ($nivel < 1 || $nivel > 3) salir(false, "Nivel no válido");
if ($seg < 8) salir(false, "Prueba demasiado corta para sumar puntos.");

$orden = [];
$r = $conn->query("SELECT id FROM categorias WHERE orden_ruta IS NOT NULL ORDER BY orden_ruta, id");
while ($f = $r->fetch_assoc()) $orden[] = (int)$f["id"];
$pos = array_search($cat, $orden, true);
if ($pos === false) salir(false, "Tema no válido");

$hechos = [];
$q = $conn->prepare("SELECT categoria_id, nivel FROM niveles_completados WHERE id_usuario = ?");
$q->bind_param("i", $id);
$q->execute();
$res = $q->get_result();
while ($f = $res->fetch_assoc()) $hechos[(int)$f["categoria_id"] . "-" . (int)$f["nivel"]] = true;
$q->close();

if ($nivel > 1) {
    $abierto = isset($hechos[$cat . "-" . ($nivel - 1)]);
} else {
    $abierto = ($pos === 0) || isset($hechos[$orden[$pos - 1] . "-3"]);
}
if (!$abierto) salir(false, "Ese nivel todavía está bloqueado.");

$primeraVez = !isset($hechos[$cat . "-" . $nivel]);
$xp = $primeraVez ? 10 * $nivel : 5 * $nivel;
if ($errores === 0) $xp += 5;
$hoy = date("Y-m-d");

$s = $conn->prepare(
    "INSERT INTO niveles_completados (id_usuario, categoria_id, nivel, mejor_errores, veces, fecha)
     VALUES (?,?,?,?,1,?)
     ON DUPLICATE KEY UPDATE veces = veces + 1, fecha = VALUES(fecha),
                             mejor_errores = LEAST(mejor_errores, VALUES(mejor_errores))"
);
$s->bind_param("iiiis", $id, $cat, $nivel, $errores, $hoy);
if (!$s->execute()) salir(false, "No se pudo guardar el nivel.");
$s->close();

$racha = registrar_actividad_diaria($conn, $id);

$c = $conn->prepare("SELECT COUNT(*) AS n FROM niveles_completados WHERE id_usuario = ?");
$c->bind_param("i", $id);
$c->execute();
$hechosN = (int)$c->get_result()->fetch_assoc()["n"];
$c->close();
$porc = (int)min(100, round($hechosN * 100 / (count($orden) * 3)));

$u = $conn->prepare("UPDATE progreso SET experiencia = experiencia + ?, porcentaje = ? WHERE id_usuario = ?");
$u->bind_param("iii", $xp, $porc, $id);
$u->execute();
$u->close();

$t = $conn->prepare("SELECT experiencia FROM progreso WHERE id_usuario = ?");
$t->bind_param("i", $id);
$t->execute();
$total = (int)($t->get_result()->fetch_assoc()["experiencia"] ?? 0);
$t->close();

salir(true, "Nivel completado", [
    "xp" => $xp, "experiencia" => $total, "racha" => $racha["racha"],
    "nuevo_dia" => $racha["nuevo_dia"], "porcentaje" => $porc, "primera_vez" => $primeraVez
]);
