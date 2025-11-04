<?php
/**
 * IP Check Endpoint
 * Returns visitor IP and basic information
 * 
 * Security: Input validation, rate limiting, and sanitized output
 * Performance: Lightweight response, minimal processing
 * Maintainability: Clear error handling and logging
 */

// Set proper headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Rate limiting (simple implementation)
$client_ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rate_limit_file = __DIR__ . '/logs/rate_limit.json';

// Create logs directory if it doesn't exist
$logs_dir = __DIR__ . '/logs';
if (!is_dir($logs_dir)) {
    mkdir($logs_dir, 0755, true);
}

// Check rate limit (max 10 requests per minute per IP)
$rate_limits = [];
if (file_exists($rate_limit_file)) {
    $rate_limits = json_decode(file_get_contents($rate_limit_file), true) ?: [];
}

$current_time = time();
$minute_ago = $current_time - 60;

// Clean old entries
foreach ($rate_limits as $ip => $timestamps) {
    $rate_limits[$ip] = array_filter($timestamps, function($timestamp) use ($minute_ago) {
        return $timestamp > $minute_ago;
    });
    if (empty($rate_limits[$ip])) {
        unset($rate_limits[$ip]);
    }
}

// Check if IP is rate limited
if (isset($rate_limits[$client_ip]) && count($rate_limits[$client_ip]) >= 10) {
    http_response_code(429);
    echo json_encode([
        'error' => 'Rate limit exceeded',
        'retry_after' => 60
    ]);
    exit();
}

// Add current request to rate limit
$rate_limits[$client_ip][] = $current_time;
file_put_contents($rate_limit_file, json_encode($rate_limits));

try {
    // Get visitor information
    $visitor_info = [
        'ip' => $client_ip,
        'timestamp' => date('c'),
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'referer' => $_SERVER['HTTP_REFERER'] ?? 'direct',
        'language' => $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? 'unknown',
        'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
        'protocol' => $_SERVER['SERVER_PROTOCOL'] ?? 'unknown',
        'host' => $_SERVER['HTTP_HOST'] ?? 'unknown',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown'
    ];

    // Add forwarded IP if available (for proxy scenarios)
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $forwarded_ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        $visitor_info['forwarded_ip'] = trim($forwarded_ips[0]);
    }

    // Add real IP if different from REMOTE_ADDR
    if (isset($_SERVER['HTTP_X_REAL_IP'])) {
        $visitor_info['real_ip'] = $_SERVER['HTTP_X_REAL_IP'];
    }

    // Log the request for analytics
    $log_entry = [
        'timestamp' => $visitor_info['timestamp'],
        'ip' => $client_ip,
        'user_agent' => $visitor_info['user_agent'],
        'referer' => $visitor_info['referer'],
        'endpoint' => 'ipcheck.php'
    ];

    $log_file = $logs_dir . '/ipcheck_requests.json';
    $logs = [];
    if (file_exists($log_file)) {
        $logs = json_decode(file_get_contents($log_file), true) ?: [];
    }
    
    $logs[] = $log_entry;
    
    // Keep only last 1000 entries
    if (count($logs) > 1000) {
        $logs = array_slice($logs, -1000);
    }
    
    file_put_contents($log_file, json_encode($logs, JSON_PRETTY_PRINT));

    // Return success response
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'data' => $visitor_info
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    // Log error
    error_log("IP Check Error: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal server error',
        'timestamp' => date('c')
    ]);
}
?>

