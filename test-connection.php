<?php
require_once __DIR__ . '/config/database.php';

header('Content-Type: text/html; charset=utf-8');

try {
    // Test de la connexion
    $db = getDBConnection();
    echo "<h2 style='color: green;'>✅ Connexion à la base de données réussie</h2>";

    // Récupération de la structure des tables
    $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<h3>Tables dans la base de données :</h3>";
    echo "<ul>";
    foreach ($tables as $table) {
        echo "<li><strong>$table</strong>";
        
        // Structure de la table
        $columns = $db->query("SHOW COLUMNS FROM $table")->fetchAll(PDO::FETCH_ASSOC);
        echo "<ul>";
        foreach ($columns as $column) {
            $nullable = $column['Null'] === 'YES' ? '(nullable)' : '(required)';
            $default = $column['Default'] ? " default: {$column['Default']}" : '';
            $key = $column['Key'] ? " [{$column['Key']}]" : '';
            
            echo "<li>{$column['Field']} - {$column['Type']} $nullable$default$key</li>";
        }
        echo "</ul></li>";
    }
    echo "</ul>";

    // Test des requêtes préparées
    $stmt = $db->prepare("SELECT 1");
    $stmt->execute();
    echo "<p style='color: green;'>✅ Les requêtes préparées fonctionnent correctement</p>";

    // Test du jeu de caractères
    $charset = $db->query("SHOW VARIABLES LIKE 'character_set_database'")->fetch();
    echo "<p>Jeu de caractères de la base : {$charset['Value']}</p>";

    // Test des droits utilisateur
    $grants = $db->query("SHOW GRANTS")->fetchAll(PDO::FETCH_COLUMN);
    echo "<h3>Droits de l'utilisateur :</h3>";
    echo "<ul>";
    foreach ($grants as $grant) {
        echo "<li>" . htmlspecialchars($grant) . "</li>";
    }
    echo "</ul>";

} catch (Exception $e) {
    echo "<h2 style='color: red;'>❌ Erreur de connexion à la base de données</h2>";
    echo "<p>Message d'erreur : " . htmlspecialchars($e->getMessage()) . "</p>";
    
    // Vérification des paramètres de connexion
    echo "<h3>Vérification de la configuration :</h3>";
    echo "<ul>";
    echo "<li>Hôte : " . (defined('DB_HOST') ? DB_HOST : 'Non défini') . "</li>";
    echo "<li>Base de données : " . (defined('DB_NAME') ? DB_NAME : 'Non définie') . "</li>";
    echo "<li>Utilisateur : " . (defined('DB_USER') ? DB_USER : 'Non défini') . "</li>";
    echo "<li>Mot de passe : " . (defined('DB_PASS') ? '******' : 'Non défini') . "</li>";
    echo "</ul>";
    
    // Vérification de l'extension PDO
    echo "<h3>Vérification de PDO :</h3>";
    echo "<ul>";
    echo "<li>Extension PDO : " . (extension_loaded('pdo') ? '✅ Installée' : '❌ Non installée') . "</li>";
    echo "<li>Driver MySQL : " . (in_array('mysql', PDO::getAvailableDrivers()) ? '✅ Installé' : '❌ Non installé') . "</li>";
    echo "</ul>";
}

// Affichage des erreurs PHP pour le débogage
echo "<h3>Configuration PHP :</h3>";
echo "<ul>";
echo "<li>Version PHP : " . phpversion() . "</li>";
echo "<li>Display Errors : " . ini_get('display_errors') . "</li>";
echo "<li>Error Reporting : " . error_reporting() . "</li>";
echo "<li>Error Log : " . ini_get('error_log') . "</li>";
echo "</ul>"; 