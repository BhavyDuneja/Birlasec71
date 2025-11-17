// Traffic Tracker for Birla Sector 71 Website
(function() {
    'use strict';
    
    // Configuration
    const TRACKING_ENDPOINT = 'traffic_logger.php';
    const SESSION_KEY = 'birla_sector71_session';
    let db = null;
    let firebaseInitialized = false;
    
    // Initialize Firebase
    async function initFirebase() {
        if (firebaseInitialized) return db !== null;
        
        try {
            // Wait for Firebase config to be available
            if (typeof window.FirebaseConfig === 'undefined') {
                // Wait a bit for firebase-config.js to load
                await new Promise(resolve => setTimeout(resolve, 500));
                if (typeof window.FirebaseConfig === 'undefined') {
                    return false;
                }
            }
            
            const firebaseConfig = window.FirebaseConfig;
            const initialized = await firebaseConfig.initialize();
            
            if (initialized) {
                db = firebaseConfig.getDatabase();
                firebaseInitialized = true;
                console.log('Traffic tracker: Firebase initialized');
                return true;
            }
        } catch (error) {
            console.log('Traffic tracker: Firebase init failed, using API fallback:', error);
        }
        
        return false;
    }
    
    // Get or create session ID
    function getSessionId() {
        let sessionId = sessionStorage.getItem(SESSION_KEY);
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem(SESSION_KEY, sessionId);
        }
        return sessionId;
    }
    
    // Detect device type
    function getDeviceType() {
        const userAgent = navigator.userAgent;
        if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
            return 'mobile';
        } else if (/Tablet|iPad/i.test(userAgent)) {
            return 'tablet';
        }
        return 'desktop';
    }
    
    // Detect browser
    function getBrowser() {
        const userAgent = navigator.userAgent;
        if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
        if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
        if (userAgent.indexOf('Safari') > -1) return 'Safari';
        if (userAgent.indexOf('Edge') > -1) return 'Edge';
        if (userAgent.indexOf('Opera') > -1) return 'Opera';
        return 'Unknown';
    }
    
    // Send tracking data to Firestore or API endpoint
    async function trackEvent(action, page = window.location.pathname) {
        const data = {
            page: page,
            action: action,
            session_id: getSessionId(),
            device_type: getDeviceType(),
            browser: getBrowser(),
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            ip: 'unknown', // IP will be detected server-side if using API
            user_agent: navigator.userAgent,
            referer: document.referrer || 'direct'
        };
        
        // Try Firestore first
        if (db) {
            try {
                await db.collection('traffic_logs').add(data);
                return; // Success, no need to try API
            } catch (error) {
                console.log('Traffic tracker: Firestore save failed, trying API:', error);
            }
        }
        
        // Fallback to API endpoint
        try {
            await fetch(TRACKING_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    page: data.page,
                    action: data.action,
                    session_id: data.session_id,
                    device_type: data.device_type,
                    browser: data.browser
                })
            });
        } catch (error) {
            console.log('Traffic tracking error (both Firestore and API failed):', error);
        }
    }
    
    // Track page view (exclude certain pages)
    function trackPageView() {
        const currentPath = window.location.pathname.toLowerCase();
        const excludedPages = [
            '/firebase-dashboard.html',
            '/traffic_dashboard.html',
            '/firebase-test.html',
            '/index.html',  // Exclude index.html from traffic counts
            '/server-status.html',
            '/thank-you.html'
        ];
        
        const isExcluded = excludedPages.some(page => currentPath.includes(page));
        if (isExcluded) {
            console.log('Page excluded from traffic tracking:', currentPath);
            return; // Don't track excluded pages
        }
        
        trackEvent('page_view', window.location.pathname);
    }
    
    // Track form submissions (prevent duplicate handling)
    function trackFormSubmissions() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            // Check if form already has submit handler
            if (form.dataset.trafficTrackerBound === 'true') {
                return; // Already bound
            }
            form.dataset.trafficTrackerBound = 'true';
            
            form.addEventListener('submit', function(e) {
                try {
                    // Only track the event, don't prevent default or handle submission
                    // Let the main form handler (data-collector.js and index.html) handle submission
                    trackEvent('form_submit', window.location.pathname);
                    
                    // Don't prevent default - let the actual form submission proceed
                    // The form will be handled by the main form handler in index.html
                } catch (err) {
                    console.error('Error tracking form submission:', err);
                    // Don't block form submission on tracking error
                }
            }, { passive: true }); // Use passive listener to not interfere
        });
    }
    
    // Track button clicks
    function trackButtonClicks() {
        const buttons = document.querySelectorAll('button, .btn, a[href*="tel:"], a[href*="mailto:"]');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                const action = this.textContent.trim() || this.getAttribute('href') || 'button_click';
                trackEvent('button_click', action);
            });
        });
    }
    
    // Track brochure downloads
    function trackBrochureDownloads() {
        const brochureLinks = document.querySelectorAll('a[href*="brochure"], button[onclick*="brochure"]');
        brochureLinks.forEach(link => {
            link.addEventListener('click', function() {
                trackEvent('brochure_download', window.location.pathname);
            });
        });
    }
    
    // Track contact form interactions
    function trackContactForms() {
        const contactForms = document.querySelectorAll('form[name*="form1"], form[action*="contact"]');
        contactForms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('focus', function() {
                    trackEvent('form_focus', input.name || 'unknown_field');
                });
            });
        });
    }
    
    // Track scroll depth
    function trackScrollDepth() {
        let maxScroll = 0;
        let scrollTracked = false;
        
        window.addEventListener('scroll', function() {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                
                // Track at 25%, 50%, 75%, and 100%
                if (scrollPercent >= 25 && scrollPercent < 50 && !scrollTracked) {
                    trackEvent('scroll_25', window.location.pathname);
                    scrollTracked = true;
                } else if (scrollPercent >= 50 && scrollPercent < 75) {
                    trackEvent('scroll_50', window.location.pathname);
                } else if (scrollPercent >= 75 && scrollPercent < 100) {
                    trackEvent('scroll_75', window.location.pathname);
                } else if (scrollPercent >= 100) {
                    trackEvent('scroll_100', window.location.pathname);
                }
            }
        });
    }
    
    // Initialize tracking when DOM is ready
    async function initTracking() {
        // Prevent duplicate initialization
        if (window.trafficTrackerInitialized) {
            console.log('Traffic tracker already initialized, skipping');
            return;
        }
        window.trafficTrackerInitialized = true;
        
        // Initialize Firebase first
        await initFirebase();
        
        // Track initial page view (only if data-collector hasn't already tracked it)
        // Add a small delay to avoid duplicate tracking with data-collector
        setTimeout(() => {
            if (!window.pageViewTrackedByDataCollector) {
                trackPageView();
            }
        }, 500);
        
        // Set up event tracking
        trackFormSubmissions();
        trackButtonClicks();
        trackBrochureDownloads();
        trackContactForms();
        trackScrollDepth();
        
        // Track time on page
        const startTime = Date.now();
        window.addEventListener('beforeunload', function() {
            const timeOnPage = Math.round((Date.now() - startTime) / 1000);
            trackEvent('time_on_page', timeOnPage + ' seconds');
        });
    }
    
    // Start tracking
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTracking);
    } else {
        initTracking();
    }
    
    // Expose tracking function globally for manual tracking
    window.trackEvent = trackEvent;
    
})();
