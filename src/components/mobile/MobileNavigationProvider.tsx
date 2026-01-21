import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

// Navigation item interface
interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  disabled?: boolean;
  children?: NavigationItem[];
}

// Mobile navigation context interface
interface MobileNavigationContextType {
  isBottomNavVisible: boolean;
  setBottomNavVisible: (visible: boolean) => void;
  navigationItems: NavigationItem[];
  setNavigationItems: (items: NavigationItem[]) => void;
  activeItem: string;
  setActiveItem: (itemId: string) => void;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  handleSwipeNavigation: (direction: 'left' | 'right') => void;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  orientation: 'portrait' | 'landscape';
  hapticFeedback: (type: 'light' | 'medium' | 'heavy') => void;
}

// Default navigation items
const defaultNavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '🏠',
    path: '/dashboard',
  },
  {
    id: 'tournaments',
    label: 'Tournaments',
    icon: '🏆',
    path: '/tournaments',
  },
  {
    id: 'matches',
    label: 'Matches',
    icon: '⚡',
    path: '/matches',
  },
  {
    id: 'teams',
    label: 'Teams',
    icon: '👥',
    path: '/teams',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: '👤',
    path: '/profile',
  },
];

// Create mobile navigation context
const MobileNavigationContext = createContext<MobileNavigationContextType | undefined>(undefined);

// Mobile navigation provider props
interface MobileNavigationProviderProps {
  children: React.ReactNode;
}

