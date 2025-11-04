// Traffic Tracker for Birla Sector 71 Website
(function() {
    'use strict';
    
    // Configuration
    const TRACKING_ENDPOINT = 'traffic_logger.php';
    const SESSION_KEY = 'birla_sector71_session';
    
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
    
    // Send tracking data
    function trackEvent(action, page = window.location.pathname) {
        const data = {
            page: page,
            action: action,
            session_id: getSessionId(),
            device_type: getDeviceType(),
            browser: getBrowser()
        };
        
        // Send data asynchronously
        fetch(TRACKING_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(data)
        }).catch(error => {
            console.log('Traffic tracking error:', error);
        });
    }
    
    // Track page view
    function trackPageView() {
        trackEvent('page_view', window.location.pathname);
    }
    
    // Track form submissions
    function trackFormSubmissions() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                try {
                    // Always track the submit event
                    trackEvent('form_submit', window.location.pathname);

                    // Avoid double-saving; data-collector.js already listens to submit

                    // Force local handling to avoid external 404 redirects
                    if (e && typeof e.preventDefault === 'function') e.preventDefault();

                    const formData = new FormData(form);
                    // Add page context
                    formData.append('page', window.location.pathname);

                    fetch('traffic_logger.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams(Array.from(formData.entries())).toString()
                    }).catch(() => {}).finally(() => {
                        // Go to local thank you page; it returns to the project after 5s
                        setTimeout(function(){ window.location.href = 'thank-you.html'; }, 200);
                    });
                } catch (err) {
                    // Fallback: still navigate to thank-you locally
                    window.location.href = 'thank-you.html';
                }
            });
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
    function initTracking() {
        // Track initial page view
        trackPageView();
        
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
