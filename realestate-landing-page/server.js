const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8001;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
    '.ico': 'image/x-icon'
};

// Simple traffic logger
function logTraffic(req, res, data) {
    const logDir = path.join(__dirname, 'webclone', 'www.birlassector71.com', 'birla-estate-sector71-gurugram', 'logs');
    const logFile = path.join(logDir, 'traffic_log.json');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Read existing logs
    let logs = [];
    if (fs.existsSync(logFile)) {
        try {
            const content = fs.readFileSync(logFile, 'utf8');
            logs = JSON.parse(content);
        } catch (e) {
            console.log('Error reading log file:', e.message);
        }
    }
    
    // Add new log entry
    const visitorData = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        ip: req.connection.remoteAddress || req.socket.remoteAddress || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown',
        referer: req.headers.referer || 'direct',
        page: data.page || 'unknown',
        action: data.action || 'visit',
        session_id: data.session_id || 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        device_type: data.device_type || 'unknown',
        browser: data.browser || 'unknown'
    };
    
    logs.push(visitorData);
    
    // Keep only last 1000 entries
    if (logs.length > 1000) {
        logs = logs.slice(-1000);
    }
    
    // Save logs
    try {
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    } catch (e) {
        console.log('Error writing log file:', e.message);
    }
    
    return visitorData;
}

// Handle data collection API endpoint
function handleDataCollection(req, res) {
    let body = '';
    
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            
            // Log the collected data
            console.log('Data collected:', {
                timestamp: new Date().toISOString(),
                name: data.name || 'Not provided',
                phone: data.phone || 'Not provided',
                email: data.email || 'Not provided',
                location: data.location || 'Not provided',
                device: data.deviceType || 'unknown',
                ip: req.connection.remoteAddress || 'unknown'
            });
            
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            });
            
            res.end(JSON.stringify({
                status: 'success',
                message: 'Data collected successfully',
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: error.message }));
        }
    });
}

// Handle traffic logging endpoint
function handleTrafficLogging(req, res) {
    let body = '';
    
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        try {
            // Parse form data
            const data = {};
            body.split('&').forEach(pair => {
                const [key, value] = pair.split('=');
                if (key && value) {
                    data[decodeURIComponent(key)] = decodeURIComponent(value);
                }
            });
            
            const visitorData = logTraffic(req, res, data);
            
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            });
            
            res.end(JSON.stringify({
                status: 'success',
                message: 'Traffic logged successfully',
                timestamp: visitorData.timestamp
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: error.message }));
        }
    });
}

// Handle IP check endpoint
function handleIpCheck(req, res) {
    try {
        // Get visitor information
        const visitorInfo = {
            ip: req.connection.remoteAddress || req.socket.remoteAddress || 'unknown',
            timestamp: new Date().toISOString(),
            user_agent: req.headers['user-agent'] || 'unknown',
            referer: req.headers.referer || 'direct',
            language: req.headers['accept-language'] || 'unknown',
            method: req.method || 'unknown',
            protocol: req.httpVersion || 'unknown',
            host: req.headers.host || 'unknown',
            request_uri: req.url || 'unknown'
        };

        // Add forwarded IP if available
        if (req.headers['x-forwarded-for']) {
            const forwardedIps = req.headers['x-forwarded-for'].split(',');
            visitorInfo.forwarded_ip = forwardedIps[0].trim();
        }

        // Add real IP if different
        if (req.headers['x-real-ip']) {
            visitorInfo.real_ip = req.headers['x-real-ip'];
        }

        // Log the request
        console.log('IP Check Request:', {
            timestamp: visitorInfo.timestamp,
            ip: visitorInfo.ip,
            user_agent: visitorInfo.user_agent,
            referer: visitorInfo.referer
        });

        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        
        res.end(JSON.stringify({
            status: 'success',
            data: visitorInfo
        }, null, 2));

    } catch (error) {
        console.error('IP Check Error:', error);
        
        res.writeHead(500, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        
        res.end(JSON.stringify({
            status: 'error',
            message: 'Internal server error',
            timestamp: new Date().toISOString()
        }));
    }
}

// Handle form submissions
function handleFormSubmission(req, res) {
    try {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            console.log('Form submission received:', body);
            
            // Parse form data
            const formData = new URLSearchParams(body);
            const submissionData = {};
            
            for (let [key, value] of formData.entries()) {
                submissionData[key] = value;
            }
            
            // Log the form submission
            console.log('Form submission data:', {
                timestamp: new Date().toISOString(),
                ...submissionData,
                ip: req.connection.remoteAddress || req.socket.remoteAddress
            });
            
            // Redirect to thank you page
            res.writeHead(302, {
                'Location': '/webclone/www.birlassector71.com/birla-estate-sector71-gurugram/thank-you.html',
                'Access-Control-Allow-Origin': '*'
            });
            res.end();
        });
        
    } catch (error) {
        console.error('Form submission error:', error);
        
        res.writeHead(500, {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*'
        });
        
        res.end(`
            <html>
                <body>
                    <h1>Error</h1>
                    <p>There was an error processing your form submission.</p>
                    <a href="/webclone/www.birlassector71.com/birla-estate-sector71-gurugram/index.html">Return to Home</a>
                </body>
            </html>
        `);
    }
}

// Serve static files
function serveStaticFile(req, res, filePath) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }
        
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// Main server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const rawPathname = parsedUrl.pathname;
    const pathname = decodeURIComponent(rawPathname || '/');
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }
    
    // Add CORS headers to all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
        // Handle traffic logging
        if (pathname === '/webclone/www.birlassector71.com/birla-estate-sector71-gurugram/traffic_logger.php') {
            handleTrafficLogging(req, res);
            return;
        }

        // Handle Firebase data collection API
        if (pathname === '/webclone/www.birlassector71.com/birla-estate-sector71-gurugram/api/collect-data') {
            handleDataCollection(req, res);
            return;
        }

        // Handle IP check endpoint
        if (pathname === '/webclone/www.birlassector71.com/birla-estate-sector71-gurugram/ipcheck.php') {
            handleIpCheck(req, res);
            return;
        }

        // Handle form submissions (redirect to thank you page)
        if (pathname === '/webclone/www.birlassector71.com/birla-estate-sector71-gurugram/traffic_logger.php' && req.method === 'POST') {
            handleFormSubmission(req, res);
            return;
        }
    
    // Serve static files
    let filePath = path.join(__dirname, pathname);
    
    // Handle missing images with fallbacks
    if (pathname.includes('.webp') || pathname.includes('.svg') || pathname.includes('.jpg') || pathname.includes('.png')) {
        // Check if image exists, if not serve a placeholder
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                // Serve a placeholder image
                const placeholderSvg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                    <rect width="400" height="300" fill="#f0f0f0"/>
                    <text x="200" y="150" text-anchor="middle" fill="#999" font-family="Arial" font-size="16">Image Not Found</text>
                </svg>`;
                res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
                res.end(placeholderSvg);
                return;
            }
            serveStaticFile(req, res, filePath);
        });
        return;
    }
    
    // If it's a directory, look for index.html
    fs.stat(filePath, (err, stats) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }
        
        if (stats.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }
        
        // Check if file exists
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
                return;
            }
            
            serveStaticFile(req, res, filePath);
        });
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Traffic Dashboard: http://localhost:${PORT}/webclone/www.birlassector71.com/birla-estate-sector71-gurugram/traffic_dashboard.html`);
    console.log(`🏠 Main Website: http://localhost:${PORT}/webclone/index.html`);
});
