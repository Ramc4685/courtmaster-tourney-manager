/**
 * Pilot Configuration Management
 * Centralized configuration for pilot-specific behavior and constraints
 */

import React from 'react';

export interface PilotEnvironment {
  isPilot: boolean;
  isProduction: boolean;
  isDevelopment: boolean;
  deploymentType: 'pilot' | 'development' | 'staging' | 'production';
}

export interface PerformanceConfig {
  syncInterval: number;
  maxRetries: number;
  timeoutDuration: number;
  batchSize: number;
  memoryLimit: number;
  storageQuota: number;
}

export interface OfflineConfig {
  enabled: boolean;
  maxQueueSize: number;
  conflictResolution: 'last_write_wins' | 'manual' | 'merge';
  autoSync: boolean;
  syncOnReconnect: boolean;
  backgroundSync: boolean;
  cacheStrategy: 'cache_first' | 'network_first' | 'stale_while_revalidate';
}

export interface FeatureFlags {
  enableAdvancedAnalytics: boolean;
  enableMultiVenue: boolean;
  enablePaymentProcessing: boolean;
  enableAdvancedReporting: boolean;
  enableRealTimeNotifications: boolean;
  enableDataExport: boolean;
  enableDataImport: boolean;
  enableAutoBackup: boolean;
  enableOfflineMode: boolean;
  enablePWAFeatures: boolean;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsoleLogging: boolean;
  enableFileLogging: boolean;
  enableRemoteLogging: boolean;
  maxLogSize: number;
  retentionDays: number;
}

export interface SecurityConfig {
  enforceHTTPS: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  enableTwoFactor: boolean;
  enableAuditLogging: boolean;
}

export interface DataLimits {
  maxTournaments: number;
  maxTeamsPerTournament: number;
  maxPlayersPerTeam: number;
  maxMatchesPerTournament: number;
  maxCourts: number;
  maxFileSize: number;
  maxStoragePerVenue: number;
}

export interface UIConfig {
  theme: 'light' | 'dark' | 'auto';
  compactMode: boolean;
  showAdvancedOptions: boolean;
  enableKeyboardShortcuts: boolean;
  defaultLanguage: string;
  timeFormat: '12h' | '24h';
  dateFormat: 'US' | 'EU' | 'ISO';
}

export interface BackupConfig {
  autoBackup: boolean;
  backupFrequency: number; // in hours
  backupRetentionDays: number;
  cloudBackupProvider: 'none' | 's3' | 'gcs';
}

export interface UpdateConfig {
  autoUpdate: boolean;
  updateChannel: 'stable' | 'beta';
  checkForUpdatesInterval: number; // in hours
}

export interface MonitoringConfig {
  healthCheckInterval: number; // in seconds
  reportToRemote: boolean;
  remoteMonitoringEndpoint: string;
}

export interface PilotConfiguration {
  environment: PilotEnvironment;
  performance: PerformanceConfig;
  offline: OfflineConfig;
  features: FeatureFlags;
  logging: LoggingConfig;
  security: SecurityConfig;
  limits: DataLimits;
  ui: UIConfig;
  backup: BackupConfig;
  update: UpdateConfig;
  monitoring: MonitoringConfig;
  venue?: {
    id: string;
    name: string;
    timezone: string;
    courts: number;
    capacity: number;
  };
}

class PilotConfigManager {
  private config: PilotConfiguration;
  private listeners = new Set<(config: PilotConfiguration) => void>();

  constructor() {
    this.config = this.getDefaultConfig();
    this.loadStoredConfig();
    this.detectEnvironment();
  }

