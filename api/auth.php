<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit();
}

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents('php://input'), true);

try {
    $db = getDBConnection();
    
    switch ($action) {
        case 'login':
            handleLogin($db, $data);
            break;
            
        case 'register':
            handleRegister($db, $data);
            break;
            
        case 'admin-login':
            handleAdminLogin($db, $data);
            break;
            
        case 'forgot-password':
            handleForgotPassword($db, $data);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Action non valide']);
            exit();
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur: ' . $e->getMessage()]);
    exit();
}

function handleLogin($db, $data) {
    if (!isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email et mot de passe requis']);
        return;
    }

    $stmt = $db->prepare('SELECT id, name, email, password_hash, role FROM users WHERE email = ? AND is_active = 1');
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($data['password'], $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Email ou mot de passe incorrect']);
        return;
    }

    // Mise à jour de la dernière connexion
    $stmt = $db->prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    $stmt->execute([$user['id']]);

    // Génération du token JWT
    $token = generateJWT([
        'user_id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role']
    ]);

    echo json_encode([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role']
        ]
    ]);
}

function handleRegister($db, $data) {
    if (!isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Tous les champs sont requis']);
        return;
    }

    // Validation de l'email
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Email invalide']);
        return;
    }

    // Vérification si l'email existe déjà
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$data['email']]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Cet email est déjà utilisé']);
        return;
    }

    // Hashage du mot de passe
    $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);

    // Insertion du nouvel utilisateur
    $stmt = $db->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, "client")');
    $success = $stmt->execute([$data['name'], $data['email'], $password_hash]);

    if (!$success) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de la création du compte']);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Compte créé avec succès'
    ]);
}

function handleAdminLogin($db, $data) {
    if (!isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email et mot de passe requis']);
        return;
    }

    $stmt = $db->prepare('SELECT id, name, email, password_hash FROM users WHERE email = ? AND role = "admin" AND is_active = 1');
    $stmt->execute([$data['email']]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin || !password_verify($data['password'], $admin['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Accès non autorisé']);
        return;
    }

    // Mise à jour de la dernière connexion
    $stmt = $db->prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    $stmt->execute([$admin['id']]);

    // Génération du token JWT avec droits admin
    $token = generateJWT([
        'user_id' => $admin['id'],
        'email' => $admin['email'],
        'role' => 'admin'
    ]);

    echo json_encode([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => $admin['id'],
            'name' => $admin['name'],
            'email' => $admin['email'],
            'role' => 'admin'
        ]
    ]);
}

function handleForgotPassword($db, $data) {
    if (!isset($data['email'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email requis']);
        return;
    }

    $stmt = $db->prepare('SELECT id, name FROM users WHERE email = ? AND is_active = 1');
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'Aucun compte trouvé avec cet email']);
        return;
    }

    // Génération d'un token de réinitialisation
    $reset_token = bin2hex(random_bytes(32));
    $expires_at = date('Y-m-d H:i:s', strtotime('+1 hour'));

    $stmt = $db->prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)');
    $success = $stmt->execute([$user['id'], $reset_token, $expires_at]);

    if (!$success) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de la génération du token de réinitialisation']);
        return;
    }

    // TODO: Envoyer l'email avec le lien de réinitialisation
    // Pour l'instant, on simule l'envoi
    $reset_link = "https://mentalserenity.fr/reset-password.html?token=" . $reset_token;

    echo json_encode([
        'success' => true,
        'message' => 'Instructions envoyées par email'
    ]);
}

function generateJWT($payload) {
    $key = JWT_SECRET;
    $issuedAt = time();
    $expire = $issuedAt + SESSION_LIFETIME;

    $token = [
        'iat' => $issuedAt,
        'exp' => $expire,
        'data' => $payload
    ];

    return JWT::encode($token, $key, 'HS256');
} 