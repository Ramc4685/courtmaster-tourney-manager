import { EnhancedOfflineManager, enhancedOfflineManager } from '../offline/EnhancedOfflineManager';

// PWA installation state
interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  installSource: 'browser' | 'standalone' | 'twa' | null;
}

// PWA update state
interface PWAUpdateState {
  isUpdateAvailable: boolean;
  isUpdating: boolean;
  updatePrompt: ServiceWorkerRegistration | null;
}

// PWA capabilities
interface PWACapabilities {
  hasServiceWorker: boolean;
  hasWebAppManifest: boolean;
  hasOfflineSupport: boolean;
  hasPushNotifications: boolean;
  hasBackgroundSync: boolean;
  hasFileSystemAccess: boolean;
  hasShareTarget: boolean;
  hasBadging: boolean;
}

// BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// PWA Manager class
export class PWAManager {
  private static instance: PWAManager;
  private installState: PWAInstallState;
  private updateState: PWAUpdateState;
  private capabilities: PWACapabilities;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private offlineManager: EnhancedOfflineManager | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.installState = {
      isInstallable: false,
      isInstalled: false,
      installPrompt: null,
      installSource: null,
    };

    this.updateState = {
      isUpdateAvailable: false,
      isUpdating: false,
      updatePrompt: null,
    };

    this.capabilities = {
      hasServiceWorker: 'serviceWorker' in navigator,
      hasWebAppManifest: false,
      hasOfflineSupport: false,
      hasPushNotifications: 'PushManager' in window,
      hasBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      hasFileSystemAccess: 'showOpenFilePicker' in window,
      hasShareTarget: 'share' in navigator,
      hasBadging: 'setAppBadge' in navigator,
    };

