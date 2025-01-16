<?php
// Configuration de la base de données
define('DB_HOST', 'roundhouse.proxy.rlwy.net');
define('DB_NAME', 'railway');
define('DB_USER', 'root');
define('DB_PASS', 'zNURSRiiQFPslwkOKbdDNOOwfjgojCPe');
define('DB_PORT', '16051');

// Configuration du site
define('SITE_URL', 'https://mentalserenity.fr');
define('UPLOAD_DIR', '/uploads');

// Configuration de la sécurité
define('JWT_SECRET', 'votre_secret_jwt'); // À remplacer par une clé secrète forte
define('SESSION_LIFETIME', 3600); // Durée de vie de la session en secondes

// Gestion des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/error.log');

// Fonction de connexion à la base de données
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        error_log("Erreur de connexion à la base de données: " . $e->getMessage());
        throw new Exception("Erreur de connexion à la base de données");
    }
}

// Fonction pour sécuriser les entrées
function sanitize($input) {
    if (is_array($input)) {
        return array_map('sanitize', $input);
    }
    return htmlspecialchars(strip_tags($input), ENT_QUOTES, 'UTF-8');
}

// Fonction pour générer un token JWT
function generateJWT($userId, $role) {
    $issuedAt = time();
    $expire = $issuedAt + SESSION_LIFETIME;

    $payload = [
        'iat' => $issuedAt,
        'exp' => $expire,
        'userId' => $userId,
        'role' => $role
    ];

    return jwt_encode($payload, JWT_SECRET);
}

// Fonction pour vérifier un token JWT
function verifyJWT($token) {
    try {
        $decoded = jwt_decode($token, JWT_SECRET);
        return $decoded;
    } catch (Exception $e) {
        return false;
    }
} 