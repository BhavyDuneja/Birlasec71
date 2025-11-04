<?php
// Traffic Logger for Birla Sector 71 Website
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Create logs directory if it doesn't exist
$logDir = __DIR__ . '/logs';
if (!file_exists($logDir)) {
    mkdir($logDir, 0755, true);
}

$logFile = $logDir . '/traffic_log.json';

// Get visitor data
$visitorData = [
    'timestamp' => date('Y-m-d H:i:s'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
    'referer' => $_SERVER['HTTP_REFERER'] ?? 'direct',
    'page' => $_POST['page'] ?? 'unknown',
    'action' => $_POST['action'] ?? 'visit',
    'session_id' => $_POST['session_id'] ?? uniqid(),
    'device_type' => $_POST['device_type'] ?? 'unknown',
    'browser' => $_POST['browser'] ?? 'unknown'
];

// Read existing logs
$logs = [];
if (file_exists($logFile)) {
    $content = file_get_contents($logFile);
    $logs = json_decode($content, true) ?: [];
}

// Add new log entry
$logs[] = $visitorData;

// Keep only last 1000 entries to prevent file from growing too large
if (count($logs) > 1000) {
    $logs = array_slice($logs, -1000);
}

// Save logs
file_put_contents($logFile, json_encode($logs, JSON_PRETTY_PRINT));

// Return success response
echo json_encode([
    'status' => 'success',
    'message' => 'Traffic logged successfully',
    'timestamp' => $visitorData['timestamp']
]);
?>

