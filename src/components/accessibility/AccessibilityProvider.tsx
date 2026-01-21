import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Accessibility preferences interface
interface AccessibilityPreferences {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  focusIndicators: boolean;
  screenReaderOptimizations: boolean;
  keyboardNavigation: boolean;
  announcements: boolean;
  colorBlindnessSupport: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

// Accessibility context interface
interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  updatePreferences: (updates: Partial<AccessibilityPreferences>) => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  skipToContent: () => void;
  focusManagement: {
    trapFocus: (element: HTMLElement) => () => void;
    restoreFocus: (element?: HTMLElement) => void;
    setFocusedElement: (element: HTMLElement) => void;
  };
  isHighContrast: boolean;
  isReducedMotion: boolean;
  fontSize: string;
}

// Default accessibility preferences
const defaultPreferences: AccessibilityPreferences = {
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
  focusIndicators: true,
  screenReaderOptimizations: true,
  keyboardNavigation: true,
  announcements: true,
  colorBlindnessSupport: 'none',
};

// Create accessibility context
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Accessibility provider props
interface AccessibilityProviderProps {
  children: React.ReactNode;
}

// Live announcement region component
const LiveRegion: React.FC<{ message: string; priority: 'polite' | 'assertive' }> = ({
  message,
  priority,
}) => (
  <div
    aria-live={priority}
    aria-atomic="true"
    className="sr-only"
    role="status"
  >
    {message}
  </div>
);

// Skip navigation links component
const SkipLinks: React.FC = () => (
  <div className="skip-links">
    <a
      href="#main-content"
      className="skip-link"
      onFocus={(e) => e.currentTarget.classList.add('focused')}
      onBlur={(e) => e.currentTarget.classList.remove('focused')}
    >
      Skip to main content
    </a>
    <a
      href="#navigation"
      className="skip-link"
      onFocus={(e) => e.currentTarget.classList.add('focused')}
      onBlur={(e) => e.currentTarget.classList.remove('focused')}
    >
      Skip to navigation
    </a>
    <a
      href="#search"
      className="skip-link"
      onFocus={(e) => e.currentTarget.classList.add('focused')}
      onBlur={(e) => e.currentTarget.classList.remove('focused')}
    >
      Skip to search
    </a>
  </div>
);

