<?php
require_once '../config.php';

header('Content-Type: application/json');

// Vérifier le token JWT
$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

if (!$token || !($decoded = verifyJWT($token))) {
    http_response_code(401);
    echo json_encode(['error' => 'Non autorisé']);
    exit;
}

$userId = $decoded['userId'];
$userRole = $decoded['role'];
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    $db = getDBConnection();

    switch ($method) {
        case 'GET':
            // Récupérer les notifications non lues
            $stmt = $db->prepare("
                SELECT * FROM notifications 
                WHERE user_id = ? 
                ORDER BY created_at DESC
                LIMIT 50
            ");
            $stmt->execute([$userId]);
            $notifications = $stmt->fetchAll();

            // Compter les notifications non lues
            $stmt = $db->prepare("
                SELECT COUNT(*) FROM notifications 
                WHERE user_id = ? AND is_read = FALSE
            ");
            $stmt->execute([$userId]);
            $unreadCount = $stmt->fetchColumn();

            echo json_encode([
                'notifications' => $notifications,
                'unread_count' => $unreadCount
            ]);
            break;

        case 'PUT':
            if ($action === 'mark-read') {
                $notificationId = $_GET['id'] ?? null;
                
                if ($notificationId) {
                    // Marquer une notification spécifique comme lue
                    $stmt = $db->prepare("
                        UPDATE notifications 
                        SET is_read = TRUE 
                        WHERE id = ? AND user_id = ?
                    ");
                    $stmt->execute([$notificationId, $userId]);
                } else {
                    // Marquer toutes les notifications comme lues
                    $stmt = $db->prepare("
                        UPDATE notifications 
                        SET is_read = TRUE 
                        WHERE user_id = ?
                    ");
                    $stmt->execute([$userId]);
                }

                echo json_encode(['message' => 'Notifications marquées comme lues']);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Action non reconnue']);
            }
            break;

        case 'DELETE':
            $notificationId = $_GET['id'] ?? null;
            if (!$notificationId) {
                http_response_code(400);
                echo json_encode(['error' => 'ID de notification requis']);
                exit;
            }

            // Supprimer la notification
            $stmt = $db->prepare("
                DELETE FROM notifications 
                WHERE id = ? AND user_id = ?
            ");
            $stmt->execute([$notificationId, $userId]);

            echo json_encode(['message' => 'Notification supprimée']);
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