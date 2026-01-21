import { useState, useEffect, useCallback } from 'react';

interface DeviceCapabilities {
  hasTouch: boolean;
  hasHover: boolean;
  hasPointer: boolean;
  hasFinePointer: boolean;
  hasReducedMotion: boolean;
  hasHighContrast: boolean;
  supportsSafeArea: boolean;
  supportsHaptics: boolean;
  supportsWebGL: boolean;
  supportsServiceWorker: boolean;
}

interface PerformanceMetrics {
  deviceMemory?: number;
  hardwareConcurrency: number;
  connectionType?: string;
  connectionSpeed?: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  isOnline: boolean;
  batteryLevel?: number;
  batteryCharging?: boolean;
}

interface DeviceType {
  isSmallMobile: boolean; // < 375px
  isLargeMobile: boolean; // 375-640px
  isSmallTablet: boolean; // 640-768px
  isLargeTablet: boolean; // 768-1024px
  isSmallLaptop: boolean; // 1024-1440px
  isDesktop: boolean; // >= 1440px
  deviceCategory: 'mobile' | 'tablet' | 'laptop' | 'desktop';
}

interface ViewportInfo {
  width: number;
  height: number;
  availableWidth: number;
  availableHeight: number;
  orientation: 'portrait' | 'landscape';
  aspectRatio: number;
  pixelRatio: number;
  isFullscreen: boolean;
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface MobileOptimizationState extends DeviceType, ViewportInfo {
  // Legacy compatibility
  isMobile: boolean;
  isTablet: boolean;
  screenWidth: number;
  screenHeight: number;

  // Enhanced capabilities
  capabilities: DeviceCapabilities;
  performance: PerformanceMetrics;

  // Utility functions
  getOptimalRefreshRate: () => number;
  getRecommendedTouchTargetSize: () => number;
  shouldUseVirtualization: (itemCount: number) => boolean;
  getAdaptiveFontSize: (baseSize: number) => number;
  getNetworkQuality: () => 'high' | 'medium' | 'low';
}

// Utility functions
const detectDeviceCapabilities = (): DeviceCapabilities => {
  if (typeof window === 'undefined') {
    return {
      hasTouch: false,
      hasHover: true,
      hasPointer: true,
      hasFinePointer: true,
      hasReducedMotion: false,
      hasHighContrast: false,
      supportsSafeArea: false,
      supportsHaptics: false,
      supportsWebGL: false,
      supportsServiceWorker: false,
    };
  }

  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const hasHover = window.matchMedia('(hover: hover)').matches;
  const hasPointer = window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(pointer: fine)').matches;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

  // Check for safe area support (notched devices)
  const supportsSafeArea = CSS.supports('padding', 'env(safe-area-inset-top)');

  // Check for haptic feedback support
  const supportsHaptics = 'vibrate' in navigator;

  // Check for WebGL support
  const canvas = document.createElement('canvas');
  const supportsWebGL = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));

  // Check for Service Worker support
  const supportsServiceWorker = 'serviceWorker' in navigator;

  return {
    hasTouch,
    hasHover,
    hasPointer,
    hasFinePointer,
    hasReducedMotion,
    hasHighContrast,
    supportsSafeArea,
    supportsHaptics,
    supportsWebGL,
    supportsServiceWorker,
  };
};

const detectPerformanceMetrics = (): PerformanceMetrics => {
  if (typeof window === 'undefined') {
    return {
      hardwareConcurrency: 4,
      isOnline: true,
    };
  }

  const nav = navigator as any;

  // Device memory (if available)
  const deviceMemory = nav.deviceMemory;

  // Hardware concurrency
  const hardwareConcurrency = nav.hardwareConcurrency || 4;

  // Network information (if available)
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  const connectionType = connection?.type;
  const connectionSpeed = connection?.effectiveType as 'slow-2g' | '2g' | '3g' | '4g' | undefined;

  // Online status
  const isOnline = nav.onLine;

  // Battery API will be handled in effect
  let batteryLevel: number | undefined;
  let batteryCharging: boolean | undefined;

  return {
    deviceMemory,
    hardwareConcurrency,
    connectionType,
    connectionSpeed,
    isOnline,
    batteryLevel,
    batteryCharging,
  };
};

