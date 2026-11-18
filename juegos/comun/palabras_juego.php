<?php
/* Entrega las palabras verificadas (español ↔ otomí) para los juegos. */
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/../../db.php";

$cats = [];
$r = $conn->query("SELECT id, nombre FROM categorias ORDER BY orden");
if ($r) {
    while ($f = $r->fetch_assoc()) {
        $cats[] = ["id" => (int)$f["id"], "nombre" => $f["nombre"]];
    }
}

$palabras = [];
$r = $conn->query("SELECT id, categoria_id, espanol, otomi FROM palabras WHERE verificada = 1 ORDER BY id");
if ($r) {
    while ($f = $r->fetch_assoc()) {
        $palabras[] = [
            "id"        => (int)$f["id"],
            "categoria" => (int)$f["categoria_id"],
            "espanol"   => $f["espanol"],
            "otomi"     => $f["otomi"]
        ];
    }
}

echo json_encode(["estado" => true, "categorias" => $cats, "palabras" => $palabras], JSON_UNESCAPED_UNICODE);
$conn->close();
