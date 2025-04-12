
import React from 'react';

export interface LineChartProps {
  data: number[];
  className?: string;
  lines: React.ReactNode;
}

export interface BarChartProps {
  data: number[];
  className?: string;
  bars: React.ReactNode;
}

export const LineChart: React.FC<LineChartProps> = ({ data, className, lines }) => {
  return (
    <div className={`w-full h-40 ${className}`}>
      {/* Placeholder for actual chart implementation */}
      <div className="flex items-end justify-between h-full">
        {data.map((value, index) => (
          <div 
            key={index} 
            className="bg-primary rounded-t w-4"
            style={{ height: `${(value / Math.max(...data)) * 100}%` }}
          />
        ))}
      </div>
      {lines}
    </div>
  );
};

export const BarChart: React.FC<BarChartProps> = ({ data, className, bars }) => {
  return (
    <div className={`w-full h-40 ${className}`}>
      {/* Placeholder for actual chart implementation */}
      <div className="flex items-end justify-between h-full">
        {data.map((value, index) => (
          <div 
            key={index} 
            className="bg-primary rounded-t w-8"
            style={{ height: `${(value / Math.max(...data)) * 100}%` }}
          />
        ))}
      </div>
      {bars}
    </div>
  );
};
