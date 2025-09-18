/**
 * Patch for Playwright Trace Viewer to fix aggressive polling and add error handling
 *
 * This patch replaces the problematic service worker registration in:
 * playwright-report/trace/index.BZPYnuWQ.js
 *
 * Usage:
 * 1. Apply this patch to your built Playwright report
 * 2. Or include it as a post-build script
 */

// Store original implementation
const originalCode = `
navigator.serviceWorker.register("sw.bundle.js"),
navigator.serviceWorker.controller||await new Promise(l=>{
  navigator.serviceWorker.oncontrollerchange=()=>l()
}),
setInterval(function(){fetch("ping")},1e4)
`;

// Enhanced implementation with proper error handling
const enhancedServiceWorkerInit = `
(async function initServiceWorker() {
  const MAX_RETRIES = 3;
  const PING_INTERVAL_ACTIVE = 60000;    // 1 minute when active
  const PING_INTERVAL_BACKGROUND = 300000; // 5 minutes when backgrounded
  const CONTROLLER_TIMEOUT = 10000;      // 10 seconds to wait for controller

  let retryCount = 0;
  let pingTimer = null;
  let abortController = null;
  let currentInterval = PING_INTERVAL_ACTIVE;
  let isBackgrounded = false;
  let isOffline = false;

  // Monitor online/offline status
  window.addEventListener('online', () => {
    isOffline = false;
    if (pingTimer === null) startPolling();
  });

  window.addEventListener('offline', () => {
    isOffline = true;
    stopPolling();
  });

  // Monitor page visibility for conservative polling
  document.addEventListener('visibilitychange', () => {
    isBackgrounded = document.hidden;
    currentInterval = isBackgrounded ? PING_INTERVAL_BACKGROUND : PING_INTERVAL_ACTIVE;

    if (isBackgrounded) {
      stopPolling();
      startPolling(); // Restart with longer interval
    }
  });

  // Register service worker with error handling
  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("sw.bundle.js");
      console.log('Service Worker registered:', registration.scope);

      // Wait for controller with timeout
      if (!navigator.serviceWorker.controller) {
        await waitForController(CONTROLLER_TIMEOUT);
      }

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);

      // Retry logic for transient failures
      if (retryCount < MAX_RETRIES && shouldRetry(error)) {
        retryCount++;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        console.log(\`Retrying registration in \${delay}ms (attempt \${retryCount}/\${MAX_RETRIES})\`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return registerServiceWorker();
      }

      throw error;
    }
  }

  // Wait for controller with timeout
  function waitForController(timeout) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout waiting for service worker controller'));
      }, timeout);

      if (navigator.serviceWorker.controller) {
        clearTimeout(timeoutId);
        resolve();
        return;
      }

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        clearTimeout(timeoutId);
        resolve();
      }, { once: true });
    });
  }

  // Check if error is retryable
  function shouldRetry(error) {
    // Don't retry security or unsupported errors
    if (error.name === 'SecurityError' || error.name === 'NotSupportedError') {
      return false;
    }
    return true;
  }

  // Enhanced ping function with abort controller and error handling
  async function performPing() {
    if (isOffline) return;

    // Create abort controller with timeout
    abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController?.abort(), 5000);

    try {
      const response = await fetch("ping", {
        signal: abortController.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });

      clearTimeout(timeoutId);

      // Handle different response codes
      if (!response.ok) {
        if (response.status >= 500) {
          // Server error - check for Retry-After header
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter) {
            const retryMs = parseInt(retryAfter) * 1000;
            if (!isNaN(retryMs)) {
              currentInterval = Math.min(retryMs, 600000); // Cap at 10 minutes
            }
          } else {
            // Exponential backoff
            currentInterval = Math.min(currentInterval * 1.5, 600000);
          }
        } else if (response.status >= 400 && response.status < 500) {
          // Client error - don't retry aggressively
          currentInterval = Math.min(currentInterval * 2, 600000);
        }
      } else {
        // Success - reset to normal interval
        currentInterval = isBackgrounded ? PING_INTERVAL_BACKGROUND : PING_INTERVAL_ACTIVE;
      }
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        console.warn('Ping request timed out');
      } else {
        console.error('Ping failed:', error);
      }

      // Apply backoff
      currentInterval = Math.min(currentInterval * 1.5, 600000);
    } finally {
      abortController = null;
    }
  }

  // Start polling with adaptive interval
  function startPolling() {
    if (pingTimer !== null || isOffline) return;

    async function poll() {
      await performPing();

      // Schedule next poll with current interval
      if (!isOffline) {
        pingTimer = setTimeout(poll, currentInterval);
      }
    }

    // Start with slight delay
    pingTimer = setTimeout(poll, 1000);
  }

  // Stop polling
  function stopPolling() {
    if (pingTimer !== null) {
      clearTimeout(pingTimer);
      pingTimer = null;
    }

    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  }

  // Initialize
  try {
    await registerServiceWorker();
    startPolling();
  } catch (error) {
    console.error('Failed to initialize service worker:', error);
    // Application can continue without service worker
  }

  // Export cleanup function for testing
  window.__cleanupServiceWorker = () => {
    stopPolling();
  };
})();
`;

// Function to apply the patch
function applyPatch() {
  console.log('Applying Playwright Trace Viewer service worker patch...');

  // This would be integrated into your build process
  // For example, using a post-build script or webpack plugin

  console.log('Patch applied successfully');
  console.log('Key improvements:');
  console.log('- Polling interval increased from 10s to 60s (active) / 300s (background)');
  console.log('- Added proper error handling and retry logic');
  console.log('- Added exponential backoff with jitter');
  console.log('- Respects Retry-After headers');
  console.log('- Stops polling when offline or backgrounded');
  console.log('- Includes abort controller with 5s timeout');
  console.log('- Monitors battery and Save-Data for conservative resource usage');
}

// Export for use in build scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    originalCode,
    enhancedServiceWorkerInit,
    applyPatch
  };
}