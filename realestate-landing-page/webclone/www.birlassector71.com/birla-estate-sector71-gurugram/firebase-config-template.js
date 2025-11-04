// Firebase Configuration Template for Birla Sector 71 Data Collection Portal
// Replace the placeholder values below with your actual Firebase configuration

class FirebaseConfig {
    constructor() {
        this.config = {
            // Replace these with your actual Firebase config values
            apiKey: "AIzaSyAzhjDSvhUtMKO6ZaONwLjfKveQGuZmqUA",
            authDomain: "realestatetemp.firebaseapp.com",
            projectId: "realestatetemp",
            storageBucket: "realestatetemp.firebasestorage.app",
            messagingSenderId: "79443195851",
            appId: "1:79443195851:web:80a3cf4e2377e7b130e84e",
            measurementId: "G-SCWNX8CK69" // Your app ID
        };
        
        this.isInitialized = false;
        this.db = null;
        this.auth = null;
    }

    // Initialize Firebase with error handling
    async initialize() {
        try {
            // Skip initialization if config has placeholders
            if (!this.isConfigured()) {
                console.warn('Firebase config not set. Skipping Firebase initialization.');
                return false;
            }
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK not loaded');
            }

            // Initialize Firebase (v8 syntax)
            if (!firebase.apps.length) {
                firebase.initializeApp(this.config);
            }
            this.db = firebase.firestore();
            this.auth = firebase.auth();
            this.isInitialized = true;
            
            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            return false;
        }
    }

    // Validate that real Firebase config is present
    isConfigured() {
        const c = this.config || {};
        if (!c.apiKey || c.apiKey === 'your-api-key-here' || c.apiKey.startsWith('AIzaSy...')) return false;
        if (!c.projectId || /your|example|placeholder/i.test(c.projectId)) return false;
        if (!c.appId || /123456789012|abcdef/i.test(c.appId)) return false;
        return true;
    }

    // Get Firestore database instance
    getDatabase() {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }
        return this.db;
    }

    // Get Auth instance
    getAuth() {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }
        return this.auth;
    }
}

// Global Firebase configuration instance
window.FirebaseConfig = new FirebaseConfig();

