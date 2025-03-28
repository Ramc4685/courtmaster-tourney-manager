
import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{title}</h1>
        {description && (
          <p className="text-gray-500 mt-1">{description}</p>
        )}
      </div>
      {action && (
        <div className="mt-2 md:mt-0">{action}</div>
      )}
    </div>
  );
};

export default PageHeader;
