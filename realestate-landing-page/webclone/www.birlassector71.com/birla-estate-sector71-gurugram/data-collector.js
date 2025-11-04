// Comprehensive Data Collection System for Birla Sector 71
// CTO Principle: Separation of concerns with clear data collection strategies

class DataCollector {
    constructor() {
        this.firebaseConfig = null;
        this.db = null;
        this.collectionName = 'birla_sector71_visitors';
        this.sessionId = this.generateSessionId();
        this.visitorData = this.initializeVisitorData();
        this.consentGiven = false;
        
        this.init();
    }

    // Initialize data collector
    async init() {
        // Wait for Firebase to load
        await this.waitForFirebase();
        
        // Initialize Firebase
        this.firebaseConfig = window.FirebaseConfig;
        const initialized = await this.firebaseConfig.initialize();
        
        if (initialized) {
            this.db = this.firebaseConfig.getDatabase();
            console.log('Data Collector initialized with Firebase');
        } else {
            console.warn('Firebase not available, using local storage fallback');
        }

        // Set up data collection methods
        // Cookie consent removed per requirement; ensure any old consent is cleared
        this.removeConsentArtifacts();
        // Proceed without cookie consent – only collect name and phone
        this.consentGiven = true;
        this.setupFormTracking();
        this.setupBehaviorTracking();
        // Track one page view so visitor count increases
        this.trackPageView();
        // Do not track geolocation
        this.setupPhoneNumberDetection();
    }

