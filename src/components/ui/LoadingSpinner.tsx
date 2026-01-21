import React from 'react';
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  /**
   * Size of the spinner in pixels
   * @default 24
   */
  size?: number;
  
  /**
   * Color of the spinner
   * @default "currentColor"
   */
  color?: string;
  
  /**
   * Thickness of the spinner track
   * @default 2
   */
  thickness?: number;
  
  /**
   * Optional text to display below the spinner
   */
  text?: string;
  
  /**
   * Whether the spinner should take up the full container space
   * @default false
   */
  fullSize?: boolean;
  
  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * A customizable loading spinner component
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 24,
  color = "currentColor",
  thickness = 2,
  text,
  fullSize = false,
  className
}) => {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center",
        fullSize && "w-full h-full",
        className
      )}
    >
      <div 
        className="animate-spin" 
        style={{ 
          width: size, 
          height: size, 
          borderWidth: thickness,
          borderStyle: "solid",
          borderRadius: "50%",
          borderColor: `${color}33`,
          borderTopColor: color,
        }}
      />
      {text && (
        <p className="mt-2 text-sm font-medium text-muted-foreground">{text}</p>
      )}
    </div>
  );
};

/**
 * A full-page loading spinner with overlay
 */
export const FullPageLoader: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <LoadingSpinner size={40} text={text || "Loading..."} />
    </div>
  );
};

/**
 * A centered spinner for content areas
 */
export const ContentLoader: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <div className="w-full py-12 flex items-center justify-center">
      <LoadingSpinner size={32} text={text} />
    </div>
  );
};

/**
 * An inline spinner for buttons or text content
 */
export const InlineLoader: React.FC<{ text?: string; className?: string }> = ({ 
  text, 
  className 
}) => {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <LoadingSpinner size={16} />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
