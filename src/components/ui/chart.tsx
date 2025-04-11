
import React from 'react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

interface ChartProps {
  data: any[];
  width?: number | string;
  height?: number | string;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  className?: string;
}

interface LineChartProps extends ChartProps {
  lines: Array<{
    dataKey: string;
    stroke?: string;
    activeDot?: { r?: number };
    type?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter';
  }>;
  xAxisDataKey?: string;
}

interface BarChartProps extends ChartProps {
  bars: Array<{
    dataKey: string;
    fill?: string;
    stackId?: string;
  }>;
  xAxisDataKey?: string;
}

interface PieChartProps extends ChartProps {
  nameKey: string;
  dataKey: string;
  colors?: string[];
  innerRadius?: number | string;
  outerRadius?: number | string;
}

// Default colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const LineChart: React.FC<LineChartProps> = ({
  data,
  lines,
  width = '100%',
  height = 300,
  margin = { top: 5, right: 30, left: 20, bottom: 5 },
  xAxisDataKey = 'name',
  className
}) => {
  return (
    <div className={className}>
      <ResponsiveContainer width={width} height={height}>
        <RechartsLineChart
          data={data}
          margin={margin}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisDataKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type={line.type || 'monotone'}
              dataKey={line.dataKey}
              stroke={line.stroke || COLORS[index % COLORS.length]}
              activeDot={line.activeDot || { r: 8 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const BarChart: React.FC<BarChartProps> = ({
  data,
  bars,
  width = '100%',
  height = 300,
  margin = { top: 5, right: 30, left: 20, bottom: 5 },
  xAxisDataKey = 'name',
  className
}) => {
  return (
    <div className={className}>
      <ResponsiveContainer width={width} height={height}>
        <RechartsBarChart
          data={data}
          margin={margin}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisDataKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              fill={bar.fill || COLORS[index % COLORS.length]}
              stackId={bar.stackId}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PieChart: React.FC<PieChartProps> = ({
  data,
  nameKey,
  dataKey,
  width = '100%',
  height = 300,
  colors = COLORS,
  innerRadius = 0,
  outerRadius = '80%',
  className
}) => {
  return (
    <div className={className}>
      <ResponsiveContainer width={width} height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};
