<?php
session_start();
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/db.php";

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) {
    $data = $_POST;
}

function campo($data, ...$claves) {
    foreach ($claves as $k) {
        if (isset($data[$k]) && trim($data[$k]) !== "") return trim($data[$k]);
    }
    return "";
}

$nombre = campo($data, "nombre", "Nombre");
$email = campo($data, "email", "Email");
$contrasena = campo($data, "contrasena", "Contrasena");
$fecha_nac = campo($data, "fecha_nac", "Fecha_nac");
$pais = campo($data, "pais", "Pais");
$nivel = campo($data, "nivel", "Nivel") ?: "basico";

if ($nombre === "" || $email === "" || $contrasena === "" || $fecha_nac === "" || $pais === "") {
    echo json_encode(["estado" => false, "mensaje" => "❌ Faltan datos obligatorios"]);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["estado" => false, "mensaje" => "❌ Email no válido"]);
    exit;
}
if (strlen($contrasena) < 6) {
    echo json_encode(["estado" => false, "mensaje" => "❌ La contraseña debe tener al menos 6 caracteres"]);
    exit;
}

$chk = $conn->prepare("SELECT Id_usuario FROM usuarios WHERE email = ?");
$chk->bind_param("s", $email);
$chk->execute();
$chk->store_result();
if ($chk->num_rows > 0) {
    echo json_encode(["estado" => false, "mensaje" => "❌ Ese email ya está registrado"]);
    exit;
}
$chk->close();

$hash = password_hash($contrasena, PASSWORD_DEFAULT);
$fecha_registro = date("Y-m-d");

$stmt = $conn->prepare(
    "INSERT INTO usuarios (nombre, email, contrasena, Fecha_registro, fecha_nac, pais, nivel)
     VALUES (?,?,?,?,?,?,?)"
);
$stmt->bind_param("sssssss", $nombre, $email, $hash, $fecha_registro, $fecha_nac, $pais, $nivel);

if ($stmt->execute()) {
    $idNuevo = $conn->insert_id;

    $p = $conn->prepare("INSERT INTO progreso (id_usuario, experiencia, racha, porcentaje) VALUES (?, 0, 0, 0)");
    if ($p) {
        $p->bind_param("i", $idNuevo);
        $p->execute();
        $p->close();
    }

    session_regenerate_id(true);
    $_SESSION["id_usuario"] = $idNuevo;
    $_SESSION["nombre"] = $nombre;
    $_SESSION["nivel"]  = $nivel;

    echo json_encode([
        "estado" => true,
        "mensaje" => "✅ Usuario registrado correctamente",
        "redirect" => "conoce_san_nicolas.html"
    ]);
} else {
    $error = $stmt->error;
    $r = $conn->query("SELECT COALESCE(MAX(Id_usuario), 0) + 1 AS siguiente FROM usuarios");
    if ($r) {
        $sig = (int)$r->fetch_assoc()["siguiente"];
        $conn->query("ALTER TABLE usuarios AUTO_INCREMENT = " . $sig);
    }
    echo json_encode(["estado" => false, "mensaje" => "❌ Error al registrar usuario: " . $error]);
}

$stmt->close();
$conn->close();