const getDeviceType = (width: number): DeviceType => {
  const isSmallMobile = width < 375;
  const isLargeMobile = width >= 375 && width < 640;
  const isSmallTablet = width >= 640 && width < 768;
  const isLargeTablet = width >= 768 && width < 1024;
  const isSmallLaptop = width >= 1024 && width < 1440;
  const isDesktop = width >= 1440;

  let deviceCategory: 'mobile' | 'tablet' | 'laptop' | 'desktop';
  if (isSmallMobile || isLargeMobile) {
    deviceCategory = 'mobile';
  } else if (isSmallTablet || isLargeTablet) {
    deviceCategory = 'tablet';
  } else if (isSmallLaptop) {
    deviceCategory = 'laptop';
  } else {
    deviceCategory = 'desktop';
  }

  return {
    isSmallMobile,
    isLargeMobile,
    isSmallTablet,
    isLargeTablet,
    isSmallLaptop,
    isDesktop,
    deviceCategory,
  };
};

const getViewportInfo = (): ViewportInfo => {
  if (typeof window === 'undefined') {
    return {
      width: 1024,
      height: 768,
      availableWidth: 1024,
      availableHeight: 768,
      orientation: 'landscape',
      aspectRatio: 1.33,
      pixelRatio: 1,
      isFullscreen: false,
      safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const availableWidth = window.screen?.availWidth || width;
  const availableHeight = window.screen?.availHeight || height;
  const orientation = width > height ? 'landscape' : 'portrait';
  const aspectRatio = Number((width / height).toFixed(2));
  const pixelRatio = window.devicePixelRatio || 1;
  const isFullscreen = document.fullscreenElement !== null;

  // Get safe area insets (for notched devices)
  const computedStyle = getComputedStyle(document.documentElement);
  const safeAreaInsets = {
    top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)')) || 0,
    right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)')) || 0,
    bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
    left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)')) || 0,
  };

  return {
    width,
    height,
    availableWidth,
    availableHeight,
    orientation,
    aspectRatio,
    pixelRatio,
    isFullscreen,
    safeAreaInsets,
  };
};

/**
 * Enhanced custom hook for comprehensive mobile optimization and responsive design
 * Provides detailed device detection, performance monitoring, and adaptive utilities
 */
