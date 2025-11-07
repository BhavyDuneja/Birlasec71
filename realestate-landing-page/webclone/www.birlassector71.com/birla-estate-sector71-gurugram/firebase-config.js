// Firebase Configuration for Birla Sector 71 Data Collection Portal
// CTO Principle: Centralized configuration with environment-based settings

class FirebaseConfig {
    constructor() {
        this.config = {
            apiKey: "AIzaSyClHvNT6jLUxs7ZwANuQ27VEfqMbCBf2_M",
            authDomain: "birlasec71-b4831.firebaseapp.com",
            projectId: "birlasec71-b4831",
            storageBucket: "birlasec71-b4831.firebasestorage.app",
            messagingSenderId: "824026476319",
            appId: "1:824026476319:web:3be39b714b957e0cc38a2a",
            measurementId: "G-0PN2CJXP4J"
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
