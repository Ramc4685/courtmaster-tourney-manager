import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

// Touch feedback types
type TouchFeedbackType = 'light' | 'medium' | 'heavy';

// Swipe direction type
type SwipeDirection = 'left' | 'right' | 'up' | 'down';

// Touch-optimized button props
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  hapticFeedback?: TouchFeedbackType;
  rippleEffect?: boolean;
  children: React.ReactNode;
}

// Swipe action props
interface SwipeActionProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

// Touch modal props
interface TouchModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  fullScreen?: boolean;
  showHandle?: boolean;
}

// Pull to refresh props
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  className?: string;
}

// Touch-optimized form input props
interface TouchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Haptic feedback utility
const useHapticFeedback = () => {
  const { isMobile } = useMobileOptimization();

  return useCallback((type: TouchFeedbackType) => {
    if ('vibrate' in navigator && isMobile) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
      };
      navigator.vibrate(patterns[type]);
    }
  }, [isMobile]);
};

// Ripple effect hook
const useRippleEffect = () => {
  const createRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const rect = button.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add('ripple');

    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);

    setTimeout(() => {
      circle.remove();
    }, 600);
  }, []);

  return createRipple;
};

// Touch-optimized button component
export const TouchButton: React.FC<TouchButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  hapticFeedback = 'light',
  rippleEffect = true,
  children,
  onClick,
  disabled,
  className = '',
  ...props
}) => {
  const haptic = useHapticFeedback();
  const createRipple = useRippleEffect();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    haptic(hapticFeedback);
    
    if (rippleEffect) {
      createRipple(event);
    }

    onClick?.(event);
  };

  const buttonClass = `touch-button touch-button--${variant} touch-button--${size} ${disabled ? 'touch-button--disabled' : ''} ${className}`;

  return (
    <button
      className={buttonClass}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Swipe action component
export const SwipeAction: React.FC<SwipeActionProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = '',
}) => {
  const startPos = useRef({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setIsSwiping(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - startPos.current.x;
    const deltaY = endY - startPos.current.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    setIsSwiping(false);
  };

  return (
    <div
      className={`swipe-action ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

// Touch-optimized modal component
export const TouchModal: React.FC<TouchModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  fullScreen = false,
  showHandle = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(0);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;

    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 100) {
      onClose();
    }
    setDragY(0);
    setIsDragging(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="touch-modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className={`touch-modal ${fullScreen ? 'touch-modal--fullscreen' : ''}`}
        style={{ transform: `translateY(${dragY}px)` }}
        onClick={(e) => e.stopPropagation()}
      >
        {showHandle && (
          <div
            className="touch-modal__handle"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="touch-modal__handle-bar" />
          </div>
        )}
        
        {title && (
          <div className="touch-modal__header">
            <h2 className="touch-modal__title">{title}</h2>
            <TouchButton
              variant="ghost"
              size="small"
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
            </TouchButton>
          </div>
        )}
        
        <div className="touch-modal__content">
          {children}
        </div>
      </div>
    </div>
  );
};

// Pull to refresh component
export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  className = '',
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setCanPull(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canPull || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;

    if (deltaY > 0) {
      e.preventDefault();
      setPullDistance(Math.min(deltaY, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (!canPull || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    setCanPull(false);
  };

  const pullProgress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      className={`pull-to-refresh ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="pull-to-refresh__indicator"
        style={{
          transform: `translateY(${pullDistance}px)`,
          opacity: pullProgress,
        }}
      >
        <div
          className={`pull-to-refresh__spinner ${isRefreshing ? 'spinning' : ''}`}
          style={{ transform: `rotate(${pullProgress * 360}deg)` }}
        >
          ↻
        </div>
        <span className="pull-to-refresh__text">
          {isRefreshing ? 'Refreshing...' : pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>
      
      <div
        className="pull-to-refresh__content"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
};

// Touch-optimized input component
export const TouchInput: React.FC<TouchInputProps> = ({
  label,
  error,
  helpText,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const inputClass = `touch-input ${isFocused ? 'touch-input--focused' : ''} ${error ? 'touch-input--error' : ''} ${className}`;

  return (
    <div className="touch-input-wrapper">
      {label && (
        <label className="touch-input__label" htmlFor={props.id}>
          {label}
        </label>
      )}
      
      <div className="touch-input__container">
        {leftIcon && (
          <div className="touch-input__icon touch-input__icon--left">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={inputRef}
          className={inputClass}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {rightIcon && (
          <div className="touch-input__icon touch-input__icon--right">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <div className="touch-input__error" role="alert">
          {error}
        </div>
      )}
      
      {helpText && !error && (
        <div className="touch-input__help">
          {helpText}
        </div>
      )}
    </div>
  );
};

// Touch-optimized list item with swipe actions
interface TouchListItemProps {
  children: React.ReactNode;
  leftActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    color?: string;
    onClick: () => void;
  }>;
  rightActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    color?: string;
    onClick: () => void;
  }>;
  className?: string;
}

export const TouchListItem: React.FC<TouchListItemProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  className = '',
}) => {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const startX = useRef(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const maxSwipeDistance = 80 * Math.max(leftActions.length, rightActions.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwipeActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipeActive) return;

    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startX.current;
    
    // Limit swipe distance
    const limitedDeltaX = Math.max(-maxSwipeDistance, Math.min(maxSwipeDistance, deltaX));
    setSwipeX(limitedDeltaX);
  };

  const handleTouchEnd = () => {
    setIsSwipeActive(false);
    
    // Snap to action or reset
    if (Math.abs(swipeX) < 40) {
      setSwipeX(0);
    } else if (swipeX > 0 && leftActions.length > 0) {
      setSwipeX(80);
    } else if (swipeX < 0 && rightActions.length > 0) {
      setSwipeX(-80);
    } else {
      setSwipeX(0);
    }
  };

  const handleActionClick = (action: () => void) => {
    action();
    setSwipeX(0);
  };

  return (
    <div className={`touch-list-item ${className}`}>
      {/* Left actions */}
      {leftActions.length > 0 && (
        <div className="touch-list-item__actions touch-list-item__actions--left">
          {leftActions.map((action, index) => (
            <TouchButton
              key={index}
              variant="ghost"
              className="touch-list-item__action"
              style={{ backgroundColor: action.color }}
              onClick={() => handleActionClick(action.onClick)}
            >
              {action.icon && <span className="action-icon">{action.icon}</span>}
              <span className="action-label">{action.label}</span>
            </TouchButton>
          ))}
        </div>
      )}
      
      {/* Main content */}
      <div
        ref={itemRef}
        className="touch-list-item__content"
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
      
      {/* Right actions */}
      {rightActions.length > 0 && (
        <div className="touch-list-item__actions touch-list-item__actions--right">
          {rightActions.map((action, index) => (
            <TouchButton
              key={index}
              variant="ghost"
              className="touch-list-item__action"
              style={{ backgroundColor: action.color }}
              onClick={() => handleActionClick(action.onClick)}
            >
              {action.icon && <span className="action-icon">{action.icon}</span>}
              <span className="action-label">{action.label}</span>
            </TouchButton>
          ))}
        </div>
      )}
    </div>
  );
};

// Touch-optimized components styles
const TouchOptimizedStyles = () => (
  <style>{`
    /* Touch Button Styles */
    .touch-button {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      overflow: hidden;
      min-height: 44px;
      min-width: 44px;
      touch-action: manipulation;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    
    .touch-button--small {
      padding: 8px 16px;
      font-size: 14px;
    }
    
    .touch-button--medium {
      padding: 12px 24px;
      font-size: 16px;
    }
    
    .touch-button--large {
      padding: 16px 32px;
      font-size: 18px;
    }
    
    .touch-button--primary {
      background: var(--primary-color, #007bff);
      color: white;
    }
    
    .touch-button--primary:hover,
    .touch-button--primary:focus {
      background: var(--primary-dark, #0056b3);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
    }
    
    .touch-button--secondary {
      background: var(--secondary-color, #6c757d);
      color: white;
    }
    
    .touch-button--outline {
      background: transparent;
      border: 2px solid var(--primary-color, #007bff);
      color: var(--primary-color, #007bff);
    }
    
    .touch-button--ghost {
      background: transparent;
      color: var(--text-primary, #333);
    }
    
    .touch-button--ghost:hover,
    .touch-button--ghost:focus {
      background: var(--bg-secondary, #f8f9fa);
    }
    
    .touch-button--disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }
    
    .touch-button:focus {
      outline: 2px solid var(--focus-ring-color, #007bff);
      outline-offset: 2px;
    }
    
    /* Ripple effect */
    .ripple {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transform: scale(0);
      animation: ripple-animation 0.6s linear;
      pointer-events: none;
    }
    
    @keyframes ripple-animation {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    /* Swipe Action Styles */
    .swipe-action {
      position: relative;
      overflow: hidden;
      touch-action: pan-y;
    }
    
    /* Touch Modal Styles */
    .touch-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      z-index: 1000;
      animation: modal-fade-in 0.3s ease;
    }
    
    .touch-modal {
      background: var(--bg-primary, white);
      border-radius: 16px 16px 0 0;
      max-width: 100%;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      animation: modal-slide-up 0.3s ease;
    }
    
    .touch-modal--fullscreen {
      height: 100vh;
      border-radius: 0;
      max-height: 100vh;
    }
    
    .touch-modal__handle {
      display: flex;
      justify-content: center;
      padding: 12px;
      cursor: grab;
    }
    
    .touch-modal__handle:active {
      cursor: grabbing;
    }
    
    .touch-modal__handle-bar {
      width: 36px;
      height: 4px;
      background: var(--border-color, #e0e0e0);
      border-radius: 2px;
    }
    
    .touch-modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color, #e0e0e0);
    }
    
    .touch-modal__title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    
    .touch-modal__content {
      padding: 20px;
      overflow-y: auto;
      max-height: calc(90vh - 120px);
    }
    
    @keyframes modal-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes modal-slide-up {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    
    /* Pull to Refresh Styles */
    .pull-to-refresh {
      position: relative;
      overflow: hidden;
      height: 100%;
    }
    
    .pull-to-refresh__indicator {
      position: absolute;
      top: -60px;
      left: 0;
      right: 0;
      height: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--bg-primary, white);
      z-index: 1;
    }
    
    .pull-to-refresh__spinner {
      font-size: 20px;
      margin-bottom: 4px;
      transition: transform 0.2s ease;
    }
    
    .pull-to-refresh__spinner.spinning {
      animation: spin 1s linear infinite;
    }
    
    .pull-to-refresh__text {
      font-size: 12px;
      color: var(--text-secondary, #666);
    }
    
    .pull-to-refresh__content {
      transition: transform 0.2s ease;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    /* Touch Input Styles */
    .touch-input-wrapper {
      margin-bottom: 16px;
    }
    
    .touch-input__label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--text-primary, #333);
    }
    
    .touch-input__container {
      position: relative;
      display: flex;
      align-items: center;
    }
    
    .touch-input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid var(--border-color, #e0e0e0);
      border-radius: 8px;
      font-size: 16px;
      background: var(--bg-primary, white);
      color: var(--text-primary, #333);
      transition: all 0.2s ease;
      min-height: 44px;
    }
    
    .touch-input:focus {
      outline: none;
      border-color: var(--primary-color, #007bff);
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }
    
    .touch-input--focused {
      border-color: var(--primary-color, #007bff);
    }
    
    .touch-input--error {
      border-color: var(--error-color, #dc3545);
    }
    
    .touch-input__icon {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      color: var(--text-secondary, #666);
    }
    
    .touch-input__icon--left {
      left: 12px;
    }
    
    .touch-input__icon--right {
      right: 12px;
    }
    
    .touch-input:has(+ .touch-input__icon--left) {
      padding-left: 44px;
    }
    
    .touch-input:has(+ .touch-input__icon--right) {
      padding-right: 44px;
    }
    
    .touch-input__error {
      margin-top: 4px;
      font-size: 14px;
      color: var(--error-color, #dc3545);
    }
    
    .touch-input__help {
      margin-top: 4px;
      font-size: 14px;
      color: var(--text-secondary, #666);
    }
    
    /* Touch List Item Styles */
    .touch-list-item {
      position: relative;
      display: flex;
      overflow: hidden;
      background: var(--bg-primary, white);
    }
    
    .touch-list-item__actions {
      display: flex;
      position: absolute;
      top: 0;
      bottom: 0;
      z-index: 1;
    }
    
    .touch-list-item__actions--left {
      left: 0;
    }
    
    .touch-list-item__actions--right {
      right: 0;
    }
    
    .touch-list-item__action {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 100%;
      border-radius: 0;
      font-size: 12px;
    }
    
    .action-icon {
      font-size: 16px;
      margin-bottom: 2px;
    }
    
    .action-label {
      font-size: 10px;
    }
    
    .touch-list-item__content {
      position: relative;
      z-index: 2;
      width: 100%;
      background: var(--bg-primary, white);
      transition: transform 0.2s ease;
      padding: 16px;
      border-bottom: 1px solid var(--border-color, #e0e0e0);
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .touch-button,
      .touch-modal,
      .touch-input,
      .pull-to-refresh__content,
      .touch-list-item__content {
        transition: none;
      }
      
      .ripple {
        animation: none;
      }
      
      .pull-to-refresh__spinner.spinning {
        animation: none;
      }
    }
    
    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .touch-button,
      .touch-input,
      .touch-modal {
        border: 2px solid var(--text-primary, #000);
      }
      
      .touch-button:focus,
      .touch-input:focus {
        outline: 3px solid var(--text-primary, #000);
      }
    }
  `}</style>
);

// Export styles component for use in App
export { TouchOptimizedStyles };
