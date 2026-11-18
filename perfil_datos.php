<?php
session_start();
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/db.php";
require_once __DIR__ . "/juegos/comun/juegos_db.php";
require_once __DIR__ . "/racha_diaria.php";

if (!isset($_SESSION["id_usuario"])) {
    http_response_code(401);
    echo json_encode(["estado" => false, "mensaje" => "Debes iniciar sesión"]);
    exit;
}

$id = (int)$_SESSION["id_usuario"];

$stmt = $conn->prepare(
    "SELECT u.nombre, u.email, u.pais, u.nivel, u.Fecha_registro, u.foto,
            COALESCE(p.experiencia, 0) AS experiencia,
            COALESCE(p.racha, 0)       AS racha,
            p.ultima_actividad,
            COALESCE(p.porcentaje, 0)  AS porcentaje
     FROM usuarios u
     LEFT JOIN progreso p ON p.id_usuario = u.Id_usuario
     WHERE u.Id_usuario = ?"
);

if (!$stmt) {
    echo json_encode([
        "estado"  => false,
        "mensaje" => "No se pudo leer el perfil. ¿Ejecutaste perfil.sql para crear la columna 'foto'?"
    ]);
    exit;
}

$stmt->bind_param("i", $id);
$stmt->execute();
$u = $stmt->get_result()->fetch_assoc();

if (!$u) {
    echo json_encode(["estado" => false, "mensaje" => "Usuario no encontrado"]);
    exit;
}

$juegos = obtener_stats_juegos($conn, $id);

$niveles = 0;
$n = $conn->prepare("SELECT COUNT(*) AS n FROM niveles_completados WHERE id_usuario = ?");
if ($n) {
    $n->bind_param("i", $id);
    $n->execute();
    $niveles = (int)$n->get_result()->fetch_assoc()["n"];
    $n->close();
}

echo json_encode([
    "estado" => true,
    "nombre" => $u["nombre"],
    "email" => $u["email"],
    "pais" => $u["pais"],
    "nivel" => $u["nivel"],
    "fecha_registro" => $u["Fecha_registro"],
    "foto" => $u["foto"],
    "experiencia" => (int)$u["experiencia"],
    "racha" => racha_vigente($u["racha"], $u["ultima_actividad"]),
    "niveles" => $niveles,
    "porcentaje" => (int)$u["porcentaje"],
    "memorama_ganados" => $juegos["memorama_ganados"],
    "sopa_ganadas" => $juegos["sopa_ganadas"]
]);

$stmt->close();
$conn->close();
