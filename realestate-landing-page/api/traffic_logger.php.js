// Vercel Serverless Function for Traffic Logger
// Handles both GET (read logs) and POST (write logs) requests
// Uses Firestore for data storage (if configured) or returns empty data

let admin = null;
let db = null;

// Try to initialize Firebase Admin (only if credentials are available)
try {
  admin = require('firebase-admin');
  
  if (!admin.apps.length) {
    // Only initialize if we have the required environment variables
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || "birlasec71-b4831",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      db = admin.firestore();
      console.log('Firebase Admin initialized successfully');
    } else {
      console.log('Firebase Admin credentials not configured, using fallback mode');
    }
  } else {
    db = admin.firestore();
  }
} catch (error) {
  console.log('Firebase Admin not available, using fallback mode:', error.message);
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Handle GET request - return traffic logs from Firestore
    if (req.method === 'GET') {
      if (db) {
        try {
          const snapshot = await db.collection('traffic_logs')
            .orderBy('timestamp', 'desc')
            .limit(1000)
            .get();

          const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          res.status(200).json({
            status: 'success',
            data: logs
          });
          return;
        } catch (error) {
          console.error('Error reading from Firestore:', error);
          // Fall through to return empty array
        }
      }
      
      // Fallback: return empty array if Firestore not available
      res.status(200).json({
        status: 'success',
        data: [],
        message: 'Firestore not configured. Please use Firebase dashboard or configure Firebase Admin credentials.'
      });
      return;
    }

    // Handle POST request - save traffic log to Firestore
    if (req.method === 'POST') {
      // Parse form data or JSON
      let data = {};
      
      if (req.headers['content-type']?.includes('application/json')) {
        data = req.body;
      } else {
        // Parse URL-encoded form data
        const body = typeof req.body === 'string' ? req.body : '';
        body.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key && value) {
            data[decodeURIComponent(key)] = decodeURIComponent(value);
          }
        });
      }

      // Get IP address from request
      const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
                 req.headers['x-real-ip'] || 
                 req.connection?.remoteAddress || 
                 'unknown';

      // Create log entry
      const logEntry = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        ip: ip,
        user_agent: req.headers['user-agent'] || 'unknown',
        referer: req.headers.referer || 'direct',
        page: data.page || 'unknown',
        action: data.action || 'visit',
        session_id: data.session_id || data.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        device_type: data.device_type || data.deviceType || 'unknown',
        browser: data.browser || 'unknown'
      };

      // Save to Firestore if available
      if (db) {
        try {
          await db.collection('traffic_logs').add(logEntry);
          res.status(200).json({
            status: 'success',
            message: 'Traffic logged successfully',
            timestamp: logEntry.timestamp
          });
          return;
        } catch (error) {
          console.error('Error saving to Firestore:', error);
          // Fall through to return success anyway (data will be lost but request won't fail)
        }
      }
      
      // If Firestore not available, still return success
      // Note: Data will not be persisted. Configure Firebase Admin credentials to enable persistence.
      res.status(200).json({
        status: 'success',
        message: 'Traffic logged (not persisted - Firestore not configured)',
        timestamp: logEntry.timestamp,
        warning: 'Firestore not configured. Data not persisted. Please configure Firebase Admin credentials or use client-side Firestore writes.'
      });
      return;
    }

    // Method not allowed
    res.status(405).json({
      status: 'error',
      message: 'Method not allowed'
    });

  } catch (error) {
    console.error('Traffic logger error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
}

