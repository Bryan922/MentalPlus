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
            if ($action === 'conversations') {
                // Récupérer la liste des conversations
                $stmt = $db->prepare("
                    SELECT DISTINCT 
                        CASE 
                            WHEN sender_id = ? THEN receiver_id 
                            ELSE sender_id 
                        END as other_user_id,
                        u.name as other_user_name,
                        u.role as other_user_role,
                        (
                            SELECT content 
                            FROM messages m2 
                            WHERE (
                                (m2.sender_id = m1.sender_id AND m2.receiver_id = m1.receiver_id)
                                OR 
                                (m2.sender_id = m1.receiver_id AND m2.receiver_id = m1.sender_id)
                            )
                            ORDER BY m2.created_at DESC 
                            LIMIT 1
                        ) as last_message,
                        (
                            SELECT created_at 
                            FROM messages m2 
                            WHERE (
                                (m2.sender_id = m1.sender_id AND m2.receiver_id = m1.receiver_id)
                                OR 
                                (m2.sender_id = m1.receiver_id AND m2.receiver_id = m1.sender_id)
                            )
                            ORDER BY m2.created_at DESC 
                            LIMIT 1
                        ) as last_message_date,
                        (
                            SELECT COUNT(*) 
                            FROM messages m2 
                            WHERE m2.receiver_id = ? 
                            AND m2.sender_id = other_user_id
                            AND m2.is_read = FALSE
                        ) as unread_count
                    FROM messages m1
                    JOIN users u ON u.id = CASE 
                        WHEN sender_id = ? THEN receiver_id 
                        ELSE sender_id 
                    END
                    WHERE ? IN (sender_id, receiver_id)
                    GROUP BY other_user_id
                    ORDER BY last_message_date DESC
                ");
                $stmt->execute([$userId, $userId, $userId, $userId]);
                echo json_encode(['conversations' => $stmt->fetchAll()]);
            } elseif ($action === 'messages') {
                $otherId = $_GET['user_id'] ?? null;
                if (!$otherId) {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID de l\'autre utilisateur requis']);
                    exit;
                }

                // Marquer les messages comme lus
                $stmt = $db->prepare("
                    UPDATE messages 
                    SET is_read = TRUE 
                    WHERE receiver_id = ? AND sender_id = ?
                ");
                $stmt->execute([$userId, $otherId]);

                // Récupérer les messages
                $stmt = $db->prepare("
                    SELECT m.*, 
                           s.name as sender_name,
                           r.name as receiver_name
                    FROM messages m
                    JOIN users s ON m.sender_id = s.id
                    JOIN users r ON m.receiver_id = r.id
                    WHERE (
                        (sender_id = ? AND receiver_id = ?)
                        OR 
                        (sender_id = ? AND receiver_id = ?)
                    )
                    ORDER BY created_at ASC
                ");
                $stmt->execute([$userId, $otherId, $otherId, $userId]);
                echo json_encode(['messages' => $stmt->fetchAll()]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['receiver_id']) || !isset($data['content'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Destinataire et contenu requis']);
                exit;
            }

            // Vérifier que le destinataire existe
            $stmt = $db->prepare("SELECT id FROM users WHERE id = ? AND is_active = TRUE");
            $stmt->execute([$data['receiver_id']]);
            if (!$stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Destinataire non trouvé']);
                exit;
            }

            // Envoyer le message
            $stmt = $db->prepare("
                INSERT INTO messages (sender_id, receiver_id, content)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([
                $userId,
                $data['receiver_id'],
                sanitize($data['content'])
            ]);

            $messageId = $db->lastInsertId();

            // Créer une notification
            $stmt = $db->prepare("
                INSERT INTO notifications (user_id, type, message)
                VALUES (?, 'new_message', ?)
            ");
            $stmt->execute([
                $data['receiver_id'],
                "Nouveau message reçu"
            ]);

            echo json_encode([
                'id' => $messageId,
                'message' => 'Message envoyé avec succès'
            ]);
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