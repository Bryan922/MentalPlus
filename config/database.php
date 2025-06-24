<?php
// Configuration de la base de données
define('DB_HOST', 'localhost');     // À remplacer par l'hôte OVH
define('DB_NAME', 'mentalserenity'); // Nom de la base de données
define('DB_USER', 'user');          // À remplacer par votre utilisateur OVH
define('DB_PASS', 'password');      // À remplacer par votre mot de passe OVH

// Configuration de la sécurité
define('JWT_SECRET', 'votre_secret_jwt'); // À remplacer par une clé secrète forte
define('SESSION_LIFETIME', 3600); // Durée de vie de la session en secondes (1 heure)

// Gestion des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/error.log');

// Fonction de connexion à la base de données
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
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

// Création du dossier logs s'il n'existe pas
if (!file_exists(__DIR__ . '/../logs')) {
    mkdir(__DIR__ . '/../logs', 0755, true);
}

// Vérification de la connexion à la base de données au démarrage
try {
    $db = getDBConnection();
    error_log("Connexion à la base de données établie avec succès");
} catch (Exception $e) {
    error_log("ERREUR CRITIQUE: Impossible de se connecter à la base de données");
    die("Erreur de configuration. Veuillez contacter l'administrateur.");
} 