export const useMobileOptimization = () => {
  const [capabilities] = useState<DeviceCapabilities>(() => detectDeviceCapabilities());
  const [performance, setPerformance] = useState<PerformanceMetrics>(() => detectPerformanceMetrics());
  const [viewportInfo, setViewportInfo] = useState<ViewportInfo>(() => getViewportInfo());
  const [deviceType, setDeviceType] = useState<DeviceType>(() => getDeviceType(getViewportInfo().width));

  // Utility functions
  const getOptimalRefreshRate = useCallback((): number => {
    // Base refresh rate on device performance and battery status
    if (performance.batteryLevel && performance.batteryLevel < 0.2 && !performance.batteryCharging) {
      return 15000; // 15 seconds for low battery
    }

    if (performance.connectionSpeed === 'slow-2g' || performance.connectionSpeed === '2g') {
      return 60000; // 1 minute for slow connections
    }

    if (deviceType.deviceCategory === 'mobile') {
      return 30000; // 30 seconds for mobile
    }

    return 15000; // 15 seconds for tablets and desktops
  }, [performance, deviceType]);

  const getRecommendedTouchTargetSize = useCallback((): number => {
    // Base on device type and accessibility preferences
    let baseSize = 44; // Apple's recommended minimum

    if (capabilities.hasFinePointer) {
      baseSize = 32; // Can be smaller for precise pointers
    }

    if (capabilities.hasReducedMotion || capabilities.hasHighContrast) {
      baseSize = 48; // Larger for accessibility
    }

    if (deviceType.isSmallMobile) {
      baseSize = Math.max(baseSize, 48); // Ensure minimum on small screens
    }

    return baseSize;
  }, [capabilities, deviceType]);

  const shouldUseVirtualization = useCallback((itemCount: number): boolean => {
    // Decide based on device performance and item count
    const memoryThreshold = performance.deviceMemory ? performance.deviceMemory < 4 : performance.hardwareConcurrency < 4;
    const isMobileDevice = deviceType.deviceCategory === 'mobile';

    if (memoryThreshold || isMobileDevice) {
      return itemCount > 20; // Lower threshold for constrained devices
    }

    return itemCount > 100; // Higher threshold for powerful devices
  }, [performance, deviceType]);

  const getAdaptiveFontSize = useCallback((baseSize: number): number => {
    let size = baseSize;

    // Adjust for device pixel ratio
    if (viewportInfo.pixelRatio > 2) {
      size *= 0.9; // Slightly smaller on high-DPI displays
    }

    // Adjust for device category
    if (deviceType.isSmallMobile) {
      size *= 0.9; // Smaller on very small screens
    } else if (deviceType.isDesktop) {
      size *= 1.1; // Larger on desktop
    }

    // Respect user preferences
    if (capabilities.hasHighContrast) {
      size *= 1.2; // Larger for high contrast users
    }

    return Math.round(size);
  }, [viewportInfo, deviceType, capabilities]);

  const getNetworkQuality = useCallback((): 'high' | 'medium' | 'low' => {
    if (!performance.isOnline) return 'low';

    switch (performance.connectionSpeed) {
      case '4g':
        return 'high';
      case '3g':
        return 'medium';
      case '2g':
      case 'slow-2g':
        return 'low';
      default:
        return 'medium';
    }
  }, [performance]);

  // Battery metrics effect
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let batteryCleanup: (() => void) | null = null;

    const nav = navigator as any;
    if ('getBattery' in nav) {
      nav.getBattery().then((battery: any) => {
        const updateBatteryInfo = () => {
          setPerformance(prev => ({
            ...prev,
            batteryLevel: battery.level,
            batteryCharging: battery.charging
          }));
        };

        // Initial update
        updateBatteryInfo();

        // Listen for battery changes
        battery.addEventListener('chargingchange', updateBatteryInfo);
        battery.addEventListener('levelchange', updateBatteryInfo);

        // Store cleanup function
        batteryCleanup = () => {
          battery.removeEventListener('chargingchange', updateBatteryInfo);
          battery.removeEventListener('levelchange', updateBatteryInfo);
        };
      }).catch(() => {
        // Battery API not supported or denied
        console.log('Battery API not available');
      });
    }

    // Cleanup
    return () => {
      if (batteryCleanup) {
        batteryCleanup();
      }
    };
  }, []);

  // Update viewport and device info on resize/orientation change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateViewportInfo = () => {
      const newViewportInfo = getViewportInfo();
      const newDeviceType = getDeviceType(newViewportInfo.width);

      setViewportInfo(newViewportInfo);
      setDeviceType(newDeviceType);
    };

    const updatePerformanceMetrics = () => {
      setPerformance(detectPerformanceMetrics());
    };

    // Debounce resize events
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateViewportInfo, 100);
    };

    // Event listeners
    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', updateViewportInfo);
    window.addEventListener('online', updatePerformanceMetrics);
    window.addEventListener('offline', updatePerformanceMetrics);

    // Cleanup
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', updateViewportInfo);
      window.removeEventListener('online', updatePerformanceMetrics);
      window.removeEventListener('offline', updatePerformanceMetrics);
    };
  }, []);

  // Construct the complete state object
  const state: MobileOptimizationState = {
    // Legacy compatibility
    isMobile: deviceType.isSmallMobile || deviceType.isLargeMobile,
    isTablet: deviceType.isSmallTablet || deviceType.isLargeTablet,
    screenWidth: viewportInfo.width,
    screenHeight: viewportInfo.height,

    // Enhanced device type detection
    ...deviceType,

    // Enhanced viewport information
    ...viewportInfo,

    // Capabilities and performance
    capabilities,
    performance,

    // Utility functions
    getOptimalRefreshRate,
    getRecommendedTouchTargetSize,
    shouldUseVirtualization,
    getAdaptiveFontSize,
    getNetworkQuality,
  };

  return state;
};

export default useMobileOptimization;