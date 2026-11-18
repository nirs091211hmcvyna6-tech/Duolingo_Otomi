<?php
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/db.php";

$letras = [];
$r = $conn->query("SELECT id, tipo, letra, orden FROM letras ORDER BY orden");
if ($r) {
    while ($f = $r->fetch_assoc()) {
        $letras[] = ["id" => (int)$f["id"], "tipo" => $f["tipo"], "letra" => $f["letra"], "orden" => (int)$f["orden"]];
    }
}

$palabras = [];
$r = $conn->query(
    "SELECT p.id, p.espanol, p.otomi, c.nombre AS categoria
     FROM palabras p LEFT JOIN categorias c ON c.id = p.categoria_id
     WHERE p.verificada = 1 ORDER BY p.id"
);
if ($r) {
    while ($f = $r->fetch_assoc()) {
        $palabras[] = ["id" => (int)$f["id"], "espanol" => $f["espanol"], "otomi" => $f["otomi"], "categoria" => $f["categoria"]];
    }
}

if (!$letras) {
    echo json_encode(["estado" => false, "mensaje" => "No hay letras en la base de datos"]);
} else {
    echo json_encode(["estado" => true, "letras" => $letras, "palabras" => $palabras], JSON_UNESCAPED_UNICODE);
}
$conn->close();