// Bottom navigation component
const BottomNavigation: React.FC<{
  items: NavigationItem[];
  activeItem: string;
  onItemClick: (item: NavigationItem) => void;
  safeAreaInsets: { bottom: number };
  hapticFeedback: (type: 'light' | 'medium' | 'heavy') => void;
}> = ({ items, activeItem, onItemClick, safeAreaInsets, hapticFeedback }) => (
  <nav
    className="bottom-navigation"
    style={{ paddingBottom: safeAreaInsets.bottom }}
    role="navigation"
    aria-label="Main navigation"
  >
    {items.slice(0, 5).map((item) => (
      <button
        key={item.id}
        className={`nav-item ${activeItem === item.id ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
        onClick={() => {
          if (!item.disabled) {
            hapticFeedback('light');
            onItemClick(item);
          }
        }}
        disabled={item.disabled}
        aria-label={item.label}
        aria-current={activeItem === item.id ? 'page' : undefined}
      >
        <span className="nav-icon" aria-hidden="true">
          {item.icon}
        </span>
        <span className="nav-label">{item.label}</span>
        {item.badge && item.badge > 0 && (
          <span className="nav-badge" aria-label={`${item.badge} notifications`}>
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </button>
    ))}
  </nav>
);

// Navigation drawer component
const NavigationDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  items: NavigationItem[];
  activeItem: string;
  onItemClick: (item: NavigationItem) => void;
  safeAreaInsets: { top: number; left: number; right: number };
}> = ({ isOpen, onClose, items, activeItem, onItemClick, safeAreaInsets }) => (
  <>
    {/* Backdrop */}
    {isOpen && (
      <div
        className="drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
    )}
    
    {/* Drawer */}
    <aside
      className={`navigation-drawer ${isOpen ? 'open' : ''}`}
      style={{
        paddingTop: safeAreaInsets.top,
        paddingLeft: safeAreaInsets.left,
        paddingRight: safeAreaInsets.right,
      }}
      aria-hidden={!isOpen}
    >
      <div className="drawer-header">
        <h2>CourtMaster</h2>
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close navigation"
        >
          ✕
        </button>
      </div>
      
      <nav className="drawer-nav" role="navigation" aria-label="Main navigation">
        {items.map((item) => (
          <div key={item.id} className="nav-group">
            <button
              className={`drawer-item ${activeItem === item.id ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
              onClick={() => {
                if (!item.disabled) {
                  onItemClick(item);
                  onClose();
                }
              }}
              disabled={item.disabled}
              aria-current={activeItem === item.id ? 'page' : undefined}
            >
              <span className="item-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="item-label">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="item-badge" aria-label={`${item.badge} notifications`}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
            
            {item.children && (
              <div className="nav-submenu">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    className={`drawer-subitem ${activeItem === child.id ? 'active' : ''} ${child.disabled ? 'disabled' : ''}`}
                    onClick={() => {
                      if (!child.disabled) {
                        onItemClick(child);
                        onClose();
                      }
                    }}
                    disabled={child.disabled}
                    aria-current={activeItem === child.id ? 'page' : undefined}
                  >
                    <span className="subitem-icon" aria-hidden="true">
                      {child.icon}
                    </span>
                    <span className="subitem-label">{child.label}</span>
                    {child.badge && child.badge > 0 && (
                      <span className="subitem-badge" aria-label={`${child.badge} notifications`}>
                        {child.badge > 99 ? '99+' : child.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  </>
);

// Mobile navigation provider component
export const MobileNavigationProvider: React.FC<MobileNavigationProviderProps> = ({ children }) => {
  const mobileOptimization = useMobileOptimization();
  
  // Safely destructure with fallbacks
  const { 
    isMobile = false, 
    isTablet = false, 
    capabilities = { isMobile: false }
  } = mobileOptimization || {};
  
  // For backward compatibility, create deviceInfo object
  const deviceInfo = { isMobile };
  const [isBottomNavVisible, setBottomNavVisible] = useState(true);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>(defaultNavigationItems);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Detect safe area insets
  useEffect(() => {
    const updateSafeAreaInsets = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      setSafeAreaInsets({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
      });
    };

    updateSafeAreaInsets();
    window.addEventListener('resize', updateSafeAreaInsets);
    return () => window.removeEventListener('resize', updateSafeAreaInsets);
  }, []);

  // Detect orientation changes
  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  // Haptic feedback function
  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy') => {
    if ('vibrate' in navigator && isMobile) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
      };
      navigator.vibrate(patterns[type]);
    }
  }, [isMobile]);

  // Handle swipe navigation
  const handleSwipeNavigation = useCallback((direction: 'left' | 'right') => {
    const currentIndex = navigationItems.findIndex(item => item.id === activeItem);
    if (currentIndex === -1) return;

    let nextIndex;
    if (direction === 'right' && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    } else if (direction === 'left' && currentIndex < navigationItems.length - 1) {
      nextIndex = currentIndex + 1;
    }

    if (nextIndex !== undefined) {
      const nextItem = navigationItems[nextIndex];
      if (!nextItem.disabled) {
        setActiveItem(nextItem.id);
        hapticFeedback('light');
        // Navigate to the new route
        window.history.pushState(null, '', nextItem.path);
      }
    }
  }, [navigationItems, activeItem, hapticFeedback]);

  // Handle navigation item click
  const handleItemClick = useCallback((item: NavigationItem) => {
    setActiveItem(item.id);
    hapticFeedback('light');
    // Navigate to the route
    window.history.pushState(null, '', item.path);
  }, [hapticFeedback]);

  // Touch gesture handlers
  useEffect(() => {
    if (!isMobile) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;

      // Check if it's a swipe gesture
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50 && deltaTime < 300) {
        if (deltaX > 0) {
          handleSwipeNavigation('right');
        } else {
          handleSwipeNavigation('left');
        }
      }

      // Handle edge swipe to open drawer
      if (startX < 20 && deltaX > 100 && Math.abs(deltaY) < 100) {
        setDrawerOpen(true);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, handleSwipeNavigation]);

  // Handle back button on Android
  useEffect(() => {
    const handleBackButton = () => {
      if (isDrawerOpen) {
        setDrawerOpen(false);
        return true; // Prevent default back behavior
      }
      return false;
    };

    // Listen for Android back button
    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [isDrawerOpen]);

  // Context value
  const contextValue: MobileNavigationContextType = {
    isBottomNavVisible,
    setBottomNavVisible,
    navigationItems,
    setNavigationItems,
    activeItem,
    setActiveItem,
    isDrawerOpen,
    setDrawerOpen,
    handleSwipeNavigation,
    safeAreaInsets,
    orientation,
    hapticFeedback,
  };

  return (
    <MobileNavigationContext.Provider value={contextValue}>
      {children}
      
      {/* Bottom navigation for mobile */}
      {isMobile && isBottomNavVisible && (
        <BottomNavigation
          items={navigationItems}
          activeItem={activeItem}
          onItemClick={handleItemClick}
          safeAreaInsets={safeAreaInsets}
          hapticFeedback={hapticFeedback}
        />
      )}
      
      {/* Navigation drawer for tablet and mobile */}
      {(isMobile || isTablet) && (
        <NavigationDrawer
          isOpen={isDrawerOpen}
          onClose={() => setDrawerOpen(false)}
          items={navigationItems}
          activeItem={activeItem}
          onItemClick={handleItemClick}
          safeAreaInsets={safeAreaInsets}
        />
      )}
      
      {/* Mobile navigation styles */}
      <style>{`
        .bottom-navigation {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          background: var(--bg-primary, #ffffff);
          border-top: 1px solid var(--border-color, #e0e0e0);
          z-index: 1000;
          padding: 8px 0;
          box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px 4px;
          background: none;
          border: none;
          color: var(--text-secondary, #666666);
          text-decoration: none;
          transition: color 0.2s ease;
          min-height: 44px;
          position: relative;
          cursor: pointer;
        }
        
        .nav-item:hover,
        .nav-item:focus {
          color: var(--primary-color, #007bff);
          outline: 2px solid var(--focus-ring-color, #007bff);
          outline-offset: 2px;
        }
        
        .nav-item.active {
          color: var(--primary-color, #007bff);
        }
        
        .nav-item.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .nav-icon {
          font-size: 20px;
          margin-bottom: 2px;
        }
        
        .nav-label {
          font-size: 10px;
          font-weight: 500;
          text-align: center;
          line-height: 1.2;
        }
        
        .nav-badge {
          position: absolute;
          top: 4px;
          right: 50%;
          transform: translateX(50%);
          background: var(--error-color, #ff4444);
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 16px;
          text-align: center;
        }
        
        .drawer-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1998;
          animation: fadeIn 0.3s ease;
        }
        
        .navigation-drawer {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 280px;
          background: var(--bg-primary, #ffffff);
          z-index: 1999;
          transform: translateX(-100%);
          transition: transform 0.3s ease;
          box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
          overflow-y: auto;
        }
        
        .navigation-drawer.open {
          transform: translateX(0);
        }
        
        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }
        
        .drawer-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #333333);
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 18px;
          padding: 8px;
          cursor: pointer;
          color: var(--text-secondary, #666666);
          border-radius: 4px;
          min-height: 44px;
          min-width: 44px;
        }
        
        .close-button:hover,
        .close-button:focus {
          background: var(--bg-secondary, #f5f5f5);
          outline: 2px solid var(--focus-ring-color, #007bff);
        }
        
        .drawer-nav {
          padding: 8px 0;
        }
        
        .nav-group {
          margin-bottom: 4px;
        }
        
        .drawer-item,
        .drawer-subitem {
          width: 100%;
          display: flex;
          align-items: center;
          padding: 12px 20px;
          background: none;
          border: none;
          color: var(--text-primary, #333333);
          text-align: left;
          cursor: pointer;
          transition: background-color 0.2s ease;
          min-height: 44px;
          position: relative;
        }
        
        .drawer-subitem {
          padding-left: 52px;
          font-size: 14px;
        }
        
        .drawer-item:hover,
        .drawer-item:focus,
        .drawer-subitem:hover,
        .drawer-subitem:focus {
          background: var(--bg-secondary, #f5f5f5);
          outline: 2px solid var(--focus-ring-color, #007bff);
          outline-offset: -2px;
        }
        
        .drawer-item.active,
        .drawer-subitem.active {
          background: var(--primary-light, #e3f2fd);
          color: var(--primary-color, #007bff);
        }
        
        .drawer-item.disabled,
        .drawer-subitem.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .item-icon,
        .subitem-icon {
          font-size: 20px;
          margin-right: 16px;
          width: 20px;
          text-align: center;
        }
        
        .subitem-icon {
          font-size: 16px;
          width: 16px;
        }
        
        .item-label,
        .subitem-label {
          flex: 1;
          font-weight: 500;
        }
        
        .subitem-label {
          font-weight: 400;
        }
        
        .item-badge,
        .subitem-badge {
          background: var(--error-color, #ff4444);
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 16px;
          text-align: center;
        }
        
        .nav-submenu {
          border-left: 2px solid var(--border-color, #e0e0e0);
          margin-left: 20px;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .navigation-drawer,
          .drawer-backdrop {
            transition: none;
            animation: none;
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .bottom-navigation,
          .navigation-drawer {
            border-color: var(--text-primary, #000000);
          }
          
          .nav-item:focus,
          .drawer-item:focus,
          .drawer-subitem:focus,
          .close-button:focus {
            outline: 3px solid var(--text-primary, #000000);
          }
        }
        
        /* Landscape orientation adjustments */
        @media (orientation: landscape) and (max-height: 500px) {
          .bottom-navigation {
            padding: 4px 0;
          }
          
          .nav-item {
            padding: 4px 2px;
          }
          
          .nav-icon {
            font-size: 18px;
          }
          
          .nav-label {
            font-size: 9px;
          }
        }
      `}</style>
    </MobileNavigationContext.Provider>
  );
};

// Hook to use mobile navigation context
export const useMobileNavigation = (): MobileNavigationContextType => {
  const context = useContext(MobileNavigationContext);
  if (context === undefined) {
    throw new Error('useMobileNavigation must be used within a MobileNavigationProvider');
  }
  return context;
};
