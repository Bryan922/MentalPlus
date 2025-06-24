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
            if ($action === 'list') {
                // Pour les clients : voir leurs rendez-vous
                // Pour les employés/admin : voir tous les rendez-vous
                $query = "SELECT a.*, 
                         c.name as client_name, c.email as client_email,
                         e.name as employee_name, e.email as employee_email
                         FROM appointments a
                         LEFT JOIN users c ON a.client_id = c.id
                         LEFT JOIN users e ON a.employee_id = e.id
                         WHERE 1=1";

                $params = [];
                if ($userRole === 'client') {
                    $query .= " AND a.client_id = ?";
                    $params[] = $userId;
                }

                $stmt = $db->prepare($query);
                $stmt->execute($params);
                $appointments = $stmt->fetchAll();

                echo json_encode(['appointments' => $appointments]);
            } elseif ($action === 'availability') {
                $date = $_GET['date'] ?? date('Y-m-d');
                $dayOfWeek = date('w', strtotime($date));

                // Récupérer les disponibilités des employés
                $stmt = $db->prepare("
                    SELECT a.*, u.name as employee_name 
                    FROM availabilities a
                    JOIN users u ON a.employee_id = u.id
                    WHERE a.day_of_week = ? AND a.is_active = TRUE
                ");
                $stmt->execute([$dayOfWeek]);
                $availabilities = $stmt->fetchAll();

                // Récupérer les rendez-vous existants
                $stmt = $db->prepare("
                    SELECT * FROM appointments 
                    WHERE date = ? AND status != 'cancelled'
                ");
                $stmt->execute([$date]);
                $existingAppointments = $stmt->fetchAll();

                echo json_encode([
                    'availabilities' => $availabilities,
                    'existing_appointments' => $existingAppointments
                ]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Vérifier la disponibilité
            $stmt = $db->prepare("
                SELECT COUNT(*) FROM appointments 
                WHERE date = ? AND time = ? 
                AND status != 'cancelled'
            ");
            $stmt->execute([$data['date'], $data['time']]);
            
            if ($stmt->fetchColumn() > 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Créneau déjà pris']);
                exit;
            }

            // Créer le rendez-vous
            $stmt = $db->prepare("
                INSERT INTO appointments (client_id, employee_id, date, time, type, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $userId,
                $data['employee_id'] ?? null,
                $data['date'],
                $data['time'],
                $data['type'],
                $data['notes'] ?? null
            ]);

            $appointmentId = $db->lastInsertId();

            // Créer une notification
            $stmt = $db->prepare("
                INSERT INTO notifications (user_id, type, message)
                VALUES (?, 'appointment_created', ?)
            ");
            $stmt->execute([
                $userId,
                "Rendez-vous créé pour le {$data['date']} à {$data['time']}"
            ]);

            echo json_encode(['id' => $appointmentId, 'message' => 'Rendez-vous créé avec succès']);
            break;

        case 'PUT':
            if (!$action) {
                http_response_code(400);
                echo json_encode(['error' => 'Action requise']);
                exit;
            }

            $appointmentId = $_GET['id'] ?? null;
            if (!$appointmentId) {
                http_response_code(400);
                echo json_encode(['error' => 'ID du rendez-vous requis']);
                exit;
            }

            // Vérifier les droits
            $stmt = $db->prepare("
                SELECT client_id, employee_id FROM appointments WHERE id = ?
            ");
            $stmt->execute([$appointmentId]);
            $appointment = $stmt->fetch();

            if (!$appointment || ($userRole === 'client' && $appointment['client_id'] !== $userId)) {
                http_response_code(403);
                echo json_encode(['error' => 'Non autorisé à modifier ce rendez-vous']);
                exit;
            }

            switch ($action) {
                case 'cancel':
                    $stmt = $db->prepare("
                        UPDATE appointments 
                        SET status = 'cancelled', 
                            updated_at = CURRENT_TIMESTAMP 
                        WHERE id = ?
                    ");
                    $stmt->execute([$appointmentId]);

                    // Notification
                    $stmt = $db->prepare("
                        INSERT INTO notifications (user_id, type, message)
                        VALUES (?, 'appointment_cancelled', ?)
                    ");
                    $stmt->execute([
                        $appointment['client_id'],
                        "Rendez-vous #$appointmentId annulé"
                    ]);

                    echo json_encode(['message' => 'Rendez-vous annulé']);
                    break;

                case 'update':
                    $data = json_decode(file_get_contents('php://input'), true);
                    $updates = [];
                    $params = [];

                    // Construire la requête de mise à jour dynamiquement
                    if (isset($data['date'])) {
                        $updates[] = 'date = ?';
                        $params[] = $data['date'];
                    }
                    if (isset($data['time'])) {
                        $updates[] = 'time = ?';
                        $params[] = $data['time'];
                    }
                    if (isset($data['notes'])) {
                        $updates[] = 'notes = ?';
                        $params[] = $data['notes'];
                    }
                    if (isset($data['status']) && $userRole !== 'client') {
                        $updates[] = 'status = ?';
                        $params[] = $data['status'];
                    }

                    if (empty($updates)) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Aucune donnée à mettre à jour']);
                        exit;
                    }

                    $params[] = $appointmentId;
                    $stmt = $db->prepare("
                        UPDATE appointments 
                        SET " . implode(', ', $updates) . ", 
                            updated_at = CURRENT_TIMESTAMP 
                        WHERE id = ?
                    ");
                    $stmt->execute($params);

                    echo json_encode(['message' => 'Rendez-vous mis à jour']);
                    break;

                default:
                    http_response_code(400);
                    echo json_encode(['error' => 'Action non reconnue']);
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