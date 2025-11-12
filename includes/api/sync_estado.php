<?php
// includes/api/sync_estado.php
include('../../db_config.php');
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['jogador_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Payload inválido']);
    exit;
}

$jogador_id = $input['jogador_id'];
$tentativas = intval($input['tentativas'] ?? 0);
$estado = mysqli_real_escape_string($conn, json_encode($input['estado']));
$timestamp = time();

// Cria tabela se não existir
$sql = "CREATE TABLE IF NOT EXISTS estado_jogo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jogador_id VARCHAR(50) UNIQUE,
    estado_json TEXT,
    tentativas INT,
    atualizado_em INT
)";
mysqli_query($conn, $sql);

// Verifica se jogador já existe
$check = mysqli_query($conn, "SELECT * FROM estado_jogo WHERE jogador_id='$jogador_id'");
if (mysqli_num_rows($check) > 0) {
    $sql = "UPDATE estado_jogo SET estado_json='$estado', tentativas=$tentativas, atualizado_em=$timestamp WHERE jogador_id='$jogador_id'";
} else {
    $sql = "INSERT INTO estado_jogo (jogador_id, estado_json, tentativas, atualizado_em)
            VALUES ('$jogador_id', '$estado', $tentativas, $timestamp)";
}

if (mysqli_query($conn, $sql)) {
    echo json_encode(['status' => 'ok', 'timestamp' => $timestamp]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao salvar estado']);
}
?>
