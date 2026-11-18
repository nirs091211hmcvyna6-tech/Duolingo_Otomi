<?php
session_start();
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/db.php";
require_once __DIR__ . "/racha_diaria.php";

if (!isset($_SESSION["id_usuario"])) {
    http_response_code(401);
    echo json_encode(["estado" => false, "mensaje" => "Debes iniciar sesión"]);
    exit;
}
$id = (int)$_SESSION["id_usuario"];

$temas = [];
$r = $conn->query("SELECT id, nombre, titulo_ruta, orden_ruta FROM categorias
                   WHERE orden_ruta IS NOT NULL ORDER BY orden_ruta, id");
while ($f = $r->fetch_assoc()) {
    $temas[(int)$f["id"]] = [
        "id" => (int)$f["id"],
        "titulo" => $f["titulo_ruta"] ?: $f["nombre"],
        "niveles" => new stdClass()
    ];
}
$niv = [];
$q = $conn->prepare("SELECT categoria_id, nivel, mejor_errores FROM niveles_completados WHERE id_usuario = ?");
$q->bind_param("i", $id);
$q->execute();
$res = $q->get_result();
while ($f = $res->fetch_assoc()) {
    $niv[(int)$f["categoria_id"]][(int)$f["nivel"]] = (int)$f["mejor_errores"];
}
$q->close();
foreach ($temas as $cid => &$t) {
    $t["niveles"] = isset($niv[$cid]) ? $niv[$cid] : new stdClass();
}
unset($t);

$palabras = [];
$r = $conn->query("SELECT id, categoria_id, espanol, otomi FROM palabras WHERE verificada = 1 ORDER BY id");
while ($f = $r->fetch_assoc()) {
    $palabras[] = ["id" => (int)$f["id"], "categoria" => (int)$f["categoria_id"],
                   "espanol" => $f["espanol"], "otomi" => $f["otomi"]];
}

$p = $conn->prepare("SELECT u.nombre, COALESCE(p.experiencia,0) AS xp, COALESCE(p.racha,0) AS racha, p.ultima_actividad
                     FROM usuarios u LEFT JOIN progreso p ON p.id_usuario = u.Id_usuario WHERE u.Id_usuario = ?");
$p->bind_param("i", $id);
$p->execute();
$u = $p->get_result()->fetch_assoc();
$p->close();

echo json_encode([
    "estado" => true,
    "nombre" => $u["nombre"] ?? "",
    "experiencia" => (int)($u["xp"] ?? 0),
    "racha" => racha_vigente($u["racha"] ?? 0, $u["ultima_actividad"] ?? null),
    "activo_hoy" => ($u["ultima_actividad"] ?? null) === date("Y-m-d"),
    "temas" => array_values($temas),
    "palabras" => $palabras
], JSON_UNESCAPED_UNICODE);
$conn->close();
