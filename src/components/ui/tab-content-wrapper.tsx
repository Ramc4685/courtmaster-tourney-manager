import React from "react";
import { cn } from "@/lib/utils";

interface TabContentWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const TabContentWrapper: React.FC<TabContentWrapperProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default TabContentWrapper; 