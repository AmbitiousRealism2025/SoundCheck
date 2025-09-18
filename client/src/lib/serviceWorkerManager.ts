/**
 * Hardened Service Worker Manager with robust error handling and conservative polling
 */

interface ServiceWorkerConfig {
  swUrl: string;
  pingEndpoint?: string;
  maxRetries?: number;
  baseInterval?: number;
  maxInterval?: number;
  enableTelemetry?: boolean;
}

interface RetryState {
  retryCount: number;
  lastAttempt: number;
  nextInterval: number;
  isOffline: boolean;
}

class ServiceWorkerManager {
  private config: Required<ServiceWorkerConfig>;
  private retryState: RetryState;
  private abortController: AbortController | null = null;
  private pollTimer: number | null = null;
  private isBackgrounded = false;
  private telemetry: Map<string, number> = new Map();

  constructor(config: ServiceWorkerConfig) {
    this.config = {
      swUrl: config.swUrl,
      pingEndpoint: config.pingEndpoint || '/ping',
      maxRetries: config.maxRetries || 5,
      baseInterval: config.baseInterval || 30000, // 30 seconds base
      maxInterval: config.maxInterval || 300000, // 5 minutes max
      enableTelemetry: config.enableTelemetry || false,
    };

    this.retryState = {
      retryCount: 0,
      lastAttempt: 0,
      nextInterval: this.config.baseInterval,
      isOffline: false,
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.retryState.isOffline = false;
      this.resumePolling();
    });

    window.addEventListener('offline', () => {
      this.retryState.isOffline = true;
      this.stopPolling();
    });

    // Monitor page visibility for conservative polling
    document.addEventListener('visibilitychange', () => {
      this.isBackgrounded = document.hidden;
      if (this.isBackgrounded) {
        this.adjustPollingForBackground();
      } else {
        this.resumePolling();
      }
    });

