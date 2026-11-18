<?php
session_start();
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/db.php";

function responder($estado, $mensaje, $extra = []) {
    echo json_encode(array_merge(["estado" => $estado, "mensaje" => $mensaje], $extra));
    exit;
}

if (!isset($_SESSION["id_usuario"])) {
    http_response_code(401);
    responder(false, "❌ Debes iniciar sesión");
}
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(false, "❌ Método no permitido");
}

$id = (int)$_SESSION["id_usuario"];
$carpeta = __DIR__ . "/el_Pensadero/perfiles/";
$rutaWeb = "el_Pensadero/perfiles/";
$accion = $_POST["accion"] ?? "subir";

if (!is_dir($carpeta) && !mkdir($carpeta, 0755, true)) {
    responder(false, "❌ No se pudo crear la carpeta de fotos");
}

$fotoAnterior = null;
$q = $conn->prepare("SELECT foto FROM usuarios WHERE Id_usuario = ?");
if (!$q) {
    responder(false, "❌ Falta la columna 'foto'. Ejecuta perfil.sql en tu base de datos.");
}
$q->bind_param("i", $id);
$q->execute();
$fila = $q->get_result()->fetch_assoc();
$fotoAnterior = $fila["foto"] ?? null;
$q->close();

function borrarFoto($carpeta, $ruta) {
    if (!$ruta) return;
    $archivo = $carpeta . basename($ruta);   
    if (is_file($archivo)) @unlink($archivo);
}

if ($accion === "quitar") {
    $u = $conn->prepare("UPDATE usuarios SET foto = NULL WHERE Id_usuario = ?");
    $u->bind_param("i", $id);
    $u->execute();
    borrarFoto($carpeta, $fotoAnterior);
    responder(true, "✅ Foto eliminada", ["foto" => null]);
}

if (!isset($_FILES["foto"]) || $_FILES["foto"]["error"] !== UPLOAD_ERR_OK) {
    $codigo = $_FILES["foto"]["error"] ?? UPLOAD_ERR_NO_FILE;
    if ($codigo === UPLOAD_ERR_INI_SIZE || $codigo === UPLOAD_ERR_FORM_SIZE) {
        responder(false, "❌ La imagen supera el límite del servidor (sube upload_max_filesize en php.ini)");
    }
    responder(false, "❌ No se recibió ninguna imagen");
}

$archivo = $_FILES["foto"];

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime  = $finfo->file($archivo["tmp_name"]);
$permitidos = [
    "image/jpeg" => "jpg",
    "image/png" => "png",
    "image/webp" => "webp"
];
if (!isset($permitidos[$mime]) || @getimagesize($archivo["tmp_name"]) === false) {
    responder(false, "❌ Solo se permiten imágenes JPG, PNG o WEBP");
}

$nombreNuevo = "u" . $id . "_" . bin2hex(random_bytes(8)) . "." . $permitidos[$mime];

if (!move_uploaded_file($archivo["tmp_name"], $carpeta . $nombreNuevo)) {
    responder(false, "❌ No se pudo guardar la imagen en el servidor");
}

$rutaNueva = $rutaWeb . $nombreNuevo;
$u = $conn->prepare("UPDATE usuarios SET foto = ? WHERE Id_usuario = ?");
$u->bind_param("si", $rutaNueva, $id);

if ($u->execute()) {
    borrarFoto($carpeta, $fotoAnterior);
    responder(true, "✅ Foto actualizada", ["foto" => $rutaNueva]);
}

@unlink($carpeta . $nombreNuevo);
responder(false, "❌ No se pudo guardar la foto en la base de datos");