// Accessibility provider component
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(defaultPreferences);
  const [announcements, setAnnouncements] = useState<Array<{ message: string; priority: 'polite' | 'assertive'; id: string }>>([]);
  const [focusHistory, setFocusHistory] = useState<HTMLElement[]>([]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('accessibility-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.warn('Failed to parse accessibility preferences:', error);
      }
    }

    // Detect system preferences
    const mediaQueries = {
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
    };

    const updateSystemPreferences = () => {
      setPreferences(prev => ({
        ...prev,
        highContrast: prev.highContrast || mediaQueries.highContrast.matches,
        reducedMotion: prev.reducedMotion || mediaQueries.reducedMotion.matches,
      }));
    };

    // Listen for system preference changes
    mediaQueries.highContrast.addEventListener('change', updateSystemPreferences);
    mediaQueries.reducedMotion.addEventListener('change', updateSystemPreferences);

    updateSystemPreferences();

    return () => {
      mediaQueries.highContrast.removeEventListener('change', updateSystemPreferences);
      mediaQueries.reducedMotion.removeEventListener('change', updateSystemPreferences);
    };
  }, []);

  // Apply CSS classes based on preferences
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    root.classList.toggle('high-contrast', preferences.highContrast);
    
    // Reduced motion
    root.classList.toggle('reduced-motion', preferences.reducedMotion);
    
    // Font size
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
    root.classList.add(`font-${preferences.fontSize}`);
    
    // Focus indicators
    root.classList.toggle('enhanced-focus', preferences.focusIndicators);
    
    // Color blindness support
    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
    if (preferences.colorBlindnessSupport !== 'none') {
      root.classList.add(preferences.colorBlindnessSupport);
    }

    // Update CSS custom properties
    root.style.setProperty('--focus-ring-width', preferences.focusIndicators ? '3px' : '2px');
    root.style.setProperty('--focus-ring-color', preferences.highContrast ? '#ffff00' : '#0066cc');
    
  }, [preferences]);

  // Update preferences function
  const updatePreferences = useCallback((updates: Partial<AccessibilityPreferences>) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, ...updates };
      localStorage.setItem('accessibility-preferences', JSON.stringify(newPreferences));
      return newPreferences;
    });
  }, []);

  // Announce function for screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!preferences.announcements) return;

    const id = `announcement-${Date.now()}-${Math.random()}`;
    const announcement = { message, priority, id };
    
    setAnnouncements(prev => [...prev, announcement]);

    // Remove announcement after it's been read
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 1000);
  }, [preferences.announcements]);

  // Skip to main content function
  const skipToContent = useCallback(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Focus management utilities
  const focusManagement = {
    // Trap focus within an element
    trapFocus: useCallback((element: HTMLElement) => {
      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      };

      element.addEventListener('keydown', handleTabKey);

      // Focus the first element
      firstElement?.focus();

      return () => {
        element.removeEventListener('keydown', handleTabKey);
      };
    }, []),

    // Restore focus to previous element
    restoreFocus: useCallback((element?: HTMLElement) => {
      const targetElement = element || focusHistory[focusHistory.length - 1];
      if (targetElement && document.contains(targetElement)) {
        targetElement.focus();
        setFocusHistory(prev => prev.slice(0, -1));
      }
    }, [focusHistory]),

    // Set focused element for focus history
    setFocusedElement: useCallback((element: HTMLElement) => {
      setFocusHistory(prev => [...prev, element]);
    }, []),
  };

  // Keyboard navigation handler
  useEffect(() => {
    if (!preferences.keyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to close modals/dropdowns
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (activeModal) {
          const closeButton = activeModal.querySelector('[aria-label*="close"], [aria-label*="Close"]') as HTMLElement;
          closeButton?.click();
        }
      }

      // Arrow keys for navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const currentElement = document.activeElement as HTMLElement;
        const role = currentElement?.getAttribute('role');
        
        if (role === 'menuitem' || role === 'option' || role === 'tab') {
          e.preventDefault();
          // Handle arrow key navigation for menu items, options, and tabs
          const container = currentElement.closest('[role="menu"], [role="listbox"], [role="tablist"]');
          if (container) {
            const items = Array.from(container.querySelectorAll('[role="menuitem"], [role="option"], [role="tab"]')) as HTMLElement[];
            const currentIndex = items.indexOf(currentElement);
            
            let nextIndex = currentIndex;
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
              nextIndex = (currentIndex + 1) % items.length;
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
              nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
            }
            
            items[nextIndex]?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [preferences.keyboardNavigation]);

  // Context value
  const contextValue: AccessibilityContextType = {
    preferences,
    updatePreferences,
    announce,
    skipToContent,
    focusManagement,
    isHighContrast: preferences.highContrast,
    isReducedMotion: preferences.reducedMotion,
    fontSize: preferences.fontSize,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      <SkipLinks />
      
      {/* Live announcement regions */}
      {announcements.map(announcement => (
        <LiveRegion
          key={announcement.id}
          message={announcement.message}
          priority={announcement.priority}
        />
      ))}
      
      {children}
      
      {/* Accessibility styles */}
      <style>{`
        .skip-links {
          position: absolute;
          top: -40px;
          left: 6px;
          z-index: 9999;
        }
        
        .skip-link {
          position: absolute;
          left: -10000px;
          top: auto;
          width: 1px;
          height: 1px;
          overflow: hidden;
          background: #000;
          color: #fff;
          padding: 8px 16px;
          text-decoration: none;
          border-radius: 4px;
        }
        
        .skip-link:focus,
        .skip-link.focused {
          position: static;
          width: auto;
          height: auto;
          left: auto;
          top: auto;
        }
        
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        
        /* High contrast mode styles */
        .high-contrast {
          --bg-primary: #000000;
          --text-primary: #ffffff;
          --bg-secondary: #1a1a1a;
          --text-secondary: #ffffff;
          --border-color: #ffffff;
          --focus-ring-color: #ffff00;
          --link-color: #00ffff;
          --button-bg: #ffffff;
          --button-text: #000000;
        }
        
        /* Reduced motion styles */
        .reduced-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
        
        /* Font size styles */
        .font-small {
          font-size: 14px;
        }
        
        .font-medium {
          font-size: 16px;
        }
        
        .font-large {
          font-size: 18px;
        }
        
        .font-extra-large {
          font-size: 20px;
        }
        
        /* Enhanced focus indicators */
        .enhanced-focus *:focus {
          outline: var(--focus-ring-width) solid var(--focus-ring-color);
          outline-offset: 2px;
        }
        
        /* Color blindness support */
        .protanopia {
          filter: url('#protanopia-filter');
        }
        
        .deuteranopia {
          filter: url('#deuteranopia-filter');
        }
        
        .tritanopia {
          filter: url('#tritanopia-filter');
        }
        
        /* Touch target minimum size */
        button, a, input, select, textarea {
          min-height: 44px;
          min-width: 44px;
        }
        
        /* Ensure sufficient color contrast */
        .high-contrast button {
          background-color: var(--button-bg);
          color: var(--button-text);
          border: 2px solid var(--border-color);
        }
        
        .high-contrast a {
          color: var(--link-color);
          text-decoration: underline;
        }
        
        /* Screen reader optimizations */
        [aria-hidden="true"] {
          display: none !important;
        }
        
        [role="button"]:not(button):not(input) {
          cursor: pointer;
        }
        
        [role="button"]:not(button):not(input):focus {
          outline: var(--focus-ring-width) solid var(--focus-ring-color);
        }
      `}</style>
      
      {/* SVG filters for color blindness support */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix values="0.567, 0.433, 0,     0, 0
                                   0.558, 0.442, 0,     0, 0
                                   0,     0.242, 0.758, 0, 0
                                   0,     0,     0,     1, 0"/>
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix values="0.625, 0.375, 0,   0, 0
                                   0.7,   0.3,   0,   0, 0
                                   0,     0.3,   0.7, 0, 0
                                   0,     0,     0,   1, 0"/>
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix values="0.95, 0.05,  0,     0, 0
                                   0,    0.433, 0.567, 0, 0
                                   0,    0.475, 0.525, 0, 0
                                   0,    0,     0,     1, 0"/>
          </filter>
        </defs>
      </svg>
    </AccessibilityContext.Provider>
  );
};

// Hook to use accessibility context
export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Accessibility settings component
export const AccessibilitySettings: React.FC = () => {
  const { preferences, updatePreferences } = useAccessibility();

  return (
    <div className="accessibility-settings" role="region" aria-labelledby="accessibility-heading">
      <h2 id="accessibility-heading">Accessibility Settings</h2>
      
      <div className="settings-group">
        <h3>Visual</h3>
        
        <label className="setting-item">
          <input
            type="checkbox"
            checked={preferences.highContrast}
            onChange={(e) => updatePreferences({ highContrast: e.target.checked })}
          />
          High Contrast Mode
        </label>
        
        <label className="setting-item">
          <span>Font Size:</span>
          <select
            value={preferences.fontSize}
            onChange={(e) => updatePreferences({ fontSize: e.target.value as AccessibilityPreferences['fontSize'] })}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="extra-large">Extra Large</option>
          </select>
        </label>
        
        <label className="setting-item">
          <span>Color Blindness Support:</span>
          <select
            value={preferences.colorBlindnessSupport}
            onChange={(e) => updatePreferences({ colorBlindnessSupport: e.target.value as AccessibilityPreferences['colorBlindnessSupport'] })}
          >
            <option value="none">None</option>
            <option value="protanopia">Protanopia</option>
            <option value="deuteranopia">Deuteranopia</option>
            <option value="tritanopia">Tritanopia</option>
          </select>
        </label>
      </div>
      
      <div className="settings-group">
        <h3>Motion & Animation</h3>
        
        <label className="setting-item">
          <input
            type="checkbox"
            checked={preferences.reducedMotion}
            onChange={(e) => updatePreferences({ reducedMotion: e.target.checked })}
          />
          Reduce Motion
        </label>
      </div>
      
      <div className="settings-group">
        <h3>Navigation</h3>
        
        <label className="setting-item">
          <input
            type="checkbox"
            checked={preferences.focusIndicators}
            onChange={(e) => updatePreferences({ focusIndicators: e.target.checked })}
          />
          Enhanced Focus Indicators
        </label>
        
        <label className="setting-item">
          <input
            type="checkbox"
            checked={preferences.keyboardNavigation}
            onChange={(e) => updatePreferences({ keyboardNavigation: e.target.checked })}
          />
          Keyboard Navigation
        </label>
      </div>
      
      <div className="settings-group">
        <h3>Screen Reader</h3>
        
        <label className="setting-item">
          <input
            type="checkbox"
            checked={preferences.screenReaderOptimizations}
            onChange={(e) => updatePreferences({ screenReaderOptimizations: e.target.checked })}
          />
          Screen Reader Optimizations
        </label>
        
        <label className="setting-item">
          <input
            type="checkbox"
            checked={preferences.announcements}
            onChange={(e) => updatePreferences({ announcements: e.target.checked })}
          />
          Live Announcements
        </label>
      </div>
    </div>
  );
};
