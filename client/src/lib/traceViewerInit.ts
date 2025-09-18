/**
 * Enhanced Trace Viewer initialization with hardened service worker
 */

import ServiceWorkerManager from './serviceWorkerManager';

interface TraceViewerConfig {
  swPath?: string;
  enablePolling?: boolean;
  enableTelemetry?: boolean;
}

/**
 * Initialize trace viewer with hardened service worker registration
 */
export async function initializeTraceViewer(config: TraceViewerConfig = {}) {
  const urlParams = new URLSearchParams(window.location.search);

  // Only initialize service worker for non-file protocols
  if (window.location.protocol === 'file:') {
    console.log('Service workers not available in file:// protocol');
    return null;
  }

  // Check if we're in test mode
  if (urlParams.get('isUnderTest') === 'true') {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Check service worker support
  if (!('serviceWorker' in navigator)) {
    throw new Error(
      `Service workers are not supported.
Make sure to serve the Trace Viewer via HTTPS or localhost.`
    );
  }

  // Initialize the service worker manager with conservative settings
  const swManager = new ServiceWorkerManager({
    swUrl: config.swPath || 'sw.bundle.js',
    pingEndpoint: config.enablePolling ? '/ping' : undefined,
    maxRetries: 3,
    baseInterval: 60000, // 1 minute base interval (instead of 10 seconds)
    maxInterval: 600000, // 10 minutes max interval
    enableTelemetry: config.enableTelemetry || false,
  });

  try {
    // Register service worker with proper error handling
    const registration = await swManager.register();

    if (!registration) {
      console.error('Failed to register service worker');
      return null;
    }

    // Set up event-driven updates using service worker events
    if (navigator.serviceWorker.controller) {
      setupEventDrivenUpdates();
    }

    return { swManager, registration };
  } catch (error) {
    console.error('Service worker initialization failed:', error);

    // Provide fallback behavior or user notification
    notifyUserOfServiceWorkerFailure(error);

    return null;
  }
}

/**
 * Set up event-driven updates using service worker messaging
 */
function setupEventDrivenUpdates() {
  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    handleServiceWorkerMessage(event.data);
  });

  // Listen for service worker updates
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service worker updated, reloading may be required');
    handleServiceWorkerUpdate();
  });

  // Use BroadcastChannel for cross-tab communication if available
  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel('trace-viewer-updates');

    channel.addEventListener('message', (event) => {
      handleBroadcastMessage(event.data);
    });
  }

  // Set up Push API if available and permissions granted
  setupPushNotifications();
}

/**
 * Handle messages from service worker
 */
function handleServiceWorkerMessage(data: any) {
  if (!data || !data.method) return;

  switch (data.method) {
    case 'update':
      // Handle update notification
      console.log('Update available:', data.params);
      break;
    case 'progress':
      // Handle progress updates
      if (data.params) {
        updateProgress(data.params);
      }
      break;
    case 'error':
      // Handle error notifications
      console.error('Service worker error:', data.params);
      break;
    default:
      // Unknown message type
      break;
  }
}

/**
 * Handle service worker update
 */
function handleServiceWorkerUpdate() {
  // Optionally prompt user to reload for updates
  const shouldReload = confirm('A new version is available. Reload to update?');
  if (shouldReload) {
    window.location.reload();
  }
}

/**
 * Handle broadcast messages for cross-tab communication
 */
function handleBroadcastMessage(data: any) {
  console.log('Broadcast message received:', data);
  // Handle cross-tab synchronization
}

/**
 * Set up Push API for real-time updates (if available)
 */
async function setupPushNotifications() {
  if (!('PushManager' in window)) {
    console.log('Push notifications not supported');
    return;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: getVAPIDPublicKey(),
      });

      console.log('Push subscription active:', subscription);
    }
  } catch (error) {
    console.log('Push notification setup failed:', error);
    // Push is optional, so we don't throw
  }
}

/**
 * Get VAPID public key for push subscriptions
 */
function getVAPIDPublicKey(): Uint8Array | null {
  // This would be your actual VAPID public key
  // For now, return null to indicate push is not configured
  return null;
}

/**
 * Update progress indicator
 */
function updateProgress(params: { done: number; total: number }) {
  // Dispatch custom event for progress updates
  const event = new CustomEvent('trace-progress', { detail: params });
  window.dispatchEvent(event);
}

/**
 * Notify user of service worker registration failure
 */
function notifyUserOfServiceWorkerFailure(error: any) {
  // Create a user-friendly error message
  const message = error instanceof Error ? error.message : 'Unknown error';

  // Dispatch custom event for error handling
  const event = new CustomEvent('sw-registration-failed', {
    detail: { message, error }
  });
  window.dispatchEvent(event);

  // Log for debugging
  console.error('Service Worker Registration Failed:', {
    message,
    error,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });
}

/**
 * Clean up service worker and stop polling
 */
export async function cleanupTraceViewer(swManager?: ServiceWorkerManager) {
  if (swManager) {
    swManager.stopPolling();
    // Optionally unregister if needed
    // await swManager.unregister();
  }
}

export default initializeTraceViewer;