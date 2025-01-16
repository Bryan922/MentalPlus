<?php
require_once '../config.php';

header('Content-Type: application/json');

// Récupérer la méthode HTTP et l'action
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    $db = getDBConnection();

    switch ($method) {
        case 'POST':
            switch ($action) {
                case 'register':
                    // Récupérer les données du formulaire
                    $data = json_decode(file_get_contents('php://input'), true);
                    $name = sanitize($data['name']);
                    $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
                    $password = $data['password'];

                    // Vérifier si l'email existe déjà
                    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
                    $stmt->execute([$email]);
                    if ($stmt->fetch()) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Cet email est déjà utilisé']);
                        exit;
                    }

                    // Hasher le mot de passe
                    $password_hash = password_hash($password, PASSWORD_DEFAULT);

                    // Insérer l'utilisateur
                    $stmt = $db->prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'client')");
                    $stmt->execute([$name, $email, $password_hash]);

                    $userId = $db->lastInsertId();
                    $token = generateJWT($userId, 'client');

                    echo json_encode([
                        'token' => $token,
                        'user' => [
                            'id' => $userId,
                            'name' => $name,
                            'email' => $email,
                            'role' => 'client'
                        ]
                    ]);
                    break;

                case 'login':
                    $data = json_decode(file_get_contents('php://input'), true);
                    $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
                    $password = $data['password'];

                    // Récupérer l'utilisateur
                    $stmt = $db->prepare("SELECT id, name, email, password_hash, role FROM users WHERE email = ? AND is_active = TRUE");
                    $stmt->execute([$email]);
                    $user = $stmt->fetch();

                    if (!$user || !password_verify($password, $user['password_hash'])) {
                        http_response_code(401);
                        echo json_encode(['error' => 'Email ou mot de passe incorrect']);
                        exit;
                    }

                    // Mettre à jour la dernière connexion
                    $stmt = $db->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?");
                    $stmt->execute([$user['id']]);

                    $token = generateJWT($user['id'], $user['role']);

                    echo json_encode([
                        'token' => $token,
                        'user' => [
                            'id' => $user['id'],
                            'name' => $user['name'],
                            'email' => $user['email'],
                            'role' => $user['role']
                        ]
                    ]);
                    break;

                default:
                    http_response_code(404);
                    echo json_encode(['error' => 'Action non trouvée']);
                    break;
            }
            break;

        case 'GET':
            switch ($action) {
                case 'verify':
                    $headers = getallheaders();
                    $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

                    if (!$token) {
                        http_response_code(401);
                        echo json_encode(['error' => 'Token manquant']);
                        exit;
                    }

                    $decoded = verifyJWT($token);
                    if (!$decoded) {
                        http_response_code(401);
                        echo json_encode(['error' => 'Token invalide']);
                        exit;
                    }

                    // Récupérer les informations de l'utilisateur
                    $stmt = $db->prepare("SELECT id, name, email, role FROM users WHERE id = ? AND is_active = TRUE");
                    $stmt->execute([$decoded['userId']]);
                    $user = $stmt->fetch();

                    if (!$user) {
                        http_response_code(401);
                        echo json_encode(['error' => 'Utilisateur non trouvé']);
                        exit;
                    }

                    echo json_encode(['user' => $user]);
                    break;

                default:
                    http_response_code(404);
                    echo json_encode(['error' => 'Action non trouvée']);
                    break;
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
            break;
    }
} catch (Exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Une erreur est survenue']);
} 