  private getDefaultConfig(): PilotConfiguration {
    return {
      environment: {
        isPilot: true,
        isProduction: false,
        isDevelopment: false,
        deploymentType: 'pilot'
      },
      performance: {
        syncInterval: 30000, // 30 seconds
        maxRetries: 3,
        timeoutDuration: 10000, // 10 seconds
        batchSize: 50,
        memoryLimit: 500 * 1024 * 1024, // 500MB
        storageQuota: 1024 * 1024 * 1024 // 1GB
      },
      offline: {
        enabled: true,
        maxQueueSize: 1000,
        conflictResolution: 'last_write_wins',
        autoSync: true,
        syncOnReconnect: true,
        backgroundSync: true,
        cacheStrategy: 'cache_first'
      },
      features: {
        enableAdvancedAnalytics: false,
        enableMultiVenue: false,
        enablePaymentProcessing: false,
        enableAdvancedReporting: true,
        enableRealTimeNotifications: true,
        enableDataExport: true,
        enableDataImport: true,
        enableAutoBackup: true,
        enableOfflineMode: true,
        enablePWAFeatures: true
      },
      logging: {
        level: 'info',
        enableConsoleLogging: true,
        enableFileLogging: true,
        enableRemoteLogging: false,
        maxLogSize: 10 * 1024 * 1024, // 10MB
        retentionDays: 7
      },
      security: {
        enforceHTTPS: false, // Disabled for local pilot
        sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
        maxLoginAttempts: 5,
        passwordMinLength: 6, // Relaxed for pilot
        enableTwoFactor: false,
        enableAuditLogging: true
      },
      limits: {
        maxTournaments: 10,
        maxTeamsPerTournament: 128,
        maxPlayersPerTeam: 4,
        maxMatchesPerTournament: 1000,
        maxCourts: 20,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxStoragePerVenue: 2 * 1024 * 1024 * 1024 // 2GB
      },
      ui: {
        theme: 'auto',
        compactMode: false,
        showAdvancedOptions: true,
        enableKeyboardShortcuts: true,
        defaultLanguage: 'en',
        timeFormat: '12h',
        dateFormat: 'US'
      },
      backup: {
        autoBackup: true,
        backupFrequency: 24, // every 24 hours
        backupRetentionDays: 7,
        cloudBackupProvider: 'none'
      },
      update: {
        autoUpdate: true,
        updateChannel: 'stable',
        checkForUpdatesInterval: 6 // every 6 hours
      },
      monitoring: {
        healthCheckInterval: 60, // every 60 seconds
        reportToRemote: false,
        remoteMonitoringEndpoint: ''
      }
    };
  }

  private detectEnvironment(): void {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;

    // Detect if running in pilot mode
    const isPilot =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      port === '3000' ||
      import.meta.env.NODE_ENV === 'pilot';

    // Detect production
    const isProduction =
      import.meta.env.PROD &&
      !isPilot &&
      protocol === 'https:';

    // Detect development
    const isDevelopment =
      import.meta.env.DEV ||
      import.meta.env.NODE_ENV === 'development';

    let deploymentType: PilotConfiguration['environment']['deploymentType'] = 'development';

    if (isPilot) {
      deploymentType = 'pilot';
    } else if (isProduction) {
      deploymentType = 'production';
    } else if (hostname.includes('staging')) {
      deploymentType = 'staging';
    }

    this.updateConfig({
      environment: {
        isPilot,
        isProduction,
        isDevelopment,
        deploymentType
      }
    });

    // Adjust config based on environment
    if (isPilot) {
      this.applyPilotOptimizations();
    } else if (isProduction) {
      this.applyProductionSettings();
    }
  }

  private applyPilotOptimizations(): void {
    this.updateConfig({
      performance: {
        ...this.config.performance,
        syncInterval: 30000, // More frequent sync for testing
        memoryLimit: 500 * 1024 * 1024, // Conservative memory usage
      },
      logging: {
        ...this.config.logging,
        level: 'debug', // Verbose logging for pilot
        enableConsoleLogging: true,
        enableFileLogging: true
      },
      security: {
        ...this.config.security,
        enforceHTTPS: false, // Allow HTTP for local testing
        sessionTimeout: 8 * 60 * 60 * 1000, // Long sessions for testing
        passwordMinLength: 6 // Relaxed for pilot
      },
      features: {
        ...this.config.features,
        enableAdvancedAnalytics: false, // Disable heavy features
        enableMultiVenue: false,
        enablePaymentProcessing: false
      },
      monitoring: {
        ...this.config.monitoring,
        healthCheckInterval: 30, // More frequent checks for pilot
        reportToRemote: false,
      }
    });
  }

  private applyProductionSettings(): void {
    this.updateConfig({
      performance: {
        ...this.config.performance,
        syncInterval: 60000, // Less frequent sync in production
        memoryLimit: 1024 * 1024 * 1024, // More memory in production
      },
      logging: {
        ...this.config.logging,
        level: 'warn', // Less verbose in production
        enableRemoteLogging: true
      },
      security: {
        ...this.config.security,
        enforceHTTPS: true,
        sessionTimeout: 2 * 60 * 60 * 1000, // Shorter sessions
        passwordMinLength: 8,
        enableTwoFactor: true
      },
      limits: {
        ...this.config.limits,
        maxTournaments: 100, // Higher limits in production
        maxTeamsPerTournament: 512,
        maxStoragePerVenue: 10 * 1024 * 1024 * 1024 // 10GB
      },
      backup: {
        ...this.config.backup,
        backupFrequency: 12, // More frequent backups in prod
        cloudBackupProvider: 's3', // Example for production
      },
      monitoring: {
        ...this.config.monitoring,
        reportToRemote: true,
        remoteMonitoringEndpoint: 'https://monitoring.courtmaster.com'
      }
    });
  }

