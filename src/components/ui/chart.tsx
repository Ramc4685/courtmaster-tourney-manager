
import React from 'react';

export interface LineChartProps {
  data: number[];
  lines: {
    dataKey: string;
    stroke: string;
  }[];
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({ data, lines, className }) => {
  // Simplified implementation - in a real app this would use a chart library like recharts
  return (
    <div className={`border rounded-md p-4 ${className}`}>
      <div className="text-center mb-2">Line Chart</div>
      <div className="h-40 flex items-end justify-between">
        {data.map((value, index) => (
          <div 
            key={index}
            className="bg-blue-500 w-4" 
            style={{ height: `${value}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export interface BarChartProps {
  data: number[];
  bars: {
    dataKey: string;
    fill: string;
  }[];
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ data, bars, className }) => {
  // Simplified implementation - in a real app this would use a chart library like recharts
  return (
    <div className={`border rounded-md p-4 ${className}`}>
      <div className="text-center mb-2">Bar Chart</div>
      <div className="h-40 flex items-end justify-between">
        {data.map((value, index) => (
          <div 
            key={index}
            className="bg-green-500 w-8" 
            style={{ height: `${value}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export const PieChart: React.FC<{ data: { name: string; value: number }[] }> = ({ data }) => {
  // Simplified implementation - in a real app this would use a chart library like recharts
  return (
    <div className="border rounded-md p-4">
      <div className="text-center mb-2">Pie Chart</div>
      <div className="flex justify-center">
        <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-green-500"></div>
      </div>
      <div className="mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex justify-between">
            <span>{item.name}</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
