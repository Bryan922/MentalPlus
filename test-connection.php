<?php
header('Content-Type: text/html; charset=utf-8');
require_once 'config.php';
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Test de connexion à la base de données</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; }
        .error { color: red; }
        .table { margin: 10px 0; padding: 10px; background: #f5f5f5; }
        .column { margin-left: 20px; }
    </style>
</head>
<body>
    <h1>Test de connexion à la base de données</h1>

    <?php
    try {
        $db = getDBConnection();
        echo '<p class="success">✅ Connexion à la base de données réussie!</p>';

        // Liste des tables
        $query = "SHOW TABLES";
        $stmt = $db->query($query);
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

        echo '<h2>Tables trouvées :</h2>';
        foreach ($tables as $table) {
            echo '<div class="table">';
            echo "<h3>📋 $table</h3>";
            
            // Structure de la table
            $query = "DESCRIBE $table";
            $stmt = $db->query($query);
            $columns = $stmt->fetchAll();
            
            foreach ($columns as $column) {
                echo '<div class="column">';
                echo "• {$column['Field']} ({$column['Type']})";
                if ($column['Key'] === 'PRI') echo " - Clé primaire";
                if ($column['Key'] === 'UNI') echo " - Unique";
                echo '</div>';
            }
            echo '</div>';
        }

    } catch (Exception $e) {
        echo '<p class="error">❌ Erreur : ' . htmlspecialchars($e->getMessage()) . '</p>';
    }
    ?>
</body>
</html> 