  private loadStoredConfig(): void {
    try {
      const stored = localStorage.getItem('pilot-config');
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        this.config = { ...this.config, ...parsedConfig };
      }
    } catch (error) {
      console.warn('Failed to load stored pilot config:', error);
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('pilot-config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save pilot config:', error);
    }
  }

  public getConfig(): PilotConfiguration {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<PilotConfiguration>): void {
    this.config = {
      ...this.config,
      ...updates,
      // Deep merge nested objects
      environment: { ...this.config.environment, ...updates.environment },
      performance: { ...this.config.performance, ...updates.performance },
      offline: { ...this.config.offline, ...updates.offline },
      features: { ...this.config.features, ...updates.features },
      logging: { ...this.config.logging, ...updates.logging },
      security: { ...this.config.security, ...updates.security },
      limits: { ...this.config.limits, ...updates.limits },
      ui: { ...this.config.ui, ...updates.ui },
      backup: { ...this.config.backup, ...updates.backup },
      update: { ...this.config.update, ...updates.update },
      monitoring: { ...this.config.monitoring, ...updates.monitoring },
      venue: updates.venue ? { ...this.config.venue, ...updates.venue } : this.config.venue
    };

    this.saveConfig();
    this.notifyListeners();
  }

  public updateVenue(venue: PilotConfiguration['venue']): void {
    this.updateConfig({ venue });
  }

  public enableFeature(feature: keyof FeatureFlags): void {
    this.updateConfig({
      features: {
        ...this.config.features,
        [feature]: true
      }
    });
  }

  public disableFeature(feature: keyof FeatureFlags): void {
    this.updateConfig({
      features: {
        ...this.config.features,
        [feature]: false
      }
    });
  }

  public isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.config.features[feature];
  }

  public getPerformanceSettings(): PerformanceConfig {
    return { ...this.config.performance };
  }

  public getOfflineSettings(): OfflineConfig {
    return { ...this.config.offline };
  }

  public getDataLimits(): DataLimits {
    return { ...this.config.limits };
  }

  public isWithinLimits(type: keyof DataLimits, current: number): boolean {
    return current < this.config.limits[type];
  }

  public addListener(callback: (config: PilotConfiguration) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.config);
      } catch (error) {
        console.error('Error in pilot config listener:', error);
      }
    });
  }

  public exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  public importConfig(configJson: string): void {
    try {
      const imported = JSON.parse(configJson);
      this.updateConfig(imported);
    } catch (error) {
      throw new Error('Invalid configuration format');
    }
  }

  public resetToDefaults(): void {
    this.config = this.getDefaultConfig();
    this.detectEnvironment();
    this.saveConfig();
    this.notifyListeners();
  }

  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate performance settings
    if (this.config.performance.syncInterval < 5000) {
      errors.push('Sync interval cannot be less than 5 seconds');
    }

    if (this.config.performance.maxRetries < 1 || this.config.performance.maxRetries > 10) {
      errors.push('Max retries must be between 1 and 10');
    }

    // Validate limits
    if (this.config.limits.maxTournaments < 1) {
      errors.push('Must allow at least 1 tournament');
    }

    if (this.config.limits.maxTeamsPerTournament < 2) {
      errors.push('Must allow at least 2 teams per tournament');
    }

    // Validate offline settings
    if (this.config.offline.maxQueueSize < 10) {
      errors.push('Offline queue size must be at least 10');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  public getSystemInfo(): {
    environment: string;
    memoryUsage: number;
    storageUsage: number;
    networkStatus: string;
  } {
    return {
      environment: this.config.environment.deploymentType,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      storageUsage: 0, // Would be calculated from IndexedDB
      networkStatus: navigator.onLine ? 'online' : 'offline'
    };
  }
}

// Singleton instance
export const pilotConfig = new PilotConfigManager();

// Convenience hooks for React components
export function usePilotConfig() {
  const [config, setConfig] = React.useState(pilotConfig.getConfig());

  React.useEffect(() => {
    return pilotConfig.addListener(setConfig);
  }, []);

  return config;
}

export function useFeatureFlag(feature: keyof FeatureFlags): boolean {
  const config = usePilotConfig();
  return config.features[feature];
}

export function usePilotEnvironment(): PilotEnvironment {
  const config = usePilotConfig();
  return config.environment;
}

// Default export
export default pilotConfig;