    this.initialize();
  }

  // Singleton pattern
  public static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  // Initialize PWA manager
  private async initialize(): Promise<void> {
    try {
      await this.detectInstallState();
      await this.registerServiceWorker();
      await this.checkWebAppManifest();
      this.setupEventListeners();
      this.detectCapabilities();
    } catch (error) {
      console.error('PWA Manager initialization failed:', error);
    }
  }

  // Detect installation state
  private async detectInstallState(): Promise<void> {
    // Check if app is running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');

    this.installState.isInstalled = isStandalone;
    this.installState.installSource = isStandalone ? 'standalone' : 'browser';

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.installState.installPrompt = e as BeforeInstallPromptEvent;
      this.installState.isInstallable = true;
      this.emit('installable', { canInstall: true });
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.installState.isInstalled = true;
      this.installState.installPrompt = null;
      this.installState.isInstallable = false;
      this.emit('installed', { installed: true });
    });
  }

  // Register service worker
  private async registerServiceWorker(): Promise<void> {
    if (!this.capabilities.hasServiceWorker) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      // Try enhanced service worker first, fallback to regular
      const swPath = '/sw-enhanced.js';
      this.serviceWorkerRegistration = await navigator.serviceWorker.register(swPath, {
        scope: '/',
        updateViaCache: 'none',
      });

      console.log('Service Worker registered:', this.serviceWorkerRegistration);

      // Listen for updates
      this.serviceWorkerRegistration.addEventListener('updatefound', () => {
        const newWorker = this.serviceWorkerRegistration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateState.isUpdateAvailable = true;
              this.updateState.updatePrompt = this.serviceWorkerRegistration;
              this.emit('updateAvailable', { registration: this.serviceWorkerRegistration });
            }
          });
        }
      });

      // Use the singleton offline manager instance
      this.offlineManager = enhancedOfflineManager;
      this.capabilities.hasOfflineSupport = true;

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  // Check web app manifest
  private async checkWebAppManifest(): Promise<void> {
    try {
      const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (manifestLink) {
        const response = await fetch(manifestLink.href);
        if (response.ok) {
          this.capabilities.hasWebAppManifest = true;
        }
      }
    } catch (error) {
      console.warn('Web App Manifest check failed:', error);
    }
  }

  // Setup event listeners
  private setupEventListeners(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.emit('networkChange', { online: true });
      this.offlineManager?.handleNetworkChange(true);
    });

    window.addEventListener('offline', () => {
      this.emit('networkChange', { online: false });
      this.offlineManager?.handleNetworkChange(false);
    });

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdates();
      }
    });
  }

  // Detect additional capabilities
  private detectCapabilities(): void {
    // Check for file system access
    this.capabilities.hasFileSystemAccess = 'showOpenFilePicker' in window;

    // Check for share target
    this.capabilities.hasShareTarget = 'share' in navigator;

    // Check for badging
    this.capabilities.hasBadging = 'setAppBadge' in navigator;
  }

  // Install PWA
  public async installPWA(): Promise<boolean> {
    if (!this.installState.installPrompt) {
      throw new Error('PWA installation not available');
    }

    try {
      await this.installState.installPrompt.prompt();
      const choiceResult = await this.installState.installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        this.installState.isInstalled = true;
        this.installState.installPrompt = null;
        this.installState.isInstallable = false;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('PWA installation failed:', error);
      throw error;
    }
  }

  // Update PWA
  public async updatePWA(): Promise<void> {
    if (!this.updateState.updatePrompt) {
      throw new Error('No update available');
    }

    try {
      this.updateState.isUpdating = true;
      this.emit('updateStarted', {});

      const newWorker = this.updateState.updatePrompt.waiting;
      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        
        // Wait for the new service worker to take control
        await new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            resolve();
          }, { once: true });
        });

        // Reload the page to use the new service worker
        window.location.reload();
      }
    } catch (error) {
      console.error('PWA update failed:', error);
      this.updateState.isUpdating = false;
      throw error;
    }
  }

  // Check for updates
  public async checkForUpdates(): Promise<void> {
    if (this.serviceWorkerRegistration) {
      try {
        await this.serviceWorkerRegistration.update();
      } catch (error) {
        console.error('Update check failed:', error);
      }
    }
  }

  // Enable push notifications
  public async enablePushNotifications(): Promise<PushSubscription | null> {
    if (!this.capabilities.hasPushNotifications || !this.serviceWorkerRegistration) {
      throw new Error('Push notifications not supported');
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.getVapidPublicKey(),
      });

      this.emit('pushEnabled', { subscription });
      return subscription;
    } catch (error) {
      console.error('Push notification setup failed:', error);
      throw error;
    }
  }

  // Set app badge
  public async setAppBadge(count?: number): Promise<void> {
    if (!this.capabilities.hasBadging) {
      console.warn('App badging not supported');
      return;
    }

    try {
      if (count === undefined || count === 0) {
        await (navigator as any).clearAppBadge();
      } else {
        await (navigator as any).setAppBadge(count);
      }
    } catch (error) {
      console.error('App badge update failed:', error);
    }
  }

  // Share content
  public async shareContent(data: ShareData): Promise<void> {
    if (!this.capabilities.hasShareTarget) {
      throw new Error('Web Share API not supported');
    }

    try {
      await navigator.share(data);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
        throw error;
      }
    }
  }

  // Get VAPID public key (should be configured in environment)
  private getVapidPublicKey(): string {
    return process.env.VITE_VAPID_PUBLIC_KEY || '';
  }

  // Event emitter methods
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Getters
  public get isInstallable(): boolean {
    return this.installState.isInstallable;
  }

  public get isInstalled(): boolean {
    return this.installState.isInstalled;
  }

  public get isUpdateAvailable(): boolean {
    return this.updateState.isUpdateAvailable;
  }

  public get isUpdating(): boolean {
    return this.updateState.isUpdating;
  }

  public get pwaCapabilities(): PWACapabilities {
    return { ...this.capabilities };
  }

  public get installSource(): string | null {
    return this.installState.installSource;
  }

  // Utility methods
  public async getStorageEstimate(): Promise<StorageEstimate | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return await navigator.storage.estimate();
    }
    return null;
  }

  public async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      return await navigator.storage.persist();
    }
    return false;
  }

  public isOnline(): boolean {
    return navigator.onLine;
  }

  public getConnectionInfo(): any {
    return (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  }
}

// Export singleton instance
export const pwaManager = PWAManager.getInstance();