    // Monitor battery status if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        battery.addEventListener('levelchange', () => {
          if (battery.level < 0.15) {
            // Low battery - reduce polling frequency
            this.adjustPollingForLowBattery();
          }
        });
      });
    }

    // Monitor Save-Data header
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.saveData) {
        this.adjustPollingForDataSaving();
      }
    }
  }

  /**
   * Register service worker with proper error handling
   */
  public async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.error('Service workers are not supported in this browser');
      this.logTelemetry('registration_unsupported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(this.config.swUrl);
      console.log('Service Worker registered successfully:', registration.scope);
      this.logTelemetry('registration_success');

      // Wait for controller with timeout
      if (!navigator.serviceWorker.controller) {
        await this.waitForController(10000); // 10 second timeout
      }

      // Start polling if configured
      if (this.config.pingEndpoint) {
        this.startPolling();
      }

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      this.logTelemetry('registration_failed');

      // Classify error and determine if retry is appropriate
      if (this.shouldRetryRegistration(error)) {
        return this.retryRegistration();
      }

      return null;
    }
  }

  /**
   * Wait for service worker controller with timeout
   */
  private waitForController(timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout waiting for service worker controller'));
      }, timeout);

      const checkController = () => {
        if (navigator.serviceWorker.controller) {
          clearTimeout(timeoutId);
          resolve();
        }
      };

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        clearTimeout(timeoutId);
        resolve();
      });

      // Check immediately in case controller is already available
      checkController();
    });
  }

  /**
   * Determine if registration should be retried based on error type
   */
  private shouldRetryRegistration(error: any): boolean {
    // Don't retry for permanent failures
    if (error.name === 'SecurityError' || error.name === 'NotSupportedError') {
      return false;
    }

    // Retry for network errors and temporary failures
    return this.retryState.retryCount < this.config.maxRetries;
  }

  /**
   * Retry service worker registration with exponential backoff
   */
  private async retryRegistration(): Promise<ServiceWorkerRegistration | null> {
    this.retryState.retryCount++;
    const delay = this.calculateBackoffDelay();

    console.log(`Retrying service worker registration in ${delay}ms (attempt ${this.retryState.retryCount}/${this.config.maxRetries})`);

    await this.delay(delay);
    return this.register();
  }

  /**
   * Start conservative polling with proper error handling
   */
  private startPolling(): void {
    if (this.pollTimer) {
      return; // Already polling
    }

    this.schedulePoll();
  }

  /**
   * Schedule next poll with adaptive interval
   */
  private schedulePoll(): void {
    const interval = this.calculatePollInterval();

    this.pollTimer = window.setTimeout(() => {
      this.performPoll();
    }, interval);
  }

  /**
   * Perform a single poll with proper error handling
   */
  private async performPoll(): Promise<void> {
    if (this.retryState.isOffline) {
      // Skip polling while offline
      this.schedulePoll();
      return;
    }

    // Create new AbortController for this request
    this.abortController = new AbortController();
    const timeout = setTimeout(() => this.abortController?.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(this.config.pingEndpoint!, {
        signal: this.abortController.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeout);

      // Handle response based on status code
      if (response.ok) {
        // Success - reset retry state
        this.retryState.retryCount = 0;
        this.retryState.nextInterval = this.config.baseInterval;
        this.logTelemetry('poll_success');
      } else if (response.status >= 400 && response.status < 500) {
        // Client error - don't retry aggressively
        console.warn(`Poll failed with client error: ${response.status}`);
        this.logTelemetry('poll_client_error');
        this.retryState.nextInterval = Math.min(
          this.retryState.nextInterval * 2,
          this.config.maxInterval
        );
      } else if (response.status >= 500) {
        // Server error - apply backoff
        console.warn(`Poll failed with server error: ${response.status}`);
        this.logTelemetry('poll_server_error');
        this.applyBackoff(response);
      }
    } catch (error: any) {
      clearTimeout(timeout);

      if (error.name === 'AbortError') {
        console.warn('Poll request timed out');
        this.logTelemetry('poll_timeout');
      } else {
        console.error('Poll request failed:', error);
        this.logTelemetry('poll_network_error');
      }

      this.applyBackoff();
    } finally {
      this.abortController = null;
      // Schedule next poll
      this.schedulePoll();
    }
  }

  /**
   * Apply exponential backoff with jitter
   */
  private applyBackoff(response?: Response): void {
    this.retryState.retryCount++;

    // Check for Retry-After header
    if (response?.headers.has('Retry-After')) {
      const retryAfter = response.headers.get('Retry-After');
      if (retryAfter) {
        const retryAfterMs = parseInt(retryAfter) * 1000;
        if (!isNaN(retryAfterMs)) {
          this.retryState.nextInterval = Math.min(retryAfterMs, this.config.maxInterval);
          return;
        }
      }
    }

    // Calculate exponential backoff with jitter
    const backoffDelay = this.calculateBackoffDelay();
    this.retryState.nextInterval = Math.min(backoffDelay, this.config.maxInterval);
  }

  /**
   * Calculate backoff delay with exponential increase and random jitter
   */
  private calculateBackoffDelay(): number {
    const exponentialDelay = Math.min(
      this.config.baseInterval * Math.pow(2, this.retryState.retryCount),
      this.config.maxInterval
    );

    // Add random jitter (±25%)
    const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
    return Math.round(exponentialDelay + jitter);
  }

  /**
   * Calculate adaptive poll interval based on conditions
   */
  private calculatePollInterval(): number {
    let interval = this.retryState.nextInterval;

    // Adjust for background state
    if (this.isBackgrounded) {
      interval = Math.min(interval * 4, this.config.maxInterval);
    }

    // Adjust for Save-Data mode
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection?.saveData) {
        interval = Math.min(interval * 2, this.config.maxInterval);
      }
    }

    return interval;
  }

  /**
   * Stop polling
   */
  public stopPolling(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Resume polling after pause
   */
  private resumePolling(): void {
    if (this.config.pingEndpoint && !this.pollTimer) {
      // Reset interval to base when resuming
      this.retryState.nextInterval = this.config.baseInterval;
      this.startPolling();
    }
  }

  /**
   * Adjust polling for background tab
   */
  private adjustPollingForBackground(): void {
    // Increase interval for background tabs
    this.retryState.nextInterval = Math.min(
      this.retryState.nextInterval * 4,
      this.config.maxInterval
    );
  }

  /**
   * Adjust polling for low battery
   */
  private adjustPollingForLowBattery(): void {
    // Double the interval when battery is low
    this.retryState.nextInterval = Math.min(
      this.retryState.nextInterval * 2,
      this.config.maxInterval
    );
  }

  /**
   * Adjust polling for data saving mode
   */
  private adjustPollingForDataSaving(): void {
    // Triple the interval in data saving mode
    this.retryState.nextInterval = Math.min(
      this.retryState.nextInterval * 3,
      this.config.maxInterval
    );
  }

  /**
   * Log telemetry event
   */
  private logTelemetry(event: string): void {
    if (!this.config.enableTelemetry) return;

    const count = this.telemetry.get(event) || 0;
    this.telemetry.set(event, count + 1);

    // Log telemetry periodically or implement custom reporting
    if (count % 100 === 0) {
      console.log(`Telemetry - ${event}: ${count}`);
    }
  }

  /**
   * Get telemetry data
   */
  public getTelemetry(): Map<string, number> {
    return new Map(this.telemetry);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup and unregister
   */
  public async unregister(): Promise<void> {
    this.stopPolling();

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
  }
}

export default ServiceWorkerManager;
export type { ServiceWorkerConfig, RetryState };