    // Wait for Firebase SDK to load
    waitForFirebase() {
        return new Promise((resolve) => {
            if (typeof firebase !== 'undefined') {
                resolve();
            } else {
                const checkFirebase = setInterval(() => {
                    if (typeof firebase !== 'undefined') {
                        clearInterval(checkFirebase);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    // Generate unique session ID
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Initialize visitor data structure
    initializeVisitorData() {
        return {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            ip: this.getClientIP(),
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            deviceType: this.detectDeviceType(),
            browser: this.detectBrowser(),
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            // Data collection fields
            name: null,
            phone: null,
            email: null,
            // Do not store location
            location: null,
            source: 'direct',
            interests: [],
            behavior: {
                pageViews: 0,
                timeOnSite: 0,
                scrollDepth: 0,
                formInteractions: 0,
                buttonClicks: 0
            },
            consent: {
                given: false,
                timestamp: null,
                version: '1.0'
            }
        };
    }

    // Get client IP (fallback method)
    getClientIP() {
        // This is a fallback - in production, use server-side IP detection
        return 'unknown';
    }

    // Detect device type
    detectDeviceType() {
        const userAgent = navigator.userAgent;
        if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
            return 'mobile';
        } else if (/Tablet|iPad/i.test(userAgent)) {
            return 'tablet';
        }
        return 'desktop';
    }

    // Detect browser
    detectBrowser() {
        const userAgent = navigator.userAgent;
        if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
        if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
        if (userAgent.indexOf('Safari') > -1) return 'Safari';
        if (userAgent.indexOf('Edge') > -1) return 'Edge';
        if (userAgent.indexOf('Opera') > -1) return 'Opera';
        return 'Unknown';
    }

    // Removed cookie consent per requirement
    setupCookieConsent() {}

    // Remove any previously stored consent artifacts (cookie/localStorage)
    removeConsentArtifacts() {
        try {
            // Delete cookie set by the theme's cookie banner
            document.cookie = 'acceptCookies=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        } catch (e) {}
        try {
            localStorage.removeItem('birla_consent');
        } catch (e) {}
    }

    // Consent modal removed
    showConsentModal() {}

    // Accept consent
    acceptConsent() { this.consentGiven = true; this.startDataCollection(); }

    // Decline consent
    declineConsent() { this.consentGiven = false; }

    // Start data collection after consent
    startDataCollection() {
        if (!this.consentGiven) return;
        
        this.trackPageView();
        this.setupFormTracking();
        this.setupBehaviorTracking();
        this.setupLocationTracking();
        this.setupPhoneNumberDetection();
    }

    // Track page views
    trackPageView() {
        this.visitorData.behavior.pageViews++;
        this.saveVisitorData();
    }

    // Setup form tracking
    setupFormTracking() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                this.trackFormSubmission(form);
            });
            
            // Track form field interactions
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.trackFormFieldInteraction(input);
                });
            });
        });
    }

    // Track form submission
    trackFormSubmission(form) {
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) { data[key] = value; }

        // Robust extraction of name/phone/email
        const extracted = this.extractContactFields(form, data);
        if (extracted.name) this.visitorData.name = extracted.name;
        if (extracted.phone) this.visitorData.phone = extracted.phone;
        if (extracted.email) this.visitorData.email = extracted.email;

        // Store form submission data separately (minimal)
        this.saveFormSubmission({ name: this.visitorData.name, phone: this.visitorData.phone, email: this.visitorData.email });

        this.visitorData.behavior.formInteractions++;
        this.saveVisitorData();
    }

    // Track form field interactions
    trackFormFieldInteraction(input) {
        if ((/name|fname|full.?name/i.test(input.name)) && input.value) {
            this.visitorData.name = input.value;
        }
        if ((/phone|mobile|tel/i.test(input.name)) && input.value) {
            this.visitorData.phone = input.value;
        }
        if (input.name === 'email' && input.value) {
            this.visitorData.email = input.value;
        }
        
        this.saveVisitorData();
    }

    // Extract name, phone, and email robustly from a form
    extractContactFields(form, data) {
        const result = { name: null, phone: null, email: null };
        // Common keys
        result.name = data.name || data.fname || data.fullname || null;
        result.phone = data.phone || data.mobile || data.modal_my_mobile2 || data.modal_dg_mobile || data.mobileconcat || null;
        result.email = data.email || data.mail || null;
        // Try input[type=tel]
        if (!result.phone) {
            const tel = form.querySelector('input[type="tel"]');
            if (tel && tel.value) result.phone = tel.value;
        }
        // Try any input with phone-like name
        if (!result.phone) {
            const phoneInput = form.querySelector('input[name*="phone"], input[name*="mobile"], input[name*="tel"]');
            if (phoneInput && phoneInput.value) result.phone = phoneInput.value;
        }
        // Normalize: extract digits and optional +country
        if (result.phone) {
            const match = (result.phone + '').match(/(\+?\d[\d\s-]{8,}\d)/);
            result.phone = match ? match[1].replace(/[^\d+]/g,'') : result.phone;
        }
        // Try any input with email name
        if (!result.email) {
            const emailInput = form.querySelector('input[name*="email"], input[type="email"]');
            if (emailInput && emailInput.value) result.email = emailInput.value;
        }
        return result;
    }

    // Setup behavior tracking
    setupBehaviorTracking() {
        // Track scroll depth
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                this.visitorData.behavior.scrollDepth = maxScroll;
                this.saveVisitorData();
            }
        });

        // Track button clicks
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.classList.contains('btn')) {
                this.visitorData.behavior.buttonClicks++;
                this.saveVisitorData();
            }
        });

        // Track time on site
        const startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            this.visitorData.behavior.timeOnSite = Math.round((Date.now() - startTime) / 1000);
            this.saveVisitorData();
        });
    }

    // Location tracking removed
    setupLocationTracking() {}

    // Setup phone number detection
    setupPhoneNumberDetection() {
        // Detect phone numbers in clicked elements
        document.addEventListener('click', (e) => {
            const text = e.target.textContent || e.target.innerText || '';
            const phoneRegex = /(\+?91[\s-]?)?[6-9]\d{9}/g;
            const phoneMatch = text.match(phoneRegex);
            
            if (phoneMatch) {
                this.visitorData.phone = phoneMatch[0];
                this.saveVisitorData();
            }
        });
    }

    // Save form submission data
    async saveFormSubmission(formData) {
        if (!this.consentGiven) return;
        
        const submissionData = {
            // Only store essential identifiers
            name: formData.name || formData.fname || null,
            phone: formData.phone || formData.mobile || formData.modal_my_mobile2 || formData.modal_dg_mobile || null,
            email: formData.email || formData.mail || this.visitorData.email || null,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            source: 'form-submission'
        };
        
        try {
            if (this.db) {
                // Save to Firebase
                await this.db.collection('form_submissions').add(submissionData);
                console.log('Form submission saved to Firebase');
            } else {
                // Fallback to local server API
                await this.saveToLocalServer(submissionData, 'form_submissions');
            }
        } catch (error) {
            console.error('Error saving form submission:', error);
            // Try local server as final fallback
            try {
                await this.saveToLocalServer(submissionData, 'form_submissions');
            } catch (fallbackError) {
                console.error('Fallback save failed:', fallbackError);
            }
        }
    }

    // Save visitor data to Firebase or local server
    async saveVisitorData() {
        if (!this.consentGiven) return;
        
        try {
            if (this.db) {
                // Save to Firebase
                const minimal = {
                    sessionId: this.visitorData.sessionId,
                    timestamp: new Date().toISOString(),
                    name: this.visitorData.name,
                    phone: this.visitorData.phone,
                    email: this.visitorData.email
                };
                await this.db.collection(this.collectionName).add(minimal);
                console.log('Data saved to Firebase');
            } else {
                // Fallback to local server API
                const minimal = {
                    sessionId: this.visitorData.sessionId,
                    timestamp: new Date().toISOString(),
                    name: this.visitorData.name,
                    phone: this.visitorData.phone,
                    email: this.visitorData.email
                };
                await this.saveToLocalServer(minimal, 'visitors');
            }
        } catch (error) {
            console.error('Error saving visitor data:', error);
            // Try local server as final fallback
            try {
                const minimal = {
                    sessionId: this.visitorData.sessionId,
                    timestamp: new Date().toISOString(),
                    name: this.visitorData.name,
                    phone: this.visitorData.phone,
                    email: this.visitorData.email
                };
                await this.saveToLocalServer(minimal, 'visitors');
            } catch (fallbackError) {
                console.error('Fallback save failed:', fallbackError);
                // Last resort: local storage
                localStorage.setItem('birla_visitor_data', JSON.stringify(this.visitorData));
                console.log('Data saved to local storage as last resort');
            }
        }
    }

    // Save data to local server API
    async saveToLocalServer(data = null, collectionType = 'visitors') {
        try {
            const payload = data || {
                ...this.visitorData,
                lastUpdated: new Date().toISOString(),
                source: 'data-collector'
            };
            
            const response = await fetch('/webclone/www.birlassector71.com/birla-estate-sector71-gurugram/api/collect-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...payload,
                    collectionType: collectionType
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`Data saved to local server (${collectionType}):`, result);
            } else {
                throw new Error(`Server responded with status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error saving to local server:', error);
            throw error;
        }
    }

    // Get visitor data
    getVisitorData() {
        return this.visitorData;
    }

    // Update visitor data
    updateVisitorData(updates) {
        this.visitorData = { ...this.visitorData, ...updates };
        this.saveVisitorData();
    }
}

// Initialize data collector when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dataCollector = new DataCollector();
});
