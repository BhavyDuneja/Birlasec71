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
        // Prevent duplicate tracking
        this.pageViewTracked = false;
        this.formSubmissionInProgress = false;
        this.trackingInitialized = false;
        
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
        
        // Prevent duplicate initialization
        if (this.trackingInitialized) {
            console.warn('DataCollector already initialized, skipping duplicate setup');
            return;
        }
        this.trackingInitialized = true;
        
        this.setupFormTracking();
        this.setupBehaviorTracking();
        // Track one page view so visitor count increases (only once per page load)
        if (!this.pageViewTracked) {
            this.trackPageView();
        }
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
        this.setupChatInterception();
    }
    
    // Intercept chat AJAX submissions
    setupChatInterception() {
        // Wait a bit for jQuery and chat script to load
        setTimeout(() => {
            // Intercept jQuery AJAX calls for chat submissions
            if (typeof $ !== 'undefined' && $.ajax) {
                const originalAjax = $.ajax;
                const self = this;
                
                $.ajax = function(options) {
                    // Check if this is a chat submission
                    if (options && options.url && 
                        (options.url.includes('lead-callback-chat') || 
                         options.url.includes('chat2.php'))) {
                        
                        console.log('💬 Chat submission detected, intercepting...');
                        
                        // Extract data from chatbotApiInput or options.data
                        const chatData = options.data || window.chatbotApiInput || {};
                        
                        // Extract name, phone, email from chat data
                        const name = chatData.first_name || chatData.fname || chatData.name || null;
                        const phone = chatData.mobile || chatData.phone || null;
                        const email = chatData.email || null;
                        
                        console.log('Chat data extracted:', { name, phone, email });
                        
                        // Save to Firebase with formType: 'chat'
                        if (name || phone || email) {
                            self.saveFormSubmission({
                                name: name,
                                phone: phone,
                                email: email,
                                formType: 'chat',
                                source: window.location.pathname
                            }).then(() => {
                                console.log('✅ Chat submission saved to Firebase form_submissions collection');
                            }).catch((error) => {
                                console.error('❌ Error saving chat submission:', error);
                            });
                        }
                    }
                    
                    // Call original AJAX function
                    return originalAjax.apply(this, arguments);
                };
                
                console.log('✅ Chat interception setup complete');
            } else {
                console.warn('⚠️ jQuery not found, chat interception not available');
            }
        }, 1000); // Wait 1 second for scripts to load
    }

    // Track page views (only once per page load)
    trackPageView() {
        if (this.pageViewTracked) {
            console.log('Page view already tracked, skipping duplicate');
            return;
        }
        
        // Exclude certain pages from visitor tracking
        const currentPath = window.location.pathname.toLowerCase();
        const excludedPages = [
            '/firebase-dashboard.html',
            '/traffic_dashboard.html',
            '/firebase-test.html',
            '/index.html',  // Exclude index.html from visitor counts
            '/server-status.html',
            '/thank-you.html'
        ];
        
        const isExcluded = excludedPages.some(page => currentPath.includes(page));
        if (isExcluded) {
            console.log('Page excluded from visitor tracking:', currentPath);
            this.pageViewTracked = true; // Mark as tracked to prevent duplicate
            window.pageViewTrackedByDataCollector = true;
            return; // Don't track excluded pages
        }
        
        this.pageViewTracked = true;
        // Mark globally so traffic_tracker.js knows not to track again
        window.pageViewTrackedByDataCollector = true;
        this.visitorData.behavior.pageViews++;
        this.saveVisitorData();
    }

    // Setup form tracking
    setupFormTracking() {
        // Track forms that exist now
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            this.attachFormHandler(form);
        });
        
        // Also watch for dynamically added forms (like in modals)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check if the added node is a form
                        if (node.tagName === 'FORM') {
                            this.attachFormHandler(node);
                        }
                        // Check if the added node contains forms
                        const forms = node.querySelectorAll && node.querySelectorAll('form');
                        if (forms) {
                            forms.forEach(form => {
                                this.attachFormHandler(form);
                            });
                        }
                    }
                });
            });
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Attach form handler to a specific form
    attachFormHandler(form) {
        // Check if already attached
        if (form.dataset.trackingAttached === 'true') {
            return;
        }
        form.dataset.trackingAttached = 'true';
        
        console.log('📋 Attaching form handler to:', form.id || 'unnamed form');
        
        // Prevent default form submission - we'll handle it
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // Always prevent default
            e.stopPropagation(); // Stop event bubbling
            
            console.log('✅ Form submission intercepted:', form.id || 'unnamed form');
            console.log('Form action:', form.action);
            console.log('Form method:', form.method);
            
            // Track and save form submission
            this.trackFormSubmission(form);
        }, { capture: true }); // Use capture to intercept early
        
        // Track form field interactions
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.trackFormFieldInteraction(input);
            });
        });
    }

    // Track form submission (prevent duplicate saves)
    trackFormSubmission(form) {
        // Prevent duplicate form submission tracking
        if (this.formSubmissionInProgress) {
            console.log('Form submission already in progress, skipping duplicate');
            return;
        }
        this.formSubmissionInProgress = true;
        
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) { data[key] = value; }

        // Robust extraction of name/phone/email
        const extracted = this.extractContactFields(form, data);
        
        // Determine form type from form attributes or context
        let formType = 'general';
        
        // Check button text first (most reliable)
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitButton) {
            const buttonText = submitButton.textContent || submitButton.value || '';
            const buttonTextLower = buttonText.toLowerCase();
            console.log('Submit button text:', buttonText);
            
            if (buttonTextLower.includes('instant call') || buttonTextLower.includes('call back') || buttonTextLower.includes('call back')) {
                formType = 'call_back';
                console.log('✅ Detected form type: call_back from button text');
            } else if (buttonTextLower.includes('brochure') || buttonTextLower.includes('download')) {
                formType = 'brochure';
                console.log('✅ Detected form type: brochure from button text');
            } else if (buttonTextLower.includes('enquiry') || buttonTextLower.includes('chat') || buttonTextLower.includes('send')) {
                formType = 'chat';
                console.log('✅ Detected form type: chat from button text');
            }
        }
        
        // Also check modal context if button text didn't match
        if (formType === 'general' && form.id === 'pardotForm') {
            // Check if it's from a modal
            const modal = document.querySelector('.modal.show, .modal.in, [id*="enqModal"]');
            if (modal) {
                // Check modal title
                const modalTitle = modal.querySelector('.modal-title, h4, h5, [class*="title"]');
                if (modalTitle) {
                    const title = modalTitle.textContent.toLowerCase();
                    if (title.includes('brochure') || title.includes('download')) {
                        formType = 'brochure';
                        console.log('✅ Detected form type: brochure from modal title');
                    } else if (title.includes('chat') || title.includes('enquiry')) {
                        formType = 'chat';
                        console.log('✅ Detected form type: chat from modal title');
                    } else if (title.includes('call') || title.includes('instant')) {
                        formType = 'call_back';
                        console.log('✅ Detected form type: call_back from modal title');
                    }
                }
                
                // Check data attributes on modal trigger button
                const modalTrigger = document.querySelector('[data-target="#enqModal"], [data-toggle="modal"]');
                if (modalTrigger && formType === 'general') {
                    const dataTitle = modalTrigger.getAttribute('data-title') || '';
                    const dataEnquiry = modalTrigger.getAttribute('data-enquiry') || '';
                    const triggerText = (dataTitle + ' ' + dataEnquiry).toLowerCase();
                    
                    if (triggerText.includes('call') || triggerText.includes('instant')) {
                        formType = 'call_back';
                        console.log('✅ Detected form type: call_back from modal trigger');
                    } else if (triggerText.includes('brochure')) {
                        formType = 'brochure';
                        console.log('✅ Detected form type: brochure from modal trigger');
                    } else if (triggerText.includes('enquiry') || triggerText.includes('chat')) {
                        formType = 'chat';
                        console.log('✅ Detected form type: chat from modal trigger');
                    }
                }
            }
        }
        
        // Check hidden input field for form type
        if (formType === 'general') {
            const enquiredFor = form.querySelector('input[name="enquiredfor"], input[id="enquiredfor"]');
            if (enquiredFor && enquiredFor.value) {
                const value = enquiredFor.value.toLowerCase();
                if (value.includes('call') || value.includes('instant')) {
                    formType = 'call_back';
                    console.log('✅ Detected form type: call_back from enquiredfor field');
                } else if (value.includes('brochure')) {
                    formType = 'brochure';
                    console.log('✅ Detected form type: brochure from enquiredfor field');
                }
            }
        }
        
        console.log('📝 Final form type detected:', formType);
        
        // Store form submission data to form_submissions collection
        this.saveFormSubmission({ 
            name: extracted.name || null, 
            phone: extracted.phone || null, 
            email: extracted.email || null,
            formType: formType,
            source: window.location.pathname
        }).then(() => {
            console.log('✅ Form submission saved to Firebase form_submissions collection');
            // Redirect to thank-you page after successful save
            setTimeout(() => {
                window.location.href = 'thank-you.html';
            }, 500);
        }).catch((error) => {
            console.error('❌ Error saving form submission:', error);
            // Still redirect even if save fails
            setTimeout(() => {
                window.location.href = 'thank-you.html';
            }, 500);
        }).finally(() => {
            // Reset flag after a delay to allow for retries
            setTimeout(() => {
                this.formSubmissionInProgress = false;
            }, 2000);
        });

        // Update visitor data for tracking purposes but DON'T save visitor data on form submission
        if (extracted.name) this.visitorData.name = extracted.name;
        if (extracted.phone) this.visitorData.phone = extracted.phone;
        if (extracted.email) this.visitorData.email = extracted.email;
        this.visitorData.behavior.formInteractions++;
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

    // Save form submission data with retry logic
    async saveFormSubmission(formData) {
        if (!this.consentGiven) {
            console.warn('Consent not given, skipping form submission save');
            return Promise.resolve();
        }
        
        const submissionData = {
            // Only store essential identifiers
            name: formData.name || formData.fname || null,
            phone: formData.phone || formData.mobile || formData.modal_my_mobile2 || formData.modal_dg_mobile || null,
            email: formData.email || formData.mail || this.visitorData.email || null,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            source: formData.source || 'form-submission',
            formType: formData.formType || 'general'
        };
        
        // Validate that we have at least name or phone
        if (!submissionData.name && !submissionData.phone) {
            console.warn('Form submission missing required fields (name/phone), skipping save');
            return Promise.resolve();
        }
        
        console.log('💾 Saving form submission to Firebase:', submissionData);
        
        let saved = false;
        const maxRetries = 3;
        
        // Try Firebase first with retries
        if (this.db) {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    await this.db.collection('form_submissions').add(submissionData);
                    console.log(`✅ Form submission saved to Firebase form_submissions (attempt ${attempt})`);
                    saved = true;
                    return Promise.resolve(); // Success
                } catch (error) {
                    console.error(`❌ Firebase save attempt ${attempt} failed:`, error);
                    if (attempt < maxRetries) {
                        // Wait before retry (exponential backoff)
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    } else {
                        console.error('All Firebase save attempts failed, trying fallback');
                    }
                }
            }
        }
        
        // Fallback to local server if Firebase failed
        if (!saved) {
            try {
                await this.saveToLocalServer(submissionData, 'form_submissions');
                console.log('✅ Form submission saved to local server (fallback)');
                return Promise.resolve();
            } catch (fallbackError) {
                console.error('❌ All save methods failed:', fallbackError);
                // Last resort: store in localStorage for later sync
                try {
                    const pending = JSON.parse(localStorage.getItem('birla_pending_submissions') || '[]');
                    pending.push(submissionData);
                    localStorage.setItem('birla_pending_submissions', JSON.stringify(pending));
                    console.log('⚠️ Form submission stored in localStorage for later sync');
                    return Promise.resolve();
                } catch (storageError) {
                    console.error('Even localStorage save failed:', storageError);
                    return Promise.reject(storageError);
                }
            }
        }
        
        return Promise.resolve();
    }

    // Save visitor data to Firebase or local server (with debouncing to prevent duplicates)
    async saveVisitorData() {
        if (!this.consentGiven) return;
        
        // Exclude certain pages from visitor tracking
        const currentPath = window.location.pathname.toLowerCase();
        const excludedPages = [
            '/firebase-dashboard.html',
            '/traffic_dashboard.html',
            '/firebase-test.html',
            '/index.html',  // Exclude index.html from visitor counts
            '/server-status.html',
            '/thank-you.html'
        ];
        
        const isExcluded = excludedPages.some(page => currentPath.includes(page));
        if (isExcluded) {
            console.log('Skipping visitor data save for excluded page:', currentPath);
            return;
        }
        
        // Debounce: prevent saving too frequently (max once per 5 seconds)
        const now = Date.now();
        if (this.lastSaveTime && (now - this.lastSaveTime) < 5000) {
            return; // Skip if saved recently
        }
        this.lastSaveTime = now;
        
        try {
            if (this.db) {
                // Save to Firebase - ONLY minimal visitor tracking data
                // DO NOT include form submission data here - that goes to form_submissions
                const minimal = {
                    sessionId: this.visitorData.sessionId,
                    timestamp: new Date().toISOString(),
                    // Only save name/phone/email if they were collected organically (not from form submission)
                    // Form submissions should NOT create visitor records
                    name: null,  // Don't save form data to visitors
                    phone: null, // Don't save form data to visitors
                    email: null  // Don't save form data to visitors
                };
                await this.db.collection(this.collectionName).add(minimal);
                console.log('Visitor data saved to Firebase (without form submission data)');
            } else {
                // Fallback to local server API
                const minimal = {
                    sessionId: this.visitorData.sessionId,
                    timestamp: new Date().toISOString(),
                    name: null,
                    phone: null,
                    email: null
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
                    name: null,
                    phone: null,
                    email: null
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
